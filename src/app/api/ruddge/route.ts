import { NextResponse } from "next/server";
import { products } from "@/lib/data";
import { moderateText } from "@/lib/moderation";
import { requireUser } from "@/lib/appwrite/auth";
import {
  countUserMessagesToday,
  createThread,
  getOwnedThread,
  listMessagesFor,
  listThreadsFor,
  saveTurn,
  serializeMessage,
  serializeThread,
} from "@/lib/appwrite/ruddge";
import { askRuddge, type RuddgeTurn } from "@/lib/ruddge/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PHOTO = /^tannelli\/ruddge\/[\w\-/]+$/;

function photosOf(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && PHOTO.test(item)).slice(0, 3) : [];
}

function cleanString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** GET /api/ruddge — this account's recent diagnosis chats. */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to use RuddgeAI" }, { status: 401 });
  try {
    const threads = await listThreadsFor(user.id);
    return NextResponse.json({ threads }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Ruddge list failed:", error);
    return NextResponse.json({ threads: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}

/** POST /api/ruddge — start or continue a plant diagnosis chat. */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to use RuddgeAI" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const message = moderateText(cleanString(body.message, 2000)).text;
  const photos = photosOf(body.photos);
  if (message.length < 8 && !photos.length) {
    return NextResponse.json({ error: "Describe the plant or the problem in a sentence, or add a photo." }, { status: 400 });
  }

  const today = await countUserMessagesToday(user.id);
  if (today >= 40) {
    return NextResponse.json({ error: "Daily RuddgeAI limit reached. A verified expert can take it from here." }, { status: 429 });
  }

  let thread;
  if (typeof body.threadId === "string" && body.threadId) {
    thread = await getOwnedThread(body.threadId, user.id);
    if (!thread) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  } else {
    thread = await createThread(user, message || "Photo diagnosis", cleanString(body.locale, 5) || "en");
  }

  const historyObjects = await listMessagesFor(thread.$id);
  const history: RuddgeTurn[] = historyObjects.map((item) => ({
    role: item.role === "assistant" ? "assistant" : "user",
    body: String(item.body || ""),
    photos: Array.isArray(item.photos) ? (item.photos as string[]) : [],
  }));

  const catalog = products.filter((item) => item.kind === "plant").slice(0, 24).map((item) => item.name);
  let answer;
  try {
    answer = await askRuddge({
      history,
      message: message || "Please diagnose this plant from the photos.",
      photos,
      role: user.role || "customer",
      wilaya: typeof user.profile?.wilaya === "string" ? user.profile.wilaya : undefined,
      crops: Array.isArray(user.profile?.mainCrops) ? (user.profile.mainCrops as string[]) : [],
      catalog,
    });
  } catch (error) {
    console.error("RuddgeAI failed:", error);
    return NextResponse.json({ error: "RuddgeAI could not answer just now. Try again, or send the photos to an expert." }, { status: 502 });
  }

  const saved = await saveTurn({
    thread,
    user,
    body: message || "Photo diagnosis",
    photos,
    reply: answer.reply,
    analysis: answer.analysis,
    model: answer.model,
  });

  return NextResponse.json({
    thread: serializeThread(saved.thread),
    messages: [...historyObjects, saved.userMessage, saved.assistantMessage].map(serializeMessage),
    author: user.name || "You",
  });
}

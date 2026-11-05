import { NextResponse } from "next/server";
import type Parse from "parse/node";
import { products } from "@/lib/data";
import { moderateText } from "@/lib/moderation";
import { masterOnlyACL } from "@/lib/parse/accounts";
import { cleanString, displayName, idOf } from "@/lib/parse/marketplace";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";
import { askRuddge, type RuddgeTurn } from "@/lib/ruddge/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const THREAD = "RuddgeThread";
const MESSAGE = "RuddgeMessage";
const PHOTO = /^tannelli\/ruddge\/[\w\-/]+$/;

function photosOf(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && PHOTO.test(item)).slice(0, 3) : [];
}

function serializeMessage(message: Parse.Object) {
  return {
    id: idOf(message),
    role: message.get("role") === "assistant" ? "assistant" : "user",
    body: message.get("body") ?? "",
    photos: message.get("photos") ?? [],
    analysis: message.get("analysis") ?? null,
    model: message.get("model") || undefined,
    createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

function serializeThread(thread: Parse.Object) {
  return {
    id: idOf(thread),
    title: thread.get("title") ?? "Plant question",
    plant: thread.get("plant") || undefined,
    updatedAt: thread.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

/** GET /api/ruddge — this account's recent diagnosis chats. */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to use RuddgeAI" }, { status: 401 });
  const Parse = getParseAdmin();
  const threads = await new Parse.Query(THREAD).equalTo("user", user).descending("updatedAt").limit(30).find({ useMasterKey: true });
  return NextResponse.json({ threads: threads.map(serializeThread) }, { headers: { "Cache-Control": "no-store" } });
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

  const Parse = getParseAdmin();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = await new Parse.Query(MESSAGE).equalTo("author", user).greaterThan("createdAt", since).count({ useMasterKey: true });
  if (today >= 40) return NextResponse.json({ error: "Daily RuddgeAI limit reached. A verified expert can take it from here." }, { status: 429 });

  let thread: Parse.Object;
  if (typeof body.threadId === "string" && body.threadId) {
    const found = await new Parse.Query(THREAD).get(body.threadId, { useMasterKey: true }).catch(() => undefined);
    if (!found || (found.get("user") as Parse.Object | undefined)?.id !== user.id) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    thread = found;
  } else {
    const created = new (Parse.Object.extend(THREAD))();
    created.set({ user, title: (message || "Photo diagnosis").slice(0, 80), locale: cleanString(body.locale, 5) || "en" });
    created.setACL(masterOnlyACL());
    await created.save(null, { useMasterKey: true });
    thread = created;
  }

  const historyObjects = await new Parse.Query(MESSAGE).equalTo("thread", thread).ascending("createdAt").limit(40).find({ useMasterKey: true });
  const history: RuddgeTurn[] = historyObjects.map((item) => ({
    role: item.get("role") === "assistant" ? "assistant" : "user",
    body: item.get("body") ?? "",
    photos: item.get("photos") ?? [],
  }));

  const catalog = products.filter((item) => item.kind === "plant").slice(0, 24).map((item) => item.name);
  let answer;
  try {
    answer = await askRuddge({
      history,
      message: message || "Please diagnose this plant from the photos.",
      photos,
      role: user.get("role") || "customer",
      wilaya: user.get("wilaya") || undefined,
      crops: (user.get("mainCrops") as string[]) || [],
      catalog,
    });
  } catch (error) {
    console.error("RuddgeAI failed:", error);
    return NextResponse.json({ error: "RuddgeAI could not answer just now. Try again, or send the photos to an expert." }, { status: 502 });
  }

  const userMessage = new (Parse.Object.extend(MESSAGE))();
  userMessage.set({ thread, author: user, role: "user", body: message || "Photo diagnosis", photos });
  userMessage.setACL(masterOnlyACL());
  const assistantMessage = new (Parse.Object.extend(MESSAGE))();
  assistantMessage.set({
    thread,
    role: "assistant",
    body: answer.reply,
    photos: [],
    model: answer.model,
    analysis: answer.analysis,
  });
  assistantMessage.setACL(masterOnlyACL());
  if (answer.analysis?.plant && answer.analysis.plant !== "Unknown") thread.set("plant", answer.analysis.plant);
  if (history.length === 0 && answer.analysis?.plant) thread.set("title", answer.analysis.plant);
  await Parse.Object.saveAll([userMessage, assistantMessage, thread], { useMasterKey: true });

  return NextResponse.json({
    thread: serializeThread(thread),
    messages: [...historyObjects, userMessage, assistantMessage].map(serializeMessage),
    author: displayName(user, "You"),
  });
}

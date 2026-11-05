import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { idOf } from "@/lib/parse/marketplace";
import { requireUser } from "@/lib/parse/require-admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/ruddge/:id — one chat and its messages, for the signed-in owner. */
export async function GET(request: Request, { params }: Params) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to use RuddgeAI" }, { status: 401 });
  const { id } = await params;
  const Parse = getParseAdmin();
  const thread = await new Parse.Query("RuddgeThread").get(id, { useMasterKey: true }).catch(() => undefined);
  if (thread && (thread.get("user") as { id?: string } | undefined)?.id !== user.id) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  if (!thread) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  const messages = await new Parse.Query("RuddgeMessage").equalTo("thread", thread).ascending("createdAt").limit(80).find({ useMasterKey: true });
  return NextResponse.json({
    thread: { id: idOf(thread), title: thread.get("title") ?? "Plant question", plant: thread.get("plant") || undefined },
    messages: messages.map((message) => ({
      id: idOf(message),
      role: message.get("role") === "assistant" ? "assistant" : "user",
      body: message.get("body") ?? "",
      photos: message.get("photos") ?? [],
      analysis: message.get("analysis") ?? null,
      createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/appwrite/auth";
import { getOwnedThread, listMessagesFor, serializeMessage, serializeThread } from "@/lib/appwrite/ruddge";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/ruddge/:id — one chat and its messages, for the signed-in owner. */
export async function GET(request: Request, { params }: Params) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to use RuddgeAI" }, { status: 401 });
  const { id } = await params;
  const thread = await getOwnedThread(id, user.id);
  if (!thread) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  const messages = await listMessagesFor(id);
  return NextResponse.json(
    {
      thread: serializeThread(thread),
      messages: messages.map(serializeMessage),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";
import { moderateText } from "@/lib/moderation";
import {
  MESSAGE_CLASS,
  cleanString,
  loadRequest,
  sanitizePhotos,
  serializeMessage,
  serializeRequest,
  viewerFor,
} from "@/lib/parse/marketplace";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** POST /api/expert-requests/:id/messages — grower ↔ assigned expert conversation. */
export async function POST(request: Request, { params }: Context) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const item = await loadRequest(id);
  if (!item) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const viewer = await viewerFor(user);
  const record = serializeRequest(item, viewer);
  if (viewer.role !== "admin" && !record.viewer.actions.includes("message")) {
    return NextResponse.json({ error: "Messaging opens once an expert accepts the request." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const text = cleanString(body.body, 3000);
  const attachments = sanitizePhotos(body.attachments, 4);
  if (!text && !attachments.length) return NextResponse.json({ error: "Write a message or attach a photo." }, { status: 400 });

  const moderated = moderateText(text);
  const Parse = getParseAdmin();
  const message = new (Parse.Object.extend(MESSAGE_CLASS))();
  message.set({
    request: item,
    author: user,
    authorRole: viewer.role,
    body: moderated.text,
    attachments,
    moderationFlags: moderated.flags,
    flagged: moderated.flags.length > 0,
    hidden: moderated.hold,
    system: false,
  });
  const acl = new Parse.ACL();
  message.setACL(acl);
  await message.save(null, { useMasterKey: true });
  await message.fetchWithInclude(["author"], { useMasterKey: true });

  return NextResponse.json(
    {
      message: serializeMessage(message, viewer),
      notice: moderated.hold
        ? "Your message is waiting for moderation."
        : moderated.flags.length
          ? "Contact details were hidden — keep conversations on Tannelli so both sides stay protected."
          : undefined,
    },
    { status: 201 },
  );
}

/** PATCH /api/expert-requests/:id/messages — `{ messageId, action: "report" | "hide" | "restore" }`. */
export async function PATCH(request: Request, { params }: Context) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const item = await loadRequest(id);
  if (!item) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const viewer = await viewerFor(user);
  const participant = viewer.role === "admin" || item.get("customer")?.id === user.id || item.get("assignedExpert")?.id === viewer.profile?.id;
  if (!participant) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const Parse = getParseAdmin();
  const message = await new Parse.Query(MESSAGE_CLASS).equalTo("request", item).include("author").get(cleanString(body.messageId, 40), { useMasterKey: true }).catch(() => undefined);
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  if (body.action === "report") {
    message.addUnique("moderationFlags", "manual_report");
    message.addUnique("reportedBy", user.id);
    message.set({ flagged: true, moderationReviewed: false });
  } else if ((body.action === "hide" || body.action === "restore") && viewer.role === "admin") {
    message.set({ hidden: body.action === "hide", moderationReviewed: true });
    if (body.action === "restore") message.set({ moderationFlags: [], flagged: false });
  } else {
    return NextResponse.json({ error: "Action not allowed" }, { status: 403 });
  }
  await message.save(null, { useMasterKey: true });
  return NextResponse.json({ message: serializeMessage(message, viewer) });
}

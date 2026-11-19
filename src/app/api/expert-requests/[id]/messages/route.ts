import { NextResponse } from "next/server";
import { ID, Permission, Role } from "node-appwrite";
import { requireUser } from "@/lib/appwrite/auth";
import { ensureExpertDoc } from "@/lib/appwrite/accounts";
import { createAdminClient } from "@/lib/appwrite/admin";
import { COLLECTIONS, appwriteDatabaseId } from "@/lib/appwrite/config";
import { getRow } from "@/lib/appwrite/db";
import { messagesForRequest } from "@/lib/appwrite/requests";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** GET /api/expert-requests/:id/messages */
export async function GET(request: Request, { params }: Context) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  let item;
  try {
    item = await getRow(COLLECTIONS.consultationRequests, id);
  } catch {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  const expert = user.role === "expert" ? await ensureExpertDoc(user) : null;
  const allowed =
    user.role === "admin" ||
    item.customerId === user.id ||
    (expert && item.assignedExpertId === expert.$id);
  if (!allowed) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  return NextResponse.json(await messagesForRequest(id));
}

/** POST /api/expert-requests/:id/messages */
export async function POST(request: Request, { params }: Context) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  let item;
  try {
    item = await getRow(COLLECTIONS.consultationRequests, id);
  } catch {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const expert = user.role === "expert" ? await ensureExpertDoc(user) : null;
  const isOwner = item.customerId === user.id;
  const isAssigned = Boolean(expert && item.assignedExpertId === expert.$id);
  if (user.role !== "admin" && !isOwner && !isAssigned) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const text = String(body.body || "").trim();
  if (text.length < 2) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

  const role = isAssigned ? "expert" : isOwner ? "customer" : user.role;
  const created = await createAdminClient().tables.createRow({
    databaseId: appwriteDatabaseId(),
    tableId: COLLECTIONS.requestMessages,
    rowId: ID.unique(),
    data: {
      requestId: id,
      authorId: user.id,
      authorRole: role,
      authorName: user.name,
      body: text.slice(0, 4000),
      flags: [],
      demoSeed: "",
    },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(user.id)),
      Permission.delete(Role.user(user.id)),
    ],
  });

  return NextResponse.json({
    id: created.$id,
    body: text,
    authorId: user.id,
    authorName: user.name,
    authorRole: role,
    attachments: [],
    flagged: false,
    hidden: false,
    system: false,
    createdAt: created.$createdAt,
  });
}

import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireAdmin, requireUser } from "@/lib/appwrite/auth";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { createRow, getRow, listRows, updateRow } from "@/lib/appwrite/db";
import { moderateText } from "@/lib/moderation";

export const dynamic = "force-dynamic";

const TARGETS = ["product", "service"];
const STATUSES = ["open", "in_review", "resolved", "rejected"];

function cleanString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function serialize(row: Record<string, unknown> & { $id: string; $createdAt?: string }) {
  return {
    id: row.$id,
    targetType: String(row.targetType || ""),
    targetName: String(row.targetName || ""),
    subject: String(row.subject || ""),
    body: String(row.body || ""),
    status: String(row.status || "open"),
    resolution: String(row.resolution || ""),
    createdAt: String(row.$createdAt || ""),
  };
}

/** GET /api/complaints — admin sees all; customers see their own. */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const admin = user.role === "admin" ? user : null;
  const queries = admin
    ? [Query.orderDesc("$createdAt"), Query.limit(200)]
    : [Query.equal("userId", user.id), Query.orderDesc("$createdAt"), Query.limit(100)];

  try {
    const listed = await listRows(COLLECTIONS.claims, queries);
    return NextResponse.json(listed.rows.map(serialize), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json([], { headers: { "Cache-Control": "private, no-store" } });
  }
}

/** POST /api/complaints — file a complaint. */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const targetType = TARGETS.includes(body.targetType) ? body.targetType : null;
  const targetName = cleanString(body.targetName, 160);
  const subject = cleanString(body.subject, 160);
  const message = moderateText(cleanString(body.body, 3000));

  if (!targetType) return NextResponse.json({ error: "Choose a product or a service." }, { status: 400 });
  if (!targetName) return NextResponse.json({ error: "Enter the product or service name." }, { status: 400 });
  if (!subject) return NextResponse.json({ error: "Enter a subject." }, { status: 400 });
  if (!message.text) return NextResponse.json({ error: "Describe your complaint." }, { status: 400 });

  try {
    const item = await createRow(COLLECTIONS.claims, {
      userId: user.id,
      targetType,
      targetName,
      subject,
      body: message.text,
      status: message.hold ? "pending" : "open",
      resolution: "",
    });
    return NextResponse.json({ ok: true, id: item.$id }, { status: 201 });
  } catch (error) {
    console.error("Error saving complaint:", error);
    return NextResponse.json({ error: "Could not send your complaint. Please try again." }, { status: 500 });
  }
}

/** PATCH /api/complaints — admin updates status and resolution. */
export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const id = cleanString(body.id, 64);
  const status = STATUSES.includes(body.status) ? body.status : null;
  if (!id || !status) return NextResponse.json({ error: "Invalid complaint update." }, { status: 400 });

  try {
    await getRow(COLLECTIONS.claims, id);
    await updateRow(COLLECTIONS.claims, id, {
      status,
      resolution: cleanString(body.resolution, 2000),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }
}

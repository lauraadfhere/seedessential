import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireAdmin, requireUser } from "@/lib/parse/require-admin";
import { cleanString } from "@/lib/parse/marketplace";
import { moderateText } from "@/lib/moderation";

export const dynamic = "force-dynamic";

const TARGETS = ["product", "service"];
const STATUSES = ["open", "in_review", "resolved", "rejected"];

/** GET /api/complaints — admin sees all complaints; a customer sees only their own. */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const admin = await requireAdmin(request);
  const Parse = getParseAdmin();
  const query = new Parse.Query("Complaint");
  if (!admin) query.equalTo("customer", user);
  const items = await query.include("customer").descending("createdAt").limit(200).find({ useMasterKey: true });

  return NextResponse.json(
    items.map((item) => ({
      id: item.id,
      targetType: item.get("targetType"),
      targetName: item.get("targetName"),
      subject: item.get("subject"),
      body: item.get("body"),
      status: item.get("status"),
      resolution: item.get("resolution") ?? "",
      createdAt: item.createdAt?.toISOString(),
    })),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

/** POST /api/complaints — a signed-in customer files a complaint about a product or service. */
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
    const Parse = getParseAdmin();
    const item = new (Parse.Object.extend("Complaint"))();
    item.set({
      customer: user,
      targetType,
      targetName,
      subject,
      body: message.text,
      status: message.hold ? "pending" : "open",
      moderationFlags: message.flags,
      resolution: "",
    });
    await item.save(null, { useMasterKey: true });
    return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
  } catch (error) {
    console.error("Error saving complaint:", error);
    return NextResponse.json({ error: "Could not send your complaint. Please try again." }, { status: 500 });
  }
}

/** PATCH /api/complaints — admin updates status and resolution: `{ id, status, resolution }`. */
export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const id = cleanString(body.id, 40);
  const status = STATUSES.includes(body.status) ? body.status : null;
  if (!id || !status) return NextResponse.json({ error: "Invalid complaint update." }, { status: 400 });

  const Parse = getParseAdmin();
  const item = await new Parse.Query("Complaint").get(id, { useMasterKey: true }).catch(() => undefined);
  if (!item) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

  item.set({ status, resolution: cleanString(body.resolution, 2000), handledBy: admin });
  await item.save(null, { useMasterKey: true });
  return NextResponse.json({ ok: true });
}

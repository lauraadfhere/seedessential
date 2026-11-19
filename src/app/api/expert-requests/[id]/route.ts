import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireUser } from "@/lib/appwrite/auth";
import { ensureExpertDoc } from "@/lib/appwrite/accounts";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { getRow, listRows, updateRow } from "@/lib/appwrite/db";
import { messagesForRequest, serializeAppwriteRequest } from "@/lib/appwrite/requests";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function load(id: string) {
  try {
    return await getRow(COLLECTIONS.consultationRequests, id);
  } catch {
    return null;
  }
}

/** GET /api/expert-requests/:id — request + conversation (Appwrite). */
export async function GET(request: Request, { params }: Context) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const item = await load(id);
  if (!item) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const expert = user.role === "expert" ? await ensureExpertDoc(user) : null;
  const isOwner = item.customerId === user.id;
  const isAssigned = Boolean(expert && item.assignedExpertId === expert.$id);
  if (user.role !== "admin" && !isOwner && !isAssigned && item.status !== "open") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const showThread = user.role === "admin" || isOwner || isAssigned;
  const messages = showThread ? await messagesForRequest(id) : [];
  return NextResponse.json({
    request: serializeAppwriteRequest(item, user, expert?.$id, messages.length),
    messages,
  });
}

/** PATCH /api/expert-requests/:id — accept / decline / recommend / complete (Appwrite). */
export async function PATCH(request: Request, { params }: Context) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const item = await load(id);
  if (!item) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  const expert = user.role === "expert" ? await ensureExpertDoc(user) : null;

  try {
    if (action === "accept") {
      if (user.role !== "expert" || !expert) return NextResponse.json({ error: "Expert access required" }, { status: 403 });
      if (item.status !== "open") return NextResponse.json({ error: "Request is no longer open." }, { status: 400 });
      const updated = await updateRow(COLLECTIONS.consultationRequests, id, {
        status: "matched",
        assignedExpertId: expert.$id,
      });
      return NextResponse.json(serializeAppwriteRequest(updated, user, expert.$id, 0));
    }

    if (action === "decline") {
      if (user.role !== "expert" || !expert) return NextResponse.json({ error: "Expert access required" }, { status: 403 });
      const declined = [...new Set([...(Array.isArray(item.declinedBy) ? item.declinedBy : []), expert.$id].map(String))];
      await updateRow(COLLECTIONS.consultationRequests, id, { declinedBy: declined });
      return NextResponse.json({ ok: true });
    }

    if (action === "recommend") {
      if (user.role !== "expert" || !expert || item.assignedExpertId !== expert.$id) {
        return NextResponse.json({ error: "Only the assigned expert can recommend." }, { status: 403 });
      }
      const recommendation = String(body.recommendation || "").trim();
      if (recommendation.length < 20) {
        return NextResponse.json({ error: "Write a fuller recommendation (20+ characters)." }, { status: 400 });
      }
      const updated = await updateRow(COLLECTIONS.consultationRequests, id, {
        status: "answered",
        recommendation,
        maintenancePlan: String(body.maintenancePlan || item.maintenancePlan || ""),
      });
      return NextResponse.json(serializeAppwriteRequest(updated, user, expert.$id, 0));
    }

    if (action === "complete") {
      if (item.customerId !== user.id && user.role !== "admin") {
        return NextResponse.json({ error: "Only the grower can complete this request." }, { status: 403 });
      }
      const updated = await updateRow(COLLECTIONS.consultationRequests, id, { status: "completed" });
      return NextResponse.json(serializeAppwriteRequest(updated, user, expert?.$id, 0));
    }

    if (action === "cancel") {
      if (item.customerId !== user.id && user.role !== "admin") {
        return NextResponse.json({ error: "Only the grower can cancel." }, { status: 403 });
      }
      const updated = await updateRow(COLLECTIONS.consultationRequests, id, { status: "cancelled" });
      return NextResponse.json(serializeAppwriteRequest(updated, user, expert?.$id, 0));
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("PATCH expert-requests", error);
    return NextResponse.json({ error: "Could not update the request." }, { status: 500 });
  }
}

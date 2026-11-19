import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireUser } from "@/lib/appwrite/auth";
import { ensureExpertDoc } from "@/lib/appwrite/accounts";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { listRows } from "@/lib/appwrite/db";

export const dynamic = "force-dynamic";

/** Lightweight Appwrite marketplace counters for header badges. */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const counts: Record<string, number> = {};
    let attention = 0;

    if (user.role === "expert") {
      const expert = await ensureExpertDoc(user);
      const open = await listRows(COLLECTIONS.consultationRequests, [
        Query.equal("status", "open"),
        Query.equal("moderationStatus", "approved"),
        Query.limit(100),
      ]);
      const assigned = await listRows(COLLECTIONS.consultationRequests, [
        Query.equal("assignedExpertId", expert.$id),
        Query.limit(100),
      ]);
      counts.inbox = open.total;
      counts.matched = assigned.rows.filter((row) => row.status === "matched").length;
      counts.answered = assigned.rows.filter((row) => row.status === "answered").length;
      counts.completed = assigned.rows.filter((row) => row.status === "completed").length;
      counts.verified = expert.status === "active" ? 1 : 0;
      attention = counts.inbox + counts.matched;
    } else if (user.role === "admin") {
      const pending = await listRows(COLLECTIONS.consultationRequests, [
        Query.equal("moderationStatus", "pending"),
        Query.limit(100),
      ]);
      const experts = await listRows(COLLECTIONS.expertProfiles, [
        Query.equal("status", "pending"),
        Query.limit(100),
      ]);
      counts.requests = pending.total;
      counts.experts = experts.total;
      counts.messages = 0;
      counts.listings = 0;
      attention = counts.requests + counts.experts;
    } else if (user.role === "provider") {
      counts.listings = 0;
      counts.pending = 0;
      counts.recommendations = 0;
      counts.recent = 0;
    } else {
      const mine = await listRows(COLLECTIONS.consultationRequests, [
        Query.equal("customerId", user.id),
        Query.limit(100),
      ]);
      counts.waiting = mine.rows.filter((row) => row.status === "open").length;
      counts.matched = mine.rows.filter((row) => row.status === "matched").length;
      counts.answered = mine.rows.filter((row) => row.status === "answered").length;
      attention = counts.answered + counts.matched;
    }

    return NextResponse.json({ attention, counts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("marketplace summary", error);
    return NextResponse.json({ attention: 0, counts: {} }, { headers: { "Cache-Control": "no-store" } });
  }
}

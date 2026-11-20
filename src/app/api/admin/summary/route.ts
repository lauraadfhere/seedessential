import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireAdmin } from "@/lib/appwrite/auth";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { listRows } from "@/lib/appwrite/db";
import { createAdminClient } from "@/lib/appwrite/admin";

export const dynamic = "force-dynamic";

/** GET /api/admin/summary — live Appwrite platform counters for the admin overview. */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const { users } = createAdminClient();
    const [userList, profiles, experts, requests, claims, messages] = await Promise.all([
      users.list({ queries: [Query.limit(100)] }).catch(() => ({ total: 0, users: [] })),
      listRows(COLLECTIONS.profiles, [Query.limit(100)]),
      listRows(COLLECTIONS.expertProfiles, [Query.limit(100)]),
      listRows(COLLECTIONS.consultationRequests, [Query.limit(100)]),
      listRows(COLLECTIONS.claims, [Query.limit(100)]),
      listRows(COLLECTIONS.requestMessages, [Query.limit(100)]),
    ]);

    const roleCounts = { admin: 0, customer: 0, expert: 0, provider: 0 };
    for (const row of profiles.rows) {
      const role = String(row.role || "customer");
      if (role in roleCounts) roleCounts[role as keyof typeof roleCounts] += 1;
    }

    const requestStatus = { open: 0, matched: 0, answered: 0, completed: 0, other: 0 };
    let pendingModeration = 0;
    for (const row of requests.rows) {
      const status = String(row.status || "open");
      if (status in requestStatus) requestStatus[status as keyof typeof requestStatus] += 1;
      else requestStatus.other += 1;
      if (String(row.moderationStatus || "") === "pending") pendingModeration += 1;
    }

    const pendingExperts = experts.rows.filter((row) => String(row.status || "") === "pending").length;
    const activeExperts = experts.rows.filter((row) => String(row.status || "") === "active").length;
    const openClaims = claims.rows.filter((row) => ["open", "in_review", "pending"].includes(String(row.status || "open"))).length;

    const counts = {
      users: userList.total || profiles.total,
      profiles: profiles.total,
      ...roleCounts,
      experts: experts.total,
      expertsTotal: experts.total,
      expertsPending: pendingExperts,
      expertsActive: activeExperts,
      requests: requests.total,
      requestsTotal: requests.total,
      requestsOpen: requestStatus.open,
      requestsMatched: requestStatus.matched,
      requestsAnswered: requestStatus.answered,
      requestsCompleted: requestStatus.completed,
      moderationPending: pendingModeration,
      messages: messages.total,
      claims: claims.total,
      claimsOpen: openClaims,
      // aliases used by the overview queue cards
      requestsHeld: pendingModeration,
      messagesFlagged: 0,
    };

    const attention = pendingModeration + pendingExperts + openClaims;

    return NextResponse.json(
      {
        attention,
        counts,
        queue: {
          requests: pendingModeration,
          messages: 0,
          experts: pendingExperts,
          claims: openClaims,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("admin summary", error);
    return NextResponse.json({ error: "Failed to load admin summary" }, { status: 500 });
  }
}

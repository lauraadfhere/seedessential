import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireUser } from "@/lib/appwrite/auth";
import { ensureExpertDoc } from "@/lib/appwrite/accounts";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { listRows } from "@/lib/appwrite/db";
import { countMessagesFor, serializeAppwriteRequest } from "@/lib/appwrite/requests";

export const dynamic = "force-dynamic";

/** GET /api/expert-requests — Appwrite consultation requests for the signed-in role. */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    if (user.role === "provider") {
      return NextResponse.json({ error: "Providers see expert demand from /api/provider/insights" }, { status: 403 });
    }

    const scope = new URL(request.url).searchParams.get("scope") ?? "";
    let rows = [] as Awaited<ReturnType<typeof listRows>>["rows"];
    let expertId = "";

    if (user.role === "admin") {
      const listed = await listRows(COLLECTIONS.consultationRequests, [
        ...(scope === "moderation" ? [Query.equal("moderationStatus", "pending")] : []),
        Query.orderDesc("$createdAt"),
        Query.limit(300),
      ]);
      rows = listed.rows;
    } else if (user.role === "expert" && scope !== "mine") {
      const expert = await ensureExpertDoc(user);
      expertId = expert.$id;
      const assigned =
        scope === "inbox"
          ? { rows: [] as typeof rows }
          : await listRows(COLLECTIONS.consultationRequests, [
              Query.equal("assignedExpertId", expert.$id),
              Query.orderDesc("$updatedAt"),
              Query.limit(200),
            ]);
      const open =
        scope === "assigned"
          ? { rows: [] as typeof rows }
          : await listRows(COLLECTIONS.consultationRequests, [
              Query.equal("status", "open"),
              Query.equal("moderationStatus", "approved"),
              Query.orderDesc("$createdAt"),
              Query.limit(300),
            ]);
      const assignedIds = new Set(assigned.rows.map((row) => row.$id));
      rows = [
        ...assigned.rows,
        ...open.rows.filter((row) => {
          if (assignedIds.has(row.$id)) return false;
          const declined = Array.isArray(row.declinedBy) ? row.declinedBy.map(String) : [];
          return !declined.includes(expert.$id);
        }),
      ];
    } else {
      const listed = await listRows(COLLECTIONS.consultationRequests, [
        Query.equal("customerId", user.id),
        Query.orderDesc("$createdAt"),
        Query.limit(200),
      ]);
      rows = listed.rows;
    }

    const counts = await countMessagesFor(rows.map((row) => row.$id));
    return NextResponse.json(
      rows.map((row) => serializeAppwriteRequest(row, user, expertId || undefined, counts.get(row.$id) ?? 0)),
    );
  } catch (error) {
    console.error("Error fetching expert requests:", error);
    return NextResponse.json([]);
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Creating consultation requests on Appwrite is being finalized. Please try again shortly." },
    { status: 501 },
  );
}

import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";
import { MESSAGE_CLASS, REQUEST_CLASS, expertCanSeeOpen, viewerFor } from "@/lib/parse/marketplace";
import type { MarketplaceSummary } from "@/lib/marketplace-types";

export const dynamic = "force-dynamic";

/** GET /api/marketplace/summary — role-aware counters for the header badge and dashboards. */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const Parse = getParseAdmin();
    const viewer = await viewerFor(user);
    const q = () => new Parse.Query(REQUEST_CLASS);
    let summary: MarketplaceSummary;

    if (viewer.role === "admin") {
      const [requests, messages, experts, listings, total] = await Promise.all([
        q().equalTo("moderationStatus", "pending").count({ useMasterKey: true }),
        new Parse.Query(MESSAGE_CLASS).equalTo("flagged", true).notEqualTo("moderationReviewed", true).count({ useMasterKey: true }),
        new Parse.Query("ExpertProfile").equalTo("status", "pending").count({ useMasterKey: true }),
        new Parse.Query("Product").equalTo("visibilityStatus", "pending").count({ useMasterKey: true }),
        q().count({ useMasterKey: true }),
      ]);
      summary = { role: "admin", attention: requests + messages + experts + listings, counts: { requests, messages, experts, listings, total } };
    } else if (viewer.role === "expert") {
      const [open, matched, answered, completed] = await Promise.all([
        q().equalTo("status", "open").equalTo("moderationStatus", "approved").limit(300).find({ useMasterKey: true }),
        q().equalTo("assignedExpert", viewer.profile).equalTo("status", "matched").count({ useMasterKey: true }),
        q().equalTo("assignedExpert", viewer.profile).equalTo("status", "answered").count({ useMasterKey: true }),
        q().equalTo("assignedExpert", viewer.profile).equalTo("status", "completed").count({ useMasterKey: true }),
      ]);
      const inbox = open.filter((item) => expertCanSeeOpen(item, viewer.profile)).length;
      summary = {
        role: "expert",
        attention: inbox + matched,
        counts: { inbox, matched, answered, completed, verified: viewer.profile?.get("status") === "active" ? 1 : 0 },
      };
    } else if (viewer.role === "provider") {
      const listings = await new Parse.Query("Product").equalTo("provider", user).select("slug", "visibilityStatus").limit(1000).find({ useMasterKey: true });
      const slugs = listings.map((item) => item.get("slug") as string);
      const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [recommendations, recent] = slugs.length
        ? await Promise.all([
            q().containedIn("recommendedSlugs", slugs).count({ useMasterKey: true }),
            q().containedIn("recommendedSlugs", slugs).greaterThan("answeredAt", week).count({ useMasterKey: true }),
          ])
        : [0, 0];
      summary = {
        role: "provider",
        attention: recent,
        counts: {
          listings: listings.length,
          pending: listings.filter((item) => item.get("visibilityStatus") === "pending").length,
          recommendations,
          recent,
        },
      };
    } else {
      const mine = await q().equalTo("customer", user).select("status").limit(500).find({ useMasterKey: true });
      const by = (status: string[]) => mine.filter((item) => status.includes(item.get("status"))).length;
      summary = {
        role: "customer",
        attention: by(["answered"]),
        counts: { waiting: by(["submitted", "open"]), matched: by(["matched"]), answered: by(["answered"]), completed: by(["completed"]), total: mine.length },
      };
    }

    return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error building marketplace summary:", error);
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }
}

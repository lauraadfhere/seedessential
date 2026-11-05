import { NextResponse } from "next/server";
import type Parse from "parse/node";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireProvider } from "@/lib/parse/require-admin";
import { REQUEST_CLASS } from "@/lib/parse/marketplace";
import { categoryLabel } from "@/lib/marketplace-types";

export const dynamic = "force-dynamic";

/**
 * GET /api/provider/insights — how expert recommendations and grower demand
 * connect to this provider's equipment. Aggregated only: providers never see
 * a grower's identity or request details.
 */
export async function GET(request: Request) {
  const user = await requireProvider(request);
  if (!user) return NextResponse.json({ error: "Provider access required" }, { status: 403 });

  const Parse = getParseAdmin();
  const listings = await new Parse.Query("Product").equalTo("provider", user).limit(1000).find({ useMasterKey: true });
  const slugs = listings.map((item) => item.get("slug") as string);
  const coverage = new Set(listings.flatMap((item) => ((item.get("coverageWilayas") as string[]) ?? [])));

  const recommended: Parse.Object[] = slugs.length
    ? await new Parse.Query(REQUEST_CLASS).containedIn("recommendedSlugs", slugs).include("assignedExpert").descending("answeredAt").limit(1000).find({ useMasterKey: true })
    : [];

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const openQuery = new Parse.Query(REQUEST_CLASS).containedIn("status", ["open", "matched", "answered"]).greaterThan("createdAt", since).select("wilaya", "category").limit(2000);
  if (coverage.size) openQuery.containedIn("wilaya", [...coverage]);
  const demand = await openQuery.find({ useMasterKey: true });

  const products = listings.map((listing) => {
    const slug = listing.get("slug") as string;
    const hits = recommended.filter((item) => ((item.get("recommendedSlugs") as string[]) ?? []).includes(slug));
    const experts = new Set(hits.map((item) => (item.get("assignedExpert") as Parse.Object | undefined)?.get("name")).filter(Boolean));
    return {
      slug,
      name: listing.get("name") as string,
      visibilityStatus: listing.get("visibilityStatus") ?? "published",
      recommendations: hits.length,
      experts: [...experts].slice(0, 5),
      wilayas: [...new Set(hits.map((item) => item.get("wilaya") as string).filter(Boolean))].slice(0, 6),
      lastRecommendedAt: (hits[0]?.get("answeredAt") as Date | undefined)?.toISOString(),
    };
  });

  const tally = (key: "wilaya" | "category") => {
    const counts = new Map<string, number>();
    for (const item of demand) {
      const value = item.get(key) as string | undefined;
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name: key === "category" ? categoryLabel(name) : name, count }));
  };

  return NextResponse.json({
    totals: {
      listings: listings.length,
      published: listings.filter((item) => (item.get("visibilityStatus") ?? "published") === "published").length,
      recommendations: recommended.length,
      demand30d: demand.length,
    },
    products: products.sort((a, b) => b.recommendations - a.recommendations),
    demandByWilaya: tally("wilaya"),
    demandByTopic: tally("category"),
  });
}

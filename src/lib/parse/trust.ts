import "server-only";

import type Parse from "parse/node";
import { getParseAdmin } from "./admin";
import { MESSAGE_CLASS, REQUEST_CLASS, getExpertProfile, roleOf } from "./marketplace";
import { buildAccountProfile, ensureBusiness } from "./accounts";
import { expertTrust, providerTrust, type TrustReport } from "@/lib/trust";

export const CLAIM_CLASS = "Claim";
export const ORDER_CLASS = "Order";

function persist(target: Parse.Object, report: TrustReport) {
  target.set({
    trustScore: report.score,
    trustTier: report.tier,
    trustSignals: report.signals,
    trustPenalties: report.penalties,
    trustUpdatedAt: new Date(report.updatedAt),
  });
  return target.save(null, { useMasterKey: true });
}

async function claimCounts(user: Parse.User) {
  const Parse = getParseAdmin();
  const against = () => new Parse.Query(CLAIM_CLASS).equalTo("respondent", user);
  const [upheld, open] = await Promise.all([
    against().equalTo("status", "resolved").equalTo("resolution", "claimant").count({ useMasterKey: true }),
    against().containedIn("status", ["open", "awaiting_response", "under_review"]).count({ useMasterKey: true }),
  ]);
  return { upheld, open };
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function recomputeExpertTrust(profile: Parse.Object) {
  const Parse = getParseAdmin();
  const user = profile.get("user") as Parse.User | undefined;
  if (!user) return null;
  await user.fetch({ useMasterKey: true });
  const assigned = () => new Parse.Query(REQUEST_CLASS).equalTo("assignedExpert", profile);
  const [completed, acceptedCount, recentAccepted, claims, hiddenMessages, account] = await Promise.all([
    assigned().equalTo("status", "completed").count({ useMasterKey: true }),
    assigned().exists("acceptedAt").count({ useMasterKey: true }),
    assigned().exists("acceptedAt").select("acceptedAt").descending("acceptedAt").limit(60).find({ useMasterKey: true }),
    claimCounts(user),
    new Parse.Query(MESSAGE_CLASS).equalTo("author", user).equalTo("hidden", true).count({ useMasterKey: true }),
    buildAccountProfile(user),
  ]);
  const hours = recentAccepted
    .map((item) => ((item.get("acceptedAt") as Date).getTime() - (item.createdAt?.getTime() ?? 0)) / 3_600_000)
    .filter((value) => Number.isFinite(value) && value >= 0);
  const report = expertTrust({
    verified: profile.get("status") === "active",
    suspended: user.get("status") === "suspended" || profile.get("status") === "suspended",
    ratingAverage: profile.get("rating") ?? 0,
    reviewsCount: profile.get("reviewsCount") ?? 0,
    completed,
    accepted: acceptedCount,
    medianResponseHours: median(hours),
    profileCompleteness: account.completeness.score,
    upheldClaims: claims.upheld,
    hiddenMessages,
  });
  await persist(profile, report);
  return report;
}

export async function recomputeProviderTrust(user: Parse.User) {
  const Parse = getParseAdmin();
  await user.fetch({ useMasterKey: true });
  const business = await ensureBusiness(user);
  const listings = await new Parse.Query("Product").equalTo("provider", user).select("slug", "visibilityStatus").limit(1000).find({ useMasterKey: true });
  const slugs = listings.map((item) => item.get("slug") as string);
  const [recommendations, delivered, reviews, claims, account] = await Promise.all([
    slugs.length ? new Parse.Query(REQUEST_CLASS).containedIn("recommendedSlugs", slugs).count({ useMasterKey: true }) : Promise.resolve(0),
    new Parse.Query(ORDER_CLASS).equalTo("providerIds", user.id).equalTo("status", "delivered").count({ useMasterKey: true }),
    listings.length
      ? new Parse.Query("Review").containedIn("product", listings).equalTo("status", "published").select("rating").limit(1000).find({ useMasterKey: true })
      : Promise.resolve([] as Parse.Object[]),
    claimCounts(user),
    buildAccountProfile(user),
  ]);
  const ratings = reviews.map((item) => Number(item.get("rating")) || 0).filter(Boolean);
  const report = providerTrust({
    verified: business.get("verificationStatus") === "verified",
    suspended: user.get("status") === "suspended",
    published: listings.filter((item) => item.get("visibilityStatus") === "published").length,
    rejected: listings.filter((item) => item.get("visibilityStatus") === "rejected").length,
    expertRecommendations: recommendations,
    deliveredOrders: delivered,
    ratingAverage: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    reviewsCount: ratings.length,
    profileCompleteness: account.completeness.score,
    accountAgeDays: Math.floor((Date.now() - (user.createdAt?.getTime() ?? Date.now())) / 86_400_000),
    upheldClaims: claims.upheld,
    openClaims: claims.open,
  });
  await persist(business, report);
  return report;
}

/** Recompute whichever trust record belongs to this user. Never throws — trust is advisory. */
export async function refreshTrust(user?: Parse.User | null) {
  if (!user) return null;
  try {
    await user.fetch({ useMasterKey: true });
    const role = roleOf(user);
    if (role === "expert") {
      const profile = await getExpertProfile(user);
      return profile ? await recomputeExpertTrust(profile) : null;
    }
    if (role === "provider") return await recomputeProviderTrust(user);
    return null;
  } catch (error) {
    console.error("Trust recompute failed:", error);
    return null;
  }
}

export async function refreshTrustForUserIds(ids: string[]) {
  const Parse = getParseAdmin();
  const unique = [...new Set(ids.filter(Boolean))];
  await Promise.all(unique.map((id) => refreshTrust(Parse.User.createWithoutData(id) as Parse.User)));
}

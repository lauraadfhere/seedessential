/**
 * Trust & worthiness engine — pure scoring functions shared by the server
 * (which persists scores) and the browser (which renders the breakdown).
 *
 * Scores are 0–100 and built only from outcomes the platform can verify:
 * admin verification, completed work, published reviews, delivered orders,
 * expert endorsements, upheld claims and moderation strikes.
 */

export type TrustTier = "restricted" | "new" | "rising" | "trusted" | "top";

export type TrustSignal = {
  key: string;
  label: string;
  points: number;
  max: number;
  detail: string;
};

export type TrustReport = {
  score: number;
  tier: TrustTier;
  signals: TrustSignal[];
  penalties: TrustSignal[];
  updatedAt: string;
};

export const TRUST_TIERS: Record<TrustTier, { label: string; tone: string; description: string }> = {
  restricted: { label: "Restricted", tone: "bg-red-50 text-red-700 ring-red-200", description: "Repeated upheld claims or moderation strikes. Hidden from rankings and ads." },
  new: { label: "New", tone: "bg-neutral-100 text-neutral-700 ring-neutral-200", description: "Getting started — not enough verified history yet." },
  rising: { label: "Rising", tone: "bg-sky-50 text-sky-800 ring-sky-200", description: "Verified with a growing record of good outcomes." },
  trusted: { label: "Trusted", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200", description: "Consistent, verified results across many growers." },
  top: { label: "Top rated", tone: "bg-[#40533d] text-white ring-[#40533d]", description: "Among the most reliable on Tannelli." },
};

/** Minimum trust a provider needs before their sponsored listings are served. */
export const AD_TRUST_FLOOR = 35;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 10) / 10;

/** Log-scaled volume so the 50th job counts less than the 5th. */
function volume(count: number, saturation: number) {
  return clamp(Math.log10(1 + Math.max(0, count)) / Math.log10(1 + saturation));
}

/** Bayesian average pulls small samples towards a neutral prior. */
export function bayesianRating(average: number, count: number, prior = 4, weight = 5) {
  if (!count) return prior;
  return (prior * weight + average * count) / (weight + count);
}

function ratingPoints(average: number, count: number) {
  return clamp((bayesianRating(average, count) - 3) / 2);
}

function signal(key: string, label: string, ratio: number, max: number, detail: string): TrustSignal {
  return { key, label, points: round(clamp(ratio) * max), max, detail };
}

function penalty(key: string, label: string, points: number, detail: string): TrustSignal {
  return { key, label, points: -round(points), max: 0, detail };
}

function finish(signals: TrustSignal[], penalties: TrustSignal[], opts: { reviews: number; strikes: number; suspended?: boolean }): TrustReport {
  const positive = signals.reduce((sum, item) => sum + item.points, 0);
  const negative = Math.min(45, penalties.reduce((sum, item) => sum - item.points, 0));
  const score = Math.round(clamp(positive - negative, 0, 100));
  let tier: TrustTier = "new";
  if (opts.suspended || opts.strikes >= 3) tier = "restricted";
  else if (score >= 85 && opts.reviews >= 10) tier = "top";
  else if (score >= 68) tier = "trusted";
  else if (score >= 45) tier = "rising";
  return { score: opts.suspended ? 0 : score, tier, signals, penalties, updatedAt: new Date().toISOString() };
}

export type ExpertTrustInput = {
  verified: boolean;
  suspended?: boolean;
  ratingAverage: number;
  reviewsCount: number;
  completed: number;
  /** Requests the expert accepted (any later status). */
  accepted: number;
  /** Median hours between a request opening and the expert accepting it. */
  medianResponseHours: number | null;
  profileCompleteness: number; // 0..100
  upheldClaims: number;
  hiddenMessages: number;
};

export function expertTrust(input: ExpertTrustInput): TrustReport {
  const completionRate = input.accepted ? input.completed / input.accepted : 0.5;
  const response = input.medianResponseHours;
  const responseRatio = response === null ? 0.5 : response <= 2 ? 1 : response <= 12 ? 0.75 : response <= 48 ? 0.4 : 0.1;
  const signals = [
    signal("verified", "Verified by Tannelli", input.verified ? 1 : 0, 20, input.verified ? "Credentials reviewed by an administrator" : "Awaiting credential review"),
    signal("rating", "Grower ratings", ratingPoints(input.ratingAverage, input.reviewsCount), 30, input.reviewsCount ? `${input.ratingAverage.toFixed(1)}★ from ${input.reviewsCount} review${input.reviewsCount === 1 ? "" : "s"}` : "No reviews yet"),
    signal("volume", "Completed requests", volume(input.completed, 50), 15, `${input.completed} completed`),
    signal("reliability", "Follow-through", completionRate, 15, input.accepted ? `${Math.round(completionRate * 100)}% of accepted requests completed` : "No accepted requests yet"),
    signal("response", "Response speed", responseRatio, 10, response === null ? "Not measured yet" : `Typically accepts within ${response < 1 ? "an hour" : `${Math.round(response)}h`}`),
    signal("profile", "Profile completeness", input.profileCompleteness / 100, 10, `${Math.round(input.profileCompleteness)}% complete`),
  ];
  const penalties = [
    ...(input.upheldClaims ? [penalty("claims", "Upheld claims", input.upheldClaims * 10, `${input.upheldClaims} claim${input.upheldClaims === 1 ? "" : "s"} upheld against this expert`)] : []),
    ...(input.hiddenMessages ? [penalty("moderation", "Moderation strikes", input.hiddenMessages * 3, `${input.hiddenMessages} message${input.hiddenMessages === 1 ? "" : "s"} removed by moderators`)] : []),
  ];
  return finish(signals, penalties, { reviews: input.reviewsCount, strikes: input.upheldClaims + Math.floor(input.hiddenMessages / 3), suspended: input.suspended });
}

export type ProviderTrustInput = {
  verified: boolean;
  suspended?: boolean;
  published: number;
  rejected: number;
  expertRecommendations: number;
  deliveredOrders: number;
  ratingAverage: number;
  reviewsCount: number;
  profileCompleteness: number;
  accountAgeDays: number;
  upheldClaims: number;
  openClaims: number;
};

export function providerTrust(input: ProviderTrustInput): TrustReport {
  const reviewed = input.published + input.rejected;
  const approval = reviewed ? input.published / reviewed : 0.5;
  const signals = [
    signal("verified", "Verified business", input.verified ? 1 : 0, 20, input.verified ? "Company documents checked by Tannelli" : "Business not verified yet"),
    signal("catalog", "Listing quality", approval * 0.65 + clamp(input.published / 10) * 0.35, 15, reviewed ? `${input.published} published · ${input.rejected} rejected` : "No reviewed listings yet"),
    signal("endorsed", "Expert endorsements", volume(input.expertRecommendations, 30), 20, `Recommended in ${input.expertRecommendations} expert plan${input.expertRecommendations === 1 ? "" : "s"}`),
    signal("fulfilment", "Delivered orders", volume(input.deliveredOrders, 100), 15, `${input.deliveredOrders} delivered`),
    signal("rating", "Buyer ratings", ratingPoints(input.ratingAverage, input.reviewsCount), 15, input.reviewsCount ? `${input.ratingAverage.toFixed(1)}★ from ${input.reviewsCount} review${input.reviewsCount === 1 ? "" : "s"}` : "No reviews yet"),
    signal("profile", "Profile completeness", input.profileCompleteness / 100, 10, `${Math.round(input.profileCompleteness)}% complete`),
    signal("tenure", "Time on Tannelli", input.accountAgeDays >= 90 ? 1 : input.accountAgeDays >= 30 ? 0.6 : 0.2, 5, `${input.accountAgeDays} days`),
  ];
  const penalties = [
    ...(input.upheldClaims ? [penalty("claims", "Upheld claims", input.upheldClaims * 10, `${input.upheldClaims} claim${input.upheldClaims === 1 ? "" : "s"} upheld against this seller`)] : []),
    ...(input.openClaims ? [penalty("open", "Open claims", input.openClaims * 2, `${input.openClaims} claim${input.openClaims === 1 ? "" : "s"} under review`)] : []),
  ];
  return finish(signals, penalties, { reviews: input.reviewsCount, strikes: input.upheldClaims, suspended: input.suspended });
}

/** Score Tannelli's own catalogue uses for seller trust. */
export const HOUSE_TRUST = 88;

export type RankInput = {
  sellerTrust: number;
  rating: number;
  reviews: number;
  expertRecommendations: number;
  sales: number;
  inStock: boolean;
  featured: boolean;
};

/** "Worthiness" used for the smart default sort: who you can rely on, not who paid. */
export function productRank(input: RankInput) {
  const value =
    0.35 * input.sellerTrust +
    0.25 * ratingPoints(input.rating, input.reviews) * 100 +
    0.2 * volume(input.expertRecommendations, 20) * 100 +
    0.1 * volume(input.sales, 100) * 100 +
    0.1 * (input.inStock ? 100 : 0) +
    (input.featured ? 4 : 0);
  return Math.round(clamp(value, 0, 100));
}

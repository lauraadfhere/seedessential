import { NextResponse } from "next/server";
import type Parse from "parse/node";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";
import { cleanString, displayName, serializeExpert } from "@/lib/parse/marketplace";
import { moderateText } from "@/lib/moderation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };
type ParseServer = ReturnType<typeof getParseAdmin>;

async function activeProfile(Parse: ParseServer, slug: string) {
  return new Parse.Query("ExpertProfile").equalTo("slug", slug).equalTo("status", "active").include("user").first({ useMasterKey: true });
}

/**
 * Each consultation a grower completes with an expert gives one review slot.
 * Closing a request (`complete`) already writes a review, so those reviews use up the slots.
 */
async function reviewSlots(Parse: ParseServer, user: Parse.User, profile: Parse.Object) {
  const [completed, written] = await Promise.all([
    new Parse.Query("ConsultationRequest")
      .equalTo("customer", user)
      .equalTo("assignedExpert", profile)
      .equalTo("status", "completed")
      .count({ useMasterKey: true }),
    new Parse.Query("Review").equalTo("user", user).equalTo("expert", profile).count({ useMasterKey: true }),
  ]);
  return { completed, written, open: Math.max(0, completed - written) };
}

/** GET /api/experts/:slug — a verified expert's public profile, rating breakdown and published reviews. */
export async function GET(request: Request, { params }: Context) {
  const { slug } = await params;
  const Parse = getParseAdmin();
  const profile = await activeProfile(Parse, slug);
  if (!profile) return NextResponse.json({ error: "Expert not found" }, { status: 404 });

  const reviews = await new Parse.Query("Review")
    .equalTo("expert", profile)
    .equalTo("status", "published")
    .include("user")
    .descending("createdAt")
    .limit(1000)
    .find({ useMasterKey: true });

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((review) => review.get("rating") === stars).length }));

  // Signed-in growers learn whether they still have a review to leave for this expert.
  const user = await requireUser(request);
  const open = user ? (await reviewSlots(Parse, user, profile)).open : 0;

  return NextResponse.json({
    expert: serializeExpert(profile),
    reviews: reviews.slice(0, 10).map((review) => ({
      id: review.id,
      rating: review.get("rating") ?? 0,
      body: review.get("body") ?? "",
      author: displayName(review.get("user"), "Grower").split(" ")[0],
      createdAt: review.createdAt?.toISOString(),
    })),
    summary: { average: profile.get("rating") ?? 0, count: reviews.length, distribution },
    eligibility: { signedIn: Boolean(user), canReview: open > 0 },
  });
}

/** POST /api/experts/:slug — a grower reviews an expert after a completed consultation. */
export async function POST(request: Request, { params }: Context) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { slug } = await params;
    const Parse = getParseAdmin();
    const profile = await activeProfile(Parse, slug);
    if (!profile) return NextResponse.json({ error: "Expert not found" }, { status: 404 });

    if ((await reviewSlots(Parse, user, profile)).open === 0) {
      return NextResponse.json({ error: "You can review this expert once a consultation with them is completed, and you have already left a review for each one." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const rating = Math.round(Number(body.rating));
    if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "Rate the expert from 1 to 5 stars." }, { status: 400 });
    const text = moderateText(cleanString(body.body, 1000));

    const review = new (Parse.Object.extend("Review"))();
    review.set({ user, expert: profile, rating, body: text.text, status: text.hold ? "pending" : "published", moderationFlags: text.flags });
    await review.save(null, { useMasterKey: true });

    if (!text.hold) {
      const published = await new Parse.Query("Review").equalTo("expert", profile).equalTo("status", "published").select("rating").limit(1000).find({ useMasterKey: true });
      const average = published.reduce((sum, item) => sum + (Number(item.get("rating")) || 0), 0) / published.length;
      profile.set({ rating: Math.round(average * 10) / 10, reviewsCount: published.length });
      await profile.save(null, { useMasterKey: true });
    }

    return NextResponse.json({ ok: true, status: text.hold ? "pending" : "published" }, { status: 201 });
  } catch (error) {
    console.error("Error saving expert review:", error);
    return NextResponse.json({ error: "Could not save your review" }, { status: 500 });
  }
}

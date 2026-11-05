import { NextResponse } from "next/server";
import type Parse from "parse/node";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireAdmin } from "@/lib/parse/require-admin";
import { refreshTrust } from "@/lib/parse/trust";
import { MESSAGE_CLASS, cleanString, displayName, requestQuery, serializeMessage, serializeRequest, viewerFor } from "@/lib/parse/marketplace";

export const dynamic = "force-dynamic";

/** GET /api/admin/moderation — everything waiting for a moderation decision. */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const Parse = getParseAdmin();
  const viewer = await viewerFor(admin);
  const [held, flaggedRequests, messages, reviews] = await Promise.all([
    requestQuery().equalTo("moderationStatus", "pending").descending("createdAt").limit(200).find({ useMasterKey: true }),
    requestQuery().equalTo("moderationStatus", "approved").exists("moderationFlags").descending("createdAt").limit(200).find({ useMasterKey: true }),
    new Parse.Query(MESSAGE_CLASS).equalTo("flagged", true).notEqualTo("moderationReviewed", true).include("author").include("request").descending("createdAt").limit(200).find({ useMasterKey: true }),
    new Parse.Query("Review").equalTo("status", "pending").include("user").include("expert").include("product").descending("createdAt").limit(200).find({ useMasterKey: true }),
  ]);

  return NextResponse.json({
    requests: held.map((item) => serializeRequest(item, viewer)),
    flaggedRequests: flaggedRequests
      .filter((item) => ((item.get("moderationFlags") as string[]) ?? []).length > 0 && !item.get("moderationReviewed"))
      .map((item) => serializeRequest(item, viewer)),
    messages: messages.map((message) => ({
      ...serializeMessage(message, viewer),
      flags: message.get("moderationFlags") ?? [],
      requestId: (message.get("request") as Parse.Object | undefined)?.id,
      requestTitle: (message.get("request") as Parse.Object | undefined)?.get("title") ?? "Request",
    })),
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.get("rating") ?? 0,
      body: review.get("body") ?? "",
      author: displayName(review.get("user"), "Grower"),
      expert: (review.get("expert") as Parse.Object | undefined)?.get("name") ?? (review.get("product") as Parse.Object | undefined)?.get("name") ?? "Listing",
      target: review.get("product") ? "product" : "expert",
      flags: review.get("moderationFlags") ?? [],
      createdAt: review.createdAt?.toISOString(),
    })),
  });
}

/** POST /api/admin/moderation — `{ type: "review" | "requestFlags", id, action: "publish" | "reject" | "dismiss" }`. */
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const Parse = getParseAdmin();
  const body = await request.json().catch(() => ({}));
  const id = cleanString(body.id, 40);

  if (body.type === "review" && ["publish", "reject"].includes(body.action)) {
    const review = await new Parse.Query("Review").get(id, { useMasterKey: true }).catch(() => undefined);
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    review.set({ status: body.action === "publish" ? "published" : "rejected", moderatedBy: admin });
    await review.save(null, { useMasterKey: true });
    const product = review.get("product") as Parse.Object | undefined;
    if (product) {
      await product.fetch({ useMasterKey: true });
      const published = await new Parse.Query("Review").equalTo("product", product).equalTo("status", "published").select("rating").limit(1000).find({ useMasterKey: true });
      if (published.length) {
        product.set({ rating: Math.round((published.reduce((sum, item) => sum + (Number(item.get("rating")) || 0), 0) / published.length) * 10) / 10, reviewsCount: published.length });
        await product.save(null, { useMasterKey: true });
      }
      await refreshTrust(product.get("provider") as Parse.User | undefined);
    }
    const expert = review.get("expert") as Parse.Object | undefined;
    if (expert) {
      await expert.fetch({ useMasterKey: true });
      await refreshTrust(expert.get("user") as Parse.User | undefined);
    }
    return NextResponse.json({ ok: true });
  }

  if (body.type === "requestFlags" && body.action === "dismiss") {
    const item = await new Parse.Query("ConsultationRequest").get(id, { useMasterKey: true }).catch(() => undefined);
    if (!item) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    item.set("moderationReviewed", true);
    await item.save(null, { useMasterKey: true });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported moderation action" }, { status: 400 });
}

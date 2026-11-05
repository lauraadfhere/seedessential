import { NextResponse } from "next/server";
import type Parse from "parse/node";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";
import { products as seededProducts } from "@/lib/data";
import { loadStoredProducts, serializeProduct, visibilityOf } from "@/lib/parse/catalog";
import { moderateText } from "@/lib/moderation";
import type { RecommendedProduct, RequestAction } from "@/lib/marketplace-types";
import {
  MESSAGE_CLASS,
  canViewRequest,
  cleanString,
  loadRequest,
  serializeMessage,
  serializeRequest,
  viewerFor,
} from "@/lib/parse/marketplace";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const MAX_RECOMMENDED_PRODUCTS = 8;

async function messagesFor(item: Parse.Object) {
  const Parse = getParseAdmin();
  return new Parse.Query(MESSAGE_CLASS).equalTo("request", item).include("author").ascending("createdAt").limit(500).find({ useMasterKey: true });
}

/** GET /api/expert-requests/:id — request detail plus its conversation. */
export async function GET(request: Request, { params }: Context) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const item = await loadRequest(id);
  if (!item) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const viewer = await viewerFor(user);
  if (!canViewRequest(item, viewer)) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  // Experts browsing an open request do not see the private thread yet.
  const thread = viewer.role === "admin" || viewer.user.id === item.get("customer")?.id || item.get("assignedExpert")?.id === viewer.profile?.id;
  const messages = thread ? await messagesFor(item) : [];
  return NextResponse.json({
    request: serializeRequest(item, viewer, messages.length),
    messages: messages.map((message) => serializeMessage(message, viewer)),
  });
}

/** Resolves expert-picked products against the published catalog, including approved provider equipment. */
async function resolveProducts(value: unknown): Promise<RecommendedProduct[]> {
  if (!Array.isArray(value)) return [];
  const wanted = value
    .map((entry) => (typeof entry === "string" ? { slug: entry } : entry))
    .filter((entry): entry is { slug: string; note?: string } => typeof entry?.slug === "string")
    .slice(0, MAX_RECOMMENDED_PRODUCTS);
  if (!wanted.length) return [];

  const stored = await loadStoredProducts();
  const bySlug = new Map(stored.map((product) => [product.get("slug") as string, product]));
  const resolved: RecommendedProduct[] = [];
  for (const { slug, note } of wanted) {
    const live = bySlug.get(slug);
    const seed = seededProducts.find((product) => product.slug === slug);
    if (!live && !seed) continue;
    if (live && visibilityOf(live) !== "published") continue;
    const record = serializeProduct(seed, live);
    resolved.push({
      slug,
      name: record.name,
      providerName: record.providerName,
      note: note ? moderateText(cleanString(note, 200)).text : undefined,
    });
  }
  return resolved;
}

async function recordExpertRating(profile: Parse.Object, rating: number) {
  const count = (profile.get("reviewsCount") as number) ?? 0;
  const average = (profile.get("rating") as number) ?? 0;
  profile.set("rating", Math.round(((average * count + rating) / (count + 1)) * 10) / 10);
  profile.set("reviewsCount", count + 1);
  profile.increment("completedRequests");
  await profile.save(null, { useMasterKey: true });
}

/** PATCH /api/expert-requests/:id — `{ action, ...payload }` drives the request lifecycle. */
export async function PATCH(request: Request, { params }: Context) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const item = await loadRequest(id);
  if (!item) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const viewer = await viewerFor(user);
  if (!canViewRequest(item, viewer)) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const action = body.action as RequestAction;
  const allowed = serializeRequest(item, viewer).viewer.actions;
  if (!allowed.includes(action)) {
    return NextResponse.json({ error: "This action is not available for this request right now." }, { status: 409 });
  }

  const Parse = getParseAdmin();
  const now = new Date();

  try {
    switch (action) {
      case "accept": {
        // Re-read to avoid two experts accepting the same request.
        await item.fetch({ useMasterKey: true });
        if (item.get("status") !== "open") return NextResponse.json({ error: "Another expert already accepted this request." }, { status: 409 });
        item.set({ assignedExpert: viewer.profile, status: "matched", acceptedAt: now });
        break;
      }
      case "decline": {
        item.addUnique("declinedBy", viewer.profile!.id);
        if (item.get("preferredExpert")?.id === viewer.profile!.id) item.unset("preferredExpert");
        break;
      }
      case "recommend": {
        const recommendation = moderateText(cleanString(body.recommendation, 6000));
        if (recommendation.text.length < 30) {
          return NextResponse.json({ error: "Write a recommendation of at least 30 characters.", fields: { recommendation: "Too short" } }, { status: 400 });
        }
        const plan = moderateText(cleanString(body.maintenancePlan, 4000));
        const estimated = Number(body.estimatedBudget);
        const recommended = await resolveProducts(body.products);
        item.set({
          recommendation: recommendation.text,
          maintenancePlan: plan.text,
          estimatedBudget: Number.isFinite(estimated) && estimated > 0 ? estimated : 0,
          recommendedProducts: recommended,
          recommendedSlugs: recommended.map((product) => product.slug),
          status: "answered",
          answeredAt: now,
        });
        const flags = [...recommendation.flags, ...plan.flags];
        if (flags.length) item.set("moderationFlags", [...new Set([...(item.get("moderationFlags") ?? []), ...flags])]);
        break;
      }
      case "cancel": {
        item.set({ status: "cancelled" });
        break;
      }
      case "complete": {
        const rating = Math.round(Number(body.rating));
        if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "Rate the expert from 1 to 5 stars." }, { status: 400 });
        const review = moderateText(cleanString(body.review, 1000));
        item.set({ status: "completed", completedAt: now, rating, review: review.text });
        const expert = item.get("assignedExpert") as Parse.Object | undefined;
        if (expert) {
          await recordExpertRating(expert, rating);
          const entry = new (Parse.Object.extend("Review"))();
          entry.set({ user, expert, rating, body: review.text, status: review.hold ? "pending" : "published" });
          await entry.save(null, { useMasterKey: true });
        }
        break;
      }
      case "approve": {
        item.set({ moderationStatus: "approved", moderationNote: cleanString(body.note, 500) });
        if (["submitted", "rejected"].includes(item.get("status"))) item.set("status", "open");
        break;
      }
      case "reject": {
        item.set({ moderationStatus: "rejected", status: "rejected", moderationNote: cleanString(body.note, 500) || "This request does not meet the community guidelines." });
        break;
      }
      case "reopen": {
        item.unset("assignedExpert");
        item.unset("acceptedAt");
        item.set({ status: "open", moderationStatus: "approved" });
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    if (["accept", "recommend", "complete", "reject", "reopen"].includes(action)) {
      const note = new (Parse.Object.extend(MESSAGE_CLASS))();
      const text: Record<string, string> = {
        accept: "accepted this request and will follow up here.",
        recommend: "shared a recommendation.",
        complete: "closed the request and rated the expert.",
        reject: "declined this request during moderation.",
        reopen: "reopened this request to other experts.",
      };
      note.set({ request: item, author: user, authorRole: viewer.role, body: `${user.get("name") || "Tannelli"} ${text[action]}`, system: true, attachments: [], moderationFlags: [] });
      await note.save(null, { useMasterKey: true });
    }

    await item.save(null, { useMasterKey: true });
    const fresh = (await loadRequest(id)) ?? item;
    return NextResponse.json(serializeRequest(fresh, viewer));
  } catch (error) {
    console.error(`Error running "${action}" on request:`, error);
    return NextResponse.json({ error: "Could not update this request" }, { status: 500 });
  }
}

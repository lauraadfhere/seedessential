import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";
import { moderateText } from "@/lib/moderation";
import { algeriaWilayas } from "@/lib/algeria";
import {
  MAX_REQUEST_PHOTOS,
  REQUEST_CATEGORIES,
  REQUEST_SPACES,
  SUN_LEVELS,
  URGENCY_LEVELS,
} from "@/lib/marketplace-types";
import {
  cleanString,
  countMessages,
  expertCanSeeOpen,
  idOf,
  requestQuery,
  sanitizePhotos,
  serializeRequest,
  viewerFor,
} from "@/lib/parse/marketplace";

export const dynamic = "force-dynamic";

const DAILY_REQUEST_LIMIT = 10;

/**
 * GET /api/expert-requests?scope=
 * - growers: their own requests
 * - experts: `inbox` (open requests matching their coverage), `assigned`, or both by default
 * - admins: `moderation` (held for review) or everything
 */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const viewer = await viewerFor(user);
    const scope = new URL(request.url).searchParams.get("scope") ?? "";
    let results;

    if (viewer.role === "provider") {
      return NextResponse.json({ error: "Providers see expert demand from /api/provider/insights" }, { status: 403 });
    }

    if (viewer.role === "admin") {
      const query = requestQuery().descending("createdAt").limit(300);
      if (scope === "moderation") query.equalTo("moderationStatus", "pending");
      results = await query.find({ useMasterKey: true });
    } else if (viewer.role === "expert" && scope !== "mine") {
      const assigned = scope === "inbox"
        ? []
        : await requestQuery().equalTo("assignedExpert", viewer.profile).descending("updatedAt").limit(200).find({ useMasterKey: true });
      const open = scope === "assigned"
        ? []
        : (await requestQuery().equalTo("status", "open").equalTo("moderationStatus", "approved").descending("createdAt").limit(300).find({ useMasterKey: true }))
            .filter((item) => expertCanSeeOpen(item, viewer.profile));
      results = [...assigned, ...open.filter((item) => !assigned.some((own) => own.id === item.id))];
    } else {
      results = await requestQuery().equalTo("customer", user).descending("createdAt").limit(200).find({ useMasterKey: true });
    }

    const counts = await countMessages(results);
    return NextResponse.json(results.map((item) => serializeRequest(item, viewer, counts.get(idOf(item)) ?? 0)));
  } catch (error) {
    console.error("Error fetching expert requests:", error);
    return NextResponse.json({ error: "Failed to fetch expert requests" }, { status: 500 });
  }
}

/** POST /api/expert-requests — a grower submits a detailed request for expert help. */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const viewer = await viewerFor(user);
    if (viewer.role === "provider") {
      return NextResponse.json({ error: "Provider accounts cannot submit grower requests" }, { status: 403 });
    }

    const Parse = getParseAdmin();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await new Parse.Query("ConsultationRequest").equalTo("customer", user).greaterThan("createdAt", since).count({ useMasterKey: true });
    if (recent >= DAILY_REQUEST_LIMIT) {
      return NextResponse.json({ error: "You have reached today's request limit. Please try again tomorrow." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const title = cleanString(body.title, 120);
    const objective = cleanString(body.objective, 3000);
    const wilaya = cleanString(body.wilaya, 60);
    const category = cleanString(body.category, 40);

    const errors: Record<string, string> = {};
    if (title.length < 5) errors.title = "Give your request a short title (5+ characters).";
    if (objective.length < 30) errors.objective = "Describe the situation in at least 30 characters so an expert can help.";
    if (!algeriaWilayas.some((item) => item.name === wilaya)) errors.wilaya = "Choose your wilaya.";
    if (!REQUEST_CATEGORIES.some((item) => item.value === category)) errors.category = "Choose a topic.";
    if (Object.keys(errors).length) return NextResponse.json({ error: "Please complete the highlighted fields.", fields: errors }, { status: 400 });

    const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T) =>
      (allowed as readonly string[]).includes(value as string) ? (value as T) : fallback;

    const free = {
      title,
      objective,
      location: cleanString(body.location, 120),
      plantType: cleanString(body.plantType, 120),
      areaSize: cleanString(body.areaSize, 80),
      soilInfo: cleanString(body.soilInfo, 500),
      waterAvailability: cleanString(body.waterAvailability, 500),
    };
    const flags = new Set<string>();
    let hold = false;
    const moderated = Object.fromEntries(
      Object.entries(free).map(([key, value]) => {
        const result = moderateText(value);
        result.flags.forEach((flag) => flags.add(flag));
        hold ||= result.hold;
        return [key, result.text];
      }),
    ) as typeof free;

    let preferredExpert;
    const preferredSlug = cleanString(body.preferredExpert, 80);
    if (preferredSlug) {
      preferredExpert = await new Parse.Query("ExpertProfile").equalTo("slug", preferredSlug).equalTo("status", "active").first({ useMasterKey: true });
      if (!preferredExpert) return NextResponse.json({ error: "The selected expert is not available." }, { status: 400 });
    }

    const budget = Number(body.budget);
    const item = new (Parse.Object.extend("ConsultationRequest"))();
    item.set({
      customer: user,
      ...moderated,
      category,
      wilaya,
      mode: body.mode === "onsite" ? "onsite" : "online",
      urgency: pick(body.urgency, URGENCY_LEVELS.map((level) => level.value), "normal"),
      spaceDetails: pick(body.spaceDetails, REQUEST_SPACES, "garden"),
      sunExposure: pick(body.sunExposure, SUN_LEVELS, "medium"),
      budget: Number.isFinite(budget) && budget > 0 ? Math.min(budget, 1e9) : 0,
      photos: sanitizePhotos(body.photos, MAX_REQUEST_PHOTOS),
      status: hold ? "submitted" : "open",
      moderationStatus: hold ? "pending" : "approved",
      moderationFlags: [...flags],
      declinedBy: [],
      recommendedProducts: [],
    });
    if (preferredExpert) item.set("preferredExpert", preferredExpert);

    const acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    item.setACL(acl);

    await item.save(null, { useMasterKey: true });
    const saved = await requestQuery().get(item.id, { useMasterKey: true });
    return NextResponse.json(serializeRequest(saved, viewer), { status: 201 });
  } catch (error) {
    console.error("Error creating expert request:", error);
    return NextResponse.json({ error: "Failed to create expert request" }, { status: 500 });
  }
}

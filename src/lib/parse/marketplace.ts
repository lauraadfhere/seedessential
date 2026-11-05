import "server-only";

import type Parse from "parse/node";
import { getParseAdmin } from "./admin";
import { isExpertRole, isProviderRole } from "@/lib/roles";
import type {
  ExpertSummary,
  ModerationStatus,
  RequestAction,
  RequestMessage,
  RequestRecord,
  RequestStatus,
} from "@/lib/marketplace-types";

export type ViewerRole = "admin" | "expert" | "provider" | "customer";

export type Viewer = {
  user: Parse.User;
  role: ViewerRole;
  /** Present when the viewer is an expert (created on demand). */
  profile?: Parse.Object;
};

export const REQUEST_CLASS = "ConsultationRequest";
export const MESSAGE_CLASS = "RequestMessage";

export function roleOf(user: Parse.User): ViewerRole {
  const role = user.get("role") as string | undefined;
  if (role === "admin") return "admin";
  if (isExpertRole(role)) return "expert";
  if (isProviderRole(role)) return "provider";
  return "customer";
}

export function displayName(user?: Parse.Object | null, fallback = "Member") {
  if (!user) return fallback;
  return (user.get("name") as string) || fallback;
}

/** First name + initial, so experts never see a grower's full identity before matching. */
export function privateName(user?: Parse.Object | null) {
  const parts = displayName(user, "Grower").trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

export function slugifyName(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "expert";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function getExpertProfile(user: Parse.User) {
  const Parse = getParseAdmin();
  return new Parse.Query("ExpertProfile").equalTo("user", user).first({ useMasterKey: true });
}

/** Experts who registered before profiles existed get a pending profile on first use. */
export async function ensureExpertProfile(user: Parse.User) {
  const existing = await getExpertProfile(user);
  if (existing) return existing;
  const Parse = getParseAdmin();
  const profile = new (Parse.Object.extend("ExpertProfile"))();
  profile.set({
    user,
    name: displayName(user, "Expert"),
    slug: slugifyName(displayName(user, "expert")),
    professionalCategory: (user.get("expertiseDomain") as string) || "General",
    specialties: (user.get("specialties") as string[]) || [],
    bio: (user.get("expertBio") as string) || "",
    location: (user.get("serviceCity") as string) || "",
    coverageWilayas: (user.get("coverageWilayas") as string[]) || [],
    languages: [],
    experienceYears: 0,
    consultationPrice: 0,
    rating: 0,
    reviewsCount: 0,
    completedRequests: 0,
    online: true,
    status: "pending",
  });
  const acl = new Parse.ACL();
  acl.setPublicReadAccess(true);
  profile.setACL(acl);
  await profile.save(null, { useMasterKey: true });
  return profile;
}

export async function viewerFor(user: Parse.User): Promise<Viewer> {
  const role = roleOf(user);
  if (role !== "expert") return { user, role };
  return { user, role, profile: await ensureExpertProfile(user) };
}

export function serializeExpert(profile: Parse.Object): ExpertSummary {
  const user = profile.get("user") as Parse.Object | undefined;
  return {
    id: idOf(profile),
    slug: profile.get("slug") ?? profile.id,
    name: profile.get("name") || displayName(user, "Expert"),
    avatar: profile.get("avatar") || user?.get?.("profilePicturePublicId") || undefined,
    professionalCategory: profile.get("professionalCategory") ?? "General",
    specialties: profile.get("specialties") ?? [],
    bio: profile.get("bio") ?? "",
    experienceYears: profile.get("experienceYears") ?? 0,
    languages: profile.get("languages") ?? [],
    location: profile.get("location") ?? "",
    coverageWilayas: profile.get("coverageWilayas") ?? [],
    online: profile.get("online") !== false,
    consultationPrice: profile.get("consultationPrice") ?? 0,
    rating: profile.get("rating") ?? 0,
    reviewsCount: profile.get("reviewsCount") ?? 0,
    completedRequests: profile.get("completedRequests") ?? 0,
    status: profile.get("status") ?? "pending",
    trustScore: profile.get("trustScore") ?? 0,
    trustTier: profile.get("trustTier") ?? "new",
  };
}

/** Public profile view: adds the explainable trust breakdown. */
export function serializeExpertDetail(profile: Parse.Object): ExpertSummary {
  return {
    ...serializeExpert(profile),
    trustSignals: profile.get("trustSignals") ?? [],
    trustPenalties: profile.get("trustPenalties") ?? [],
  };
}

export function idOf(object: Parse.Object) {
  return object.id ?? "";
}

function iso(value: unknown) {
  return value instanceof Date ? value.toISOString() : undefined;
}

function sameId(a?: Parse.Object | null, b?: Parse.Object | null) {
  return Boolean(a && b && a.id === b.id);
}

/** Whether an expert may see a still-open request in their inbox. */
export function expertCanSeeOpen(request: Parse.Object, profile?: Parse.Object) {
  if (!profile || profile.get("status") !== "active") return false;
  if (request.get("status") !== "open" || request.get("moderationStatus") !== "approved") return false;
  if (((request.get("declinedBy") as string[]) ?? []).includes(idOf(profile))) return false;
  const preferred = request.get("preferredExpert") as Parse.Object | undefined;
  if (preferred) return preferred.id === profile.id;
  if (request.get("mode") === "online" && profile.get("online") !== false) return true;
  const coverage = (profile.get("coverageWilayas") as string[]) ?? [];
  return coverage.length === 0 || coverage.includes(request.get("wilaya"));
}

export function canViewRequest(request: Parse.Object, viewer: Viewer) {
  if (viewer.role === "admin") return true;
  if (sameId(request.get("customer"), viewer.user)) return true;
  if (viewer.role === "expert") {
    if (sameId(request.get("assignedExpert"), viewer.profile)) return true;
    return expertCanSeeOpen(request, viewer.profile);
  }
  return false;
}

function actionsFor(request: Parse.Object, viewer: Viewer): RequestAction[] {
  const status = request.get("status") as RequestStatus;
  const isOwner = sameId(request.get("customer"), viewer.user);
  const isAssigned = sameId(request.get("assignedExpert"), viewer.profile);
  const actions: RequestAction[] = [];

  if (viewer.role === "admin") {
    if (request.get("moderationStatus") !== "approved" || status === "rejected") actions.push("approve");
    if (status !== "rejected" && status !== "completed") actions.push("reject");
    if (status === "matched" || status === "cancelled") actions.push("reopen");
  }
  if (isOwner) {
    if (["submitted", "open", "matched"].includes(status)) actions.push("cancel");
    if (status === "answered") actions.push("complete");
    if (["matched", "answered"].includes(status)) actions.push("message");
  }
  if (viewer.role === "expert") {
    if (status === "open" && expertCanSeeOpen(request, viewer.profile)) actions.push("accept", "decline");
    if (isAssigned && ["matched", "answered"].includes(status)) actions.push("recommend", "message");
  }
  return [...new Set(actions)];
}

export function serializeRequest(request: Parse.Object, viewer: Viewer, messagesCount = 0): RequestRecord {
  const customer = request.get("customer") as Parse.Object | undefined;
  const preferred = request.get("preferredExpert") as Parse.Object | undefined;
  const assigned = request.get("assignedExpert") as Parse.Object | undefined;
  const isOwner = sameId(customer, viewer.user);
  const isAssigned = sameId(assigned, viewer.profile);
  const showFullName = viewer.role === "admin" || isOwner || isAssigned;

  return {
    id: idOf(request),
    status: (request.get("status") as RequestStatus) ?? "submitted",
    moderationStatus: (request.get("moderationStatus") as ModerationStatus) ?? "approved",
    moderationFlags: viewer.role === "admin" || isOwner ? (request.get("moderationFlags") ?? []) : [],
    moderationNote: viewer.role === "admin" || isOwner ? request.get("moderationNote") || undefined : undefined,
    title: request.get("title") || request.get("plantType") || "Expert request",
    objective: request.get("objective") ?? "",
    category: request.get("category") ?? "agronomy",
    mode: request.get("mode") ?? "online",
    urgency: request.get("urgency") ?? "normal",
    wilaya: request.get("wilaya") ?? "",
    location: request.get("location") ?? "",
    plantType: request.get("plantType") ?? "",
    spaceDetails: request.get("spaceDetails") ?? "",
    areaSize: request.get("areaSize") ?? "",
    sunExposure: request.get("sunExposure") ?? "",
    soilInfo: request.get("soilInfo") ?? "",
    waterAvailability: request.get("waterAvailability") ?? "",
    budget: request.get("budget") ?? 0,
    photos: request.get("photos") ?? [],
    createdAt: iso(request.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(request.updatedAt) ?? new Date().toISOString(),
    acceptedAt: iso(request.get("acceptedAt")),
    answeredAt: iso(request.get("answeredAt")),
    completedAt: iso(request.get("completedAt")),
    customer: customer
      ? { id: idOf(customer), name: showFullName ? displayName(customer, "Grower") : privateName(customer), accountKind: customer.get("accountKind") }
      : null,
    preferredExpert: preferred
      ? { id: idOf(preferred), slug: preferred.get("slug") ?? preferred.id, name: preferred.get("name") ?? "Expert" }
      : null,
    assignedExpert: assigned
      ? {
          id: idOf(assigned),
          slug: assigned.get("slug") ?? assigned.id,
          name: assigned.get("name") ?? "Expert",
          professionalCategory: assigned.get("professionalCategory") ?? "",
          location: assigned.get("location") ?? "",
          avatar: assigned.get("avatar") || undefined,
        }
      : null,
    recommendation: request.get("recommendation") ?? "",
    maintenancePlan: request.get("maintenancePlan") ?? "",
    estimatedBudget: request.get("estimatedBudget") ?? 0,
    recommendedProducts: request.get("recommendedProducts") ?? [],
    rating: request.get("rating") ?? undefined,
    review: request.get("review") ?? undefined,
    messagesCount,
    viewer: {
      role: viewer.role === "provider" ? "viewer" : viewer.role,
      isOwner,
      isAssignedExpert: isAssigned,
      actions: actionsFor(request, viewer),
    },
  };
}

export function serializeMessage(message: Parse.Object, viewer: Viewer): RequestMessage {
  const author = message.get("author") as Parse.Object | undefined;
  const hidden = Boolean(message.get("hidden"));
  return {
    id: idOf(message),
    body: hidden && viewer.role !== "admin" ? "This message was removed by moderation." : message.get("body") ?? "",
    authorId: author ? idOf(author) : "",
    authorName: displayName(author, "Member"),
    authorRole: message.get("authorRole") ?? "customer",
    attachments: hidden && viewer.role !== "admin" ? [] : message.get("attachments") ?? [],
    flagged: (message.get("moderationFlags") ?? []).length > 0,
    hidden,
    system: Boolean(message.get("system")),
    createdAt: iso(message.createdAt) ?? new Date().toISOString(),
  };
}

export function requestQuery() {
  const Parse = getParseAdmin();
  return new Parse.Query(REQUEST_CLASS)
    .include("customer")
    .include("preferredExpert")
    .include("assignedExpert");
}

export async function loadRequest(id: string) {
  try {
    return await requestQuery().get(id, { useMasterKey: true });
  } catch {
    return undefined;
  }
}

export async function countMessages(requests: Parse.Object[]) {
  if (!requests.length) return new Map<string, number>();
  const Parse = getParseAdmin();
  const messages = await new Parse.Query(MESSAGE_CLASS)
    .containedIn("request", requests)
    .select("request")
    .limit(5000)
    .find({ useMasterKey: true });
  const counts = new Map<string, number>();
  for (const message of messages) {
    const id = (message.get("request") as Parse.Object | undefined)?.id;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Only allow Cloudinary assets that were uploaded into the request folder. */
export function sanitizePhotos(value: unknown, max: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && /^tannelli\/consultation-requests\/[\w\-/]+$/.test(item))
    .slice(0, max);
}

export function cleanString(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

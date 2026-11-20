import "server-only";
import { Query } from "node-appwrite";
import { resolveAvatarUrl } from "@/lib/default-avatar";
import type { AppwriteAccount } from "./auth";
import { COLLECTIONS } from "./config";
import { listRows, type Row } from "./db";

export function serializeAppwriteRequest(
  row: Row,
  viewer: AppwriteAccount,
  expertProfileId?: string,
  messagesCount = 0,
) {
  const isOwner = row.customerId === viewer.id;
  const isAssignedExpert = Boolean(expertProfileId && row.assignedExpertId === expertProfileId);
  const status = String(row.status || "open");
  const actions: string[] = [];

  if (viewer.role === "expert") {
    if (status === "open" && !isAssignedExpert) actions.push("accept", "decline");
    if (isAssignedExpert && ["matched", "answered"].includes(status)) actions.push("recommend", "message");
  }
  if (isOwner) {
    if (["open", "matched"].includes(status)) actions.push("cancel");
    if (status === "answered") actions.push("complete");
    if (["matched", "answered"].includes(status)) actions.push("message");
  }
  if (viewer.role === "admin") {
    if (row.moderationStatus !== "approved") actions.push("approve");
    if (status !== "rejected" && status !== "completed") actions.push("reject");
  }

  return {
    id: row.$id,
    status,
    moderationStatus: row.moderationStatus || "approved",
    moderationFlags: (row.moderationFlags as string[]) || [],
    moderationNote: row.moderationNote ? String(row.moderationNote) : undefined,
    title: String(row.title || "Expert request"),
    objective: String(row.objective || ""),
    category: String(row.category || "agronomy"),
    mode: (row.mode as "online" | "onsite") || "online",
    urgency: String(row.urgency || "normal"),
    wilaya: String(row.wilaya || ""),
    location: String(row.location || ""),
    plantType: String(row.plantType || ""),
    spaceDetails: String(row.spaceDetails || ""),
    areaSize: String(row.areaSize || ""),
    sunExposure: String(row.sunExposure || ""),
    soilInfo: String(row.soilInfo || ""),
    waterAvailability: String(row.waterAvailability || ""),
    budget: Number(row.budget || 0),
    photos: (row.photos as string[]) || [],
    createdAt: String(row.$createdAt || new Date().toISOString()),
    updatedAt: String(row.$updatedAt || row.$createdAt || new Date().toISOString()),
    customer: row.customerId
      ? { id: String(row.customerId), name: String(row.customerName || "Grower") }
      : null,
    preferredExpert: null,
    assignedExpert: isAssignedExpert || row.assignedExpertId
      ? {
          id: String(row.assignedExpertId),
          slug: "demo-expert",
          name: "Demo Expert",
          professionalCategory: "Agronomy",
          location: "Alger",
          avatar: resolveAvatarUrl(),
        }
      : null,
    recommendation: String(row.recommendation || ""),
    maintenancePlan: String(row.maintenancePlan || ""),
    estimatedBudget: Number(row.budget || 0),
    recommendedProducts: Array.isArray(row.recommendedProducts) ? (row.recommendedProducts as { slug: string; name: string; note?: string; providerName?: string }[]) : [],
    messagesCount,
    viewer: {
      role: viewer.role === "admin" || viewer.role === "expert" || viewer.role === "customer" ? viewer.role : "viewer",
      isOwner,
      isAssignedExpert,
      actions,
    },
  };
}

export async function countMessagesFor(requestIds: string[]) {
  const counts = new Map<string, number>();
  if (!requestIds.length) return counts;
  // Appwrite Query.equal supports arrays for OR on same attribute in many versions;
  // fall back to per-id counts if needed.
  for (const id of requestIds) {
    try {
      const listed = await listRows(COLLECTIONS.requestMessages, [
        Query.equal("requestId", id),
        Query.limit(100),
      ]);
      counts.set(id, listed.total);
    } catch {
      counts.set(id, 0);
    }
  }
  return counts;
}

export async function messagesForRequest(requestId: string) {
  const listed = await listRows(COLLECTIONS.requestMessages, [
    Query.equal("requestId", requestId),
    Query.orderAsc("$createdAt"),
    Query.limit(200),
  ]);
  return listed.rows.map((row) => ({
    id: row.$id,
    body: String(row.body || ""),
    authorId: String(row.authorId || ""),
    authorName: String(row.authorName || "Member"),
    authorRole: String(row.authorRole || "customer"),
    attachments: [],
    flagged: false,
    hidden: false,
    system: false,
    createdAt: String(row.$createdAt || new Date().toISOString()),
  }));
}

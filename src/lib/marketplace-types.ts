/**
 * Shared, client-safe vocabulary for the grower ↔ expert ↔ provider marketplace.
 * Server handlers and UI both import from here so statuses never drift.
 */

import type { TrustSignal, TrustTier } from "./trust";

export type RequestStatus =
  | "submitted" // waiting for moderation, hidden from experts
  | "open" // visible to matching experts
  | "matched" // an expert accepted the request
  | "answered" // the expert delivered a recommendation
  | "completed" // the grower closed the request
  | "cancelled"
  | "rejected"; // refused by moderation

export type ModerationStatus = "approved" | "pending" | "rejected";

export type RequestMode = "online" | "onsite";

export const REQUEST_CATEGORIES = [
  { value: "agronomy", label: "Agronomy & crops" },
  { value: "irrigation", label: "Irrigation & water" },
  { value: "soil", label: "Soil & fertilisation" },
  { value: "pests", label: "Pests & diseases" },
  { value: "landscaping", label: "Garden & landscaping" },
  { value: "indoor", label: "Indoor & urban plants" },
  { value: "orchard", label: "Orchards & trees" },
  { value: "greenhouse", label: "Greenhouse" },
] as const;

export type RequestCategory = (typeof REQUEST_CATEGORIES)[number]["value"];

export const REQUEST_SPACES = ["balcony", "garden", "indoor", "farm", "greenhouse"] as const;
export const SUN_LEVELS = ["low", "medium", "full"] as const;
export const URGENCY_LEVELS = [
  { value: "normal", label: "Within a week" },
  { value: "soon", label: "Within 48 hours" },
  { value: "urgent", label: "Urgent — crop at risk" },
] as const;

export const MAX_REQUEST_PHOTOS = 6;

export const STATUS_META: Record<RequestStatus, { label: string; tone: string; step: number }> = {
  submitted: { label: "In review", tone: "bg-amber-50 text-amber-800 ring-amber-200", step: 0 },
  open: { label: "Open to experts", tone: "bg-sky-50 text-sky-800 ring-sky-200", step: 1 },
  matched: { label: "Expert assigned", tone: "bg-indigo-50 text-indigo-800 ring-indigo-200", step: 2 },
  answered: { label: "Recommendation ready", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200", step: 3 },
  completed: { label: "Completed", tone: "bg-[#eaf0e8] text-[#263b2d] ring-[#cfdccb]", step: 4 },
  cancelled: { label: "Cancelled", tone: "bg-neutral-100 text-neutral-600 ring-neutral-200", step: -1 },
  rejected: { label: "Not accepted", tone: "bg-red-50 text-red-700 ring-red-200", step: -1 },
};

export const STATUS_STEPS = ["Submitted", "Open", "Expert assigned", "Recommendation", "Completed"];

export function categoryLabel(value?: string) {
  return REQUEST_CATEGORIES.find((item) => item.value === value)?.label ?? value ?? "General";
}

export type ExpertSummary = {
  id: string;
  slug: string;
  name: string;
  avatar?: string;
  professionalCategory: string;
  specialties: string[];
  bio: string;
  experienceYears: number;
  languages: string[];
  location: string;
  coverageWilayas: string[];
  online: boolean;
  consultationPrice: number;
  rating: number;
  reviewsCount: number;
  completedRequests: number;
  status: string;
  trustScore: number;
  trustTier: TrustTier;
  trustSignals?: TrustSignal[];
  trustPenalties?: TrustSignal[];
};

export type RecommendedProduct = {
  slug: string;
  name: string;
  note?: string;
  providerName?: string;
};

export type RequestRecord = {
  id: string;
  status: RequestStatus;
  moderationStatus: ModerationStatus;
  moderationFlags: string[];
  moderationNote?: string;
  title: string;
  objective: string;
  category: string;
  mode: RequestMode;
  urgency: string;
  wilaya: string;
  location: string;
  plantType: string;
  spaceDetails: string;
  areaSize: string;
  sunExposure: string;
  soilInfo: string;
  waterAvailability: string;
  budget: number;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  answeredAt?: string;
  completedAt?: string;
  customer: { id: string; name: string; accountKind?: string } | null;
  preferredExpert: { id: string; slug: string; name: string } | null;
  assignedExpert: { id: string; slug: string; name: string; professionalCategory: string; location: string; avatar?: string } | null;
  recommendation: string;
  maintenancePlan: string;
  estimatedBudget: number;
  recommendedProducts: RecommendedProduct[];
  rating?: number;
  review?: string;
  messagesCount: number;
  /** Actions the current viewer may perform, computed server-side. */
  viewer: {
    role: "customer" | "expert" | "admin" | "viewer";
    isOwner: boolean;
    isAssignedExpert: boolean;
    actions: RequestAction[];
  };
};

export type RequestAction =
  | "accept"
  | "decline"
  | "recommend"
  | "message"
  | "cancel"
  | "complete"
  | "approve"
  | "reject"
  | "reopen";

export type RequestMessage = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  attachments: string[];
  flagged: boolean;
  hidden: boolean;
  system: boolean;
  createdAt: string;
};

export type MarketplaceSummary = {
  role: string;
  /** Items needing the viewer's attention (drives the header badge). */
  attention: number;
  counts: Record<string, number>;
};

/** Client-safe vocabulary for disputes between growers, experts, sellers and Tannelli. */

export type ClaimStatus = "awaiting_response" | "under_review" | "resolved" | "rejected" | "withdrawn";
export type ClaimSubject = "order" | "request" | "listing" | "expert";
export type ClaimResolution = "claimant" | "respondent" | "split";
export type ClaimParty = "claimant" | "respondent" | "admin";
export type ClaimAction = "message" | "escalate" | "withdraw" | "resolve" | "reject" | "reopen";

export const CLAIM_SUBJECTS: { value: ClaimSubject; label: string; help: string }[] = [
  { value: "order", label: "An order", help: "Delivery, damaged or wrong items" },
  { value: "request", label: "An expert request", help: "Advice, no-show or conduct during a consultation" },
  { value: "listing", label: "A listing", help: "Misleading, counterfeit or unsafe product" },
  { value: "expert", label: "An expert profile", help: "False credentials or misconduct" },
];

export const CLAIM_REASONS: { value: string; label: string; subjects: ClaimSubject[] }[] = [
  { value: "not_delivered", label: "Not delivered", subjects: ["order"] },
  { value: "damaged", label: "Arrived damaged or dead", subjects: ["order"] },
  { value: "wrong_item", label: "Wrong or missing item", subjects: ["order"] },
  { value: "not_as_described", label: "Not as described", subjects: ["order", "listing"] },
  { value: "counterfeit", label: "Counterfeit or unsafe product", subjects: ["order", "listing"] },
  { value: "no_show", label: "Expert did not follow through", subjects: ["request"] },
  { value: "poor_advice", label: "Advice caused harm or loss", subjects: ["request"] },
  { value: "unprofessional", label: "Unprofessional conduct", subjects: ["request", "expert"] },
  { value: "false_credentials", label: "False credentials", subjects: ["expert"] },
  { value: "abusive_customer", label: "Abusive or fraudulent customer", subjects: ["request", "order"] },
  { value: "fraud", label: "Fraud or scam attempt", subjects: ["order", "request", "listing", "expert"] },
  { value: "other", label: "Something else", subjects: ["order", "request", "listing", "expert"] },
];

export const CLAIM_STATUS_META: Record<ClaimStatus, { label: string; tone: string }> = {
  awaiting_response: { label: "Awaiting response", tone: "bg-amber-50 text-amber-900 ring-amber-200" },
  under_review: { label: "Under review", tone: "bg-sky-50 text-sky-800 ring-sky-200" },
  resolved: { label: "Resolved", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  rejected: { label: "Closed — not upheld", tone: "bg-neutral-100 text-neutral-700 ring-neutral-200" },
  withdrawn: { label: "Withdrawn", tone: "bg-neutral-100 text-neutral-600 ring-neutral-200" },
};

export const RESOLUTION_LABELS: Record<ClaimResolution, string> = {
  claimant: "Upheld for the claimant",
  respondent: "Decided for the respondent",
  split: "Shared responsibility",
};

export const RESPONSE_WINDOW_HOURS = 72;

export type ClaimEvent = {
  id: string;
  at: string;
  kind: "created" | "message" | "status" | "resolution";
  party: ClaimParty | "system";
  author: string;
  body: string;
  attachments: string[];
};

export type ClaimRecord = {
  id: string;
  number: string;
  status: ClaimStatus;
  subjectType: ClaimSubject;
  subjectRef: string;
  subjectTitle: string;
  subjectHref?: string;
  reason: string;
  description: string;
  evidence: string[];
  claimant: { id: string; name: string; role: string };
  respondent: { id: string; name: string; role: string } | null;
  respondBy?: string;
  resolution?: ClaimResolution;
  resolutionNote?: string;
  refundAmount?: number;
  moderationFlags: string[];
  createdAt: string;
  updatedAt: string;
  timeline: ClaimEvent[];
  viewer: { party: ClaimParty; actions: ClaimAction[] };
};

export function reasonLabel(value: string) {
  return CLAIM_REASONS.find((item) => item.value === value)?.label ?? value;
}

/**
 * Tannelli Parse schema reference.
 *
 * This documents every Parse class used by the platform and its fields, for
 * type-safe querying (`getParse().Object.extend("Product")` etc). The
 * classes themselves are created/updated in your Back4App app by running:
 *
 *   yarn parse:schema
 *
 * which executes `scripts/parse-schema.mjs` against the Master Key.
 */

export type ID = string;

export interface CategoryAttrs {
  name: string;
  slug: string;
  kind: "plant" | "equipment";
}

export interface ProductAttrs {
  name: string;
  slug: string;
  kind: "plant" | "equipment";
  category: ID; // Pointer<Category>
    price: number;
    /** Optional Algerian dinar selling price, managed independently from USD. */
    priceDZD?: number;
  currency: string;
  rating: number;
  reviewsCount: number;
  shortDescription: string;
  description: string;
  inStock: boolean;
  featured: boolean;
  /** Controls whether experts may add this plant to a recommendation. */
  availableForExpertRequests?: boolean;
  difficulty?: "Easy" | "Moderate" | "Advanced";
  light?: string;
  climate?: string;
  care?: string;
  usage?: string;
  specs?: { label: string; value: string }[];
  /** Cloudinary public IDs. */
  images: string[];
  /** Cloudinary public ID for a downloadable spec sheet, if any. */
  pdfSpecSheet?: string;
  originWilaya?: string;
  coverageWilayas?: string[];
  /** Public shop visibility. Seeded catalog items default to published. Provider submissions start as pending. */
  visibilityStatus?: "published" | "pending" | "rejected";
  /** Company account that submitted this listing, if any. */
  provider?: ID; // Pointer<_User>
  companyName?: string;
}

export interface ExpertAttrs {
  user: ID; // Pointer<_User>
  name: string;
  slug: string;
  role: string;
  category: string;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  hourlyRate: number;
  languages: string[];
  location: string;
  online: boolean;
  specialties: string[];
  bio: string;
  /** Cloudinary public ID. */
  avatar?: string;
  /** Cloudinary public IDs. */
  portfolio: string[];
}

export interface ConsultationTypeAttrs {
  expert?: ID; // Pointer<Expert>, empty = platform-wide offering
  name: string;
  durationMinutes?: number;
  price: number;
  description: string;
}

export type { RequestStatus as ConsultationRequestStatus } from "@/lib/marketplace-types";

/** Stored in `ConsultationRequest`; ACL is master-key only, all access goes through `/api/expert-requests`. */
export interface ConsultationRequestAttrs {
  customer: ID; // Pointer<_User>
  preferredExpert?: ID; // Pointer<ExpertProfile>, chosen by the grower
  assignedExpert?: ID; // Pointer<ExpertProfile>, set when an expert accepts
  status: import("@/lib/marketplace-types").RequestStatus;
  title: string;
  objective: string;
  category: string;
  mode: "online" | "onsite";
  urgency: "normal" | "soon" | "urgent";
  wilaya: string;
  location?: string;
  plantType?: string;
  spaceDetails?: string;
  areaSize?: string;
  sunExposure?: string;
  soilInfo?: string;
  waterAvailability?: string;
  budget?: number;
  /** Cloudinary public IDs under tannelli/consultation-requests. */
  photos: string[];
  declinedBy: ID[]; // ExpertProfile IDs
  recommendation?: string;
  maintenancePlan?: string;
  estimatedBudget?: number;
  /** Published catalog items (plants or provider equipment) the expert recommends. */
  recommendedProducts: { slug: string; name: string; note?: string; providerName?: string }[];
  recommendedSlugs: string[];
  rating?: number;
  review?: string;
  moderationStatus: "approved" | "pending" | "rejected";
  moderationFlags: string[];
  moderationNote?: string;
}

export interface RequestMessageAttrs {
  request: ID; // Pointer<ConsultationRequest>
  author: ID; // Pointer<_User>
  authorRole: string;
  body: string;
  attachments: string[];
  system?: boolean;
  hidden?: boolean;
  flagged?: boolean;
  moderationFlags: string[];
}

export interface ConsultationAttrs {
  request?: ID; // Pointer<ConsultationRequest>
  expert: ID; // Pointer<Expert>
  customer: ID; // Pointer<_User>
  type: string; // e.g. "30-minute consultation"
  scheduledAt: string; // ISO date
  status: "scheduled" | "completed" | "cancelled";
  price: number;
  notes?: string;
}

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

export interface OrderAttrs {
  customer: ID; // Pointer<_User>
  status: OrderStatus;
  total: number;
  currency: string;
  shippingAddress?: ID; // Pointer<Address>
  deliveryStatus: "processing" | "shipped" | "delivered";
  shippingProvider?: string; // ID of shipping provider (e.g., "yalidine", "zr_express")
  deliveryMethod?: "home" | "stop_desk"; // Delivery method
  paymentMethod?: "cod" | "card" | "transfer"; // Payment method
  estimatedDays?: string; // Estimated delivery time
  shippingCost?: number; // Shipping cost in base currency
  shippingCostDzd?: number; // Shipping cost in DZD
}

export interface OrderItemAttrs {
  order: ID; // Pointer<Order>
  product: ID; // Pointer<Product>
  quantity: number;
  unitPrice: number;
}

export interface GardenProjectAttrs {
  owner: ID; // Pointer<_User>
  name: string;
  type: "balcony" | "backyard" | "vegetable" | "orchard" | "indoor" | "farm";
  budget: number;
  progress: number;
  /** Cloudinary public IDs. */
  photos: string[];
  expertRecommendations?: string;
  // Relations: plants, equipment -> Product; tasks -> ProjectTask
}

export interface ProjectTaskAttrs {
  project: ID; // Pointer<GardenProject>
  title: string;
  dueDate?: string; // ISO date
  completed: boolean;
  type: "watering" | "maintenance" | "planting" | "other";
}

export interface GuideArticleAttrs {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  minutesToRead: number;
  /** Cloudinary public ID. */
  coverImage?: string;
  /** Cloudinary public ID for a downloadable PDF guide/report. */
  pdfAttachment?: string;
  locale: "en" | "fr" | "ar";
  publishedAt: string; // ISO date
}

export interface ReviewAttrs {
  author: ID; // Pointer<_User>
  product?: ID; // Pointer<Product>
  expert?: ID; // Pointer<Expert>
  rating: number;
  comment: string;
}

export interface AddressAttrs {
  user: ID; // Pointer<_User>
  label: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface BusinessAccountAttrs {
  user: ID; // Pointer<_User>
  companyName: string;
  companyType:
    | "landscaping"
    | "hotel"
    | "restaurant"
    | "office"
    | "school"
    | "municipality"
    | "farm"
    | "nursery"
    | "developer"
    | "garden-center";
  vatNumber?: string;
  contactPhone: string;
}

/** Extra fields added to Parse's built-in `_User` class. */
export interface UserExtraAttrs {
  role: "customer" | "expert" | "admin" | "business" | "provider";
  locale: "en" | "fr" | "ar";
  phone?: string;
  /** Cloudinary public ID. */
  avatar?: string;
  /** Main professional focus, used by expert and administrator profiles. */
  expertiseDomain?: string;
  specialties?: string[];
  companyName?: string;
  /** Public enrollment kind: farmer | user | expert | merchant */
  accountKind?: "farmer" | "user" | "expert" | "merchant";
}

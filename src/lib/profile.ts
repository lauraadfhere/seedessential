import type { TrustReport } from "./trust";

export type AccountRole = "customer" | "expert" | "provider" | "admin";

export type BusinessProfile = {
  companyName: string;
  companyType: string;
  registryNumber: string;
  taxId: string;
  description: string;
  logo: string;
  website: string;
  address: string;
  wilaya: string;
  coverageWilayas: string[];
  contactPhone: string;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  verificationDocuments: { name: string; url: string; publicId: string; type: string }[];
  rejectionReason?: string;
};

export type ExpertProfileSummary = {
  id: string;
  slug: string;
  status: string;
  professionalCategory: string;
  bio: string;
  specialties: string[];
  coverageWilayas: string[];
  languages: string[];
  experienceYears: number;
  consultationPrice: number;
  online: boolean;
  verificationDocuments: number;
};

export type AccountProfile = {
  id: string;
  email: string;
  role: AccountRole;
  accountKind: string;
  status: string;
  name: string;
  phone: string;
  avatar: string;
  wilaya: string;
  bio: string;
  locale: string;
  farmSize: string;
  mainCrops: string[];
  gardenType: string;
  interests: string[];
  createdAt: string;
  business: BusinessProfile | null;
  expert: ExpertProfileSummary | null;
  completeness: Completeness;
  trust: TrustReport | null;
};

export type Completeness = { score: number; missing: { key: string; label: string }[]; done: number; total: number };

type Check = { key: string; label: string; done: boolean; weight?: number };

function score(checks: Check[]): Completeness {
  const total = checks.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  const done = checks.reduce((sum, item) => sum + (item.done ? item.weight ?? 1 : 0), 0);
  return {
    score: total ? Math.round((done / total) * 100) : 100,
    missing: checks.filter((item) => !item.done).map(({ key, label }) => ({ key, label })),
    done: checks.filter((item) => item.done).length,
    total: checks.length,
  };
}

const filled = (value?: string | null, min = 1) => Boolean(value && value.trim().length >= min);

type CompletenessSource = Pick<AccountProfile, "role" | "accountKind" | "name" | "phone" | "avatar" | "wilaya" | "bio" | "farmSize" | "mainCrops" | "gardenType" | "interests" | "business" | "expert">;

/** Role-specific profile checklist; drives the progress meter and trust "profile" signal. */
export function profileCompleteness(profile: CompletenessSource): Completeness {
  const base: Check[] = [
    { key: "name", label: "Full name", done: filled(profile.name, 2) },
    { key: "avatar", label: "Profile photo", done: filled(profile.avatar) },
    { key: "phone", label: "Phone number", done: filled(profile.phone, 8) },
    { key: "wilaya", label: "Home wilaya", done: filled(profile.wilaya) },
  ];

  if (profile.role === "expert") {
    const expert = profile.expert;
    return score([
      ...base,
      { key: "category", label: "Area of expertise", done: filled(expert?.professionalCategory, 3) },
      { key: "bio", label: "Professional bio (80+ characters)", done: filled(expert?.bio, 80), weight: 2 },
      { key: "specialties", label: "At least 2 specialties", done: (expert?.specialties.length ?? 0) >= 2 },
      { key: "coverage", label: "Coverage wilayas or online availability", done: Boolean(expert?.online) || (expert?.coverageWilayas.length ?? 0) > 0 },
      { key: "experience", label: "Years of experience", done: (expert?.experienceYears ?? 0) > 0 },
      { key: "languages", label: "Languages spoken", done: (expert?.languages.length ?? 0) > 0 },
      { key: "documents", label: "Verification documents", done: (expert?.verificationDocuments ?? 0) > 0, weight: 2 },
    ]);
  }

  if (profile.role === "provider") {
    const business = profile.business;
    return score([
      { key: "name", label: "Contact name", done: filled(profile.name, 2) },
      { key: "companyName", label: "Company name", done: filled(business?.companyName, 2) },
      { key: "logo", label: "Company logo", done: filled(business?.logo) || filled(profile.avatar) },
      { key: "contactPhone", label: "Business phone", done: filled(business?.contactPhone, 8) || filled(profile.phone, 8) },
      { key: "companyType", label: "Company type", done: filled(business?.companyType) },
      { key: "registryNumber", label: "Trade registry number (RC)", done: filled(business?.registryNumber, 4), weight: 2 },
      { key: "description", label: "Company description (60+ characters)", done: filled(business?.description, 60) },
      { key: "address", label: "Business address", done: filled(business?.address, 6) },
      { key: "wilaya", label: "Head-office wilaya", done: filled(business?.wilaya) },
      { key: "coverage", label: "Delivery coverage wilayas", done: (business?.coverageWilayas.length ?? 0) > 0 },
      { key: "documents", label: "Business verification documents", done: (business?.verificationDocuments.length ?? 0) > 0, weight: 2 },
    ]);
  }

  if (profile.role === "admin") return score(base.slice(0, 3));

  if (profile.accountKind === "farmer") {
    return score([
      ...base,
      { key: "farmSize", label: "Farm or plot size", done: filled(profile.farmSize) },
      { key: "mainCrops", label: "Main crops", done: profile.mainCrops.length > 0 },
      { key: "bio", label: "About your farm", done: filled(profile.bio, 20) },
    ]);
  }

  return score([
    ...base,
    { key: "gardenType", label: "Type of garden or space", done: filled(profile.gardenType) },
    { key: "interests", label: "Growing interests", done: profile.interests.length > 0 },
  ]);
}

export const COMPANY_TYPES = ["Nursery", "Agricultural supplies", "Irrigation equipment", "Greenhouse builder", "Landscaping company", "Seed producer", "Cooperative", "Other"];
export const GARDEN_TYPES = ["Balcony", "Indoor", "Terrace", "Backyard garden", "Vegetable plot", "Orchard", "Greenhouse"];
export const GROWING_INTERESTS = ["Houseplants", "Vegetables", "Herbs", "Fruit trees", "Flowers", "Succulents", "Landscaping", "Irrigation"];
export const LANGUAGES = ["Arabic", "Darija", "French", "Tamazight", "English"];

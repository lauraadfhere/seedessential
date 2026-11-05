import "server-only";

import type Parse from "parse/node";
import { getParseAdmin } from "./admin";
import { getExpertProfile, roleOf } from "./marketplace";
import { profileCompleteness, type AccountProfile, type AccountRole, type BusinessProfile, type ExpertProfileSummary } from "@/lib/profile";
import type { TrustReport } from "@/lib/trust";

export const BUSINESS_CLASS = "BusinessAccount";

/** Readable by everyone, writable only with the Master Key (i.e. through our API). */
export function publicReadACL() {
  const Parse = getParseAdmin();
  const acl = new Parse.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(false);
  return acl;
}

/** Invisible to clients entirely; only our API (Master Key) can read or write. */
export function masterOnlyACL() {
  const Parse = getParseAdmin();
  const acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  return acl;
}

export async function getBusiness(user: Parse.User) {
  const Parse = getParseAdmin();
  return new Parse.Query(BUSINESS_CLASS).equalTo("user", user).first({ useMasterKey: true });
}

export async function ensureBusiness(user: Parse.User) {
  const existing = await getBusiness(user);
  if (existing) return existing;
  const Parse = getParseAdmin();
  const business = new (Parse.Object.extend(BUSINESS_CLASS))();
  business.set({
    user,
    companyName: (user.get("companyName") as string) || (user.get("name") as string) || "Company",
    companyType: "",
    verificationStatus: "unverified",
    coverageWilayas: [],
    verificationDocuments: [],
  });
  business.setACL(publicReadACL());
  await business.save(null, { useMasterKey: true });
  return business;
}

export function serializeBusiness(business?: Parse.Object | null): BusinessProfile | null {
  if (!business) return null;
  return {
    companyName: business.get("companyName") ?? "",
    companyType: business.get("companyType") ?? "",
    registryNumber: business.get("registryNumber") ?? "",
    taxId: business.get("vatNumber") ?? "",
    description: business.get("description") ?? "",
    logo: business.get("logo") ?? "",
    website: business.get("website") ?? "",
    address: business.get("address") ?? "",
    wilaya: business.get("wilaya") ?? "",
    coverageWilayas: business.get("coverageWilayas") ?? [],
    contactPhone: business.get("contactPhone") ?? "",
    verificationStatus: business.get("verificationStatus") ?? "unverified",
    verificationDocuments: business.get("verificationDocuments") ?? [],
    rejectionReason: business.get("rejectionReason") || undefined,
  };
}

export function serializeExpertSummary(profile?: Parse.Object | null): ExpertProfileSummary | null {
  if (!profile) return null;
  return {
    id: profile.id ?? "",
    slug: profile.get("slug") ?? profile.id ?? "",
    status: profile.get("status") ?? "pending",
    professionalCategory: profile.get("professionalCategory") ?? "",
    bio: profile.get("bio") ?? "",
    specialties: profile.get("specialties") ?? [],
    coverageWilayas: profile.get("coverageWilayas") ?? [],
    languages: profile.get("languages") ?? [],
    experienceYears: profile.get("experienceYears") ?? 0,
    consultationPrice: profile.get("consultationPrice") ?? 0,
    online: profile.get("online") !== false,
    verificationDocuments: (profile.get("verificationDocuments") ?? []).length,
  };
}

/** Older accounts store the avatar under different keys; normalise to one value. */
export function avatarOf(user: Parse.Object) {
  return (user.get("avatar") as string) || (user.get("profilePicturePublicId") as string) || (user.get("profilePicture") as string) || "";
}

export function storedTrust(source?: Parse.Object | null): TrustReport | null {
  if (!source || typeof source.get("trustScore") !== "number") return null;
  return {
    score: source.get("trustScore"),
    tier: source.get("trustTier") ?? "new",
    signals: source.get("trustSignals") ?? [],
    penalties: source.get("trustPenalties") ?? [],
    updatedAt: (source.get("trustUpdatedAt") as Date | undefined)?.toISOString() ?? new Date().toISOString(),
  };
}

export function accountRole(user: Parse.User): AccountRole {
  return roleOf(user);
}

export async function buildAccountProfile(user: Parse.User): Promise<AccountProfile> {
  const role = accountRole(user);
  const [business, expert] = await Promise.all([
    role === "provider" ? ensureBusiness(user) : Promise.resolve(undefined),
    role === "expert" ? getExpertProfile(user) : Promise.resolve(undefined),
  ]);
  const base = {
    id: user.id ?? "",
    email: user.getEmail() ?? (user.get("username") as string) ?? "",
    role,
    accountKind: (user.get("accountKind") as string) ?? (role === "provider" ? "merchant" : role === "expert" ? "expert" : "user"),
    status: (user.get("status") as string) ?? "active",
    name: (user.get("name") as string) ?? "",
    phone: (user.get("phone") as string) ?? "",
    avatar: avatarOf(user),
    wilaya: (user.get("wilaya") as string) ?? "",
    bio: (user.get("bio") as string) ?? "",
    locale: (user.get("locale") as string) ?? "en",
    farmSize: (user.get("farmSize") as string) ?? "",
    mainCrops: (user.get("mainCrops") as string[]) ?? [],
    gardenType: (user.get("gardenType") as string) ?? "",
    interests: (user.get("interests") as string[]) ?? [],
    createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
    business: serializeBusiness(business),
    expert: serializeExpertSummary(expert),
  };
  return {
    ...base,
    completeness: profileCompleteness(base),
    trust: storedTrust(role === "provider" ? business : role === "expert" ? expert : null),
  };
}

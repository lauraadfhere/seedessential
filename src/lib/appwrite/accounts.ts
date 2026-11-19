import "server-only";
import { Permission, Query, Role } from "node-appwrite";
import type { AppwriteAccount } from "./auth";
import { COLLECTIONS } from "./config";
import { createRow, listRows, updateRow, type Row } from "./db";
import { createAdminClient } from "./admin";
import { resolveAvatarUrl } from "@/lib/default-avatar";
import { profileCompleteness, type AccountProfile, type BusinessProfile, type ExpertProfileSummary } from "@/lib/profile";
import type { TrustReport } from "@/lib/trust";

export async function getProfileDoc(userId: string) {
  const listed = await listRows(COLLECTIONS.profiles, [Query.equal("userId", userId), Query.limit(1)]);
  return listed.rows[0] || null;
}

export async function getExpertDoc(userId: string) {
  const listed = await listRows(COLLECTIONS.expertProfiles, [Query.equal("userId", userId), Query.limit(1)]);
  return listed.rows[0] || null;
}

export async function getBusinessDoc(userId: string) {
  const listed = await listRows(COLLECTIONS.businesses, [Query.equal("userId", userId), Query.limit(1)]);
  return listed.rows[0] || null;
}

export async function ensureExpertDoc(account: AppwriteAccount) {
  const existing = await getExpertDoc(account.id);
  if (existing) return existing;
  return createRow(
    COLLECTIONS.expertProfiles,
    {
      userId: account.id,
      slug: `expert-${account.id.slice(0, 8)}`,
      name: account.name,
      professionalCategory: "General",
      specialties: [],
      bio: "",
      location: "",
      coverageWilayas: [],
      languages: [],
      experienceYears: 0,
      consultationPrice: 0,
      rating: 0,
      reviewsCount: 0,
      completedRequests: 0,
      online: true,
      status: "pending",
      trustScore: 0,
      trustTier: "new",
    },
    [
      Permission.read(Role.any()),
      Permission.update(Role.user(account.id)),
      Permission.delete(Role.user(account.id)),
    ],
  );
}

function serializeBusiness(doc?: Row | null): BusinessProfile | null {
  if (!doc) return null;
  return {
    companyName: String(doc.companyName || ""),
    companyType: String(doc.companyType || ""),
    registryNumber: String(doc.registryNumber || ""),
    taxId: String(doc.vatNumber || ""),
    description: String(doc.description || ""),
    logo: String(doc.logo || ""),
    website: String(doc.website || ""),
    address: String(doc.address || ""),
    wilaya: String(doc.wilaya || ""),
    coverageWilayas: (doc.coverageWilayas as string[]) || [],
    contactPhone: String(doc.contactPhone || ""),
    verificationStatus: (doc.verificationStatus as BusinessProfile["verificationStatus"]) || "unverified",
    verificationDocuments: [],
    rejectionReason: doc.rejectionReason ? String(doc.rejectionReason) : undefined,
  };
}

function serializeExpertSummary(doc?: Row | null): ExpertProfileSummary | null {
  if (!doc) return null;
  return {
    id: doc.$id,
    slug: String(doc.slug || doc.$id),
    status: (doc.status as ExpertProfileSummary["status"]) || "pending",
    professionalCategory: String(doc.professionalCategory || ""),
    bio: String(doc.bio || ""),
    specialties: (doc.specialties as string[]) || [],
    coverageWilayas: (doc.coverageWilayas as string[]) || [],
    languages: (doc.languages as string[]) || [],
    experienceYears: Number(doc.experienceYears || 0),
    consultationPrice: Number(doc.consultationPrice || 0),
    online: doc.online !== false,
    verificationDocuments: 0,
  };
}

function storedTrust(doc?: Row | null): TrustReport | null {
  if (!doc || typeof doc.trustScore !== "number") return null;
  return {
    score: doc.trustScore as number,
    tier: (doc.trustTier as TrustReport["tier"]) || "new",
    signals: [],
    penalties: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function buildAccountProfile(account: AppwriteAccount): Promise<AccountProfile> {
  const profile = (account.profile as Row | null) || (await getProfileDoc(account.id));
  const role = account.role as AccountProfile["role"];
  const [business, expert] = await Promise.all([
    role === "provider" ? getBusinessDoc(account.id) : Promise.resolve(null),
    role === "expert" ? getExpertDoc(account.id) : Promise.resolve(null),
  ]);

  const base = {
    id: account.id,
    email: account.email,
    role,
    accountKind: account.accountKind || (role === "provider" ? "merchant" : role === "expert" ? "expert" : "user"),
    status: account.status || "active",
    name: String(profile?.name || account.name || ""),
    phone: String(profile?.phone || ""),
    avatar: resolveAvatarUrl(String(profile?.avatar || "")),
    wilaya: String(profile?.wilaya || ""),
    bio: String(profile?.bio || ""),
    locale: String(profile?.locale || "en"),
    farmSize: String(profile?.farmSize || ""),
    mainCrops: (profile?.mainCrops as string[]) || [],
    gardenType: String(profile?.gardenType || ""),
    interests: (profile?.interests as string[]) || [],
    createdAt: String(profile?.$createdAt || new Date().toISOString()),
    business: serializeBusiness(business),
    expert: serializeExpertSummary(expert),
  };

  return {
    ...base,
    completeness: profileCompleteness(base),
    trust: storedTrust(role === "provider" ? business : role === "expert" ? expert : null),
  };
}

export function serializeExpertFromDoc(doc: Row) {
  return {
    id: doc.$id,
    slug: String(doc.slug || doc.$id),
    name: String(doc.name || "Expert"),
    avatar: resolveAvatarUrl(doc.avatar ? String(doc.avatar) : ""),
    professionalCategory: String(doc.professionalCategory || "General"),
    specialties: (doc.specialties as string[]) || [],
    bio: String(doc.bio || ""),
    experienceYears: Number(doc.experienceYears || 0),
    languages: (doc.languages as string[]) || [],
    location: String(doc.location || ""),
    coverageWilayas: (doc.coverageWilayas as string[]) || [],
    online: doc.online !== false,
    consultationPrice: Number(doc.consultationPrice || 0),
    rating: Number(doc.rating || 0),
    reviewsCount: Number(doc.reviewsCount || 0),
    completedRequests: Number(doc.completedRequests || 0),
    status: String(doc.status || "pending"),
    trustScore: Number(doc.trustScore || 0),
    trustTier: String(doc.trustTier || "new"),
    rejectionReason: doc.rejectionReason ? String(doc.rejectionReason) : undefined,
  };
}

export async function updateProfileRow(userId: string, patch: Record<string, unknown>, account: AppwriteAccount) {
  const existing = await getProfileDoc(userId);
  if (existing) return updateRow(COLLECTIONS.profiles, existing.$id, patch);
  return createRow(COLLECTIONS.profiles, {
    userId,
    email: account.email,
    name: account.name,
    role: account.role,
    accountKind: account.accountKind || "user",
    status: account.status || "active",
    ...patch,
  });
}

export async function updateExpertRow(rowId: string, patch: Record<string, unknown>) {
  return updateRow(COLLECTIONS.expertProfiles, rowId, patch);
}

export async function updateUserName(userId: string, name: string) {
  await createAdminClient().users.updateName({ userId, name });
}

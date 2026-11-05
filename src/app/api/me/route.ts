import { NextResponse } from "next/server";
import { isSuspended, sessionUser } from "@/lib/parse/require-admin";
import { buildAccountProfile, ensureBusiness, accountRole } from "@/lib/parse/accounts";
import { cleanString, getExpertProfile } from "@/lib/parse/marketplace";
import { refreshTrust } from "@/lib/parse/trust";
import { algeriaWilayas } from "@/lib/algeria";
import { moderateText } from "@/lib/moderation";
import { isLocale } from "@/lib/locales";
import { COMPANY_TYPES, GARDEN_TYPES } from "@/lib/profile";

export const dynamic = "force-dynamic";

const WILAYAS = new Set<string>(algeriaWilayas.map((item) => item.name));
const PHONE = /^\+?[\d\s().-]{8,20}$/;
const MEDIA = /^tannelli\/(profiles|experts|products|business-documents)\/[\w\-/]+$/;

function list(value: unknown, max: number, itemMax = 40) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, itemMax)).filter(Boolean))].slice(0, max)
    : [];
}

function documents(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object" && typeof item.publicId === "string" && MEDIA.test(item.publicId))
    .slice(0, 6)
    .map((item) => ({ name: cleanString(item.name, 120), url: cleanString(item.url, 500), publicId: item.publicId as string, type: cleanString(item.type, 60) }));
}

/** GET /api/me — the signed-in account with role profile, completeness and trust. */
export async function GET(request: Request) {
  const user = await sessionUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (isSuspended(user)) {
    return NextResponse.json({ error: "This account is suspended. Contact support to restore access.", suspended: true, reason: user.get("suspensionReason") || undefined }, { status: 403 });
  }
  return NextResponse.json(await buildAccountProfile(user), { headers: { "Cache-Control": "no-store" } });
}

/** PUT /api/me — whitelisted profile fields only; role, status and trust are never writable here. */
export async function PUT(request: Request) {
  const user = await sessionUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json({ error: "This account is suspended." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const role = accountRole(user);
  const notices: string[] = [];

  if (body.name !== undefined) {
    const name = cleanString(body.name, 80);
    if (name.length < 2) return NextResponse.json({ error: "Enter your full name.", fields: { name: "Required" } }, { status: 400 });
    user.set("name", name);
  }
  if (body.phone !== undefined) {
    const phone = cleanString(body.phone, 24);
    if (phone && !PHONE.test(phone)) return NextResponse.json({ error: "Enter a valid phone number.", fields: { phone: "Invalid" } }, { status: 400 });
    user.set("phone", phone);
  }
  if (typeof body.avatar === "string" && MEDIA.test(body.avatar)) {
    user.set({ avatar: body.avatar, profilePicturePublicId: body.avatar });
  }
  if (body.wilaya !== undefined) user.set("wilaya", WILAYAS.has(body.wilaya) ? body.wilaya : "");
  if (body.bio !== undefined) {
    const bio = moderateText(cleanString(body.bio, 1200));
    if (bio.flags.length) notices.push("Contact details were removed from your bio.");
    user.set("bio", bio.text);
  }
  if (isLocale(body.locale)) user.set("locale", body.locale);

  if (role === "customer") {
    if (body.farmSize !== undefined) user.set("farmSize", cleanString(body.farmSize, 40));
    if (body.mainCrops !== undefined) user.set("mainCrops", list(body.mainCrops, 12));
    if (body.gardenType !== undefined) user.set("gardenType", GARDEN_TYPES.includes(body.gardenType) ? body.gardenType : "");
    if (body.interests !== undefined) user.set("interests", list(body.interests, 10));
  }

  await user.save(null, { useMasterKey: true });

  if (role === "expert") {
    const profile = await getExpertProfile(user);
    if (profile) {
      profile.set("name", user.get("name"));
      if (typeof body.avatar === "string" && MEDIA.test(body.avatar)) profile.set("avatar", body.avatar);
      await profile.save(null, { useMasterKey: true });
    }
  }

  if (role === "provider" && body.business && typeof body.business === "object") {
    const input = body.business as Record<string, unknown>;
    const business = await ensureBusiness(user);
    const verified = business.get("verificationStatus") === "verified";
    const companyName = cleanString(input.companyName, 120);
    if (companyName.length >= 2) {
      if (verified && companyName !== business.get("companyName")) {
        notices.push("Your company name is locked after verification. Contact support to change it.");
      } else {
        business.set("companyName", companyName);
        user.set("companyName", companyName);
      }
    }
    const description = moderateText(cleanString(input.description, 1500));
    if (description.flags.length) notices.push("Contact details were removed from the company description.");
    business.set({
      companyType: COMPANY_TYPES.includes(input.companyType as string) ? input.companyType : "",
      description: description.text,
      website: /^https?:\/\/[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(String(input.website ?? "")) ? cleanString(input.website, 200) : "",
      address: cleanString(input.address, 200),
      wilaya: WILAYAS.has(input.wilaya as string) ? input.wilaya : "",
      coverageWilayas: list(input.coverageWilayas, 58).filter((item) => WILAYAS.has(item)),
      contactPhone: PHONE.test(String(input.contactPhone ?? "")) ? cleanString(input.contactPhone, 24) : "",
    });
    if (!verified) {
      business.set({ registryNumber: cleanString(input.registryNumber, 40), vatNumber: cleanString(input.taxId, 40) });
    }
    if (typeof input.logo === "string" && MEDIA.test(input.logo)) business.set("logo", input.logo);
    if (input.verificationDocuments !== undefined) {
      const docs = documents(input.verificationDocuments);
      business.set("verificationDocuments", docs);
      if (docs.length && ["unverified", "rejected"].includes(business.get("verificationStatus"))) {
        business.set("verificationStatus", "pending");
        notices.push("Documents submitted — an administrator will verify your business.");
      }
    }
    await Promise.all([business.save(null, { useMasterKey: true }), user.save(null, { useMasterKey: true })]);
  }

  await refreshTrust(user);
  return NextResponse.json({ ...(await buildAccountProfile(user)), notice: notices.join(" ") || undefined });
}

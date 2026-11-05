import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { cleanString, slugifyName } from "@/lib/parse/marketplace";
import { publicReadACL } from "@/lib/parse/accounts";
import { moderateText } from "@/lib/moderation";
import { roleForAccountKind, type AccountKind } from "@/lib/roles";
import { isLocale } from "@/lib/locales";
import { algeriaWilayas } from "@/lib/algeria";

export const dynamic = "force-dynamic";

const KINDS: AccountKind[] = ["farmer", "user", "expert", "merchant"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const WILAYA_CODES: string[] = algeriaWilayas.map((item) => item.code);
const FARMING_TYPES = ["crop", "livestock", "mixed", "greenhouse"] as const;
const SPACE_TYPES = ["balcony", "backyard", "indoor", "other"] as const;
const FEE_MODELS = ["per_consultation", "hourly", "subscription"] as const;

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | "" {
  return allowed.includes(value as T) ? (value as T) : "";
}

function list(value: unknown, max = 10): string[] {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return items.map((item) => cleanString(item, 40)).filter(Boolean).slice(0, max);
}

/** Role-specific onboarding answers (SeedExpress section 4.2). Invalid values are dropped or reported. */
function onboarding(kind: AccountKind, raw: unknown) {
  const input: Record<string, unknown> = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const errors: Record<string, string> = {};
  const wilaya = WILAYA_CODES.includes(String(input.wilaya)) ? String(input.wilaya) : "";
  const values: Record<string, string | number | string[]> = {};

  if (kind === "farmer") {
    values.farmName = cleanString(input.farmName, 120);
    values.wilaya = wilaya;
    values.commune = cleanString(input.commune, 120);
    values.farmSize = Math.max(0, Math.min(100000, Number(input.farmSize) || 0));
    values.farmingType = pick(input.farmingType, FARMING_TYPES);
    values.mainCrops = cleanString(input.mainCrops, 200);
    if (String(values.farmName).length < 2) errors.farmName = "Enter your farm name.";
    if (!wilaya) errors.wilaya = "Choose your wilaya.";
    if (!values.farmingType) errors.farmingType = "Choose your farming type.";
  } else if (kind === "user") {
    values.wilaya = wilaya;
    values.interests = cleanString(input.interests, 200);
    values.spaceType = pick(input.spaceType, SPACE_TYPES);
    if (!wilaya) errors.wilaya = "Choose your wilaya.";
    if (!values.spaceType) errors.spaceType = "Choose your growing space.";
  } else if (kind === "expert") {
    values.wilaya = wilaya;
    values.languages = list(input.languages);
    values.feeModel = pick(input.feeModel, FEE_MODELS);
    if (!wilaya) errors.wilaya = "Choose the wilaya you cover.";
    if (!(values.languages as string[]).length) errors.languages = "Enter at least one language.";
    if (!values.feeModel) errors.feeModel = "Choose your fee model.";
  } else {
    values.legalName = cleanString(input.legalName, 160);
    values.rcNumber = cleanString(input.rcNumber, 60);
    values.nifNumber = cleanString(input.nifNumber, 60);
    values.categories = cleanString(input.categories, 200);
    values.payoutAccount = cleanString(input.payoutAccount, 120);
    if (String(values.legalName).length < 2) errors.legalName = "Enter your legal business name.";
    if (String(values.rcNumber).length < 3) errors.rcNumber = "Enter your commercial register (RC) number.";
    if (String(values.nifNumber).length < 3) errors.nifNumber = "Enter your tax identification (NIF) number.";
  }
  return { values, errors };
}

type Doc = { name: string; url: string; publicId: string; type: string };

function documents(value: unknown): Doc[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Doc => Boolean(item && typeof item === "object" && typeof item.publicId === "string" && /^tannelli\/(experts|profiles)\//.test(item.publicId)))
    .slice(0, 5)
    .map((item) => ({ name: cleanString(item.name, 120), url: cleanString(item.url, 500), publicId: item.publicId, type: cleanString(item.type, 60) }));
}

/**
 * POST /api/auth/sign-up — creates the account server-side so the role,
 * status and expert/business records can never be chosen by the browser.
 * Returns a session token the client adopts with `Parse.User.become`.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = cleanString(body.email, 160).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const name = cleanString(body.name, 80);
  const kind = KINDS.includes(body.accountKind) ? (body.accountKind as AccountKind) : null;
  const avatar = cleanString(body.avatar, 300);
  const avatarUrl = cleanString(body.avatarUrl, 500);
  const locale = isLocale(body.locale) ? body.locale : "en";

  const fields: Record<string, string> = {};
  if (!EMAIL.test(email)) fields.email = "Enter a valid email address.";
  if (password.length < 8) fields.password = "Use at least 8 characters.";
  if (name.length < 2) fields.name = "Enter your full name.";
  if (!kind) fields.accountKind = "Choose an account type.";
  if (!/^tannelli\/profiles\/[\w\-/]+$/.test(avatar)) fields.avatar = "Upload a profile picture.";

  const expertise = cleanString(body.expertise, 120);
  const bio = moderateText(cleanString(body.bio, 2000));
  const docs = documents(body.documents);
  const companyName = cleanString(body.companyName, 120);
  const profile = onboarding(kind ?? "user", body.onboarding);
  Object.assign(fields, profile.errors);
  if (kind === "expert") {
    if (expertise.length < 3) fields.expertise = "Describe your area of expertise.";
    if (bio.text.length < 30) fields.bio = "Write at least 30 characters about your background.";
    if (!docs.length) fields.documents = "Upload at least one verification document.";
  }
  if (kind === "merchant" && companyName.length < 2) fields.companyName = "Enter your company name.";
  if (Object.keys(fields).length) {
    return NextResponse.json({ error: Object.values(fields)[0], fields }, { status: 400 });
  }

  const Parse = getParseAdmin();
  const role = roleForAccountKind(kind!);
  const user = new Parse.User();
  user.set({
    username: email,
    email,
    password,
    name,
    role,
    accountKind: kind,
    locale,
    avatar,
    profilePicturePublicId: avatar,
    profilePicture: avatarUrl,
    status: kind === "expert" ? "pending" : "active",
    ...(kind === "merchant" ? { companyName } : {}),
    ...profile.values,
  });

  try {
    await user.signUp(null, { useMasterKey: true });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 202 || code === 203) {
      return NextResponse.json({ error: "An account with this email already exists. Sign in instead.", fields: { email: "Already registered" } }, { status: 409 });
    }
    console.error("Sign-up failed:", error);
    return NextResponse.json({ error: "We could not create your account. Please try again." }, { status: 500 });
  }

  try {
    if (kind === "expert") {
      const profile = new (Parse.Object.extend("ExpertProfile"))();
      profile.set({
        user,
        name,
        slug: slugifyName(name),
        avatar,
        online: true,
        specialties: [],
        coverageWilayas: profile.values.wilaya ? [profile.values.wilaya] : [],
        languages: (profile.values.languages as string[]) ?? [],
        professionalCategory: expertise,
        bio: bio.text,
        experienceYears: Math.max(0, Math.min(70, Number.parseInt(body.experienceYears, 10) || 0)),
        consultationPrice: 0,
        rating: 0,
        reviewsCount: 0,
        completedRequests: 0,
        status: "pending",
        verificationDocuments: docs,
      });
      profile.setACL(publicReadACL());
      await profile.save(null, { useMasterKey: true });
    }
    if (kind === "merchant") {
      const business = new (Parse.Object.extend("BusinessAccount"))();
      business.set({ user, companyName, companyType: "", verificationStatus: "unverified", coverageWilayas: [], verificationDocuments: [] });
      business.setACL(publicReadACL());
      await business.save(null, { useMasterKey: true });
    }
  } catch (error) {
    console.error("Sign-up profile provisioning failed:", error);
  }

  return NextResponse.json({ sessionToken: user.getSessionToken(), role, accountKind: kind }, { status: 201 });
}

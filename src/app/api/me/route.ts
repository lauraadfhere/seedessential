import { NextResponse } from "next/server";
import { isSuspended, requireUser, sessionUser } from "@/lib/appwrite/auth";
import { buildAccountProfile, updateProfileRow, updateUserName } from "@/lib/appwrite/accounts";
import { algeriaWilayas } from "@/lib/algeria";
import { moderateText } from "@/lib/moderation";
import { isLocale } from "@/lib/locales";
import { GARDEN_TYPES } from "@/lib/profile";

export const dynamic = "force-dynamic";

const WILAYAS = new Set<string>(algeriaWilayas.map((item) => item.name));
const PHONE = /^\+?[\d\s().-]{8,20}$/;
const MEDIA = /^tannelli\/(profiles|experts|products|business-documents)\/[\w\-/]+$/;

function cleanString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function list(value: unknown, max: number, itemMax = 40) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, itemMax)).filter(Boolean))].slice(0, max)
    : [];
}

export async function GET(request: Request) {
  const user = await sessionUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (isSuspended(user)) {
    return NextResponse.json(
      { error: "This account is suspended. Contact support to restore access.", suspended: true },
      { status: 403 },
    );
  }
  return NextResponse.json(await buildAccountProfile(user), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const notices: string[] = [];
  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = cleanString(body.name, 80);
    if (name.length < 2) return NextResponse.json({ error: "Enter your full name.", fields: { name: "Required" } }, { status: 400 });
    patch.name = name;
  }
  if (body.phone !== undefined) {
    const phone = cleanString(body.phone, 24);
    if (phone && !PHONE.test(phone)) return NextResponse.json({ error: "Enter a valid phone number.", fields: { phone: "Invalid" } }, { status: 400 });
    patch.phone = phone;
  }
  if (typeof body.avatar === "string") {
    if (body.avatar === "") patch.avatar = "";
    else if (MEDIA.test(body.avatar)) patch.avatar = body.avatar;
  }
  if (body.wilaya !== undefined) patch.wilaya = WILAYAS.has(body.wilaya) ? body.wilaya : "";
  if (body.bio !== undefined) {
    const bio = moderateText(cleanString(body.bio, 1200));
    if (bio.flags.length) notices.push("Contact details were removed from your bio.");
    patch.bio = bio.text;
  }
  if (isLocale(body.locale)) patch.locale = body.locale;

  if (user.role === "customer") {
    if (body.farmSize !== undefined) patch.farmSize = cleanString(body.farmSize, 40);
    if (body.mainCrops !== undefined) patch.mainCrops = list(body.mainCrops, 12);
    if (body.gardenType !== undefined) patch.gardenType = GARDEN_TYPES.includes(body.gardenType) ? body.gardenType : "";
    if (body.interests !== undefined) patch.interests = list(body.interests, 10);
  }

  await updateProfileRow(user.id, patch, user);
  if (typeof patch.name === "string") await updateUserName(user.id, patch.name);

  const refreshed = await sessionUser(request);
  if (!refreshed) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json({ ...(await buildAccountProfile(refreshed)), notice: notices.join(" ") || undefined });
}

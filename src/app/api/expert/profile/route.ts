import { NextResponse } from "next/server";
import { requireUser } from "@/lib/parse/require-admin";
import { algeriaWilayas } from "@/lib/algeria";
import { moderateText } from "@/lib/moderation";
import { cleanString, ensureExpertProfile, roleOf, serializeExpert } from "@/lib/parse/marketplace";
import { recomputeExpertTrust } from "@/lib/parse/trust";

export const dynamic = "force-dynamic";

async function expertUser(request: Request) {
  const user = await requireUser(request);
  return user && roleOf(user) === "expert" ? user : null;
}

/** GET /api/expert/profile — the signed-in expert's marketplace profile. */
export async function GET(request: Request) {
  const user = await expertUser(request);
  if (!user) return NextResponse.json({ error: "Expert access required" }, { status: 403 });
  const profile = await ensureExpertProfile(user);
  return NextResponse.json({ ...serializeExpert(profile), rejectionReason: profile.get("rejectionReason") || undefined });
}

/** PUT /api/expert/profile — updates what growers see in the directory. */
export async function PUT(request: Request) {
  const user = await expertUser(request);
  if (!user) return NextResponse.json({ error: "Expert access required" }, { status: 403 });
  const profile = await ensureExpertProfile(user);
  const body = await request.json().catch(() => ({}));
  const wilayas = new Set<string>(algeriaWilayas.map((item) => item.name));
  const list = (value: unknown, max: number) =>
    Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))].slice(0, max) : [];

  const professionalCategory = cleanString(body.professionalCategory, 80);
  if (professionalCategory.length < 2) return NextResponse.json({ error: "Add your main field of expertise." }, { status: 400 });

  const bio = moderateText(cleanString(body.bio, 1500));
  const location = cleanString(body.location, 60);
  const years = Number(body.experienceYears);
  const price = Number(body.consultationPrice);

  profile.set({
    name: cleanString(body.name, 80) || profile.get("name"),
    professionalCategory,
    specialties: list(body.specialties, 12).map((item) => item.slice(0, 40)),
    languages: list(body.languages, 6),
    bio: bio.text,
    location: wilayas.has(location) ? location : profile.get("location") ?? "",
    coverageWilayas: list(body.coverageWilayas, 58).filter((item) => wilayas.has(item)),
    online: body.online !== false,
    experienceYears: Number.isFinite(years) ? Math.max(0, Math.min(60, Math.round(years))) : 0,
    consultationPrice: Number.isFinite(price) ? Math.max(0, price) : 0,
  });
  if (typeof body.avatar === "string" && /^tannelli\/(profiles|experts)\/[\w\-/]+$/.test(body.avatar)) profile.set("avatar", body.avatar);
  if (profile.get("status") === "rejected") profile.set("status", "pending");
  await profile.save(null, { useMasterKey: true });

  user.set({ expertiseDomain: professionalCategory, specialties: profile.get("specialties") });
  await user.save(null, { useMasterKey: true });
  await recomputeExpertTrust(profile).catch(() => null);

  return NextResponse.json({
    ...serializeExpert(profile),
    notice: bio.flags.length ? "Contact details were removed from your bio — growers reach you through Tannelli." : undefined,
  });
}

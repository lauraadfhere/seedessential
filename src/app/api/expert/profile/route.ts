import { NextResponse } from "next/server";
import { requireExpert } from "@/lib/appwrite/auth";
import { ensureExpertDoc, serializeExpertFromDoc, updateExpertRow } from "@/lib/appwrite/accounts";
import { algeriaWilayas } from "@/lib/algeria";
import { moderateText } from "@/lib/moderation";

export const dynamic = "force-dynamic";

function cleanString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function list(value: unknown, max: number) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))].slice(0, max)
    : [];
}

export async function GET(request: Request) {
  try {
    const user = await requireExpert(request);
    if (!user) return NextResponse.json({ error: "Expert access required" }, { status: 403 });
    const profile = await ensureExpertDoc(user);
    return NextResponse.json(serializeExpertFromDoc(profile));
  } catch (error) {
    console.error("GET /api/expert/profile", error);
    return NextResponse.json({ error: "Could not load your expert profile." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireExpert(request);
    if (!user) return NextResponse.json({ error: "Expert access required" }, { status: 403 });
    const profile = await ensureExpertDoc(user);
    const body = await request.json().catch(() => ({}));
    const wilayas = new Set<string>(algeriaWilayas.map((item) => item.name));

    const professionalCategory = cleanString(body.professionalCategory, 80);
    if (professionalCategory.length < 2) {
      return NextResponse.json({ error: "Add your main field of expertise." }, { status: 400 });
    }

    const bio = moderateText(cleanString(body.bio, 1500));
    const location = cleanString(body.location, 60);
    const years = Number(body.experienceYears);
    const price = Number(body.consultationPrice);

    const patch: Record<string, unknown> = {
      name: cleanString(body.name, 80) || profile.name,
      professionalCategory,
      specialties: list(body.specialties, 12).map((item) => item.slice(0, 40)),
      languages: list(body.languages, 6),
      bio: bio.text,
      location: wilayas.has(location) ? location : profile.location || "",
      coverageWilayas: list(body.coverageWilayas, 58).filter((item) => wilayas.has(item)),
      online: body.online !== false,
      experienceYears: Number.isFinite(years) ? Math.max(0, Math.min(60, Math.round(years))) : 0,
      consultationPrice: Number.isFinite(price) ? Math.max(0, price) : 0,
    };
    if (typeof body.avatar === "string" && /^tannelli\/(profiles|experts)\/[\w\-/]+$/.test(body.avatar)) {
      patch.avatar = body.avatar;
    }
    if (profile.status === "rejected") patch.status = "pending";

    const updated = await updateExpertRow(profile.$id, patch);
    return NextResponse.json({
      ...serializeExpertFromDoc(updated),
      notice: bio.flags.length ? "Contact details were removed from your bio — growers reach you through Tannelli." : undefined,
    });
  } catch (error) {
    console.error("PUT /api/expert/profile", error);
    return NextResponse.json({ error: "Could not save your expert profile." }, { status: 500 });
  }
}

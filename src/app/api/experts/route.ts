import { NextResponse } from "next/server";
import { experts as staticExperts } from "@/lib/data";
import { getParseAdmin } from "@/lib/parse/admin";
import { serializeExpert } from "@/lib/parse/marketplace";
import type { ExpertSummary } from "@/lib/marketplace-types";

export const dynamic = "force-dynamic";

function staticDirectory(): ExpertSummary[] {
  return staticExperts.map((expert, index) => ({
    id: `static-${expert.slug}`,
    slug: expert.slug,
    name: expert.name,
    professionalCategory: expert.category || expert.role,
    specialties: expert.specialties,
    bio: expert.bio,
    experienceYears: Number.parseInt(expert.experience, 10) || 5,
    languages: expert.languages,
    location: expert.location.replace(/,.*$/, ""),
    coverageWilayas: expert.coverage ?? [],
    online: expert.online,
    consultationPrice: Math.round(expert.price * 130),
    rating: expert.rating,
    reviewsCount: expert.reviews,
    completedRequests: 10 + index * 3,
    status: "active",
    trustScore: Math.round(expert.rating * 18),
    trustTier: expert.rating >= 4.8 ? "trusted" : "rising",
  }));
}

/**
 * GET /api/experts — public directory of verified experts.
 * Filters: `q` (name, field, specialties), `category`, `wilaya`, `online=1`.
 * Falls back to static featured experts when Parse is empty or unavailable (demo).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const category = searchParams.get("category")?.trim().toLowerCase() ?? "";
  const wilaya = searchParams.get("wilaya")?.trim() ?? "";
  const online = searchParams.get("online") === "1";

  const matches = (expert: ExpertSummary) => {
    const haystack = [expert.name, expert.professionalCategory, expert.bio, ...expert.specialties].join(" ").toLowerCase();
    if (category && !haystack.includes(category)) return false;
    if (wilaya && !expert.coverageWilayas.includes(wilaya)) return false;
    if (online && !expert.online) return false;
    return !q || haystack.includes(q);
  };

  try {
    const Parse = getParseAdmin();
    const query = new Parse.Query("ExpertProfile").equalTo("status", "active").include("user").descending("trustScore").descending("rating").limit(500);
    if (wilaya) query.equalTo("coverageWilayas", wilaya);
    if (online) query.notEqualTo("online", false);

    const experts = (await query.find({ useMasterKey: true })).map(serializeExpert).filter((expert) => {
      const haystack = [expert.name, expert.professionalCategory, expert.bio, ...expert.specialties].join(" ").toLowerCase();
      if (category && !haystack.includes(category)) return false;
      return !q || haystack.includes(q);
    });

    if (experts.length === 0) {
      return NextResponse.json(staticDirectory().filter(matches), {
        headers: { "Cache-Control": "no-store, max-age=0", "X-Experts-Source": "static-fallback" },
      });
    }

    return NextResponse.json(experts, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Error fetching experts:", error);
    return NextResponse.json(staticDirectory().filter(matches), {
      headers: { "Cache-Control": "no-store, max-age=0", "X-Experts-Source": "static-fallback" },
    });
  }
}

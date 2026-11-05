import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { serializeExpert } from "@/lib/parse/marketplace";

export const dynamic = "force-dynamic";

/**
 * GET /api/experts — public directory of verified experts.
 * Filters: `q` (name, field, specialties), `category`, `wilaya`, `online=1`.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const category = searchParams.get("category")?.trim().toLowerCase() ?? "";
    const wilaya = searchParams.get("wilaya")?.trim() ?? "";
    const online = searchParams.get("online") === "1";

    const Parse = getParseAdmin();
    const query = new Parse.Query("ExpertProfile").equalTo("status", "active").include("user").descending("trustScore").descending("rating").limit(500);
    if (wilaya) query.equalTo("coverageWilayas", wilaya);
    if (online) query.notEqualTo("online", false);

    const experts = (await query.find({ useMasterKey: true })).map(serializeExpert).filter((expert) => {
      const haystack = [expert.name, expert.professionalCategory, expert.bio, ...expert.specialties].join(" ").toLowerCase();
      if (category && !haystack.includes(category)) return false;
      return !q || haystack.includes(q);
    });

    return NextResponse.json(experts, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Error fetching experts:", error);
    return NextResponse.json({ error: "Failed to fetch experts" }, { status: 500 });
  }
}

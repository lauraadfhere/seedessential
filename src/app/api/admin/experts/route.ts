import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireAdmin } from "@/lib/appwrite/auth";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { getRow, listRows, updateRow } from "@/lib/appwrite/db";
import { resolveAvatarUrl } from "@/lib/default-avatar";

export const dynamic = "force-dynamic";

/** GET /api/admin/experts — all expert profiles from Appwrite. */
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const listed = await listRows(COLLECTIONS.expertProfiles, [Query.orderDesc("$createdAt"), Query.limit(100)]);
    const profiles = await listRows(COLLECTIONS.profiles, [Query.equal("role", "expert"), Query.limit(100)]);
    const profileByUser = new Map(profiles.rows.map((row) => [String(row.userId), row]));

    const experts = listed.rows.map((row) => {
      const profile = profileByUser.get(String(row.userId));
      return {
        id: row.$id,
        userId: String(row.userId || ""),
        name: String(row.name || profile?.name || "Expert"),
        email: String(profile?.email || ""),
        profilePicture: resolveAvatarUrl(String(row.avatar || profile?.avatar || "")),
        slug: String(row.slug || row.$id),
        professionalCategory: String(row.professionalCategory || ""),
        bio: String(row.bio || ""),
        experienceYears: Number(row.experienceYears || 0),
        status: String(row.status || "pending"),
        verificationDocuments: Array.isArray(row.verificationDocuments) ? row.verificationDocuments : [],
        createdAt: String(row.$createdAt || ""),
        verifiedAt: row.verifiedAt ? String(row.verifiedAt) : undefined,
        rejectionReason: row.rejectionReason ? String(row.rejectionReason) : undefined,
      };
    });

    return NextResponse.json(experts);
  } catch (error) {
    console.error("Error fetching expert profiles:", error);
    return NextResponse.json({ error: "Failed to fetch expert profiles" }, { status: 500 });
  }
}

/** POST /api/admin/experts — approve or reject an expert application. */
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  try {
    const body = await request.json();
    const { expertId, action, rejectionReason } = body as {
      expertId?: string;
      action?: string;
      rejectionReason?: string;
    };

    if (!expertId || !action) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    if (!["approve", "reject"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    let expert;
    try {
      expert = await getRow(COLLECTIONS.expertProfiles, expertId);
    } catch {
      expert = null;
    }
    if (!expert) return NextResponse.json({ error: "Expert profile not found" }, { status: 404 });

    if (action === "approve") {
      const updated = await updateRow(COLLECTIONS.expertProfiles, expert.$id, {
        status: "active",
        verifiedAt: new Date().toISOString(),
        verifiedBy: admin.id,
        rejectionReason: "",
      });
      const profiles = await listRows(COLLECTIONS.profiles, [Query.equal("userId", String(expert.userId)), Query.limit(1)]);
      if (profiles.rows[0]) {
        await updateRow(COLLECTIONS.profiles, profiles.rows[0].$id, { status: "active", role: "expert" });
      }
      return NextResponse.json({
        message: "Expert approved successfully",
        expert: { id: updated.$id, status: "active", verifiedAt: updated.verifiedAt },
      });
    }

    const reason = rejectionReason || "Verification documents did not meet requirements";
    const updated = await updateRow(COLLECTIONS.expertProfiles, expert.$id, {
      status: "rejected",
      rejectionReason: reason,
      verifiedAt: "",
      verifiedBy: "",
    });
    return NextResponse.json({
      message: "Expert rejected",
      expert: { id: updated.$id, status: "rejected", rejectionReason: reason },
    });
  } catch (error) {
    console.error("Error updating expert profile:", error);
    return NextResponse.json({ error: "Failed to update expert profile" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/parse/require-admin";
import { getParseAdmin } from "@/lib/parse/admin";

/**
 * Admin endpoint to manage expert verification requests
 * GET - List all expert profiles pending verification
 * POST - Approve or reject expert verification
 */

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const Parse = getParseAdmin();
    const ExpertProfile = Parse.Object.extend("ExpertProfile");
    const query = new Parse.Query(ExpertProfile);
    query.include("user");
    query.descending("createdAt");
    
    const results = await query.find({ useMasterKey: true });
    
    const experts = results.map((profile) => {
      const user = profile.get("user");
      return {
        id: profile.id,
        userId: user?.id,
        name: user?.get("name"),
        email: user?.get("email"),
        profilePicture: user?.get("profilePicture"),
        slug: profile.get("slug"),
        professionalCategory: profile.get("professionalCategory"),
        bio: profile.get("bio"),
        experienceYears: profile.get("experienceYears"),
        status: profile.get("status"),
        verificationDocuments: profile.get("verificationDocuments") || [],
        createdAt: profile.createdAt,
        verifiedAt: profile.get("verifiedAt"),
        verifiedBy: profile.get("verifiedBy"),
        rejectionReason: profile.get("rejectionReason"),
      };
    });

    return NextResponse.json(experts);
  } catch (error) {
    console.error("Error fetching expert profiles:", error);
    return NextResponse.json({ error: "Failed to fetch expert profiles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { expertId, action, rejectionReason } = body;

    if (!expertId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const Parse = getParseAdmin();

    const ExpertProfile = Parse.Object.extend("ExpertProfile");
    const query = new Parse.Query(ExpertProfile);
    const expertProfile = await query.get(expertId, { useMasterKey: true });

    if (!expertProfile) {
      return NextResponse.json({ error: "Expert profile not found" }, { status: 404 });
    }

    // Get the associated user
    const user = expertProfile.get("user");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    await user.fetch({ useMasterKey: true });

    if (action === "approve") {
      // Approve the expert
      expertProfile.set("status", "active");
      expertProfile.set("verifiedAt", new Date());
      expertProfile.set("verifiedBy", admin);
      expertProfile.set("rejectionReason", null);
      
      // Update user status to active
      user.set("status", "active");
      
      await Promise.all([
        expertProfile.save(null, { useMasterKey: true }),
        user.save(null, { useMasterKey: true }),
      ]);

      // TODO: Send approval email notification to the expert
      
      return NextResponse.json({
        message: "Expert approved successfully",
        expert: {
          id: expertProfile.id,
          status: expertProfile.get("status"),
          verifiedAt: expertProfile.get("verifiedAt"),
        },
      });
    } else if (action === "reject") {
      // Reject the expert
      expertProfile.set("status", "rejected");
      expertProfile.set("rejectionReason", rejectionReason || "Verification documents did not meet requirements");
      expertProfile.set("verifiedAt", null);
      expertProfile.set("verifiedBy", null);
      
      // Keep user status as pending (they can resubmit)
      user.set("status", "pending");
      
      await Promise.all([
        expertProfile.save(null, { useMasterKey: true }),
        user.save(null, { useMasterKey: true }),
      ]);

      // TODO: Send rejection email notification to the expert
      
      return NextResponse.json({
        message: "Expert verification rejected",
        expert: {
          id: expertProfile.id,
          status: expertProfile.get("status"),
          rejectionReason: expertProfile.get("rejectionReason"),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing expert verification:", error);
    return NextResponse.json({ error: "Failed to process verification" }, { status: 500 });
  }
}

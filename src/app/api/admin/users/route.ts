import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireAdmin } from "@/lib/appwrite/auth";
import { createAdminClient } from "@/lib/appwrite/admin";
import { COLLECTIONS } from "@/lib/appwrite/config";
import { listRows, updateRow } from "@/lib/appwrite/db";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "customer", "expert", "provider"] as const;
const STATUSES = ["active", "pending", "suspended"] as const;

/**
 * Admin users — Appwrite profiles (+ Auth user email fallback).
 * GET  ?q=&role=
 * PATCH { userId, role?, status? }
 */
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const role = searchParams.get("role") || "";

    const queries = [Query.orderDesc("$createdAt"), Query.limit(200)];
    if (role && (ROLES as readonly string[]).includes(role)) queries.unshift(Query.equal("role", role));

    const listed = await listRows(COLLECTIONS.profiles, queries);
    const users = listed.rows
      .map((row) => ({
        id: String(row.userId || row.$id),
        profileId: row.$id,
        name: String(row.name || ""),
        email: String(row.email || ""),
        role: String(row.role || "customer"),
        status: String(row.status || "active"),
        createdAt: String(row.$createdAt || ""),
      }))
      .filter((user) => {
        if (!q) return true;
        return user.email.toLowerCase().includes(q) || user.name.toLowerCase().includes(q);
      });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, role, status } = body as { userId?: string; role?: string; status?: string };

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    if (role !== undefined && !(ROLES as readonly string[]).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (status !== undefined && !(STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (userId === admin.id && (status === "suspended" || (role !== undefined && role !== "admin"))) {
      return NextResponse.json({ error: "You cannot suspend or demote your own account" }, { status: 400 });
    }

    const listed = await listRows(COLLECTIONS.profiles, [Query.equal("userId", userId), Query.limit(1)]);
    const profile = listed.rows[0];
    if (!profile) return NextResponse.json({ error: "User profile not found" }, { status: 404 });

    const patch: Record<string, unknown> = {};
    if (role !== undefined) patch.role = role;
    if (status !== undefined) patch.status = status;
    const updated = await updateRow(COLLECTIONS.profiles, profile.$id, patch);

    try {
      const { users } = createAdminClient();
      const prefs = (await users.get({ userId })).prefs || {};
      await users.updatePrefs({
        userId,
        prefs: {
          ...prefs,
          ...(role !== undefined ? { role } : {}),
          ...(status !== undefined ? { status } : {}),
        },
      });
    } catch (error) {
      console.error("Could not sync Auth prefs:", error);
    }

    return NextResponse.json({
      message: "User updated",
      user: {
        id: userId,
        name: String(updated.name || ""),
        email: String(updated.email || ""),
        role: String(updated.role || "customer"),
        status: String(updated.status || "active"),
        createdAt: String(updated.$createdAt || ""),
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

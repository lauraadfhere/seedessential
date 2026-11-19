import { NextResponse } from "next/server";
import type Parse from "parse/node";
import { requireAdmin } from "@/lib/parse/require-admin";
import { getParseAdmin } from "@/lib/parse/admin";

const ROLES = ["admin", "customer", "expert", "provider"] as const;
const STATUSES = ["active", "pending", "suspended"] as const;

/**
 * Admin endpoint to manage user accounts.
 * GET  - List users, optionally filtered by ?q= (email/username/name) and ?role=
 * PATCH - Update a user's role or status ({ userId, role?, status? })
 */
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const Parse = getParseAdmin();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const role = searchParams.get("role") || "";

    const pattern = new RegExp(escapeRegex(q), "i");
    const query = q
      ? Parse.Query.or(
          new Parse.Query(Parse.User).matches("email", pattern),
          new Parse.Query(Parse.User).matches("name", pattern),
          new Parse.Query(Parse.User).matches("username", pattern),
        )
      : new Parse.Query(Parse.User);
    if (role && (ROLES as readonly string[]).includes(role)) query.equalTo("role", role);
    query.descending("createdAt");
    query.limit(200);

    const results = await query.find({ useMasterKey: true });
    return NextResponse.json(results.map(serializeUser));
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

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (role !== undefined && !(ROLES as readonly string[]).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (status !== undefined && !(STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (userId === admin.id && (status === "suspended" || (role !== undefined && role !== "admin"))) {
      return NextResponse.json({ error: "You cannot suspend or demote your own account" }, { status: 400 });
    }

    const Parse = getParseAdmin();
    const user = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
    if (role !== undefined) user.set("role", role);
    if (status !== undefined) user.set("status", status);
    await user.save(null, { useMasterKey: true });

    return NextResponse.json({ message: "User updated", user: serializeUser(user) });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeUser(user: Parse.User) {
  return {
    id: user.id,
    name: user.get("name") || "",
    email: user.get("email") || user.get("username") || "",
    role: user.get("role") || "customer",
    status: user.get("status") || "active",
    createdAt: user.createdAt,
  };
}

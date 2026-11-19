import { NextResponse } from "next/server";
import { Account, Client, Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/admin";
import { appwriteEndpoint, appwriteProjectId, COLLECTIONS } from "@/lib/appwrite/config";
import { listRows } from "@/lib/appwrite/db";
import { homePathForRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/sign-in
 * 1) Validates email/password with a temporary Account session
 * 2) Issues a server session secret via Users.createSession (Cloud omits secret on email sessions)
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const probeClient = new Client().setEndpoint(appwriteEndpoint()).setProject(appwriteProjectId());
    const probeAccount = new Account(probeClient);
    const probe = await probeAccount.createEmailPasswordSession({ email, password });
    const userId = probe.userId;

    const admin = createAdminClient();
    const session = await admin.users.createSession({ userId });
    const secret = session.secret;
    if (!secret) {
      return NextResponse.json({ error: "Could not create a usable Appwrite session." }, { status: 500 });
    }

    const sessionClient = new Client()
      .setEndpoint(appwriteEndpoint())
      .setProject(appwriteProjectId())
      .setSession(secret);
    const me = await new Account(sessionClient).get();
    const prefs = (me.prefs || {}) as Record<string, unknown>;

    let role = String(prefs.role || "customer");
    let accountKind = String(prefs.accountKind || "");
    let status = String(prefs.status || "active");
    let name = me.name || email;

    try {
      const profiles = await listRows(COLLECTIONS.profiles, [Query.equal("userId", me.$id), Query.limit(1)]);
      const profile = profiles.rows[0];
      if (profile) {
        role = String(profile.role || role);
        accountKind = String(profile.accountKind || accountKind);
        status = String(profile.status || status);
        name = String(profile.name || name);
      }
    } catch {
      /* profile optional */
    }

    if (status === "suspended") {
      return NextResponse.json(
        { error: "This account is suspended. Contact support to restore access.", suspended: true },
        { status: 403 },
      );
    }

    return NextResponse.json({
      secret,
      user: {
        id: me.$id,
        email: me.email,
        name,
        role,
        accountKind,
        status,
      },
      homePath: homePathForRole(role),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-in failed";
    const status = /invalid|credentials|unauthorized|user_invalid/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? "Invalid email or password." : message }, { status });
  }
}

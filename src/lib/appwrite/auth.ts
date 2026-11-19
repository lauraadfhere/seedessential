import "server-only";
import { Query } from "node-appwrite";
import { createSessionClient } from "./admin";
import { COLLECTIONS } from "./config";
import { listRows } from "./db";

export type AppwriteAccount = {
  id: string;
  email: string;
  name: string;
  role: string;
  accountKind?: string;
  status?: string;
  prefs: Record<string, unknown>;
  profile?: Record<string, unknown> | null;
};

function bearerToken(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim() || "";
}

/** Resolves the signed-in Appwrite user from the Bearer session secret. */
export async function sessionUser(request: Request): Promise<AppwriteAccount | null> {
  const token = bearerToken(request);
  if (!token) return null;

  try {
    const session = createSessionClient(token);
    const user = await session.account.get();
    const prefs = (user.prefs || {}) as Record<string, unknown>;
    let profile: Record<string, unknown> | null = null;
    try {
      const listed = await listRows(COLLECTIONS.profiles, [Query.equal("userId", user.$id), Query.limit(1)]);
      profile = listed.rows[0] ?? null;
    } catch {
      profile = null;
    }

    const role = String(profile?.role || prefs.role || "customer");
    const status = String(profile?.status || prefs.status || "active");

    return {
      id: user.$id,
      email: user.email,
      name: String(profile?.name || user.name || user.email),
      role,
      accountKind: String(profile?.accountKind || prefs.accountKind || ""),
      status,
      prefs,
      profile,
    };
  } catch {
    return null;
  }
}

export function isSuspended(account: AppwriteAccount) {
  return account.status === "suspended";
}

export async function requireUser(request: Request) {
  const user = await sessionUser(request);
  return user && !isSuspended(user) ? user : null;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  return user?.role === "admin" ? user : null;
}

export async function requireExpert(request: Request) {
  const user = await requireUser(request);
  return user?.role === "expert" ? user : null;
}

export async function requireProvider(request: Request) {
  const user = await requireUser(request);
  return user?.role === "provider" || user?.role === "business" ? user : null;
}

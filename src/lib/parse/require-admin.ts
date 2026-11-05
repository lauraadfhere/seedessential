import "server-only";
import type Parse from "parse/node";
import { getParseAdmin } from "./admin";
import { isProviderRole } from "@/lib/roles";

/** Resolves the session's user even when the account is suspended (used by `/api/me`). */
export async function sessionUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const Parse = getParseAdmin();
  const session = await new Parse.Query("_Session").equalTo("sessionToken", token).first({ useMasterKey: true });
  if (!session) return null;
  const expires = session.get("expiresAt") as Date | undefined;
  if (expires && expires.getTime() < Date.now()) return null;
  const user = session.get("user");
  if (!user) return null;
  await user.fetch({ useMasterKey: true });
  return user as Parse.User;
}

export function isSuspended(user: Parse.User) {
  return user.get("status") === "suspended";
}

/** Validates a Parse session token and returns its active (non-suspended) user, or null. */
export async function requireUser(request: Request) {
  const user = await sessionUser(request);
  return user && !isSuspended(user) ? user : null;
}

/** Validates a Parse session token and returns its admin user, or null. */
export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  return user?.get("role") === "admin" ? user : null;
}

export async function requireProvider(request: Request) {
  const user = await requireUser(request);
  return user && isProviderRole(user.get("role")) ? user : null;
}

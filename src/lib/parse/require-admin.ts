import "server-only";
import type Parse from "parse/node";
import { getParseAdmin } from "./admin";
import { publicEnv } from "@/lib/public-config";
import { isProviderRole } from "@/lib/roles";

/** Session-scoped Parse options — works even when PARSE_MASTER_KEY is wrong. */
export function sessionOpts(user: Parse.User): { sessionToken: string } | { useMasterKey: true } {
  const sessionToken = user.getSessionToken();
  if (sessionToken) return { sessionToken };
  return { useMasterKey: true };
}

/**
 * Resolves the signed-in user from the Bearer session token via Parse REST `/users/me`.
 * Avoids `useMasterKey` / `_Session` queries so a bad master key cannot take auth offline.
 */
export async function sessionUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  if (!token) return null;

  const appId = publicEnv("NEXT_PUBLIC_PARSE_APP_ID");
  const jsKey = publicEnv("NEXT_PUBLIC_PARSE_JS_KEY");
  const serverURL = publicEnv("NEXT_PUBLIC_PARSE_SERVER_URL").replace(/\/$/, "");

  try {
    const response = await fetch(`${serverURL}/users/me`, {
      headers: {
        "X-Parse-Application-Id": appId,
        "X-Parse-JavaScript-Key": jsKey,
        "X-Parse-Session-Token": token,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    if (!data?.objectId) return null;

    const Parse = getParseAdmin();
    return Parse.User.fromJSON({
      className: "_User",
      ...data,
      sessionToken: token,
    }) as Parse.User;
  } catch {
    return null;
  }
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

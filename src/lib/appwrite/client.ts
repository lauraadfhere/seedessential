"use client";

import { Account, Client } from "appwrite";
import { appwriteEndpoint, appwriteProjectId, SESSION_STORAGE_KEY } from "./config";

let client: Client | null = null;

function browserClient() {
  if (!client) {
    client = new Client().setEndpoint(appwriteEndpoint()).setProject(appwriteProjectId());
  }
  return client;
}

export function getAppwriteAccount() {
  return new Account(browserClient());
}

export function getSessionSecret(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function setSessionSecret(secret: string | null) {
  if (typeof window === "undefined") return;
  if (secret) window.localStorage.setItem(SESSION_STORAGE_KEY, secret);
  else window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

/** Email/password sign-in; stores the session secret for API Bearer auth. */
export async function appwriteSignIn(email: string, password: string) {
  const account = getAppwriteAccount();
  try {
    await account.deleteSessions();
  } catch {
    /* no existing session */
  }
  const session = await account.createEmailPasswordSession(email.trim().toLowerCase(), password);
  // Web SDK may keep cookie session; prefer explicit secret when present for SSR/API routes.
  const secret = (session as { secret?: string }).secret || session.$id;
  setSessionSecret(secret);
  const user = await account.get();
  return { session, user, secret };
}

export async function appwriteSignOut() {
  try {
    await getAppwriteAccount().deleteSession("current");
  } catch {
    /* ignore */
  }
  setSessionSecret(null);
}

export async function appwriteCurrentUser() {
  const secret = getSessionSecret();
  if (!secret) return null;
  try {
    return await getAppwriteAccount().get();
  } catch {
    setSessionSecret(null);
    return null;
  }
}

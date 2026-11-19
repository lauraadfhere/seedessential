"use client";

import { getSessionSecret } from "./client";
import { authHeaders } from "@/lib/api-client";

export function browserSessionToken() {
  return getSessionSecret() ?? "";
}

/** Loads /api/me when a session exists; returns null when signed out. */
export async function fetchMe() {
  if (!browserSessionToken()) return null;
  const response = await fetch("/api/me", { headers: authHeaders(), cache: "no-store" });
  if (!response.ok) return null;
  return response.json() as Promise<{ id: string; role: string; name?: string; email?: string }>;
}

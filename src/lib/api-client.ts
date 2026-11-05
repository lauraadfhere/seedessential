"use client";

import { getParse } from "@/lib/parse/client";

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields?: Record<string, string>) {
    super(message);
  }
}

export function sessionToken() {
  return getParse().User.current()?.getSessionToken() ?? "";
}

export function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = sessionToken();
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

/** JSON fetch against our API with the Parse session attached; throws `ApiError` with the server message. */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const response = await fetch(path, {
    ...rest,
    headers: authHeaders({ ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(headers ?? {}) }),
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || "Something went wrong", response.status, data.fields);
  return data as T;
}

export type UploadFolder = "profiles" | "products" | "experts" | "projects" | "consultationRequests" | "businessDocuments" | "claims" | "ruddge";

/** Signed direct upload to Cloudinary; returns the stored public ID and delivery URL. */
export async function uploadToCloudinary(file: File, folder: UploadFolder) {
  const signed = await api<{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }>(
    "/api/cloudinary/sign",
    { method: "POST", json: { folder } },
  );
  const form = new FormData();
  form.set("file", file);
  form.set("api_key", signed.apiKey);
  form.set("timestamp", String(signed.timestamp));
  form.set("signature", signed.signature);
  form.set("folder", signed.folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`, { method: "POST", body: form });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.public_id) throw new Error(result.error?.message || "Upload failed");
  return { publicId: result.public_id as string, url: result.secure_url as string };
}

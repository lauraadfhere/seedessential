import { NextResponse } from "next/server";
import { signUploadParams, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";
import { requireAdmin, requireProvider, requireUser } from "@/lib/parse/require-admin";

type FolderKey = keyof typeof CLOUDINARY_FOLDERS;
type Access = "public" | "user" | "seller" | "admin";

/**
 * Who may upload where. `profiles` and `experts` stay public because sign-up
 * uploads the avatar and verification documents before a session exists.
 */
const FOLDER_ACCESS: Record<FolderKey, Access> = {
  profiles: "public",
  experts: "public",
  consultationRequests: "user",
  projects: "user",
  claims: "user",
  ruddge: "public",
  businessDocuments: "seller",
  products: "seller",
  guides: "admin",
  reports: "admin",
};

async function allowed(request: Request, access: Access) {
  if (access === "public") return true;
  if (access === "user") return Boolean(await requireUser(request));
  if (access === "admin") return Boolean(await requireAdmin(request));
  return Boolean((await requireAdmin(request)) || (await requireProvider(request)));
}

/**
 * Issues a Cloudinary upload signature so the browser can upload directly
 * to Cloudinary (images, PDFs) without ever seeing the API secret.
 *
 * Client usage:
 *   1. POST here with `{ folder: "products" }` to get { signature, timestamp, apiKey, cloudName, folder }.
 *   2. POST a multipart form directly to
 *      `https://api.cloudinary.com/v1_1/<cloudName>/auto/upload`
 *      including file, api_key, timestamp, signature and folder.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const folderKey = (typeof body.folder === "string" ? body.folder : "products") as FolderKey;
  if (!(folderKey in FOLDER_ACCESS)) {
    return NextResponse.json({ error: "Unknown upload folder" }, { status: 400 });
  }
  if (!(await allowed(request, FOLDER_ACCESS[folderKey]))) {
    return NextResponse.json({ error: "You are not allowed to upload to this folder" }, { status: 403 });
  }

  const folder = CLOUDINARY_FOLDERS[folderKey];
  const timestamp = Math.round(Date.now() / 1000);
  const signature = signUploadParams({ timestamp, folder });

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  });
}

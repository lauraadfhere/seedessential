/**
 * Server-only Cloudinary configuration. Used for signed uploads and any
 * admin-side media operations (deleting assets, generating signatures,
 * server-side uploads of PDFs/reports, etc). The API secret must never be
 * exposed to the browser — this file is guarded by `server-only`.
 */
import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/** Folder layout used across the app, so uploads stay organized. */
export const CLOUDINARY_FOLDERS = {
  products: "tannelli/products",
  profiles: "tannelli/profiles",
  guides: "tannelli/guides",
  reports: "tannelli/reports",
  experts: "tannelli/experts",
  projects: "tannelli/projects",
  consultationRequests: "tannelli/consultation-requests",
  businessDocuments: "tannelli/business-documents",
  claims: "tannelli/claims",
  ruddge: "tannelli/ruddge",
} as const;

/**
 * Generates a signature for a direct, secure browser -> Cloudinary upload
 * (the "signed upload" pattern). Pair with `POST /api/cloudinary/sign`.
 */
export function signUploadParams(paramsToSign: Record<string, string | number>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error("Missing CLOUDINARY_API_SECRET in .env.local");
  }
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
  return signature;
}

/** Uploads a file (path, base64, or remote URL) to a given folder. */
export async function uploadMedia(
  source: string,
  folder: (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS],
  options: Record<string, unknown> = {},
) {
  return cloudinary.uploader.upload(source, {
    folder,
    resource_type: "auto", // images and PDFs both handled
    ...options,
  });
}

/**
 * Client-safe Cloudinary helpers. Only uses the public cloud name — no
 * secrets here, safe to import anywhere (Client or Server Components).
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const WATERMARK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WATERMARK === "true";

type ImageOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "scale" | "thumb" | "limit";
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
  watermark?: boolean; // Add watermark overlay
};

/** Builds a Cloudinary delivery URL for an image from its public ID. */
export function cloudinaryImage(publicId: string, opts: ImageOptions = {}) {
  if (!CLOUD_NAME) {
    throw new Error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local");
  }
  const {
    width,
    height,
    crop = "fill",
    quality = "auto",
    format = "auto",
    watermark = false,
  } = opts;

  const transforms = [
    `f_${format}`,
    `q_${quality}`,
    crop && `c_${crop}`,
    width && `w_${width}`,
    height && `h_${height}`,
  ]
    .filter(Boolean)
    .join(",");

  // Only add watermark if explicitly enabled in environment and requested
  // The watermark logo should be uploaded to Cloudinary as "tannelli/watermark_logo"
  // Set NEXT_PUBLIC_ENABLE_WATERMARK=true in .env.local to enable
  const watermarkTransform = (watermark && WATERMARK_ENABLED) 
    ? "/l_tannelli:watermark_logo,w_120,o_40,g_south_east,x_20,y_20" 
    : "";

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}${watermarkTransform}/${publicId}`;
}

/** Builds a direct Cloudinary URL for a raw file (PDF reports, docs, etc). */
export function cloudinaryFile(publicId: string) {
  if (!CLOUD_NAME) {
    throw new Error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local");
  }
  return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${publicId}`;
}

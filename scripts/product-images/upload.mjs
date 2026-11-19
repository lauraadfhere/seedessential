// Uploads the downscaled product photos to Cloudinary as tannelli/products/<slug>.
// Run: node --env-file=.env.local scripts/product-images/upload.mjs
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "small");
const sources = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "sources.json"), "utf8"));
const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;
if (!cloud || !key || !secret) throw new Error("Missing Cloudinary env vars");

for (const s of sources) {
  const publicId = `tannelli/products/${s.slug}`;
  const timestamp = Math.round(Date.now() / 1000);
  const signed = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(signed + secret).digest("hex");
  const form = new FormData();
  form.append("file", new Blob([readFileSync(join(dir, `${s.slug}.jpg`))], { type: "image/jpeg" }), `${s.slug}.jpg`);
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", key);
  form.append("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
  const body = await res.json();
  console.log(res.status, s.slug, body.public_id ?? body.error?.message);
}

// Imports the SEED product media folders into Cloudinary and Parse.
// Usage: node --env-file=.env.local scripts/import-seed-catalog.mjs "<media root>"
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const Parse = createRequire(import.meta.url)("parse/node");
import { v2 as cloudinary } from "cloudinary";

const root = process.argv[2];
if (!root) throw new Error("Pass the media root folder as the first argument.");

Parse.initialize(process.env.NEXT_PUBLIC_PARSE_APP_ID, process.env.NEXT_PUBLIC_PARSE_JS_KEY, process.env.PARSE_MASTER_KEY);
Parse.serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGES = ["01_Full_Product_Panel", "02_Main_Product_View", "03_Label_and_Packaging_Detail", "04_Product_Feature_Detail"];
// Existing app categories (src/lib/data.ts). Guides (29-36) have no matching category, so they use "tools".
const CATEGORY = {
  1: "soil-compost", 2: "fertilizers", 3: "soil-compost", 4: "soil-compost", 5: "fertilizers", 6: "fertilizers",
  7: "fertilizers", 8: "fertilizers", 9: "fertilizers", 10: "fertilizers", 11: "fertilizers", 12: "fertilizers",
  13: "protection", 14: "protection", 15: "seeds", 16: "seeds", 17: "seeds", 18: "soil-compost", 19: "soil-compost",
  20: "soil-compost", 21: "soil-compost", 22: "greenhouses", 23: "irrigation", 24: "lighting", 25: "tools", 26: "tools",
  27: "tools", 28: "irrigation",
};
const categoryFor = (n) => CATEGORY[n] ?? "tools";
const CATEGORY_META = {
  "soil-compost": ["Soil & Compost", "equipment"],
  fertilizers: ["Fertilizers & Nutrients", "equipment"],
  protection: ["Plant Protection", "equipment"],
  seeds: ["Seeds", "plant"],
  irrigation: ["Irrigation & Watering", "equipment"],
  lighting: ["Grow Lighting", "equipment"],
  greenhouses: ["Greenhouses", "equipment"],
  tools: ["Gardening Tools", "equipment"],
};
const kindFor = (n) => CATEGORY_META[categoryFor(n)][1];
const toSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function uploadImages(folderName, slug) {
  const ids = [];
  for (const base of IMAGES) {
    const file = path.join(root, folderName, `${base}.jpg`);
    const res = await cloudinary.uploader.upload(file, {
      public_id: `${slug}-${base.slice(0, 2)}`,
      folder: "tannelli/products",
      overwrite: true,
      resource_type: "image",
    });
    ids.push(res.public_id);
  }
  return ids;
}

const Category = Parse.Object.extend("Category");
const Product = Parse.Object.extend("Product");
const folders = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();

for (const folderName of folders) {
  const n = Number(folderName.slice(0, 2));
  const info = fs.readFileSync(path.join(root, folderName, "PRODUCT_INFO.txt"), "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const name = info[1];
  const tagline = info[2] ?? "";
  const slug = `seed-${toSlug(folderName.slice(3))}`;
  const images = await uploadImages(folderName, slug);

  const catSlug = categoryFor(n);
  let category = await new Parse.Query(Category).equalTo("slug", catSlug).first({ useMasterKey: true });
  if (!category) {
    category = new Category();
    category.set({ name: CATEGORY_META[catSlug][0], slug: catSlug, kind: CATEGORY_META[catSlug][1] });
    await category.save(null, { useMasterKey: true });
  }

  let product = await new Parse.Query(Product).equalTo("slug", slug).first({ useMasterKey: true });
  if (!product) product = new Product();
  product.set({
    name,
    slug,
    kind: kindFor(n),
    category,
    price: 0,
    currency: "USD",
    rating: 0,
    reviewsCount: 0,
    shortDescription: tagline,
    description: `${name} by SEED. ${tagline}.`,
    inStock: true,
    featured: false,
    images,
    availableForExpertRequests: false,
    visibilityStatus: "published",
  });
  await product.save(null, { useMasterKey: true });
  console.log(`saved ${slug} (${images.length} images)`);
}
console.log(`done: ${folders.length} products`);

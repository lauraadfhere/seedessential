// One-off: adds `image` (Cloudinary public ID) and `imageCredit` to each product in src/lib/data.ts.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sources = JSON.parse(readFileSync(join(here, "sources.json"), "utf8"));
const dataPath = join(here, "../../src/lib/data.ts");
let text = readFileSync(dataPath, "utf8");

for (const s of sources) {
  const marker = `slug: "${s.slug}",`;
  const start = text.indexOf(marker);
  if (start < 0) throw new Error(`product not found: ${s.slug}`);
  const tintAt = text.indexOf("\n    tint: ", start);
  const lineEnd = text.indexOf("\n", tintAt + 1);
  const credit = `${s.author} / Wikimedia Commons, ${s.license} (${s.page})`.replace(/"/g, "");
  const insert = `\n    image: "tannelli/products/${s.slug}",\n    imageCredit: "${credit}",`;
  text = text.slice(0, lineEnd) + insert + text.slice(lineEnd);
}

writeFileSync(dataPath, text);
console.log("updated", sources.length);

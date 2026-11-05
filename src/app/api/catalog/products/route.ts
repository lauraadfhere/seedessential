import { NextResponse } from "next/server";
import { products } from "@/lib/data";
import { loadStoredProducts, serializeProduct, toShopProduct, visibilityOf } from "@/lib/parse/catalog";

export const dynamic = "force-dynamic";

/** Public catalogue read: published products only, including approved provider equipment. */
export async function GET() {
  const stored = await loadStoredProducts();
  const bySlug = new Map(stored.map((item) => [item.get("slug") as string, item]));
  const seeded = products
    .map((source) => serializeProduct(source, bySlug.get(source.slug)))
    .filter((item) => item.visibilityStatus === "published")
    .map(toShopProduct);
  const extra = stored
    .filter((item) => !products.some((source) => source.slug === item.get("slug")) && visibilityOf(item) === "published")
    .map((item) => toShopProduct(serializeProduct(undefined, item)));
  return NextResponse.json([...seeded, ...extra], { headers: { "Cache-Control": "no-store, max-age=0" } });
}

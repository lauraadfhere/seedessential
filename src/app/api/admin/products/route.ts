import { NextResponse } from "next/server";
import { products } from "@/lib/data";
import { applyMedia, getOrCreateCategory, getOrCreateSeededProduct, loadStoredProducts, serializeProduct, slugifyProduct, visibilityOf } from "@/lib/parse/catalog";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireAdmin } from "@/lib/parse/require-admin";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  const stored = await loadStoredProducts();
  const bySlug = new Map(stored.map((item) => [item.get("slug") as string, item]));
  const seeded = products.map((source) => serializeProduct(source, bySlug.get(source.slug)));
  const extra = stored
    .filter((item) => !products.some((source) => source.slug === item.get("slug")))
    .map((item) => serializeProduct(undefined, item));
  return NextResponse.json([...seeded, ...extra]);
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  const body = await request.json();
  const Parse = getParseAdmin();

  if (body.create === true) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const categorySlug = typeof body.category === "string" ? body.category : "";
    const kind = body.kind === "plant" ? "plant" : "equipment";
    if (!name || !categorySlug) return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    const product = new (Parse.Object.extend("Product"))();
    product.set({
      name,
      slug: slugifyProduct(name),
      kind,
      category: await getOrCreateCategory(categorySlug),
      price: typeof body.price === "number" && body.price >= 0 ? body.price : 0,
      currency: "USD",
      rating: 0,
      reviewsCount: 0,
      shortDescription: typeof body.short === "string" ? body.short.trim() : "",
      description: typeof body.description === "string" ? body.description.trim() : "",
      inStock: true,
      featured: Boolean(body.featured),
      images: [],
      availableForExpertRequests: false,
      visibilityStatus: "published",
    });
    if (typeof body.priceDZD === "number" && body.priceDZD >= 0) product.set("priceDZD", body.priceDZD);
    await product.save(null, { useMasterKey: true });
    await product.get("category")?.fetch?.({ useMasterKey: true }).catch(() => {});
    return NextResponse.json(serializeProduct(undefined, product));
  }

  if (typeof body.slug !== "string") return NextResponse.json({ error: "A product slug is required" }, { status: 400 });
  const existing = await new Parse.Query("Product").equalTo("slug", body.slug).include("category").include("provider").first({ useMasterKey: true });
  const product = existing ?? await getOrCreateSeededProduct(body.slug);
  if (typeof body.name === "string" && body.name.trim()) product.set("name", body.name.trim());
  if (typeof body.price === "number" && Number.isFinite(body.price) && body.price >= 0) product.set("price", body.price);
  if (typeof body.priceDZD === "number" && Number.isFinite(body.priceDZD) && body.priceDZD >= 0) product.set("priceDZD", body.priceDZD);
  if (typeof body.availableForExpertRequests === "boolean") product.set("availableForExpertRequests", body.availableForExpertRequests);
  if (typeof body.featured === "boolean") product.set("featured", body.featured);
  if (typeof body.inStock === "boolean") product.set("inStock", body.inStock);
  if (typeof body.short === "string") product.set("shortDescription", body.short.trim());
  if (body.visibilityStatus === "published" || body.visibilityStatus === "pending" || body.visibilityStatus === "rejected") {
    product.set("visibilityStatus", body.visibilityStatus);
  } else if (!product.get("visibilityStatus")) {
    product.set("visibilityStatus", visibilityOf(product));
  }
  applyMedia(product, body);
  await product.save(null, { useMasterKey: true });
  return NextResponse.json(serializeProduct(products.find((item) => item.slug === body.slug), product));
}

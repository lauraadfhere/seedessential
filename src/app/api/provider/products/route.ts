import { NextResponse } from "next/server";
import type Parse from "parse/node";
import { applyMedia, getOrCreateCategory, serializeProduct, slugifyProduct } from "@/lib/parse/catalog";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireProvider } from "@/lib/parse/require-admin";

function json(product: Parse.Object) {
  return serializeProduct(undefined, product);
}

export async function GET(request: Request) {
  const user = await requireProvider(request);
  if (!user) return NextResponse.json({ error: "Provider access required" }, { status: 403 });
  const Parse = getParseAdmin();
  const stored = await new Parse.Query("Product").equalTo("provider", user).include("category").limit(1000).find({ useMasterKey: true });
  return NextResponse.json(stored.map((item) => json(item)));
}

export async function POST(request: Request) {
  const user = await requireProvider(request);
  if (!user) return NextResponse.json({ error: "Provider access required" }, { status: 403 });
  const body = await request.json();
  const Parse = getParseAdmin();
  const companyName = user.get("companyName") || user.get("name") || "Provider";

  if (body.create === true) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const categorySlug = typeof body.category === "string" ? body.category : "";
    if (!name || !categorySlug) return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    const product = new (Parse.Object.extend("Product"))();
    product.set({
      name,
      slug: slugifyProduct(name),
      kind: "equipment",
      category: await getOrCreateCategory(categorySlug),
      price: typeof body.price === "number" && body.price >= 0 ? body.price : 0,
      currency: "USD",
      rating: 0,
      reviewsCount: 0,
      shortDescription: typeof body.short === "string" ? body.short.trim() : "",
      description: typeof body.description === "string" ? body.description.trim() : "",
      inStock: true,
      featured: false,
      images: [],
      availableForExpertRequests: false,
      visibilityStatus: "pending",
      provider: user,
      companyName,
    });
      if (typeof body.priceDZD === "number" && body.priceDZD >= 0) product.set("priceDZD", body.priceDZD);
    if (typeof body.originWilaya === "string") product.set("originWilaya", body.originWilaya);
    if (Array.isArray(body.coverageWilayas)) product.set("coverageWilayas", body.coverageWilayas.filter((item: unknown) => typeof item === "string"));
    applyMedia(product, body);
    await product.save(null, { useMasterKey: true });
    return NextResponse.json(json(product));
  }

  if (typeof body.slug !== "string") return NextResponse.json({ error: "A product slug is required" }, { status: 400 });
  const product = await new Parse.Query("Product").equalTo("slug", body.slug).equalTo("provider", user).include("category").first({ useMasterKey: true });
  if (!product) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (typeof body.name === "string" && body.name.trim()) product.set("name", body.name.trim());
  if (typeof body.price === "number" && Number.isFinite(body.price) && body.price >= 0) product.set("price", body.price);
  if (typeof body.priceDZD === "number" && Number.isFinite(body.priceDZD) && body.priceDZD >= 0) product.set("priceDZD", body.priceDZD);
  if (typeof body.short === "string") product.set("shortDescription", body.short.trim());
  if (typeof body.description === "string") product.set("description", body.description.trim());
  if (typeof body.originWilaya === "string") product.set("originWilaya", body.originWilaya);
  if (Array.isArray(body.coverageWilayas)) product.set("coverageWilayas", body.coverageWilayas.filter((item: unknown) => typeof item === "string"));
  applyMedia(product, body);
  product.set("visibilityStatus", "pending");
  product.set("featured", false);
  await product.save(null, { useMasterKey: true });
  return NextResponse.json(json(product));
}

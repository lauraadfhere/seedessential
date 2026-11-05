import { NextResponse } from "next/server";
import { products } from "@/lib/data";
import { loadStoredProducts, serializeProduct, toShopProduct, visibilityOf } from "@/lib/parse/catalog";

export const dynamic = "force-dynamic";

/**
 * GET /api/catalog/products/:slug - Get a single published product by slug
 * Public endpoint
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const stored = await loadStoredProducts();
    const bySlug = new Map(stored.map((item) => [item.get("slug") as string, item]));
    
    // Check seeded products first
    const seededProduct = products.find((item) => item.slug === slug);
    const storedProduct = bySlug.get(slug);
    
    if (!seededProduct && !storedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    const product = serializeProduct(seededProduct, storedProduct);
    
    // Only return published products
    if (product.visibilityStatus !== "published") {
      return NextResponse.json({ error: "Product not available" }, { status: 404 });
    }
    
    return NextResponse.json(toShopProduct(product), {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

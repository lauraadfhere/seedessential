import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/wishlist - Retrieve user's wishlist
 * Requires authentication
 */
export async function GET(request: Request) {
  try {
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const Wishlist = Parse.Object.extend("Wishlist");
    const query = new Parse.Query(Wishlist);
    query.equalTo("user", user);
    query.include("product");
    query.include("product.category");
    query.descending("createdAt");
    
    const wishlistItems = await query.find({ useMasterKey: true });
    
    const serializedWishlist = wishlistItems.map(item => ({
      id: item.id,
      product: item.get("product") ? {
        id: item.get("product").id,
        slug: item.get("product").get("slug"),
        name: item.get("product").get("name"),
        kind: item.get("product").get("kind"),
        price: item.get("product").get("price"),
        priceDzd: item.get("product").get("priceDzd"),
        shortDescription: item.get("product").get("shortDescription"),
        category: item.get("product").get("category")?.get("name"),
        images: item.get("product").get("images"),
      } : null,
      createdAt: item.get("createdAt"),
    }));

    return NextResponse.json(serializedWishlist);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

/**
 * POST /api/wishlist - Add product to wishlist
 * Requires authentication
 */
export async function POST(request: Request) {
  try {
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Get the product
    const Product = Parse.Object.extend("Product");
    const product = await new Parse.Query(Product).get(productId, { useMasterKey: true });
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if already in wishlist
    const Wishlist = Parse.Object.extend("Wishlist");
    const existingQuery = new Parse.Query(Wishlist);
    existingQuery.equalTo("user", user);
    existingQuery.equalTo("product", product);
    const existing = await existingQuery.first({ useMasterKey: true });
    
    if (existing) {
      return NextResponse.json({ error: "Product already in wishlist" }, { status: 409 });
    }

    // Add to wishlist
    const wishlistItem = new Wishlist();
    wishlistItem.set({
      user,
      product,
    });

    await wishlistItem.save(null, { useMasterKey: true });

    return NextResponse.json({
      id: wishlistItem.id,
      productId: product.id,
      createdAt: wishlistItem.get("createdAt"),
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
  }
}

/**
 * DELETE /api/wishlist - Remove product from wishlist
 * Requires authentication
 */
export async function DELETE(request: Request) {
  try {
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Find and delete the wishlist item
    const Wishlist = Parse.Object.extend("Wishlist");
    const query = new Parse.Query(Wishlist);
    query.equalTo("user", user);
    
    const Product = Parse.Object.extend("Product");
    const productQuery = new Parse.Query(Product);
    const product = await productQuery.get(productId, { useMasterKey: true });
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    query.equalTo("product", product);
    const wishlistItem = await query.first({ useMasterKey: true });
    
    if (!wishlistItem) {
      return NextResponse.json({ error: "Product not in wishlist" }, { status: 404 });
    }

    await wishlistItem.destroy({ useMasterKey: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
  }
}

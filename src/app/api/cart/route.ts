import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/cart - Retrieve user's cart
 * Requires authentication
 */
export async function GET(request: Request) {
  try {
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const Cart = Parse.Object.extend("Cart");
    const query = new Parse.Query(Cart);
    query.equalTo("user", user);
    query.include("items");
    query.include("items.productVariant");
    query.include("items.productVariant.product");
    
    const cart = await query.first({ useMasterKey: true });
    
    if (!cart) {
      return NextResponse.json({ items: [], currency: "USD" });
    }
    
    const items = cart.get("items") || [];
    const serializedItems = items.map((item: any) => ({
      id: item.id,
      productVariantId: item.get("productVariant")?.id,
      quantity: item.get("quantity"),
      product: item.get("productVariant")?.get("product") ? {
        id: item.get("productVariant")?.get("product")?.id,
        slug: item.get("productVariant")?.get("product")?.get("slug"),
        name: item.get("productVariant")?.get("product")?.get("name"),
        kind: item.get("productVariant")?.get("product")?.get("kind"),
        price: item.get("productVariant")?.get("price"),
        priceDzd: item.get("productVariant")?.get("priceDzd"),
        category: item.get("productVariant")?.get("product")?.get("category")?.get("name"),
        images: item.get("productVariant")?.get("product")?.get("images"),
      } : null,
    }));

    return NextResponse.json({
      id: cart.id,
      items: serializedItems,
      currency: cart.get("currency") || "USD",
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

/**
 * POST /api/cart/items - Add item to cart
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
    const { productVariantId, quantity } = body;

    if (!productVariantId || !quantity || quantity < 1) {
      return NextResponse.json({ error: "Invalid product variant or quantity" }, { status: 400 });
    }

    // Get or create cart
    const Cart = Parse.Object.extend("Cart");
    const cartQuery = new Parse.Query(Cart);
    cartQuery.equalTo("user", user);
    let cart = await cartQuery.first({ useMasterKey: true });
    
    if (!cart) {
      const newCart = new Cart();
      newCart.set("user", user);
      newCart.set("currency", "USD");
      await newCart.save(null, { useMasterKey: true });
      cart = newCart;
    }
    if (!cart) return NextResponse.json({ error: "Could not create cart" }, { status: 500 });

    // Check if item already exists in cart
    const CartItem = Parse.Object.extend("CartItem");
    const itemQuery = new Parse.Query(CartItem);
    itemQuery.equalTo("cart", cart);
    itemQuery.equalTo("productVariant", { __type: "Pointer", className: "ProductVariant", objectId: productVariantId });
    let existingItem = await itemQuery.first({ useMasterKey: true });
    
    if (existingItem) {
      existingItem.increment("quantity", quantity);
      await existingItem.save(null, { useMasterKey: true });
    } else {
      const newItem = new CartItem();
      newItem.set("cart", cart);
      newItem.set("productVariant", { __type: "Pointer", className: "ProductVariant", objectId: productVariantId });
      newItem.set("quantity", quantity);
      await newItem.save(null, { useMasterKey: true });
    }

    // Update cart timestamp
    cart.set("updatedAt", new Date());
    await cart.save(null, { useMasterKey: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout - Process checkout and create order
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
    const { addressId, paymentMethod, idempotencyKey, shippingProvider, deliveryMethod } = body;

    if (!addressId) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }

    // Check for idempotency key to prevent duplicate orders
    if (idempotencyKey) {
      const Order = Parse.Object.extend("Order");
      const existingOrderQuery = new Parse.Query(Order);
      existingOrderQuery.equalTo("user", user);
      existingOrderQuery.equalTo("idempotencyKey", idempotencyKey);
      const existingOrder = await existingOrderQuery.first({ useMasterKey: true });
      
      if (existingOrder) {
        return NextResponse.json({
          orderNumber: existingOrder.get("orderNumber"),
          status: existingOrder.get("status"),
          message: "Order already processed"
        });
      }
    }

    // Get user's cart
    const Cart = Parse.Object.extend("Cart");
    const cartQuery = new Parse.Query(Cart);
    cartQuery.equalTo("user", user);
    cartQuery.include("items");
    cartQuery.include("items.productVariant");
    cartQuery.include("items.productVariant.product");
    const cart = await cartQuery.first({ useMasterKey: true });
    
    if (!cart || !cart.get("items") || cart.get("items").length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Get address
    const Address = Parse.Object.extend("Address");
    const address = await new Parse.Query(Address).get(addressId, { useMasterKey: true });
    
    if (!address || address.get("user").id !== user.id) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    // Calculate totals
    const cartItems = cart.get("items");
    let subtotal = 0;
    let subtotalDzd = 0;
    
    const orderItems = await Promise.all(cartItems.map(async (item: any) => {
      const productVariant = item.get("productVariant");
      const product = productVariant?.get("product");
      const quantity = item.get("quantity");
      const unitPrice = productVariant?.get("price") || 0;
      const unitPriceDzd = productVariant?.get("priceDzd") || unitPrice * 135;
      
      subtotal += unitPrice * quantity;
      subtotalDzd += unitPriceDzd * quantity;
      
      return {
        nameSnapshot: product?.get("name") || "Unknown",
        skuSnapshot: productVariant?.get("sku"),
        unitPrice,
        quantity,
        total: unitPrice * quantity,
      };
    }));

    // Calculate shipping based on provider selection
    let shipping = 0;
    let shippingDzd = 0;
    let estimatedDays = "";
    
    if (shippingProvider && deliveryMethod) {
      try {
        const { getShippingQuote, getProviderById } = await import("@/lib/shipping");
        const provider = getProviderById(shippingProvider);
        if (provider) {
          const { calculateShippingCost } = await import("@/lib/shipping");
          const shippingCost = calculateShippingCost(
            provider,
            deliveryMethod as "home" | "stop_desk",
            subtotal,
            subtotalDzd
          );
          shipping = shippingCost.priceUsd;
          shippingDzd = shippingCost.priceDzd;
          estimatedDays = deliveryMethod === "stop_desk" 
            ? provider.standardDays 
            : (provider.expressDays || provider.standardDays);
        }
      } catch (error) {
        console.error("Error calculating shipping cost:", error);
        // Fallback to simple calculation
        shipping = subtotal >= 60 ? 0 : 12;
        shippingDzd = shipping * 135;
        estimatedDays = "3-5 working days";
      }
    } else {
      // Fallback to simple calculation
      shipping = subtotal >= 60 ? 0 : 12;
      shippingDzd = shipping * 135;
      estimatedDays = "3-5 working days";
    }
    
    const total = subtotal + shipping;
    const totalDzd = subtotalDzd + shippingDzd;

    // Generate order number
    const orderNumber = `TN-${Date.now().toString(36).toUpperCase()}`;

    // Create order
    const Order = Parse.Object.extend("Order");
    const order = new Order();
    
    order.set({
      user,
      address,
      orderNumber,
      status: "pending",
      currency: "USD",
      total,
      paymentStatus: "unpaid",
      paymentMethod,
      idempotencyKey: idempotencyKey || null,
      shippingProvider: shippingProvider || null,
      deliveryMethod: deliveryMethod || null,
      estimatedDays: estimatedDays || null,
      shippingCost: shipping,
      shippingCostDzd: shippingDzd,
    });

    await order.save(null, { useMasterKey: true });

    // Create order items
    const OrderItem = Parse.Object.extend("OrderItem");
    for (const orderItem of orderItems) {
      const orderItemObj = new OrderItem();
      orderItemObj.set({
        order,
        nameSnapshot: orderItem.nameSnapshot,
        skuSnapshot: orderItem.skuSnapshot,
        unitPrice: orderItem.unitPrice,
        quantity: orderItem.quantity,
        total: orderItem.total,
      });
      await orderItemObj.save(null, { useMasterKey: true });
    }

    // Create payment record
    const Payment = Parse.Object.extend("Payment");
    const payment = new Payment();
    payment.set({
      order,
      user,
      provider: paymentMethod === "card" ? "stripe" : "manual",
      amount: total,
      currency: "USD",
      status: "pending",
    });
    await payment.save(null, { useMasterKey: true });

    // Clear cart
    cart.set("items", []);
    await cart.save(null, { useMasterKey: true });

    return NextResponse.json({
      orderNumber,
      status: "pending",
      total,
      message: "Order created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json({ error: "Failed to process checkout" }, { status: 500 });
  }
}

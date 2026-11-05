import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";
import { loadPublishedCatalog } from "@/lib/parse/catalog";
import { masterOnlyACL } from "@/lib/parse/accounts";
import { cleanString } from "@/lib/parse/marketplace";
import { ORDER_CLASS } from "@/lib/parse/trust";
import { serializeOrder, type OrderItemSnapshot } from "@/lib/parse/orders";
import { algeriaWilayas } from "@/lib/algeria";
import { getShippingQuote } from "@/lib/shipping";

export const dynamic = "force-dynamic";

const DZD_RATE = 135;

/** GET /api/orders — the signed-in customer's orders, newest first. */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const Parse = getParseAdmin();
  const orders = await new Parse.Query(ORDER_CLASS).equalTo("user", user).descending("createdAt").limit(100).find({ useMasterKey: true });
  return NextResponse.json(orders.map((order) => serializeOrder(order)), { headers: { "Cache-Control": "no-store" } });
}

/** POST /api/orders — places a cash-on-delivery order with server-verified prices. */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to place an order" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const Parse = getParseAdmin();

  const idempotencyKey = cleanString(body.idempotencyKey, 80);
  if (idempotencyKey) {
    const existing = await new Parse.Query(ORDER_CLASS).equalTo("user", user).equalTo("idempotencyKey", idempotencyKey).first({ useMasterKey: true });
    if (existing) return NextResponse.json(serializeOrder(existing));
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = await new Parse.Query(ORDER_CLASS).equalTo("user", user).greaterThan("createdAt", since).count({ useMasterKey: true });
  if (today >= 20) return NextResponse.json({ error: "Daily order limit reached. Contact support for bulk orders." }, { status: 429 });

  const wilaya = algeriaWilayas.some((item) => item.name === body.wilaya) ? (body.wilaya as string) : "";
  if (!wilaya) return NextResponse.json({ error: "Choose a delivery wilaya" }, { status: 400 });

  const requested = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!requested.length) return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });

  const catalog = new Map((await loadPublishedCatalog()).map((item) => [item.record.slug, item.record]));
  const items: OrderItemSnapshot[] = [];
  for (const entry of requested) {
    const record = catalog.get(entry?.slug);
    const quantity = Math.max(1, Math.min(99, Math.round(Number(entry?.quantity) || 1)));
    if (!record) return NextResponse.json({ error: `"${cleanString(entry?.name, 80) || entry?.slug}" is no longer available` }, { status: 409 });
    if (!record.inStock) return NextResponse.json({ error: `${record.name} is out of stock` }, { status: 409 });
    items.push({
      slug: record.slug,
      name: record.name,
      kind: record.kind,
      category: record.category,
      price: record.price,
      priceDzd: record.priceDzd,
      image: record.images[0],
      quantity,
      providerId: record.providerId,
      providerName: record.providerName,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalDzd = items.reduce((sum, item) => sum + (item.priceDzd ?? item.price * DZD_RATE) * item.quantity, 0);
  // Shipping is priced on the server from the chosen provider and method; client amounts are ignored.
  const deliveryMethod = body.deliveryMethod === "stop_desk" ? "stop_desk" : "home";
  const quote = getShippingQuote(wilaya, subtotal, subtotalDzd, deliveryMethod);
  const chosen = quote.options.find((option) => option.provider.id === body.shippingProvider && option.method === deliveryMethod) ?? quote.recommended;
  if (!chosen) return NextResponse.json({ error: "No delivery option is available for this wilaya" }, { status: 400 });
  const shipping = chosen.priceUsd;
  const shippingDzd = chosen.priceDzd;
  const orderNumber = `TN-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
  const paymentMethod = ["cod", "card", "transfer"].includes(body.paymentMethod) ? body.paymentMethod : "cod";

  const order = new (Parse.Object.extend(ORDER_CLASS))();
  order.set({
    user,
    orderNumber,
    status: "placed",
    paymentStatus: "unpaid",
    paymentMethod,
    currency: "USD",
    items,
    wilaya,
    deliveryAddress: cleanString(body.address, 240),
    phone: cleanString(body.phone, 24),
    notes: cleanString(body.notes, 500),
    subtotal,
    shipping,
    total: subtotal + shipping,
    shippingDzd,
    totalDzd: subtotalDzd + shippingDzd,
    days: cleanString(body.days, 60) || "2–5 working days",
    shippingProvider: chosen.provider.id,
    deliveryMethod,
    providerIds: [...new Set(items.map((item) => item.providerId).filter(Boolean))],
    statusHistory: [{ status: "placed", at: new Date().toISOString() }],
    reviewedSlugs: [],
    ...(idempotencyKey ? { idempotencyKey } : {}),
  });
  order.setACL(masterOnlyACL());
  await order.save(null, { useMasterKey: true });
  return NextResponse.json(serializeOrder(order), { status: 201 });
}

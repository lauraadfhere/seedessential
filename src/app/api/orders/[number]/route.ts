import { NextResponse } from "next/server";
import { requireUser } from "@/lib/parse/require-admin";
import { roleOf, cleanString } from "@/lib/parse/marketplace";
import { refreshTrustForUserIds } from "@/lib/parse/trust";
import { ORDER_STATUSES, findOrder, ownsOrder, serializeOrder } from "@/lib/parse/orders";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ number: string }> };

const PROVIDER_STEPS = ["confirmed", "preparing", "shipped", "out_for_delivery"];

/** GET /api/orders/:number — customer, involved providers (their lines only) and admins. */
export async function GET(request: Request, { params }: Params) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { number } = await params;
  const order = await findOrder(number);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const role = roleOf(user);
  if (role === "admin") return NextResponse.json(serializeOrder(order, { includeCustomer: true }));
  if (ownsOrder(order, user)) return NextResponse.json(serializeOrder(order));
  if (role === "provider" && ((order.get("providerIds") as string[]) ?? []).includes(user.id ?? "")) {
    return NextResponse.json(serializeOrder(order, { includeCustomer: true, providerId: user.id }));
  }
  return NextResponse.json({ error: "Order not found" }, { status: 404 });
}

/**
 * PATCH /api/orders/:number — `{ status, note }`.
 * Customers may cancel a just-placed order or confirm delivery; providers advance
 * fulfilment for orders containing their items; admins can set any status.
 */
export async function PATCH(request: Request, { params }: Params) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { number } = await params;
  const order = await findOrder(number);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const next = String(body.status ?? "");
  const current = order.get("status") as string;
  const role = roleOf(user);
  const isOwner = ownsOrder(order, user);
  const isProvider = role === "provider" && ((order.get("providerIds") as string[]) ?? []).includes(user.id ?? "");

  if (![...ORDER_STATUSES, "cancelled"].includes(next)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  if (current === "delivered" || current === "cancelled") return NextResponse.json({ error: "This order is already closed" }, { status: 409 });

  let allowed = role === "admin";
  if (isOwner && next === "cancelled" && current === "placed") allowed = true;
  if (isOwner && next === "delivered" && ["shipped", "out_for_delivery"].includes(current)) allowed = true;
  if (isProvider && PROVIDER_STEPS.includes(next) && ORDER_STATUSES.indexOf(next as never) > ORDER_STATUSES.indexOf(current as never)) allowed = true;
  if (!allowed) return NextResponse.json({ error: "You cannot move this order to that status" }, { status: 403 });

  const history = (order.get("statusHistory") as { status: string; at: string; note?: string; by?: string }[]) ?? [];
  order.set({
    status: next,
    statusHistory: [...history, { status: next, at: new Date().toISOString(), note: cleanString(body.note, 300) || undefined, by: role }],
    ...(next === "delivered" ? { deliveredAt: new Date(), paymentStatus: order.get("paymentMethod") === "cod" ? "paid" : order.get("paymentStatus") } : {}),
  });
  await order.save(null, { useMasterKey: true });
  if (next === "delivered") await refreshTrustForUserIds(order.get("providerIds") ?? []);

  return NextResponse.json(serializeOrder(order, { includeCustomer: role !== "customer", providerId: isProvider ? user.id : undefined }));
}

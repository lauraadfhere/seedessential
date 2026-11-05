import "server-only";

import type Parse from "parse/node";
import { getParseAdmin } from "./admin";
import { ORDER_CLASS } from "./trust";
import { displayName } from "./marketplace";
import type { CartItem, OrderDeliveryStatus, SavedOrder } from "@/lib/cart";

export const ORDER_STATUSES: OrderDeliveryStatus[] = ["placed", "confirmed", "preparing", "shipped", "out_for_delivery", "delivered"];
export const ORDER_FINAL = ["delivered", "cancelled"];

export type OrderItemSnapshot = CartItem & { providerId?: string; providerName?: string };

export type OrderRecord = SavedOrder & {
  status: OrderDeliveryStatus | "cancelled";
  items: OrderItemSnapshot[];
  customer?: { id: string; name: string };
  providerIds: string[];
  history: { status: string; at: string; note?: string }[];
  reviewedSlugs: string[];
};

export function serializeOrder(order: Parse.Object, opts: { includeCustomer?: boolean; providerId?: string } = {}): OrderRecord {
  const user = order.get("user") as Parse.Object | undefined;
  const items = ((order.get("items") as OrderItemSnapshot[]) ?? []).filter((item) => !opts.providerId || item.providerId === opts.providerId);
  return {
    id: order.get("orderNumber"),
    createdAt: order.createdAt?.toISOString() ?? new Date().toISOString(),
    wilaya: order.get("wilaya") ?? "",
    address: order.get("deliveryAddress") || undefined,
    phone: opts.providerId ? undefined : order.get("phone") || undefined,
    notes: order.get("notes") || undefined,
    paymentMethod: order.get("paymentMethod") || "cod",
    status: order.get("status") ?? "placed",
    items,
    subtotal: order.get("subtotal") ?? 0,
    shipping: order.get("shipping") ?? 0,
    total: order.get("total") ?? 0,
    shippingDzd: order.get("shippingDzd") ?? 0,
    totalDzd: order.get("totalDzd") ?? 0,
    days: order.get("days") ?? "",
    shippingProvider: order.get("shippingProvider") || undefined,
    deliveryMethod: order.get("deliveryMethod") || undefined,
    customer: opts.includeCustomer && user ? { id: user.id ?? "", name: displayName(user, "Customer") } : undefined,
    providerIds: order.get("providerIds") ?? [],
    history: order.get("statusHistory") ?? [],
    reviewedSlugs: order.get("reviewedSlugs") ?? [],
  };
}

export async function findOrder(orderNumber: string) {
  const Parse = getParseAdmin();
  return new Parse.Query(ORDER_CLASS).equalTo("orderNumber", orderNumber).include("user").first({ useMasterKey: true });
}

export function ownsOrder(order: Parse.Object, user: Parse.User) {
  return (order.get("user") as Parse.Object | undefined)?.id === user.id;
}

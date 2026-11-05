"use client";

import { useEffect, useState } from "react";
import { Link } from "@/components/locale-link";
import { PageHero } from "@/components/page-hero";
import { RequireAuth } from "@/components/require-auth";
import { Badge, Price } from "@/components/ui";
import { DeepCard, DeepButton } from "@/components/deep-ui";
import { loadOrders, type SavedOrder, ORDER_STATUS_STEPS, orderStatusIndex } from "@/lib/cart";

function OrdersBody() {
  const [orders, setOrders] = useState<SavedOrder[]>([]);

  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  return (
    <main className="network-surface font-barlow">
      <PageHero
        eyebrow="Your orders"
        title="Order history & tracking"
        text="Track your plant and equipment deliveries across Algeria. View status, delivery estimates and order details."
      />
      <section className="section py-10">
        {orders.length === 0 ? (
          <DeepCard className="p-12 text-center">
            <p className="text-lg font-semibold">No orders yet</p>
            <p className="mt-2 text-sm text-[#607060]">Start growing by adding plants and equipment to your cart.</p>
            <DeepButton href="/shop" className="mt-6">Browse the shop</DeepButton>
          </DeepCard>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block">
                <DeepCard hover className="p-6 transition">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#638260]">#{order.id}</span>
                        <Badge tone={order.status === "delivered" ? "green" : "neutral"}>
                          {ORDER_STATUS_STEPS[orderStatusIndex(order.status)]?.label || order.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-[#607060]">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"} · Delivered to {order.wilaya}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Price value={order.total} dzd={order.totalDzd} />
                      <p className="mt-1 text-xs text-[#607060]">{order.days}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {order.items.slice(0, 3).map((item) => (
                      <span key={item.slug} className="rounded-full bg-[#eef3ed] px-3 py-1 text-xs">
                        {item.name}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-xs text-neutral-500">+{order.items.length - 3} more</span>
                    )}
                  </div>
                </DeepCard>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth loadingLabel="Loading your orders…">
      <OrdersBody />
    </RequireAuth>
  );
}
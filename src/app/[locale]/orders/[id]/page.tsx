"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Link } from "@/components/locale-link";
import { PageHero } from "@/components/page-hero";
import { RequireAuth } from "@/components/require-auth";
import { Badge, Price } from "@/components/ui";
import { DeepCard, DeepButton } from "@/components/deep-ui";
import { getOrder, type SavedOrder, ORDER_STATUS_STEPS, orderStatusIndex } from "@/lib/cart";
import { ProductVisual } from "@/components/product-card";

function OrderDetailBody() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = params.id as string;
    const foundOrder = getOrder(orderId);
    if (!foundOrder) {
      router.push("/orders");
    } else {
      setOrder(foundOrder);
    }
    setLoading(false);
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="network-surface font-barlow">
        <div className="section py-20">Loading order details…</div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  const currentStepIndex = orderStatusIndex(order.status);

  return (
    <main className="network-surface font-barlow">
      <PageHero
        eyebrow="Order tracking"
        title={`Order #${order.id}`}
        text={`Track your delivery to ${order.wilaya} · ${order.days}`}
      />
      <section className="section py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-8">
            {/* Tracking Progress */}
            <DeepCard variant="default" className="p-6">
              <h2 className="text-lg font-semibold">Delivery progress</h2>
              <div className="mt-6 space-y-4">
                {ORDER_STATUS_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.id} className="flex items-center gap-4">
                      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                        isCompleted ? "bg-[#006d44] text-white" : "bg-[#eef3ed] text-[#607060]"
                      }`}>
                        {isCompleted ? "✓" : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isCurrent ? "text-[#006d44]" : ""}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="mt-1 text-sm text-[#607060]">
                            {order.status === "placed" && "Your order has been received and is being processed."}
                            {order.status === "confirmed" && "Order confirmed and preparing for shipment."}
                            {order.status === "preparing" && "Your items are being prepared for delivery."}
                            {order.status === "shipped" && "Order has been shipped and is on its way."}
                            {order.status === "out_for_delivery" && "Out for delivery to your location."}
                            {order.status === "delivered" && "Delivered successfully!"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DeepCard>

            {/* Order Items */}
            <DeepCard variant="default" className="p-6">
              <h2 className="text-lg font-semibold">Order items</h2>
              <ul className="mt-4 space-y-4">
                {order.items.map((item) => (
                  <li key={item.slug} className="flex gap-4 rounded-2xl bg-[#f8faf8] p-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eef3ed]">
                      {item.image && <ProductVisual product={{ slug: item.slug, name: item.name, kind: item.kind, category: item.category, price: item.price, image: item.image }} className="h-full" />}
                    </div>
                    <div className="flex-1">
                      <Badge tone={item.kind === "plant" ? "green" : "neutral"}>{item.kind}</Badge>
                      <p className="mt-2 font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-[#789078]">{item.category.replaceAll("-", " ")}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <Price value={item.price} dzd={item.priceDzd} />
                        <span className="text-sm text-[#607060]">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </DeepCard>
          </div>

          {/* Order Summary */}
          <aside className="space-y-6">
            <DeepCard variant="default" className="p-6">
              <h2 className="font-semibold">Order summary</h2>
              <dl className="mt-4 space-y-3 border-t border-[#e4ebe3] pt-4 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd><Price value={order.subtotal} dzd={order.subtotal * 135} /></dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery</dt>
                  <dd>{order.shipping === 0 ? "Free" : <Price value={order.shipping} dzd={order.shippingDzd} />}</dd>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <dt>Total</dt>
                  <dd><Price value={order.total} dzd={order.totalDzd} /></dd>
                </div>
              </dl>
              <div className="mt-6 space-y-2 text-sm">
                <p className="font-semibold">Delivery details</p>
                <p className="text-[#607060]">{order.wilaya}, Algeria</p>
                <p className="text-[#607060]">{order.days}</p>
              </div>
              {order.paymentMethod && (
                <div className="mt-4 pt-4 border-t border-[#e4ebe3]">
                  <p className="text-sm font-semibold">Payment method</p>
                  <p className="mt-1 text-sm text-[#607060] capitalize">{order.paymentMethod.replace("_", " ")}</p>
                </div>
              )}
            </DeepCard>

            <DeepCard variant="default" className="p-6">
              <p className="text-sm font-semibold">Need help?</p>
              <p className="mt-2 text-sm text-[#607060]">
                Contact our support team if you have questions about your order.
              </p>
              <DeepButton href="/contact" variant="outline" className="mt-4 w-full">
                Contact support
              </DeepButton>
            </DeepCard>

            <DeepButton href="/shop" variant="outline" className="w-full">
              Continue shopping
            </DeepButton>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <RequireAuth loadingLabel="Loading order details…">
      <OrderDetailBody />
    </RequireAuth>
  );
}

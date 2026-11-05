"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/components/locale-link";
import { useCart } from "@/components/cart-provider";
import { ProductVisual } from "@/components/product-card";
import { ShippingSelector } from "@/components/shipping-selector";
import { Badge, Button, Price } from "@/components/ui";
import { algeriaWilayas } from "@/lib/algeria";
import { products } from "@/lib/data";
import { saveOrder } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { getParse } from "@/lib/parse/client";

export default function CartPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const cart = useCart();
  const [placing, setPlacing] = useState(false);

  function catalogMatch(slug: string) {
    return products.find((item) => item.slug === slug);
  }

  function checkout(event: FormEvent) {
    event.preventDefault();
    if (!cart.items.length) return;
    const user = getParse().User.current();
    if (!user) {
      router.push(`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/cart`)}`);
      return;
    }
    setPlacing(true);
    const order = {
      id: `TN-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      wilaya: cart.wilaya,
      items: cart.items,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      total: cart.total,
      shippingDzd: cart.shippingDzd,
      totalDzd: cart.subtotalDzd + cart.shippingDzd,
      days: cart.days,
      status: "placed" as const,
      shippingProvider: cart.shippingProvider,
      deliveryMethod: cart.deliveryMethod,
      paymentMethod: cart.paymentMethod,
    };
    saveOrder(order);
    cart.clear();
    router.push(`/${locale}/dashboard?order=${order.id}`);
  }

  return (
    <main className="network-surface py-8 sm:py-12">
      <div className="section grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-brand text-[#638260]">Smart cart</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#18231b]">Your growing kit</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#607060]">The cart groups plants and equipment, fills missing care items, and quotes Algeria delivery from your wilaya.</p>

          {cart.items.length === 0 ? (
            <div className="network-card mt-8 rounded-[1.75rem] p-8 text-center">
              <p className="font-semibold">Your cart is empty</p>
              <p className="mt-2 text-sm text-[#607060]">Add a plant and we will suggest the soil, pots and irrigation that belong with it.</p>
              <Button href="/shop" shape="rect" className="mt-6">Browse the shop</Button>
            </div>
          ) : (
            <ul className="mt-8 space-y-4">
              {cart.items.map((item) => {
                const product = catalogMatch(item.slug);
                return (
                  <li key={item.slug} className="network-card grid gap-4 overflow-hidden rounded-[1.5rem] p-4 sm:grid-cols-[6.5rem_1fr_auto] sm:items-center">
                    <div className="aspect-square overflow-hidden rounded-2xl bg-[#eef3ed]">
                      {product ? <ProductVisual product={{ ...product, image: item.image ?? product.image }} className="h-full" /> : null}
                    </div>
                    <div>
                      <Badge tone={item.kind === "plant" ? "green" : "neutral"}>{item.kind}</Badge>
                      <Link href={`/shop/${item.slug}`} className="mt-2 block font-semibold hover:text-accent-strong">{item.name}</Link>
                      <p className="mt-1 text-xs uppercase tracking-wider text-[#789078]">{item.category.replaceAll("-", " ")}</p>
                      <Price value={item.price} dzd={item.priceDzd} className="mt-2 block" />
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <div className="flex items-center rounded-full border border-[#dce5dc] bg-white">
                        <button type="button" aria-label="Decrease" onClick={() => cart.updateQuantity(item.slug, item.quantity - 1)} className="grid h-9 w-9 place-items-center">−</button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button type="button" aria-label="Increase" onClick={() => cart.updateQuantity(item.slug, item.quantity + 1)} className="grid h-9 w-9 place-items-center">+</button>
                      </div>
                      <button type="button" onClick={() => cart.remove(item.slug)} className="text-xs font-bold uppercase tracking-wider text-red-700">Remove</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {cart.suggestions.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold">Smart additions</h2>
              <p className="mt-1 text-sm text-[#607060]">Matched to what is already in your cart so the kit arrives complete.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {cart.suggestions.map((suggestion) => (
                  <div key={suggestion.product.slug} className="network-card flex gap-3 rounded-2xl p-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eef3ed]">
                      <ProductVisual product={suggestion.product} className="h-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{suggestion.product.name}</p>
                      <p className="mt-1 text-xs leading-5 text-[#607060]">{suggestion.reason}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Price value={suggestion.product.price} dzd={suggestion.product.priceDzd} />
                        <button type="button" onClick={() => cart.addProduct(suggestion.product)} className="text-xs font-bold uppercase tracking-wider text-[#40533d]">Add</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => cart.addProducts(cart.suggestions.map((item) => item.product))} className="mt-4 text-sm font-bold text-[#40533d]">
                Add all missing kit pieces →
              </button>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <form onSubmit={checkout} className="network-card space-y-5 rounded-[1.75rem] p-6">
            <h2 className="font-semibold">Algeria delivery</h2>
            <label className="block text-xs font-semibold">
              Deliver to wilaya
              <select value={cart.wilaya} onChange={(event) => cart.setWilaya(event.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-normal">
                {algeriaWilayas.map((wilaya) => (
                  <option key={wilaya.code} value={wilaya.name}>{wilaya.name}</option>
                ))}
              </select>
            </label>
            
            {/* Advanced shipping selector */}
            <ShippingSelector />
            
            <dl className="space-y-2 border-t border-[#e4ebe3] pt-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd><Price value={cart.subtotal} dzd={cart.subtotalDzd} /></dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{cart.shipping === 0 ? "Free" : <Price value={cart.shipping} dzd={cart.shippingDzd} />}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd><Price value={cart.total} dzd={cart.subtotalDzd + cart.shippingDzd} /></dd></div>
            </dl>
            <button disabled={!cart.items.length || placing} className="w-full rounded-md bg-[#40533d] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50">
              {placing ? "Placing order…" : "Place order"}
            </button>
            <p className="text-[11px] leading-5 text-[#789078]">Sign in is required to place an order. Multiple couriers available with COD and home/stop-desk delivery options.</p>
          </form>
          <div className="mt-4 space-y-3">
            {cart.tips.map((tip) => (
              <div key={tip.id} className="network-card rounded-2xl p-4">
                <p className="text-sm font-semibold">{tip.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#607060]">{tip.text}</p>
                {tip.href && <Link href={tip.href} className="mt-2 inline-block text-xs font-bold text-[#40533d]">Open →</Link>}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

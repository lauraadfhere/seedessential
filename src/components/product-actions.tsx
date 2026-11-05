"use client";

import { useState } from "react";
import type { Product } from "@/lib/data";
import { Button, cn } from "./ui";
import { HeartIcon } from "./icons";
import { useCart } from "./cart-provider";

const tabs = ["Description", "Specifications", "Care", "Reviews", "Q&A", "Delivery"] as const;
type Tab = (typeof tabs)[number];

const sampleReviews = [
  { name: "Nadia", rating: 5, text: "Arrived healthy and well packed. Already growing!" },
  { name: "Marc", rating: 4, text: "Beautiful plant, slightly smaller than expected but thriving." },
];

const sampleQa = [
  { q: "Is this safe for pets?", a: "Check the specifications — most indoor tropicals are mildly toxic if eaten." },
  { q: "How often should I water it?", a: "See the Care tab; for this item, roughly the interval shown there." },
];

export function ProductActions({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const { addProduct } = useCart();

  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-[#dce5dc] bg-white shadow-[0_8px_24px_rgb(24_35_27_/_0.06)]">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-11 w-11 place-items-center rounded-full text-lg hover:bg-neutral-100"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="grid h-11 w-11 place-items-center rounded-full text-lg hover:bg-neutral-100"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <Button
          href="/cart"
          variant="accent"
          size="lg"
          className="flex-1"
          onClick={(e) => {
            e.preventDefault();
            if (product.inStock) addProduct(product, qty);
          }}
        >
          {product.inStock ? `Add ${qty} to cart` : "Out of stock"}
        </Button>
        <button
          className="grid h-12 w-12 place-items-center rounded-full border border-[#dce5dc] bg-white text-neutral-600 shadow-[0_8px_24px_rgb(24_35_27_/_0.06)] hover:border-foreground hover:text-foreground"
          aria-label="Add to wishlist"
        >
          <HeartIcon className="h-[18px] w-[18px]" />
        </button>
      </div>

      <ProductTabs product={product} />
    </div>
  );
}

function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<Tab>("Description");
  return (
    <div className="network-card rounded-3xl">
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 p-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
              tab === t ? "bg-foreground text-white" : "text-neutral-500 hover:bg-neutral-100",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-6 text-sm leading-relaxed text-neutral-700">
        {tab === "Description" && <p>{product.description}</p>}

        {tab === "Specifications" && (
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {(product.specs ?? []).map((s) => (
              <div key={s.label} className="flex justify-between border-b border-neutral-100 pb-2">
                <dt className="text-neutral-500">{s.label}</dt>
                <dd className="font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {tab === "Care" && (
          <ul className="space-y-3">
            {product.light && <li><strong>Light:</strong> {product.light}</li>}
            {product.climate && <li><strong>Climate:</strong> {product.climate}</li>}
            {product.care && <li><strong>Watering & care:</strong> {product.care}</li>}
            {product.usage && <li><strong>Recommended usage:</strong> {product.usage}</li>}
            {product.difficulty && <li><strong>Difficulty:</strong> {product.difficulty}</li>}
          </ul>
        )}

        {tab === "Reviews" && (
          <div className="space-y-4">
            {sampleReviews.map((r) => (
              <div key={r.name} className="border-b border-neutral-100 pb-4">
                <p className="font-semibold">
                  {r.name} <span className="text-accent">{"★".repeat(r.rating)}</span>
                </p>
                <p className="mt-1 text-neutral-600">{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "Q&A" && (
          <div className="space-y-4">
            {sampleQa.map((item) => (
              <div key={item.q}>
                <p className="font-semibold">Q: {item.q}</p>
                <p className="mt-1 text-neutral-600">A: {item.a}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "Delivery" && (
          <ul className="space-y-2">
            <li>Delivery across Algeria’s 58 wilayas from the seller’s location.</li>
            <li>Standard delivery 2–5 working days (Alger, Oran, Constantine often 48h).</li>
            <li>Plants and equipment shipped together where the same wilaya coverage allows.</li>
            <li>30-day plant health guarantee.</li>
            <li>Easy returns on unopened equipment within 30 days.</li>
          </ul>
        )}
      </div>
    </div>
  );
}

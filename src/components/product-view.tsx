"use client";

import { useEffect, useState } from "react";
import { Link } from "@/components/locale-link";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { ProductActions } from "@/components/product-actions";
import { Badge, Price, Stars } from "@/components/ui";
import type { Product } from "@/lib/data";

export function ProductView({ product, related }: { product: Product; related: Product[] }) {
  const [live, setLive] = useState(product);

  useEffect(() => {
    let active = true;
    fetch("/api/catalog/products", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((catalog: { slug: string; name?: string; images?: string[]; price?: number; priceDzd?: number }[]) => {
        const item = catalog.find((entry) => entry.slug === product.slug);
        if (!active || !item) return;
        setLive({
          ...product,
          name: item.name ?? product.name,
          image: item.images?.[0] ?? (item as { image?: string }).image ?? product.image,
          price: item.price ?? product.price,
          priceDzd: item.priceDzd ?? product.priceDzd,
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [product]);

  const nodes = [
    live.difficulty && { label: "Difficulty", value: live.difficulty },
    live.light && { label: "Light", value: live.light },
    live.climate && { label: "Climate", value: live.climate },
    live.care && { label: "Care", value: live.care },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <main className="network-surface font-haskoy py-8 sm:py-12">
      <div className="section">
        <Link href="/shop" className="text-xs font-bold uppercase tracking-wider text-[#40533d] hover:underline">
          ← Back to shop
        </Link>
        <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-start">
          <ProductGallery product={live} images={live.image ? [live.image] : []} />
          <section className="network-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
            <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-[#40533d]/10 bg-[#40533d]/5" />
            <span className="pointer-events-none absolute bottom-10 right-8 h-px w-20 bg-[#40533d]/15" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="green">{live.kind === "plant" ? "Plant" : "Equipment"}</Badge>
                <Stars rating={live.rating} />
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-brand text-[#638260]">{live.category.replaceAll("-", " ")}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#18231b] sm:text-4xl">{live.name}</h1>
              <p className="mt-4 text-base leading-7 text-[#617061]">{live.short}</p>
              <div className="mt-7 flex items-end justify-between gap-4 border-y border-[#e4ebe3] py-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#789078]">Price</p>
                  <Price value={live.price} dzd={live.priceDzd} className="mt-1 text-2xl text-[#18231b]" />
                </div>
                <span className="rounded-full bg-[#eef3ed] px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  {live.inStock ? "In stock · ready to ship" : "Currently unavailable"}
                </span>
              </div>
              <p className="mt-5 text-sm leading-6 text-[#617061]">{live.description}</p>
              <ProductActions product={live} />
              <Link href="/experts" className="mt-4 block text-center text-sm font-semibold text-[#40533d] hover:underline">
                Need help choosing? Ask an expert →
              </Link>
            </div>
          </section>
        </div>

        {nodes.length > 0 && (
          <div className="relative mt-12">
            <span className="pointer-events-none absolute inset-x-8 top-10 hidden h-px bg-[#40533d]/15 sm:block" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {nodes.map((node) => (
                <div key={node.label} className="network-card relative rounded-[1.5rem] p-5 pt-8">
                  <span className="network-node absolute left-5 top-0 grid h-8 w-8 -translate-y-1/2 place-items-center border border-[#dce5dc] text-[10px] font-bold uppercase tracking-wider text-[#40533d]">
                    ·
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#789078]">{node.label}</p>
                  <p className="mt-2 font-semibold leading-6 text-[#18231b]">{node.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(live.specs ?? []).length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {(live.specs ?? []).slice(0, 3).map((spec) => (
              <div key={spec.label} className="network-card rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#789078]">{spec.label}</p>
                <p className="mt-2 font-semibold text-[#18231b]">{spec.value}</p>
              </div>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-14">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-brand text-[#638260]">Grow the collection</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#18231b]">You may also like</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

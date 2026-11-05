"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/data";
import { cloudinaryImage } from "@/lib/cloudinary-client";
import { ProductVisual } from "./product-card";

/** Interactive product gallery backed by the product's Cloudinary public IDs. */
export function ProductGallery({ product, images }: { product: Product; images: string[] }) {
  const [liveImages, setLiveImages] = useState(images);
  useEffect(() => {
    let active = true;
    fetch("/api/catalog/products", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((catalog: { slug: string; images?: string[]; image?: string }[]) => {
        const item = catalog.find((entry) => entry.slug === product.slug);
        if (active && (item?.images?.length || item?.image)) setLiveImages(item.images?.length ? item.images : [item.image as string]);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [product.slug, images]);
  const media = liveImages.length ? liveImages : product.image ? [product.image] : [];
  const [selected, setSelected] = useState(0);
  const active = media[selected] ?? media[0];
  return (
    <div className="relative space-y-3">
      <span className="pointer-events-none absolute -left-6 top-16 hidden h-20 w-20 rounded-full border border-[#40533d]/15 bg-white/70 shadow-[0_18px_50px_rgb(0_0_0_/_0.08)] lg:block" />
      <span className="pointer-events-none absolute -right-4 bottom-24 hidden h-14 w-14 rounded-full border border-[#40533d]/10 bg-white/80 lg:block" />
      {active ? (
        <div className="network-card relative aspect-square overflow-hidden rounded-[2rem] bg-[#eef3ed]">
          <Image src={cloudinaryImage(active, { width: 1200, height: 1200 })} alt={product.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
      ) : (
        <ProductVisual product={product} className="network-card aspect-square rounded-[2rem]" />
      )}
      {media.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {media.map((image, index) => (
            <button
              key={image}
              onClick={() => setSelected(index)}
              aria-label={`Show image ${index + 1}`}
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 shadow-[0_8px_24px_rgb(24_35_27_/_0.08)] transition ${index === selected ? "border-[#40533d] scale-[1.02]" : "border-transparent hover:border-[#9eb19b]"}`}
            >
              <Image src={cloudinaryImage(image, { width: 240, height: 240 })} alt="" fill sizes="25vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

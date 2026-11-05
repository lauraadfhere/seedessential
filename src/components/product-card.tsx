import Image from "next/image";
import { Link } from "./locale-link";
import type { Product } from "@/lib/data";
import { cloudinaryImage } from "@/lib/cloudinary-client";
import { Badge, Price, Stars, cn, initials } from "./ui";
import { LeafMark } from "./icons";
import { AddToCartButton } from "./add-to-cart-button";

type ProductVisualProduct = Pick<Product, "slug" | "name" | "kind" | "category" | "price" | "image"> & Partial<Pick<Product, "tint" | "inStock" | "featured">>;

export function ProductVisual({
  product,
  className,
}: {
  product: ProductVisualProduct;
  className?: string;
}) {
  // Add watermark only for plant images
  const useWatermark = product.kind === "plant" && Boolean(product.image);
  
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden bg-gradient-to-br",
        product.tint,
        className,
      )}
    >
      {product.image ? (
        <Image
          src={cloudinaryImage(product.image, { 
            width: 640, 
            height: 640,
            watermark: useWatermark 
          })}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_70%_22%,rgb(255_255_255_/_0.9),transparent_34%),linear-gradient(135deg,#f4f7f2,#dfe9dc)] text-[#40533d]">
          <LeafMark className="absolute -right-8 -top-8 h-40 w-40 rotate-12 text-[#40533d]/10" />
          <LeafMark className="absolute -bottom-12 -left-8 h-44 w-44 -rotate-12 text-[#40533d]/10" />
          <div className="relative grid h-24 w-24 place-items-center rounded-full border border-[#40533d]/20 bg-white/60 shadow-sm backdrop-blur-sm">
            <span className="text-2xl font-semibold tracking-wide text-[#40533d]/75 sm:text-3xl">{initials(product.name)}</span>
          </div>
        </div>
      )}
      {product.inStock === false && (
        <span className="absolute left-3 top-3">
          <Badge tone="dark">Out of stock</Badge>
        </span>
      )}
      {product.featured && product.inStock && (
        <span className="absolute left-3 top-3">
          <Badge tone="green">Popular</Badge>
        </span>
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="depth-card font-barlow group flex flex-col overflow-hidden">
      <Link href={`/shop/${product.slug}`} className="flex flex-1 flex-col">
        <ProductVisual product={product} className="aspect-square" />
        <div className="flex flex-1 flex-col p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {product.kind === "plant" ? "Plant" : "Equipment"}
            </span>
            <Stars rating={product.rating} />
          </div>
          <h3 className="mt-1.5 font-semibold leading-snug group-hover:text-accent-strong">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{product.short}</p>
          <div className="mt-4 flex items-center justify-between">
            <Price value={product.price} dzd={product.priceDzd} className="text-lg" />
            <span className="text-sm font-semibold text-neutral-400 transition group-hover:text-accent-strong">
              View →
            </span>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <AddToCartButton product={product} className="w-full rounded-md bg-[#40533d] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-40" label={product.inStock ? "Add to cart" : "Out of stock"} />
      </div>
    </div>
  );
}

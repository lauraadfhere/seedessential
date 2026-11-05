"use client";

import { useEffect, useState } from "react";
import { Link } from "@/components/locale-link";
import { PageHero } from "@/components/page-hero";
import { RequireAuth } from "@/components/require-auth";
import { Badge, Button, Price } from "@/components/ui";
import { ProductVisual } from "@/components/product-card";
import { useCart } from "@/components/cart-provider";

type WishlistItem = {
  id: string;
  product: {
    id: string;
    slug: string;
    name: string;
    kind: "plant" | "equipment";
    price: number;
    priceDzd?: number;
    shortDescription: string;
    category: string;
    images: string[];
  } | null;
  createdAt: string;
};

function WishlistBody() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const cart = useCart();

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    try {
      const response = await fetch("/api/wishlist");
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWishlist(productId: string) {
    setRemoving(productId);
    try {
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWishlist((prev) => prev.filter((item) => item.product?.id !== productId));
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    } finally {
      setRemoving(null);
    }
  }

  function addToCart(item: WishlistItem) {
    if (!item.product) return;
    cart.addProduct({
      slug: item.product.slug,
      name: item.product.name,
      kind: item.product.kind,
      category: item.product.category,
      price: item.product.price,
      priceDzd: item.product.priceDzd,
      image: item.product.images?.[0],
    });
  }

  if (loading) {
    return (
      <main className="network-surface font-barlow">
        <div className="section py-20">Loading your wishlist…</div>
      </main>
    );
  }

  return (
    <main className="network-surface font-barlow">
      <PageHero
        eyebrow="Your wishlist"
        title="Saved plants & equipment"
        text="Keep track of products you want to add to your garden. Move items to cart when you're ready to grow."
      />

      <section className="section py-10">
        {wishlist.length === 0 ? (
          <div className="network-card rounded-[1.75rem] p-12 text-center">
            <p className="text-lg font-semibold">Your wishlist is empty</p>
            <p className="mt-2 text-sm text-[#607060]">
              Save plants and equipment you're interested in by clicking the heart icon on product pages.
            </p>
            <Button href="/shop" shape="rect" className="mt-6">
              Browse the shop
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((item) => {
              if (!item.product) return null;
              return (
                <div
                  key={item.id}
                  className="network-card rounded-[1.75rem] p-6"
                >
                  <div className="flex justify-between">
                    <Badge tone={item.product.kind === "plant" ? "green" : "neutral"}>
                      {item.product.kind}
                    </Badge>
                    <button
                      onClick={() => removeFromWishlist(item.product!.id)}
                      disabled={removing === item.product!.id}
                      className="text-xs font-bold uppercase tracking-wider text-red-700 disabled:opacity-50"
                    >
                      {removing === item.product!.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                  
                  <div className="mt-4 aspect-square overflow-hidden rounded-2xl bg-[#eef3ed]">
                    <ProductVisual product={item.product} className="h-full" />
                  </div>

                  <Link
                    href={`/shop/${item.product.slug}`}
                    className="mt-4 block font-semibold hover:text-accent-strong"
                  >
                    {item.product.name}
                  </Link>
                  
                  <p className="mt-1 text-xs uppercase tracking-wider text-[#789078]">
                    {item.product.category}
                  </p>
                  
                  <Price
                    value={item.product.price}
                    dzd={item.product.priceDzd}
                    className="mt-2 block"
                  />

                  <Button
                    onClick={() => addToCart(item)}
                    shape="rect"
                    className="mt-4 w-full"
                  >
                    Add to cart
                  </Button>

                  <p className="mt-3 text-xs text-neutral-500">
                    Saved {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function WishlistPage() {
  return (
    <RequireAuth loadingLabel="Loading your wishlist…">
      <WishlistBody />
    </RequireAuth>
  );
}
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/components/locale-link";
import { categories, type CategoryKind, type Product } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { Badge, Button, cn } from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import { mergeLiveCatalog } from "@/lib/catalog";

type Sort = "featured" | "price-asc" | "price-desc" | "rating";

function ShopContent() {
  const params = useSearchParams();
  const initialKind = (params.get("kind") as CategoryKind | null) ?? "all";
  const initialCategory = params.get("category") ?? "all";

  const [kind, setKind] = useState<CategoryKind | "all">(initialKind);
  const [category, setCategory] = useState<string>(initialCategory);
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [sort, setSort] = useState<Sort>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [catalog, setCatalog] = useState<Product[] | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("focusSearch") === "1") searchRef.current?.focus();
  }, [params]);

  useEffect(() => {
    let active = true;
    fetch("/api/catalog/products", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((catalog: Product[]) => {
        if (active) setCatalog(catalog);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const liveProducts = useMemo(() => mergeLiveCatalog(catalog), [catalog]);

  const visibleCategories = categories.filter(
    (c) => kind === "all" || c.kind === kind,
  );

  const results = useMemo(() => {
    let list = liveProducts.filter((p) => {
      if (kind !== "all" && p.kind !== kind) return false;
      if (category !== "all" && p.category !== category) return false;
      if (inStockOnly && !p.inStock) return false;
      if (query && !`${p.name} ${p.short}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        default:
          return Number(b.featured ?? 0) - Number(a.featured ?? 0);
      }
    });
    return list;
  }, [kind, category, query, sort, inStockOnly, liveProducts]);

  return (
    <main className="section py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-brand text-accent">
            Marketplace
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Shop</h1>
          <p className="mt-2 text-neutral-600">
            Plants, seeds and gardening equipment — delivered together.
          </p>
        </div>
        <div className="flex w-full max-w-sm items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2.5">
          <SearchIcon className="h-4 w-4 text-neutral-400" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plants & equipment"
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Kind tabs */}
      <div className="mt-6 flex gap-2">
        {(
          [
            ["all", "All"],
            ["plant", "Plants"],
            ["equipment", "Equipment"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setKind(value);
              setCategory("all");
            }}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
              kind === value
                ? "bg-foreground text-white"
                : "border border-neutral-200 bg-white hover:border-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar filters */}
        <aside className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold">Categories</h2>
            <div className="mt-3 flex flex-col gap-1">
              <button
                onClick={() => setCategory("all")}
                className={cn(
                  "rounded-xl px-3 py-2 text-left text-sm transition",
                  category === "all"
                    ? "bg-accent-soft font-semibold text-accent-strong"
                    : "text-neutral-600 hover:bg-neutral-100",
                )}
              >
                All categories
              </button>
              {visibleCategories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCategory(c.slug)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                    category === c.slug
                      ? "bg-accent-soft font-semibold text-accent-strong"
                      : "text-neutral-600 hover:bg-neutral-100",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-6">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              In stock only
            </label>
          </div>

          <div className="rounded-2xl bg-accent-soft p-5">
            <p className="font-semibold text-accent-strong">Not sure what to buy?</p>
            <p className="mt-1 text-sm text-neutral-600">
              Answer 5 questions and we&apos;ll build your list.
            </p>
            <Button href="/discover" shape="rect" className="mt-4 w-full">
              Find the right plant
            </Button>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              {results.length} product{results.length !== 1 && "s"}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-neutral-500">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-neutral-300 p-12 text-center">
              <p className="font-semibold">No products match your filters</p>
              <p className="mt-1 text-sm text-neutral-500">
                Try clearing filters or searching something else.
              </p>
              <Button
                href="/shop"
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setKind("all");
                  setCategory("all");
                  setQuery("");
                  setInStockOnly(false);
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-2">
            <Badge tone="green">Delivery across 58 wilayas</Badge>
            <Badge>30-day plant guarantee</Badge>
            <Link href="/experts" className="ml-auto text-sm font-semibold text-accent-strong hover:underline">
              Need advice? Ask an expert →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="section py-20 text-neutral-500">Loading shop…</div>}>
      <ShopContent />
    </Suspense>
  );
}

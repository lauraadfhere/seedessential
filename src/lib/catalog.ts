import { products, type Product } from "@/lib/data";

export function mergeLiveCatalog(live: Product[] | null | undefined): Product[] {
  if (!live?.length) return products;
  const bySlug = new Map(live.map((item) => [item.slug, item]));
  const seeded = products
    .filter((item) => bySlug.has(item.slug))
    .map((item) => {
      const next = bySlug.get(item.slug)!;
      return {
        ...item,
        name: next.name ?? item.name,
        image: next.image ?? item.image,
        price: next.price ?? item.price,
        priceDzd: next.priceDzd ?? item.priceDzd,
        featured: next.featured ?? item.featured,
        inStock: next.inStock ?? item.inStock,
        short: next.short ?? item.short,
      };
    });
  const extra = live.filter((item) => !products.some((source) => source.slug === item.slug));
  return [...seeded, ...extra];
}

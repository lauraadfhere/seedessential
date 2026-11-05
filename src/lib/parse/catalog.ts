import "server-only";

import type Parse from "parse/node";
import { categories, products, type Product } from "@/lib/data";
import { getParseAdmin } from "./admin";

export type VisibilityStatus = "published" | "pending" | "rejected";

export type CatalogRecord = {
  slug: string;
  name: string;
  kind: "plant" | "equipment";
  category: string;
  price: number;
  priceDzd?: number;
  images: string[];
  featured: boolean;
  inStock: boolean;
  short: string;
  description: string;
  rating: number;
  reviews: number;
  availableForExpertRequests: boolean;
  visibilityStatus: VisibilityStatus;
  providerName?: string;
  providerId?: string;
  originWilaya?: string;
  coverageWilayas?: string[];
};

export function visibilityOf(item?: Parse.Object | null): VisibilityStatus {
  const status = item?.get("visibilityStatus") as VisibilityStatus | undefined;
  if (status === "pending" || status === "rejected" || status === "published") return status;
  return "published";
}

export function slugifyProduct(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "equipment";
  return `${base}-${Date.now().toString(36)}`;
}

export async function getOrCreateCategory(categorySlug: string) {
  const Parse = getParseAdmin();
  const existing = await new Parse.Query("Category").equalTo("slug", categorySlug).first({ useMasterKey: true });
  if (existing) return existing;
  const source = categories.find((item) => item.slug === categorySlug);
  if (!source) throw new Error("Unknown category");
  const category = new (Parse.Object.extend("Category"))();
  category.set({ name: source.name, slug: source.slug, kind: source.kind });
  await category.save(null, { useMasterKey: true });
  return category;
}

export function serializeProduct(source: Product | undefined, item?: Parse.Object | null): CatalogRecord {
  const category = item?.get("category");
  const provider = item?.get("provider");
  return {
    slug: item?.get("slug") ?? source?.slug ?? "",
    name: item?.get("name") ?? source?.name ?? "",
    kind: (item?.get("kind") ?? source?.kind ?? "equipment") as "plant" | "equipment",
    category: category?.get?.("slug") ?? source?.category ?? "tools",
    price: item?.get("price") ?? source?.price ?? 0,
    priceDzd: item?.get("priceDZD") ?? source?.priceDzd,
    images: item?.get("images") ?? (source?.image ? [source.image] : []),
    featured: item?.get("featured") ?? Boolean(source?.featured),
    inStock: item?.get("inStock") ?? source?.inStock ?? true,
    short: item?.get("shortDescription") ?? source?.short ?? "",
    description: item?.get("description") ?? source?.description ?? "",
    rating: item?.get("rating") ?? source?.rating ?? 0,
    reviews: item?.get("reviewsCount") ?? source?.reviews ?? 0,
    availableForExpertRequests: item?.get("availableForExpertRequests") ?? source?.kind === "plant",
    visibilityStatus: visibilityOf(item),
    providerName: item?.get("companyName") || undefined,
    providerId: provider?.id,
    originWilaya: item?.get("originWilaya") || undefined,
    coverageWilayas: item?.get("coverageWilayas") || [],
  };
}

export function toShopProduct(record: CatalogRecord): Product & { images: string[] } {
  const source = products.find((item) => item.slug === record.slug);
  return {
    slug: record.slug,
    name: record.name,
    category: record.category,
    kind: record.kind,
    price: record.price,
    priceDzd: record.priceDzd,
    rating: record.rating || source?.rating || 4.6,
    reviews: record.reviews || source?.reviews || 0,
    tint: source?.tint ?? "from-neutral-100 to-neutral-200",
    image: record.images[0],
    images: record.images,
    short: record.short || source?.short || "Gardening equipment for growers.",
    description: record.description || source?.description || record.short,
    inStock: record.inStock,
    featured: record.featured,
    specs: source?.specs,
    difficulty: source?.difficulty,
    light: source?.light,
    climate: source?.climate,
    care: source?.care,
    usage: source?.usage,
  };
}

export async function loadStoredProducts() {
  const Parse = getParseAdmin();
  const stored = await new Parse.Query("Product").include("category").include("provider").limit(1000).find({ useMasterKey: true });
  return stored;
}

/** Every published product (seeded catalogue merged with stored overrides and provider listings). */
export async function loadPublishedCatalog() {
  const stored = await loadStoredProducts();
  const bySlug = new Map(stored.map((item) => [item.get("slug") as string, item]));
  const seeded = products
    .map((source) => ({ record: serializeProduct(source, bySlug.get(source.slug)), object: bySlug.get(source.slug) }))
    .filter((item) => item.record.visibilityStatus === "published");
  const extra = stored
    .filter((item) => !products.some((source) => source.slug === item.get("slug")) && visibilityOf(item) === "published")
    .map((item) => ({ record: serializeProduct(undefined, item), object: item as Parse.Object | undefined }));
  return [...seeded, ...extra];
}

export async function getOrCreateSeededProduct(slug: string) {
  const Parse = getParseAdmin();
  const existing = await new Parse.Query("Product").equalTo("slug", slug).include("category").first({ useMasterKey: true });
  if (existing) return existing;
  const source = products.find((item) => item.slug === slug);
  if (!source) throw new Error("Unknown product");
  const product = new (Parse.Object.extend("Product"))();
  product.set({
    name: source.name,
    slug: source.slug,
    kind: source.kind,
    category: await getOrCreateCategory(source.category),
    price: source.price,
    currency: "USD",
    rating: source.rating,
    reviewsCount: source.reviews,
    shortDescription: source.short,
    description: source.description,
    inStock: source.inStock,
    featured: Boolean(source.featured),
    images: source.image ? [source.image] : [],
    availableForExpertRequests: source.kind === "plant",
    visibilityStatus: "published",
  });
  await product.save(null, { useMasterKey: true });
  return product;
}

export function applyMedia(product: Parse.Object, body: Record<string, unknown>) {
  if (typeof body.imagePublicId === "string" && /^tannelli\/products\//.test(body.imagePublicId)) {
    product.addUnique("images", body.imagePublicId);
  }
  if (typeof body.removeImagePublicId === "string") product.remove("images", body.removeImagePublicId);
  if (typeof body.coverImagePublicId === "string") {
    const images = (product.get("images") ?? []) as string[];
    if (images.includes(body.coverImagePublicId)) product.set("images", [body.coverImagePublicId, ...images.filter((image) => image !== body.coverImagePublicId)]);
  }
}

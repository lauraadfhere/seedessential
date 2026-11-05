import { notFound } from "next/navigation";
import { ProductView } from "@/components/product-view";
import { products } from "@/lib/data";
import { loadStoredProducts, serializeProduct, toShopProduct, visibilityOf } from "@/lib/parse/catalog";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export const dynamicParams = true;

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const source = products.find((item) => item.slug === slug);
  let product = source ?? null;
  try {
    const stored = await loadStoredProducts();
    const item = stored.find((entry) => entry.get("slug") === slug);
    if (item && visibilityOf(item) !== "published") notFound();
    if (item) product = toShopProduct(serializeProduct(source, item));
  } catch {
    product = source ?? null;
  }
  if (!product) notFound();
  const related = products.filter((item) => item.kind === product.kind && item.slug !== product.slug).slice(0, 4);
  return <ProductView product={product} related={related} />;
}

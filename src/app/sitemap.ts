import type { MetadataRoute } from "next";
import { products, experts, guides } from "@/lib/data";
import { LOCALES } from "@/lib/locales";
const site = "https://tannelli.com";
const pages = ["", "/shop", "/discover", "/experts", "/planner", "/learn", "/assistant", "/business", "/about", "/contact"];
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = LOCALES.flatMap(({ code }) => pages.map((path) => ({ url: `${site}/${code}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : path === "/shop" || path === "/experts" ? 0.9 : 0.7 })));
  const localized = (path: string, priority = 0.8) => LOCALES.map(({ code }) => ({ url: `${site}/${code}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority }));
  return [...staticPages, ...products.flatMap((product) => localized(`/shop/${product.slug}`)), ...experts.flatMap((expert) => localized(`/experts/${expert.slug}`, 0.75)), ...guides.flatMap((guide) => localized(`/learn/${guide.slug}`, 0.7))];
}

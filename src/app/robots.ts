import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/en/dashboard", "/fr/dashboard", "/ar/dashboard", "/en/sign-in", "/fr/sign-in", "/ar/sign-in", "/en/sign-up", "/fr/sign-up", "/ar/sign-up", "/en/forgot-password", "/fr/forgot-password", "/ar/forgot-password"] }, sitemap: "https://tannelli.com/sitemap.xml", host: "https://tannelli.com" };
}

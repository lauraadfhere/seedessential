import type { Metadata } from "next";
import { Geist_Mono, Open_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const simplon = localFont({
  src: "../fonts/SimplonNorm-Regular-WebXL.ttf",
  variable: "--font-simplon",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tannelli.com"),
  title: {
    default: "seed — Plants, equipment & expert solutions",
    template: "%s · seed",
  },
  description:
    "seed is an agriculture marketplace connecting farmers, home growers, agricultural experts and equipment merchants. Shop plants and tools, book expert advice, and plan your farm.",
  keywords: [
    "seed",
    "agriculture marketplace",
    "plants",
    "farming equipment",
    "agricultural experts",
    "irrigation",
    "farm planner",
    "Algeria agriculture",
    "grower platform",
  ],
  openGraph: {
    title: "seed — Plants, equipment & expert solutions",
    description:
      "Shop plants and equipment, book agricultural experts, and plan your farm — all in one place.",
    type: "website",
    url: "https://tannelli.com",
    siteName: "seed",
  },
  twitter: {
    card: "summary",
    title: "seed — Plants, equipment & expert solutions",
    description: "Shop plants and equipment, book agricultural experts, and plan your farm.",
  },
  alternates: { canonical: "/en", languages: { en: "/en", fr: "/fr", ar: "/ar" } },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  icons: { icon: [{ url: "/seed.png", type: "image/png" }, { url: "/favicon-512.png", type: "image/png", sizes: "512x512" }], apple: [{ url: "/seed.png", sizes: "180x180", type: "image/png" }] },
  manifest: "/site.webmanifest",
};

// Locale (<html lang/dir>), header and footer are handled per-locale in
// `src/app/[locale]/layout.tsx` — this root layout only owns the document
// shell, fonts and global styles.
export default function RootLayout({ children }: LayoutProps<"/">) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "seed",
        alternateName: ["Expertseed", "Tannelli"],
        url: "https://tannelli.com",
        logo: "https://tannelli.com/seed.png",
        description: "Agriculture marketplace for plants, equipment, expert consultations and farm planning.",
      },
      {
        "@type": "WebSite",
        name: "seed",
        url: "https://tannelli.com",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://tannelli.com/en/shop?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
  return (
    <html lang="en" className={`${openSans.variable} ${geistMono.variable} ${simplon.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />{children}</body>
    </html>
  );
}

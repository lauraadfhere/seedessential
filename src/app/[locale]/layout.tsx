import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/lib/locales";
import { LocaleEffects } from "@/components/locale-effects";
import { AppChrome } from "@/components/app-chrome";
import type { Metadata } from "next";

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { alternates: { canonical: `/${locale}`, languages: { en: "/en", fr: "/fr", ar: "/ar" } } };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const localeConfig = LOCALES.find((entry) => entry.code === locale)!;

  return (
    <div lang={locale} dir={localeConfig.dir} className="flex min-h-full flex-1 flex-col">
      <LocaleEffects locale={locale} />
      <AppChrome>{children}</AppChrome>
    </div>
  );
}

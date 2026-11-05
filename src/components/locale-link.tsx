"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import { forwardRef } from "react";
import type { ComponentProps } from "react";
import { DEFAULT_LOCALE, isLocale } from "@/lib/locales";

type NextLinkProps = ComponentProps<typeof NextLink>;

function withLocale(href: string, locale: string) {
  if (/^([a-z]+:)?\/\//i.test(href) || href.startsWith("#") || href.startsWith("mailto:")) {
    return href;
  }
  if (!href.startsWith("/")) return href;
  if (href === "/") return `/${locale}`;
  return `/${locale}${href}`;
}

/**
 * Drop-in replacement for `next/link` that automatically prefixes internal
 * hrefs with the current locale segment (e.g. `/shop` -> `/en/shop`).
 * Every internal link in the app should import `Link` from here instead of
 * `next/link` so locale-prefixed routing stays consistent everywhere.
 */
export const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(function Link(
  { href, ...props },
  ref,
) {
  const params = useParams();
  const rawLocale = params?.locale;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const finalHref = typeof href === "string" ? withLocale(href, locale) : href;

  return <NextLink ref={ref} href={finalHref} {...props} />;
});

export default Link;

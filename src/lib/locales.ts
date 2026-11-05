// Server-safe locale metadata. Kept out of `i18n.tsx` (which is a client
// module) because exporting plain constants from a "use client" file makes
// them unusable when imported into Server Components.

export type Locale = "en" | "fr" | "ar";

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALES: { code: Locale; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "EN", dir: "ltr" },
  { code: "fr", label: "FR", dir: "ltr" },
  { code: "ar", label: "AR", dir: "rtl" },
];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.some((l) => l.code === value);
}

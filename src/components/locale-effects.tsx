"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/locales";
import { LOCALES } from "@/lib/locales";

/** Syncs <html lang/dir> with the active URL locale. */
export function LocaleEffects({ locale }: { locale: Locale }) {
  useEffect(() => {
    const dir = LOCALES.find((l) => l.code === locale)?.dir ?? "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  return null;
}

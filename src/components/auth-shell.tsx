"use client";

import { Link } from "./locale-link";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { useI18n } from "@/lib/i18n";
import type { ReactNode } from "react";

/** Slim banking-style chrome for sign-in / sign-up / password recovery. */
export function AuthShell({
  children,
  trustKey = "auth.trustEnroll",
  darkHeader = false,
}: {
  children: ReactNode;
  trustKey?: string;
  darkHeader?: boolean;
}) {
  const { t, dir } = useI18n();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f4f7f2]" dir={dir}>
      <header className="sticky top-0 z-50 bg-[#40533d] text-white shadow-[0_6px_20px_rgb(24_35_27_/_0.18)]">
        <div className="relative mx-auto flex max-w-5xl items-center justify-center px-4 py-3 sm:py-4">
          <Logo />
          <div className={dir === "rtl" ? "absolute start-4 top-1/2 -translate-y-1/2 sm:start-6" : "absolute end-4 top-1/2 -translate-y-1/2 sm:end-6"}>
            <LanguageSwitcher variant="icon" compact />
          </div>
        </div>
      </header>
      {darkHeader ? (
        <div className="border-b border-[#dce5dc] bg-white px-4 py-2 text-center text-[11px] leading-relaxed text-neutral-600">
          {t(trustKey)}
        </div>
      ) : (
        <div className="border-b border-[#dce5dc] bg-white px-4 py-2 text-center text-[11px] leading-relaxed text-neutral-600">
          {t("auth.trustStrip")}
        </div>
      )}
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="border-t border-[#dce5dc] bg-white px-4 py-4 text-center text-xs text-neutral-500">
        <Link href="/" className="font-semibold text-[#40533d] hover:underline">{t("auth.home")}</Link>
        <span className="mx-2 text-neutral-300">·</span>
        <Link href="/contact" className="hover:underline">{t("auth.help")}</Link>
        <span className="mx-2 text-neutral-300">·</span>
        <Link href="/about" className="hover:underline">{t("auth.privacy")}</Link>
      </footer>
    </div>
  );
}

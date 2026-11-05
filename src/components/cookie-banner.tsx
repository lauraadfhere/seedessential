"use client";

import { useEffect, useState } from "react";
import { Link } from "./locale-link";
import { buttonClasses } from "./ui";
import { useI18n } from "@/lib/i18n";

const CONSENT_COOKIE = "tannelli_cookie_consent";

function readConsent(): "accepted" | "rejected" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return (match?.[1] as "accepted" | "rejected" | undefined) ?? null;
}

function writeConsent(value: "accepted" | "rejected") {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export function CookieBanner() {
  const { t, dir } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
  }, []);

  function decide(value: "accepted" | "rejected") {
    writeConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6" role="dialog" aria-live="polite" aria-label={t("cookie.title")}>
      <div className="pointer-events-auto relative mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/20 bg-[#40533d] text-white shadow-[0_24px_60px_rgb(24_35_27_/_0.32)]">
        <span className="pointer-events-none absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border border-white/25 bg-white/10" />
        <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full border border-white/20 bg-white/5" />
        <span className="pointer-events-none absolute bottom-4 right-28 h-px w-24 bg-white/25" />
        <div className="relative flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="max-w-2xl">
            <p className="font-simplon text-sm font-semibold tracking-[0.04em]">{t("cookie.title")}</p>
            <p className="font-simplon mt-1 text-sm leading-relaxed tracking-[0.02em] text-white/75">
              {t("cookie.description")}{" "}
              <Link href="/about" className="underline decoration-white/40 underline-offset-2 hover:text-white">
                {t("cookie.manage")}
              </Link>
            </p>
          </div>
          <div className={`flex shrink-0 gap-2 ${dir === "rtl" ? "sm:flex-row-reverse" : ""}`}>
            <button onClick={() => decide("rejected")} className={buttonClasses({ variant: "outline-dark", shape: "rect" })}>
              {t("cookie.reject")}
            </button>
            <button onClick={() => decide("accepted")} className={buttonClasses({ variant: "light", shape: "rect" })}>
              {t("cookie.accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

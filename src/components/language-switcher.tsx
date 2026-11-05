"use client";

import { ChevronDownIcon, GlobeIcon } from "./icons";
import { LOCALES, useI18n } from "@/lib/i18n";
import { cn } from "./ui";
import { useEffect, useRef, useState } from "react";

const fullNames: Record<string, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

/** Language selector. Use `variant="icon"` for a simple globe control (auth pages). */
export function LanguageSwitcher({
  className,
  compact = false,
  variant = "default",
}: {
  className?: string;
  compact?: boolean;
  variant?: "default" | "icon";
}) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isIcon = variant === "icon";

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("auth.language")}
        title={t("auth.language")}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          isIcon
            ? cn(
                "grid h-10 w-10 place-items-center rounded-full border transition",
                compact
                  ? "border-white/40 text-white hover:bg-white/10"
                  : "border-neutral-300 bg-white text-[#40533d] hover:bg-neutral-50",
              )
            : cn(
                "border border-neutral-200 bg-white text-neutral-900",
                compact
                  ? "!flex h-8 shrink-0 items-center gap-1 rounded-md !border-white/40 !bg-transparent px-1.5 !text-white"
                  : "flex min-w-[9.5rem] flex-col items-start gap-0.5 rounded-2xl px-4 py-2",
              ),
        )}
      >
        {isIcon ? (
          <GlobeIcon className="h-5 w-5" />
        ) : compact ? (
          <>
            <GlobeIcon className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-bold leading-none">{locale.toUpperCase()}</span>
            <ChevronDownIcon className="h-3 w-3 shrink-0" />
          </>
        ) : (
          <>
            <span className="text-[10px] font-medium text-neutral-500">{t("auth.language")}</span>
            <span className="flex w-full items-center gap-2 text-sm font-medium">
              <GlobeIcon className="h-4 w-4 shrink-0" />
              {fullNames[locale]}
              <ChevronDownIcon className="ml-auto h-4 w-4 shrink-0" />
            </span>
          </>
        )}
      </button>
      <div
        role="menu"
        className={cn(
          "absolute top-full z-20 mt-2 flex min-w-[9.5rem] flex-col overflow-visible rounded-xl bg-white text-sm text-neutral-900 shadow-lg transition before:absolute before:-top-1 before:h-2 before:w-2 before:rotate-45 before:bg-white",
          "right-0 before:right-4",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        {LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            role="menuitem"
            onClick={() => {
              setLocale(l.code);
              setOpen(false);
            }}
            className={cn("px-4 py-2.5 text-left hover:bg-neutral-100", locale === l.code && "font-semibold text-[#40533d]")}
          >
            {fullNames[l.code]}
          </button>
        ))}
      </div>
    </div>
  );
}

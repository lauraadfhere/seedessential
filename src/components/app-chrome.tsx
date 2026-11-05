"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "./site-header";
import { AudienceHeader } from "./audience-header";
import { SiteFooter } from "./site-footer";
import { CookieBanner } from "./cookie-banner";
import { CartProvider } from "./cart-provider";
import { CartSidebar } from "./cart-sidebar";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdmin = /\/admin(\/|$|\?)/.test(pathname);
  const isDashboard = /\/dashboard(\/|$|\?)/.test(pathname);
  const isAuth = /\/(sign-in|sign-up|forgot-password)(\/|$|\?)/.test(pathname);
  const isHome = /^\/(en|fr|ar)\/?$/.test(pathname);
  const [cartOpen, setCartOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <CartProvider>
      {!isAdmin && !isAuth && !isDashboard && (isHome ? <SiteHeader onCartClick={() => setCartOpen(true)} /> : <AudienceHeader onCartClick={() => setCartOpen(true)} />)}
      <div className="flex-1">{children}</div>
      {!isAdmin && !isAuth && !isDashboard && <SiteFooter />}
      {!isAdmin && !isAuth && !isDashboard && <CookieBanner />}
      {!isAdmin && !isAuth && !isDashboard && showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={t("scroll.top")}
          title={t("scroll.top")}
          className="fixed bottom-5 right-5 z-[55] grid h-11 w-11 place-items-center rounded-full bg-[#40533d] text-white shadow-lg transition hover:bg-[#1f3a1c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9ad83a] sm:bottom-6 sm:right-6"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </CartProvider>
  );
}

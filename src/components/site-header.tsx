"use client";

import { Link } from "./locale-link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { Button, cn } from "./ui";
import { CloseIcon, LinkedInIcon, SearchIcon } from "./icons";
import { CartLink } from "./cart-link";
import { AccountMenu, NotificationBell, useAccount, workspaceFor } from "./header-parts";
import { useI18n } from "@/lib/i18n";

const publicNav = [
  { key: "nav.shop", href: "/shop" },
  { key: "nav.experts", href: "/experts" },
  { key: "nav.planner", href: "/planner" },
  { key: "nav.learn", href: "/learn" },
];

const signedInNav = [
  ...publicNav,
  { key: "nav.projects", href: "/dashboard" },
];

interface SiteHeaderProps {
  onCartClick?: () => void;
}

export function SiteHeader({ onCartClick }: SiteHeaderProps) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { account, summary, setAccount } = useAccount(pathname);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]);
  const active = (href: string) => pathname === `/${locale}${href}` || pathname.startsWith(`/${locale}${href}/`);
  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const term = query.trim(); router.push(`/${locale}/shop${term ? `?q=${encodeURIComponent(term)}` : "?focusSearch=1"}`); setSearchOpen(false); }
  const workspace = workspaceFor(account?.role);
  const nav = account ? [...signedInNav, { key: workspace.label, href: workspace.href.split("?")[0] }] : publicNav;

  return <header className="sticky top-0 z-50 bg-[#40533d] text-white">
    <div className="section grid h-[5.25rem] grid-cols-[1fr_auto_1fr] items-center gap-3">
      <button onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="site-menu" className="flex w-fit items-center gap-2 rounded-full border border-white/35 px-3 py-2 text-sm font-semibold transition hover:border-white hover:bg-white/10">
        <span className="relative block h-4 w-5" aria-hidden="true"><span className={cn("absolute left-0 top-0 h-px w-5 bg-white transition-transform duration-300", open && "top-2 rotate-45")}/><span className={cn("absolute left-0 top-2 h-px w-5 bg-white transition-opacity duration-200", open && "opacity-0")}/><span className={cn("absolute bottom-0 left-0 h-px w-5 bg-white transition-transform duration-300", open && "bottom-[7px] -rotate-45")}/></span><span className="hidden sm:inline">{open ? t("menu.close") : t("menu.open")}</span>
      </button>
      <Logo className="justify-self-center" />
      <div className="flex justify-self-end items-center gap-1 sm:gap-2">
        <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label={t("header.linkedin")} className="hidden rounded-full p-2.5 text-white/80 transition hover:bg-white/10 hover:text-white sm:block"><LinkedInIcon className="h-[18px] w-[18px]" /></a>
        <button onClick={() => { setSearchOpen(true); setOpen(false); }} aria-label={t("header.search")} className="rounded-full p-2.5 text-white/80 transition hover:bg-white/10 hover:text-white"><SearchIcon className="h-[19px] w-[19px]" /></button>
        <CartLink className="hidden h-auto w-auto p-2.5 sm:grid" onClick={onCartClick} />
        <LanguageSwitcher compact className="block shrink-0" />
        {account && <NotificationBell account={account} summary={summary} />}
        {account ? <AccountMenu account={account} summary={summary} onSignedOut={() => setAccount(null)} size="sm" /> : <Link href="/sign-in" className="hidden text-xs font-bold text-white sm:block">{t("account.signIn")}</Link>}
        <Button href={account ? workspace.cta.href : "/discover"} variant="outline-dark" shape="pill" className="hidden border-white/70 px-4 py-2 text-[11px] sm:inline-flex">{account ? workspace.cta.label : t("cta.primary")}</Button>
      </div>
    </div>
    <div id="site-menu" className={cn("grid overflow-hidden bg-[#334532] transition-[grid-template-rows] duration-300", open ? "grid-rows-[1fr] border-t border-white/15" : "grid-rows-[0fr]")}>
      <div className="min-h-0 max-h-[calc(100dvh-5.25rem)] overflow-y-auto [scrollbar-gutter:stable]"><nav className="section grid gap-1 py-5 md:grid-cols-[1fr_auto]"><div className="flex flex-col">{nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-wider transition", active(item.href) ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}>{t(item.key)}</Link>)}{account ? <><Link href="/profile" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-wider text-white/70">{t("account.profile")}</Link><Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-wider text-white/70">{t("account.dashboard")}</Link></> : <Link href="/sign-in" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-wider text-white/70 transition hover:bg-white/10 hover:text-white">{t("account.signIn")}</Link>}</div><div className="mt-4 md:mt-0"><LanguageSwitcher /></div></nav></div>
    </div>
    {searchOpen && <div role="dialog" aria-modal="true" aria-label={t("search.dialog")} className="fixed inset-x-0 bottom-0 top-[5.25rem] z-50 grid bg-black/45 p-4 backdrop-blur-sm sm:place-items-start sm:pt-10">
      <form onSubmit={submitSearch} className="w-full rounded-2xl bg-white p-3 shadow-2xl sm:max-w-2xl sm:p-4">
        <div className="flex items-center gap-3"><SearchIcon className="h-5 w-5 shrink-0 text-[#40533d]"/><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-base text-foreground outline-none placeholder:text-neutral-500" placeholder={t("search.placeholder")} aria-label={t("search.placeholder")}/><button type="button" onClick={() => setSearchOpen(false)} aria-label={t("search.close")} className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100"><CloseIcon className="h-5 w-5"/></button></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-3"><p className="text-xs text-neutral-500">{t("search.description")}</p><button type="submit" className="rounded-full bg-[#40533d] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#334532]">{t("nav.shop")}</button></div>
      </form>
    </div>}
  </header>;
}

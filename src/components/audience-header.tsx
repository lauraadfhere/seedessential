"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Link } from "./locale-link";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { CloseIcon, SearchIcon } from "./icons";
import { CartLink } from "./cart-link";
import { cn } from "./ui";
import { AccountMenu, NotificationBell, useAccount, type Account } from "./header-parts";
import { useI18n } from "@/lib/i18n";
import { chromeText, pageTitle, type ChromeText } from "@/lib/chrome-i18n";
import { isExpertRole, isProviderRole } from "@/lib/roles";
import { useSearchHistory } from "@/lib/search-history";
import type { Product } from "@/lib/data";

type MenuItem = { href: string; label: string };
type MenuGroup = { key: string; label: string; href?: string; items?: MenuItem[] };

function menuFor(text: ChromeText): MenuGroup[] {
  return [
    { key: "home", label: text.home, href: "/" },
    {
      key: "shop",
      label: text.shop,
      items: [
        { href: "/shop?kind=plant", label: text.plants },
        { href: "/shop?kind=equipment", label: text.equipment },
        { href: "/shop", label: text.allProducts },
        { href: "/discover", label: text.discover },
      ],
    },
    {
      key: "experts",
      label: text.experts,
      items: [
        { href: "/experts", label: text.findExpert },
        { href: "/experts/request", label: text.postRequest },
        { href: "/sign-up?account=expert", label: text.becomeExpert },
      ],
    },
    { key: "ruddge", label: text.ruddge, href: "/ruddge" },
    {
      key: "learn",
      label: text.learn,
      items: [
        { href: "/learn", label: text.guides },
        { href: "/seasonal-calendar", label: text.calendar },
        { href: "/planner", label: text.planner },
      ],
    },
    {
      key: "support",
      label: text.support,
      items: [
        { href: "/claims", label: text.claims },
        { href: "/delivery", label: text.delivery },
        { href: "/returns", label: text.returns },
        { href: "/faqs", label: text.faqs },
        { href: "/contact", label: text.contact },
      ],
    },
  ];
}

function workspaceLinks(account: Account | null, attention: number): MenuItem[] {
  if (!account) return [];
  if (account.role === "admin") return [{ href: "/admin", label: "Admin" }, { href: "/admin/moderation", label: attention ? `Moderation (${attention})` : "Moderation" }];
  if (isExpertRole(account.role)) return [{ href: "/expert?tab=inbox", label: attention ? `Inbox (${attention})` : "Inbox" }];
  if (isProviderRole(account.role)) return [{ href: "/provider", label: "Seller" }];
  return [{ href: "/consultations", label: "My requests" }, { href: "/orders", label: "Orders" }];
}

function Caret() {
  return (
    <svg viewBox="0 0 10 6" className="h-2 w-2 opacity-80" fill="currentColor" aria-hidden="true">
      <path d="M1 1.2 5 5l4-3.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavDropdown({ group }: { group: MenuGroup }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" className="chrome-nav-link">
        {group.label}
        <Caret />
      </button>
      {open && (
        <div role="menu" className="chrome-dropdown absolute top-full z-40 min-w-[13rem] bg-white py-1 text-[#18231b] shadow-[0_12px_28px_rgb(15_26_18_/_0.22)] ring-1 ring-black/8 ltr:left-0 rtl:right-0">
          {group.items?.map((item) => (
            <Link key={item.href} href={item.href} role="menuitem" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-[#eef3ed]">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Inner-page chrome cloned from the three-band header: brand, flat nav, page title. */
export function AudienceHeader({ onCartClick }: { onCartClick?: () => void }) {
  const { locale } = useI18n();
  const text = chromeText(locale);
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { account, summary, setAccount, ready } = useAccount(pathname);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open || searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, searchOpen]);

  const menu = menuFor(text);
  const workspace = workspaceLinks(account, summary?.attention ?? 0);
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const title = pageTitle(segments[0] ?? "", locale);

  const [results, setResults] = useState<{ products: Product[]; experts: { slug?: string; name: string; professionalCategory?: string }[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const { history, remember, forget } = useSearchHistory();
  const term = query.trim().toLowerCase();

  useEffect(() => {
    if (!searchOpen || term.length < 2) { setResults(null); setSearching(false); setSearchFailed(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchFailed(false);
      try {
        const [productsRes, expertsRes] = await Promise.all([
          fetch("/api/catalog/products", { signal: controller.signal }),
          fetch(`/api/experts?q=${encodeURIComponent(term)}`, { signal: controller.signal }),
        ]);
        if (!productsRes.ok && !expertsRes.ok) throw new Error("search");
        const products: Product[] = productsRes.ok ? await productsRes.json() : [];
        const experts = expertsRes.ok ? await expertsRes.json() : [];
        setResults({
          products: products.filter((p) => [p.name, p.short, p.description, p.category].some((v) => v && String(v).toLowerCase().includes(term))).slice(0, 6),
          experts: experts.slice(0, 4),
        });
      } catch {
        if (!controller.signal.aborted) { setSearchFailed(true); setResults(null); }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [term, searchOpen]);

  function goTo(href: string, value: string) {
    remember(value);
    setSearchOpen(false);
    setQuery("");
    router.push(href);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) { setSearchOpen(false); router.push(`/${locale}/shop`); return; }
    if (results?.products[0]) return goTo(`/${locale}/shop/${results.products[0].slug}`, value);
    if (results?.experts[0]?.slug) return goTo(`/${locale}/experts/${results.experts[0].slug}`, value);
    goTo(`/${locale}/shop?q=${encodeURIComponent(value)}`, value);
  }

  return (
    <>
      <header className="sticky top-0 z-50 text-white" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {/* Band 1 — brand, like HOSTBKK's navy logo bar */}
        <div className="bg-[#1e3226]">
          <div className="section flex h-[3.75rem] items-center justify-between gap-4 sm:h-16">
            <Logo className="[&_img]:h-8 sm:[&_img]:h-10" />
            <div className="flex items-center gap-0.5">
              <button onClick={() => setSearchOpen(true)} aria-label={text.search} className="grid h-9 w-9 place-items-center text-white/85 hover:text-white">
                <SearchIcon className="h-[18px] w-[18px]" />
              </button>
              <LanguageSwitcher compact className="hidden sm:block" />
              {account && <NotificationBell account={account} summary={summary} className="h-9 w-9 hover:bg-transparent" />}
              {!isExpertRole(account?.role) && <CartLink onClick={onCartClick} className="h-9 w-9 hover:bg-transparent" />}
              {ready && account && <AccountMenu account={account} summary={summary} onSignedOut={() => setAccount(null)} size="sm" />}
              <button onClick={() => setOpen(true)} aria-label={text.menu} aria-expanded={open} className="grid h-9 w-9 place-items-center lg:hidden">
                <span className="relative block h-3 w-4" aria-hidden="true">
                  <span className="absolute inset-x-0 top-0 h-px bg-white" />
                  <span className="absolute inset-x-0 top-1.5 h-px bg-white" />
                  <span className="absolute inset-x-0 bottom-0 h-px bg-white" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Band 2 — flat text nav, like HOSTBKK's bright bar */}
        <nav aria-label="Main" className="hidden bg-[#40533d] lg:block">
          <div className="section flex h-10 items-center">
            {menu.map((group) =>
              group.items ? (
                <NavDropdown key={group.key} group={group} />
              ) : (
                <Link key={group.key} href={group.href!} className="chrome-nav-link">
                  {group.label}
                </Link>
              ),
            )}
            <div className="flex items-center ltr:ml-auto rtl:mr-auto">
              {workspace.map((item) => (
                <Link key={item.href} href={item.href} className="chrome-nav-link">
                  {item.label}
                </Link>
              ))}
              {ready && !account && (
                <Link href="/sign-in" className="chrome-nav-link">
                  {text.logIn}
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Band 3 — page title on the same dark as the logo bar */}
      {title && (
        <div className="bg-[#1e3226] text-white">
          <div className="section py-6 sm:py-8">
            <h1 className="text-[1.65rem] font-normal tracking-tight sm:text-[2rem]">{title}</h1>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-[60] lg:hidden", open ? "visible" : "invisible")} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={cn("absolute inset-0 bg-black/45 transition-opacity", open ? "opacity-100" : "opacity-0")} />
        <aside className={cn("absolute inset-y-0 flex w-[min(20rem,88vw)] flex-col bg-[#1e3226] text-white shadow-2xl transition-transform duration-300 ltr:right-0 rtl:left-0", open ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full")} role="dialog" aria-label={text.menu}>
          <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
            <Logo className="[&_img]:h-8" />
            <button onClick={() => setOpen(false)} aria-label={text.close} className="grid h-9 w-9 place-items-center"><CloseIcon className="h-5 w-5" /></button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {workspace.map((item) => (
              <Link key={item.href} href={item.href} className="block px-5 py-3 text-sm hover:bg-white/10">{item.label}</Link>
            ))}
            {menu.map((group) =>
              group.items ? (
                <div key={group.key}>
                  <button type="button" onClick={() => setExpanded((value) => (value === group.key ? null : group.key))} className="flex w-full items-center justify-between px-5 py-3 text-sm">
                    {group.label}
                    <Caret />
                  </button>
                  {expanded === group.key && group.items.map((item) => (
                    <Link key={item.href} href={item.href} className="block px-8 py-2.5 text-sm text-white/75 hover:bg-white/10 hover:text-white">{item.label}</Link>
                  ))}
                </div>
              ) : (
                <Link key={group.key} href={group.href!} className="block px-5 py-3 text-sm hover:bg-white/10">{group.label}</Link>
              ),
            )}
          </nav>
          <div className="space-y-3 border-t border-white/10 p-4">
            <LanguageSwitcher />
            {ready && !account && (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/sign-in" className="border border-white/25 py-2 text-center text-xs font-semibold uppercase tracking-wider">{text.logIn}</Link>
                <Link href="/sign-up" className="bg-white py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#1e3226]">{text.join}</Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      {searchOpen && (
        <div role="dialog" aria-modal="true" aria-label={text.search} className="fixed inset-0 z-[60] bg-[#1e3226]/70 p-4 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
          <form onSubmit={submitSearch} className="mx-auto mt-20 flex max-w-xl overflow-hidden bg-white shadow-2xl">
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.searchShop} aria-label={text.search} className="min-w-0 flex-1 px-4 py-3.5 text-sm text-[#18231b] outline-none" />
            <button type="submit" className="bg-[#40533d] px-5 text-sm font-semibold text-white">{text.search}</button>
            <button type="button" onClick={() => setSearchOpen(false)} aria-label={text.close} className="grid w-12 place-items-center text-[#607060] hover:bg-[#f3f7f1]"><CloseIcon className="h-5 w-5" /></button>
          </form>
          <div className="mx-auto mt-2 max-w-xl bg-white p-4 shadow-2xl" aria-live="polite">
            {term.length < 2 && history.length > 0 && <ul className="flex flex-wrap gap-2">{history.map((item) => <li key={item} className="flex items-center rounded-full bg-[#f3f7f1] text-sm"><button type="button" onClick={() => setQuery(item)} className="px-3 py-1 text-[#18231b] hover:text-[#40533d]">{item}</button><button type="button" onClick={() => forget(item)} aria-label={`Remove ${item}`} className="pr-2 text-[#607060] hover:text-[#18231b]">×</button></li>)}</ul>}
            {term.length >= 2 && searching && <p className="py-3 text-sm text-[#607060]">Searching…</p>}
            {term.length >= 2 && searchFailed && <p className="py-3 text-sm text-red-600">Search is unavailable right now. Press Enter to browse the shop.</p>}
            {term.length >= 2 && results && !searching && results.products.length === 0 && results.experts.length === 0 && <p className="py-3 text-sm text-[#607060]">No products or experts match “{query.trim()}”. Press Enter to search the shop.</p>}
            {term.length >= 2 && results && !searching && results.products.length > 0 && <div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#607060]">Products</p><ul>{results.products.map((p) => <li key={p.slug}><button type="button" onClick={() => goTo(`/${locale}/shop/${p.slug}`, query)} className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left text-sm hover:bg-[#f3f7f1]"><span className="font-semibold text-[#18231b]">{p.name}</span><span className="truncate text-xs text-[#607060]">{p.short}</span></button></li>)}</ul></div>}
            {term.length >= 2 && results && !searching && results.experts.length > 0 && <div className="mt-3"><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#607060]">Experts</p><ul>{results.experts.map((e) => <li key={e.slug ?? e.name}><button type="button" disabled={!e.slug} onClick={() => e.slug && goTo(`/${locale}/experts/${e.slug}`, query)} className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left text-sm hover:bg-[#f3f7f1] disabled:opacity-60"><span className="font-semibold text-[#18231b]">{e.name}</span><span className="truncate text-xs text-[#607060]">{e.professionalCategory}</span></button></li>)}</ul></div>}
          </div>
        </div>
      )}
    </>
  );
}

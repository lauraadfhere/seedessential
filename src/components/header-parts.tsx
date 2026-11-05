"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "./locale-link";
import { cn } from "./ui";
import { getParse } from "@/lib/parse/client";
import { authHeaders } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";
import { audienceLabel, isExpertRole, isProviderRole } from "@/lib/roles";
import type { MarketplaceSummary } from "@/lib/marketplace-types";
import { mediaUrl } from "./marketplace";

export type Account = { id: string; name: string; avatar?: string; role: string; accountKind?: string; completeness?: number; status?: string };

/**
 * Signed-in account plus marketplace counters. The session is validated by the
 * server (`/api/me`), so expired or suspended sessions are cleared locally.
 * `ready` is false until the first check finishes, to avoid a signed-out flash.
 */
export function useAccount(pathname?: string) {
  const [account, setAccount] = useState<Account | null>(null);
  const [summary, setSummary] = useState<MarketplaceSummary | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    let last = 0;
    const refresh = async (force = false) => {
      if (!force && Date.now() - last < 15000) return;
      last = Date.now();
      const user = getParse().User.current();
      if (!user) {
        if (live) { setAccount(null); setSummary(null); setReady(true); }
        return;
      }
      try {
        const response = await fetch("/api/me", { headers: authHeaders(), cache: "no-store" });
        if (response.status === 401 || response.status === 403) {
          await getParse().User.logOut().catch(() => undefined);
          if (live) { setAccount(null); setSummary(null); }
          return;
        }
        if (!response.ok) throw new Error();
        const me = await response.json();
        if (!live) return;
        setAccount({ id: me.id, name: me.name || me.email || "Account", avatar: me.avatar || undefined, role: me.role, accountKind: me.accountKind, completeness: me.completeness?.score, status: me.status });
        const next = await fetch("/api/marketplace/summary", { headers: authHeaders() }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
        if (live) setSummary(next);
      } catch {
        if (live) setAccount((current) => current ?? { id: user.id ?? "", name: user.get("name") || "Account", role: user.get("role") || "customer", accountKind: user.get("accountKind") });
      } finally {
        if (live) setReady(true);
      }
    };
    const onAuth = () => void refresh(true);
    const onFocus = () => void refresh();
    void refresh(true);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(true); }, 60000);
    window.addEventListener("focus", onFocus);
    window.addEventListener("tannelli:auth", onAuth);
    return () => { live = false; window.clearInterval(timer); window.removeEventListener("focus", onFocus); window.removeEventListener("tannelli:auth", onAuth); };
  }, [pathname]);

  return { account, summary, setAccount, ready };
}

/** Where each role handles its marketplace work. */
export function workspaceFor(role?: string) {
  if (role === "admin") return { href: "/admin/moderation", label: "Moderation", cta: { href: "/admin", label: "Admin hub" } };
  if (isExpertRole(role)) return { href: "/expert?tab=inbox", label: "Request inbox", cta: { href: "/expert?tab=inbox", label: "Open requests" } };
  if (isProviderRole(role)) return { href: "/provider", label: "Expert demand", cta: { href: "/provider", label: "Add listing" } };
  return { href: "/consultations", label: "My requests", cta: { href: "/experts/request", label: "Ask an expert" } };
}

export function NotificationBell({ account, summary, className }: { account: Account; summary: MarketplaceSummary | null; className?: string }) {
  const workspace = workspaceFor(account.role);
  const count = summary?.attention ?? 0;
  const label = count ? `${count} item${count === 1 ? "" : "s"} need your attention in ${workspace.label}` : workspace.label;
  return (
    <Link href={workspace.href} aria-label={label} title={label} className={cn("relative grid h-10 w-10 place-items-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white", className)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 20a2 2 0 0 0 4 0" />
      </svg>
      {count > 0 && <span className="absolute right-1 top-1 grid min-w-[1.1rem] place-items-center rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-[1.1rem] text-[#263b2d] ring-2 ring-[#40533d]">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}

export function AccountMenu({ account, summary, onSignedOut, size = "md" }: { account: Account; summary: MarketplaceSummary | null; onSignedOut: () => void; size?: "sm" | "md" }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const workspace = workspaceFor(account.role);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);

  const links = [
    { href: "/dashboard", label: t("account.dashboard") },
    { href: workspace.href, label: workspace.label, badge: summary?.attention },
    ...(isExpertRole(account.role) ? [{ href: "/expert?tab=profile", label: t("account.expertise") }] : []),
    ...(isProviderRole(account.role) ? [{ href: "/provider", label: t("account.equipment") }] : []),
    ...(account.role === "admin" ? [{ href: "/admin", label: t("account.administration") }, { href: "/admin/experts", label: t("account.expertVerification") }] : []),
    ...(!isExpertRole(account.role) && !isProviderRole(account.role) && account.role !== "admin" ? [{ href: "/orders", label: "Orders" }, { href: "/projects", label: "Projects" }] : []),
    { href: "/ruddge", label: "RuddgeAI" },
    { href: account.role === "admin" ? "/admin/claims" : "/claims", label: "Claims" },
    { href: "/profile", label: account.completeness !== undefined && account.completeness < 100 ? `${t("account.profile")} · ${account.completeness}%` : t("account.profile") },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((value) => !value)} aria-label={t("account.openMenu")} aria-expanded={open} aria-haspopup="menu" className={cn("grid place-items-center overflow-hidden rounded-full border-2 border-white/50 bg-white/15 text-xs font-bold text-white transition hover:border-white", size === "sm" ? "h-9 w-9" : "h-10 w-10")}>
        {account.avatar ? <img src={mediaUrl(account.avatar, 96)} alt="" className="h-full w-full object-cover" /> : account.name.slice(0, 1).toUpperCase()}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-3 w-64 overflow-hidden rounded-2xl border border-[#dce5dc] bg-[#fbfdf9] p-2 text-sm text-neutral-900 shadow-[0_20px_55px_rgb(24_35_27_/_0.24)] rtl:left-0 rtl:right-auto">
          <div className="mb-2 rounded-xl bg-[#40533d] px-3 py-3 text-white">
            <p className="truncate font-semibold">{account.name}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">{audienceLabel(account.role, account.accountKind)} account</p>
          </div>
          {links.map((link) => (
            <Link key={link.href + link.label} href={link.href} onClick={() => setOpen(false)} role="menuitem" className="flex items-center justify-between rounded-xl px-3 py-2.5 font-medium hover:bg-[#eaf0e8]">
              {link.label}
              {"badge" in link && link.badge ? <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-[#263b2d]">{link.badge}</span> : null}
            </Link>
          ))}
          <button
            role="menuitem"
            onClick={() => { void getParse().User.logOut(); window.dispatchEvent(new Event("tannelli:auth")); onSignedOut(); setOpen(false); router.push(`/${locale}`); }}
            className="mt-2 block w-full rounded-xl border-t border-[#dce5dc] px-3 py-2.5 text-left font-medium text-red-700 hover:bg-red-50"
          >
            {t("account.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

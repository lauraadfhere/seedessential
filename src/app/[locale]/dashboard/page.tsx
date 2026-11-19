"use client";

import { Suspense, useEffect, useState, type ComponentType } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/components/locale-link";
import { RequireAuth } from "@/components/require-auth";
import { Price, cn } from "@/components/ui";
import { EmptyState, RequestCard, StatCard } from "@/components/marketplace";
import { SignOutButton, useAccount, workspaceFor } from "@/components/header-parts";
import { api } from "@/lib/api-client";
import { audienceLabel, isExpertRole, isProviderRole } from "@/lib/roles";
import { loadOrders, type SavedOrder } from "@/lib/cart";
import type { RequestRecord } from "@/lib/marketplace-types";
import { BagIcon, BookIcon, ChatIcon, CheckIcon, ClockIcon, GridIcon, HeartIcon, LeafMark, PackageIcon, TruckIcon, UserIcon } from "@/components/icons";

type NavItem = { label: string; href: string; icon: ComponentType<{ className?: string }>; badge?: number };
type Stat = { label: string; value: number | string; hint: string; href: string; icon: ComponentType<{ className?: string }> };

const browse = [
  { label: "Plants", text: "Indoor, garden & orchard", href: "/shop?kind=plant" },
  { label: "Equipment", text: "Irrigation, soil & tools", href: "/shop?kind=equipment" },
  { label: "Experts", text: "Verified across 58 wilayas", href: "/experts" },
  { label: "Planner", text: "Plan beds & seasons", href: "/planner" },
];

function DashboardBody() {
  const searchParams = useSearchParams();
  const { account, summary } = useAccount();
  const [orders] = useState<SavedOrder[]>(() => loadOrders());
  const [requests, setRequests] = useState<RequestRecord[] | null>(null);
  const latest = searchParams.get("order");
  const role = account?.role ?? "customer";
  const provider = isProviderRole(role);
  const expert = isExpertRole(role);
  const admin = role === "admin";
  const grower = !provider && !expert && !admin;
  const workspace = workspaceFor(role);
  const counts = summary?.counts ?? {};
  const roleLabel = audienceLabel(role, account?.accountKind);

  const accountId = account?.id;
  useEffect(() => {
    if (!accountId || provider) return;
    api<RequestRecord[]>(admin ? "/api/expert-requests?scope=moderation" : "/api/expert-requests").then(setRequests).catch(() => setRequests([]));
  }, [accountId, provider, admin]);

  const navigation: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: GridIcon },
    ...(expert ? [
      { label: "Request inbox", href: "/expert?tab=inbox", icon: ClockIcon, badge: counts.inbox },
      { label: "My clients", href: "/expert?tab=active", icon: ChatIcon, badge: counts.matched },
      { label: "Expert profile", href: "/expert?tab=profile", icon: BookIcon },
    ] : provider ? [
      { label: "My equipment", href: "/provider", icon: BagIcon, badge: counts.pending },
      { label: "Orders", href: "/orders", icon: PackageIcon },
    ] : admin ? [
      { label: "Admin hub", href: "/admin", icon: GridIcon },
      { label: "Moderation", href: "/admin/moderation", icon: ChatIcon, badge: (counts.requests ?? 0) + (counts.messages ?? 0) },
      { label: "Expert verification", href: "/admin/experts", icon: CheckIcon, badge: counts.experts },
    ] : [
      { label: "My requests", href: "/consultations", icon: ChatIcon, badge: counts.answered },
      { label: "Orders", href: "/orders", icon: PackageIcon },
      { label: "My projects", href: "/projects", icon: LeafMark },
      { label: "Saved items", href: "/wishlist", icon: HeartIcon },
    ]),
    { label: "Profile", href: "/profile", icon: UserIcon },
  ];

  const stats: Stat[] = expert ? [
    { label: "New requests", value: counts.inbox ?? 0, hint: "Matching your coverage", href: "/expert?tab=inbox", icon: ClockIcon },
    { label: "Need your advice", value: counts.matched ?? 0, hint: "Accepted, not answered", href: "/expert?tab=active", icon: ChatIcon },
    { label: "Answered", value: counts.answered ?? 0, hint: "Waiting for growers", href: "/expert?tab=active", icon: LeafMark },
    { label: "Completed", value: counts.completed ?? 0, hint: counts.verified ? "Verified expert" : "Verification pending", href: "/expert?tab=done", icon: CheckIcon },
  ] : provider ? [
    { label: "Listings", value: counts.listings ?? 0, hint: `${counts.pending ?? 0} waiting for review`, href: "/provider", icon: BagIcon },
    { label: "Expert picks", value: counts.recommendations ?? 0, hint: "Times experts recommended you", href: "/provider", icon: BookIcon },
    { label: "This week", value: counts.recent ?? 0, hint: "New recommendations", href: "/provider", icon: ClockIcon },
    { label: "Orders", value: orders.length, hint: "Marketplace orders", href: "/orders", icon: TruckIcon },
  ] : admin ? [
    { label: "Held requests", value: counts.requests ?? 0, hint: "Waiting for moderation", href: "/admin/moderation", icon: ChatIcon },
    { label: "Flagged messages", value: counts.messages ?? 0, hint: "Reported or auto-flagged", href: "/admin/moderation", icon: ClockIcon },
    { label: "Expert applications", value: counts.experts ?? 0, hint: "To verify", href: "/admin/experts", icon: CheckIcon },
    { label: "Provider listings", value: counts.listings ?? 0, hint: "Pending approval", href: "/admin?workspace=equipment", icon: BagIcon },
  ] : [
    { label: "Waiting", value: counts.waiting ?? 0, hint: "Open to experts", href: "/consultations", icon: ClockIcon },
    { label: "With an expert", value: counts.matched ?? 0, hint: "In conversation", href: "/consultations", icon: ChatIcon },
    { label: "Recommendations", value: counts.answered ?? 0, hint: "Ready to read", href: "/consultations", icon: LeafMark },
    { label: "Orders", value: orders.length, hint: orders.length ? "Track deliveries" : "Nothing yet", href: "/orders", icon: PackageIcon },
  ];

  const headline = expert
    ? (counts.inbox ? `${counts.inbox} grower${counts.inbox === 1 ? "" : "s"} need an expert in your area.` : "Your inbox is clear.")
    : provider
      ? "Turn expert recommendations into orders."
      : admin
        ? (summary?.attention ? `${summary.attention} items need a decision.` : "Everything is moderated.")
        : counts.answered
          ? `You have ${counts.answered} expert recommendation${counts.answered === 1 ? "" : "s"} to read.`
          : "Keep your growing plan moving.";

  const firstName = (account?.name ?? "Grower").split(" ")[0];
  const dashTitle = expert ? "Expert workspace" : provider ? "Merchant dashboard" : admin ? "Admin dashboard" : "Grower dashboard";
  const dashText = expert
    ? "Inbox, active clients and your public profile."
    : provider
      ? "Listings, recommendations and marketplace orders."
      : admin
        ? "Moderation, verification and platform health."
        : "Requests, orders and projects in one place.";

  return (
    <main className="min-h-screen bg-panel text-[#0f1111]">
      <div className="border-b border-rule bg-panel-head px-4 py-1 text-right text-xs text-link">
        <span className="tmpl-chip mx-2 !normal-case !tracking-normal">{roleLabel}</span>
        <span className="mx-2">{account?.name ?? "Account"}</span>
        |<Link href="/profile" className="mx-2 hover:underline">Your account</Link>
        |<Link href="/help" className="mx-2 hover:underline">Help</Link>
        |<SignOutButton tone="link" />
      </div>

      <header className="border-b border-[#17231a] bg-[#263b2d]">
        <div className="tmpl-rail flex flex-wrap items-center gap-5 py-3.5">
          <Link href="/" aria-label="seed home" className="flex items-center">
            <img src="/seed.png" alt="seed" width={1906} height={557} className="h-7 w-auto sm:h-8" />
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.badge ? <span className="bg-[#ffd814] px-1.5 text-[11px] font-bold text-[#0f1111]">{item.badge}</span> : null}
                </Link>
              );
            })}
          </nav>
          <SignOutButton className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20" />
        </div>
      </header>

      <section className="tmpl-hero">
        <div className="tmpl-rail flex flex-wrap items-end justify-between gap-5 py-8 sm:py-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">{roleLabel}</p>
            <h1 className="tmpl-hero-title mt-1">{dashTitle}</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">{dashText}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={workspace.cta.href} className="bg-white px-4 py-2.5 text-sm font-semibold text-[#263b2d] hover:bg-[#eaf0e8]">
              {workspace.cta.label}
            </Link>
            <Link href={workspace.href} className="border border-white/35 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              {workspace.label}
            </Link>
          </div>
        </div>
      </section>

      <div className="tmpl-rail pt-4">
        <div className="tmpl-notice flex items-start gap-3">
          <span className="font-bold text-link">i</span>
          <p>Welcome back, {firstName}. {headline}</p>
        </div>
      </div>

      <section className="min-w-0">
        <div className="tmpl-rail space-y-6 py-6">
          {latest && (
            <div className="tmpl-notice !border-s-ok">
              <p className="tmpl-chip tmpl-chip-ok">Order placed</p>
              <p className="mt-2 font-semibold">#{latest} is now in fulfilment.</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} {...stat} accent={index === 0 && Number(stat.value) > 0} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
            {!provider ? (
              <section className="tmpl-panel">
                <div className="tmpl-panel-head flex items-center justify-between">
                  <span>{expert ? "Latest requests for you" : admin ? "Waiting for moderation" : "Your expert requests"}</span>
                  <Link href={workspace.href} className="text-sm font-semibold text-link">View all</Link>
                </div>
                <div className="tmpl-panel-body !p-4">
                  {requests === null ? (
                    <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((key) => <div key={key} className="h-56 animate-pulse border border-rule bg-panel" />)}</div>
                  ) : requests.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">{requests.slice(0, 4).map((request) => <RequestCard key={request.id} request={request} />)}</div>
                  ) : (
                    <EmptyState
                      title={expert ? "No open requests yet" : admin ? "Moderation queue is empty" : "No request yet"}
                      text={grower ? "Tell a verified expert what's happening in your garden or farm — with photos — and get a written plan." : undefined}
                      action={grower ? <Link href="/experts/request" className="ui-btn">Ask an expert</Link> : undefined}
                    />
                  )}
                </div>
              </section>
            ) : (
              <section className="tmpl-panel">
                <div className="tmpl-panel-head">Merchant shortcuts</div>
                <div className="tmpl-panel-body grid gap-3 sm:grid-cols-2">
                  <Link href="/provider" className="border border-rule bg-panel p-4 hover:border-[#40533d]">
                    <p className="font-semibold">Manage listings</p>
                    <p className="mt-1 text-sm text-[#607060]">Photos, prices and delivery wilayas.</p>
                  </Link>
                  <Link href="/orders" className="border border-rule bg-panel p-4 hover:border-[#40533d]">
                    <p className="font-semibold">Track orders</p>
                    <p className="mt-1 text-sm text-[#607060]">Fulfilment for marketplace sales.</p>
                  </Link>
                </div>
              </section>
            )}

            <aside className="space-y-4">
              <section className="tmpl-list">
                <div className="tmpl-list-head">Quick links</div>
                {browse.map((tile) => (
                  <Link key={tile.label} href={tile.href} className="tmpl-list-row flex items-center justify-between gap-3 hover:bg-panel">
                    <span>
                      <span className="block font-semibold">{tile.label}</span>
                      <span className="text-xs text-[#607060]">{tile.text}</span>
                    </span>
                    <span className="text-xs font-bold text-[#40533d]">Open →</span>
                  </Link>
                ))}
              </section>

              {orders.length > 0 && (
                <section className="tmpl-list">
                  <div className="tmpl-list-head flex items-center justify-between">
                    <span>Recent orders</span>
                    <Link href="/orders" className="text-sm font-semibold text-link">View all</Link>
                  </div>
                  {orders.slice(0, 3).map((order) => (
                    <Link href={`/orders/${order.id}`} key={order.id} className="tmpl-list-row flex items-center justify-between gap-4 hover:bg-panel">
                      <div>
                        <p className="font-semibold">{order.id}</p>
                        <p className="mt-1 text-sm text-[#607060]">To {order.wilaya} · {order.days}</p>
                      </div>
                      <Price value={order.total} dzd={order.totalDzd} />
                    </Link>
                  ))}
                </section>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-panel p-10 text-sm text-[#607060]">Loading dashboard…</main>}>
      <RequireAuth loadingLabel="Opening your dashboard…">
        <DashboardBody />
      </RequireAuth>
    </Suspense>
  );
}

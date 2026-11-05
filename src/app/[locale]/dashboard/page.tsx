"use client";

import { Suspense, useEffect, useState, type ComponentType } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/components/locale-link";
import { RequireAuth } from "@/components/require-auth";
import { Price, cn } from "@/components/ui";
import { EmptyState, RequestCard, StatCard } from "@/components/marketplace";
import { useAccount, workspaceFor } from "@/components/header-parts";
import { api } from "@/lib/api-client";
import { audienceLabel, isExpertRole, isProviderRole } from "@/lib/roles";
import { loadOrders, type SavedOrder } from "@/lib/cart";
import type { RequestRecord } from "@/lib/marketplace-types";
import { BagIcon, BookIcon, ChatIcon, CheckIcon, ClockIcon, GridIcon, HeartIcon, LeafMark, PackageIcon, SearchIcon, TruckIcon, UserIcon } from "@/components/icons";

type NavItem = { label: string; href: string; icon: ComponentType<{ className?: string }>; badge?: number };
type Stat = { label: string; value: number | string; hint: string; href: string; icon: ComponentType<{ className?: string }> };

const browse = [
  { label: "Plants", text: "Indoor, garden & orchard", href: "/shop?kind=plant", tint: "from-[#e6efdc] to-[#cfe0c4]" },
  { label: "Equipment", text: "Irrigation, soil & tools", href: "/shop?kind=equipment", tint: "from-[#e9eef0] to-[#cdd9dd]" },
  { label: "Experts", text: "Verified across 58 wilayas", href: "/experts", tint: "from-[#f2ece0] to-[#e3d5bb]" },
  { label: "Planner", text: "Plan beds & seasons", href: "/planner", tint: "from-[#eae6f1] to-[#d6cfe4]" },
];

function DashboardBody() {
  const searchParams = useSearchParams();
  const { account, summary } = useAccount();
  // RequireAuth mounts this body on the client only, so localStorage is safe here.
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

  return (
    <main className="min-h-screen bg-[#fcfdfb] text-[#18231b]">
      <div className="grid min-h-screen lg:grid-cols-[14.5rem_minmax(0,1fr)_18rem]">
        <aside className="hidden border-r border-[#e3e9e1] bg-white px-4 py-6 lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-2 px-2 text-lg font-bold tracking-tight text-[#263b2d]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#40533d] text-white">T</span>Tannelli</Link>
          <p className="mt-8 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#8a9788]">{audienceLabel(role, account?.accountKind)} workspace</p>
          <nav className="mt-3 space-y-1">
            {navigation.map((item, index) => (
              <Link key={item.label} href={item.href} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition", index === 0 ? "bg-[#eaf0e8] font-semibold text-[#263b2d]" : "text-[#607060] hover:bg-[#f3f7f1] hover:text-[#263b2d]")}>
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-[#263b2d]">{item.badge}</span> : null}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-[#263b2d] p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-white/55">Marketplace</p>
            <p className="mt-2 text-sm leading-5 text-white/80">Growers, verified experts and equipment providers — connected through every request.</p>
            <Link href={workspace.cta.href} className="mt-4 inline-flex text-sm font-semibold text-white underline underline-offset-4">{workspace.cta.label}</Link>
          </div>
        </aside>

        <section className="min-w-0 border-r border-[#e3e9e1]">
          <header className="flex min-h-20 items-center justify-between gap-3 border-b border-[#e3e9e1] px-5 sm:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#7d8a7b]">Dashboard</p>
              <h1 className="mt-1 text-xl font-semibold">Welcome back, {firstName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href={workspace.cta.href} className="hidden rounded-xl bg-[#40533d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#334532] sm:inline-flex">{workspace.cta.label}</Link>
              <Link href="/shop" aria-label="Search the shop" className="grid h-10 w-10 place-items-center rounded-full border border-[#dce5dc] text-[#40533d] transition hover:bg-[#eaf0e8]"><SearchIcon className="h-5 w-5" /></Link>
            </div>
          </header>

          <nav className="flex gap-1 overflow-x-auto border-b border-[#e3e9e1] px-4 py-2 lg:hidden">
            {navigation.map((item) => (
              <Link key={item.label} href={item.href} className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#dce5dc] px-3 py-1.5 text-xs font-semibold text-[#40533d]">
                {item.label}{item.badge ? <span className="rounded-full bg-amber-400 px-1.5 text-[10px]">{item.badge}</span> : null}
              </Link>
            ))}
          </nav>

          <div className="mx-auto max-w-4xl space-y-8 px-5 py-8 sm:px-8">
            {latest && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Order placed</p><p className="mt-1 font-semibold">#{latest} is now in fulfilment.</p></div>}

            <article className="relative overflow-hidden rounded-[1.75rem] bg-[#263b2d] p-7 text-white">
              <LeafMark className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rotate-12 text-white/5" />
              <p className="text-xs font-bold uppercase tracking-[.16em] text-white/60">Your next step</p>
              <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight">{headline}</h2>
              <p className="mt-3 max-w-xl leading-7 text-white/75">
                {expert ? "Accept requests, send diagnoses and link the plants and equipment growers need." : provider ? "Experts link your approved equipment in their recommendations — keep listings complete with photos and delivery wilayas." : admin ? "Approve held requests, review flagged conversations and verify new experts." : "Describe your problem with photos, get a verified expert's plan, and order exactly what they recommend."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={workspace.cta.href} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#263b2d] transition hover:bg-[#eaf0e8]">{workspace.cta.label}</Link>
                <Link href={workspace.href} className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">{workspace.label}</Link>
              </div>
            </article>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => <StatCard key={stat.label} {...stat} accent={index === 0 && Number(stat.value) > 0} />)}
            </div>

            {!provider && (
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{expert ? "Latest requests for you" : admin ? "Waiting for moderation" : "Your expert requests"}</h2>
                  <Link href={workspace.href} className="text-sm font-semibold text-[#40533d]">View all</Link>
                </div>
                {requests === null ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">{[0, 1].map((key) => <div key={key} className="h-64 animate-pulse rounded-[1.5rem] bg-[#f1f5ef]" />)}</div>
                ) : requests.length ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">{requests.slice(0, 4).map((request) => <RequestCard key={request.id} request={request} />)}</div>
                ) : (
                  <div className="mt-4">
                    <EmptyState
                      title={expert ? "No open requests yet" : admin ? "Moderation queue is empty" : "No request yet"}
                      text={grower ? "Tell a verified expert what's happening in your garden or farm — with photos — and get a written plan." : undefined}
                      action={grower ? <Link href="/experts/request" className="rounded-xl bg-[#40533d] px-4 py-2.5 text-sm font-semibold text-white">Ask an expert</Link> : undefined}
                    />
                  </div>
                )}
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold">Popular on Tannelli</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {browse.map((tile) => (
                  <Link key={tile.label} href={tile.href} className={cn("group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgb(24_35_27_/_0.12)]", tile.tint)}>
                    <p className="font-semibold">{tile.label}</p>
                    <p className="mt-1 text-xs text-[#4f5f50]">{tile.text}</p>
                    <span className="mt-6 inline-block text-xs font-bold uppercase tracking-[.12em] text-[#263b2d] transition group-hover:translate-x-1">Explore →</span>
                  </Link>
                ))}
              </div>
            </section>

            {orders.length > 0 && (
              <section>
                <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Recent orders</h2><Link href="/orders" className="text-sm font-semibold text-[#40533d]">View all</Link></div>
                <div className="mt-4 divide-y divide-[#e3e9e1] rounded-2xl border border-[#e3e9e1] bg-white">
                  {orders.slice(0, 3).map((order) => (
                    <Link href={`/orders/${order.id}`} key={order.id} className="flex items-center justify-between gap-4 p-4 hover:bg-[#f5f8f3]">
                      <div><p className="font-semibold">{order.id}</p><p className="mt-1 text-sm text-[#607060]">To {order.wilaya} · {order.days}</p></div>
                      <Price value={order.total} dzd={order.totalDzd} />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>

        <aside className="hidden bg-[#fcfdfb] px-6 py-8 lg:block">
          <div className="rounded-2xl border border-[#dce5dc] bg-white p-5">
            <p className="font-semibold">How it works</p>
            <ol className="mt-4 space-y-3 text-sm text-[#607060]">
              {["Grower posts a detailed request with photos", "A verified expert in the wilaya accepts it", "The expert sends a plan and links products", "Grower orders from Tannelli & providers, then rates"].map((step, index) => (
                <li key={step} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eaf0e8] text-[11px] font-bold text-[#40533d]">{index + 1}</span>{step}</li>
              ))}
            </ol>
          </div>
          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8a9788]">Grower resources</p>
            <div className="mt-4 space-y-4">
              {[{ label: "Seasonal calendar", href: "/seasonal-calendar" }, { label: "Plant care guides", href: "/learn" }, { label: "Delivery information", href: "/delivery" }].map((item) => <Link key={item.label} href={item.href} className="block text-sm font-medium text-[#40533d] hover:underline">{item.label} ↗</Link>)}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function Dashboard() {
  return <Suspense fallback={<main className="min-h-screen bg-[#fcfdfb] p-10">Loading dashboard…</main>}><RequireAuth loadingLabel="Opening your dashboard…"><DashboardBody /></RequireAuth></Suspense>;
}

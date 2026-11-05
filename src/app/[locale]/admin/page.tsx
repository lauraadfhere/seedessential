"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getParse } from "@/lib/parse/client";
import { useI18n } from "@/lib/i18n";
import { cloudinaryImage } from "@/lib/cloudinary-client";
import { ProductVisual } from "@/components/product-card";
import { categories, products } from "@/lib/data";

type CatalogItem = {
  slug: string;
  name: string;
  kind: "plant" | "equipment";
  category: string;
  price: number;
  priceDzd?: number;
  images: string[];
  featured: boolean;
  inStock: boolean;
  short: string;
  availableForExpertRequests: boolean;
  visibilityStatus: "published" | "pending" | "rejected";
  providerName?: string;
};

type Workspace = "plants" | "equipment";
type AdminCard = { key: string; title: string; text: string; icon: string; workspace?: Workspace };

const adminCards: AdminCard[] = [
  { key: "plants", title: "Plant catalog", text: "Products, collection images, covers and availability.", icon: "catalog", workspace: "plants" },
  { key: "equipment", title: "Popular equipment", text: "Everything to plant it, feed it, water it and keep it thriving.", icon: "orders", workspace: "equipment" },
  { key: "users", title: "Users", text: "Customers, profiles, access and account support.", icon: "users" },
  { key: "experts", title: "Experts", text: "Profiles, specialties, availability and services.", icon: "experts" },
  { key: "orders", title: "Orders & delivery", text: "Purchases, fulfilment and delivery tracking.", icon: "orders" },
  { key: "payments", title: "Payments", text: "Transactions, refunds and payout oversight.", icon: "payments" },
  { key: "moderation", title: "Moderation", text: "Expert requests, conversations, reviews and content safety.", icon: "moderation" },
  { key: "claims", title: "Claims & support", text: "Customer cases, disputes and resolutions.", icon: "claims" },
  { key: "content", title: "Content", text: "Guides, articles, promotions and SEO content.", icon: "content" },
  { key: "analytics", title: "Analytics", text: "Marketplace performance and reporting.", icon: "analytics" },
];

const equipmentCategories = categories.filter((item) => item.kind === "equipment");

function token() {
  return getParse().User.current()?.getSessionToken() ?? "";
}

function opts(init: RequestInit = {}) {
  return { ...init, headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...(init.headers ?? {}) } };
}

function AdminIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const paths: Record<string, string> = {
    catalog: "M4 5.5h16v13H4zM8 9h8M8 13h5",
    users: "M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M17 7a2.5 2.5 0 0 1 0 5",
    experts: "M12 21V10M12 14C7 14 4 11 4 6c5 0 8 3 8 8ZM12 10c0-4 3-7 8-7 0 5-3 8-8 8Z",
    orders: "M5 7h14v13H5zM8 7V5h8v2M8 11h8M8 15h5",
    payments: "M4 7h16v11H4zM4 11h16M8 15h3",
    moderation: "M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z",
    claims: "M5 5h14v11H9l-4 3.5V5ZM8 9h8M8 12h5",
    content: "M6 4h12v16H6zM9 8h6M9 12h6M9 16h4",
    analytics: "M5 19V10M12 19V5M19 19v-7",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[name] ?? paths.catalog} />
    </svg>
  );
}

function AdminShell({ active, onSelect, children }: { active: string; onSelect: (workspace?: string) => void; children: ReactNode }) {
  const navItem = (key: string, title: string, icon: string, workspace?: string, enabled = true) => {
    const selected = key === "overview" ? !active : active === (workspace ?? key);
    return (
      <button
        key={key}
        onClick={() => (enabled ? onSelect(workspace) : undefined)}
        disabled={!enabled}
        title={title}
        className={`group relative flex w-full items-center justify-center gap-3 rounded-2xl px-2 py-2.5 text-sm font-semibold transition sm:justify-start sm:px-3 ${
          selected ? "bg-white text-[#18231b] shadow-[0_14px_36px_rgb(0_0_0_/_0.22)]" : enabled ? "text-white/80 hover:bg-white/8 hover:text-white" : "cursor-default text-white/30"
        }`}
      >
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${selected ? "border-[#40533d]/15 bg-[#40533d] text-white shadow-[0_10px_24px_rgb(24_35_27_/_0.28)]" : "border-white/15 bg-white/8"}`}>
          <AdminIcon name={icon} className="h-4 w-4" />
        </span>
        <span className="hidden sm:block">{title}</span>
      </button>
    );
  };

  return (
    <main className="admin-shell network-surface min-h-screen text-[#18231b]">
      <div className="flex min-h-screen">
        <aside className="relative w-[4.75rem] shrink-0 overflow-hidden bg-[#263b2d] px-2 py-5 text-white shadow-[12px_0_40px_rgb(24_35_27_/_0.18)] sm:w-64 sm:px-4">
          <span className="pointer-events-none absolute -left-8 top-10 h-28 w-28 rounded-full border border-white/10 bg-white/5" />
          <span className="pointer-events-none absolute -right-10 bottom-24 h-36 w-36 rounded-full border border-white/10" />
          <span className="pointer-events-none absolute left-7 top-28 hidden h-[58%] w-px bg-white/10 sm:block" />
          <div className="relative flex items-center justify-center gap-3 px-1 sm:justify-start">
            <span className="network-node grid h-11 w-11 place-items-center text-sm font-bold text-[#40533d]">T</span>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Tannelli</p>
              <p className="text-sm font-bold tracking-[0.16em]">ADMIN</p>
            </div>
          </div>
          <nav className="relative mt-8 space-y-1.5" aria-label="Administration workspaces">
            {navItem("overview", "Overview", "analytics")}
            {adminCards.map((card) => navItem(card.key, card.title, card.icon, card.key))}
          </nav>
          <div className="relative mt-8 hidden border-t border-white/10 pt-5 sm:block">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Workspace</p>
            <p className="mt-2 px-3 text-xs leading-5 text-white/55">Provider equipment stays hidden until you accept it.</p>
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

function Pricing({ item, update }: { item: CatalogItem; update: (payload: Record<string, unknown>) => Promise<void> }) {
  const [usd, setUsd] = useState(String(item.price));
  const [dzd, setDzd] = useState(item.priceDzd === undefined ? "" : String(item.priceDzd));
  const [saving, setSaving] = useState(false);
  return (
    <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2 rounded-2xl bg-[#f6f8f5] p-3">
      <label className="text-xs font-semibold">
        USD ($)
        <input aria-label="USD price" type="number" min="0" step="0.01" value={usd} onChange={(e) => setUsd(e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-2 py-1.5 text-sm font-normal" />
      </label>
      <label className="text-xs font-semibold">
        DZD
        <input aria-label="DZD price" type="number" min="0" step="1" placeholder="Optional" value={dzd} onChange={(e) => setDzd(e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-2 py-1.5 text-sm font-normal" />
      </label>
      <button
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await update({ price: Number(usd), ...(dzd ? { priceDZD: Number(dzd) } : {}) });
          } finally {
            setSaving(false);
          }
        }}
        className="self-end rounded-lg bg-[#40533d] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#30412e]"
      >
        {saving ? "…" : "Save"}
      </button>
    </div>
  );
}

function CatalogCard({ item, uploading, editing, draft, setDraft, setEditing, update, upload, onNotice }: {
  item: CatalogItem;
  uploading: string;
  editing: string;
  draft: string;
  setDraft: (value: string) => void;
  setEditing: (value: string) => void;
  update: (slug: string, payload: Record<string, unknown>) => Promise<void>;
  upload: (slug: string, event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onNotice: (value: string) => void;
}) {
  const fallback = products.find((product) => product.slug === item.slug);
  const editingName = editing === item.slug;
  const status = item.visibilityStatus;
  return (
    <article className="network-card overflow-hidden rounded-[1.75rem]">
      <div className="grid sm:grid-cols-[10rem_1fr]">
        <div className="aspect-square bg-[#eef3ed]">
          {item.images[0] ? (
            <img src={cloudinaryImage(item.images[0], { width: 500, height: 500 })} alt={item.name} className="h-full w-full object-cover" />
          ) : fallback ? (
            <ProductVisual product={fallback} className="h-full" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-[#789078]">No image</div>
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status === "published" ? "bg-emerald-50 text-emerald-800" : status === "pending" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}>{status}</span>
            {item.providerName && <span className="text-[10px] font-semibold uppercase tracking-wider text-[#789078]">From {item.providerName}</span>}
          </div>
          <div className="mt-3 flex items-start gap-2">
            {editingName ? (
              <input value={draft} onChange={(e) => setDraft(e.target.value)} className="min-w-0 flex-1 rounded-lg border px-2 py-1 font-semibold" />
            ) : (
              <h2 className="flex-1 font-semibold">{item.name}</h2>
            )}
            <button
              onClick={() =>
                editingName
                  ? update(item.slug, { name: draft }).then(() => {
                      setEditing("");
                      onNotice("Details saved.");
                    })
                  : (setEditing(item.slug), setDraft(item.name))
              }
              className="text-xs font-bold text-[#40533d]"
            >
              {editingName ? "Save" : "Edit"}
            </button>
          </div>
          <Pricing item={item} update={(payload) => update(item.slug, payload).then(() => onNotice("USD and DZD prices saved."))} />
          {item.kind === "plant" ? (
            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl bg-[#f6f8f5] p-3 text-sm">
              <span>Available for expert requests</span>
              <input type="checkbox" checked={item.availableForExpertRequests} onChange={(e) => update(item.slug, { availableForExpertRequests: e.target.checked }).then(() => onNotice("Availability updated."))} className="h-4 w-4 accent-[#40533d]" />
            </label>
          ) : (
            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl bg-[#f6f8f5] p-3 text-sm">
              <span>Show in Popular equipment</span>
              <input type="checkbox" checked={item.featured} onChange={(e) => update(item.slug, { featured: e.target.checked }).then(() => onNotice("Homepage equipment updated."))} className="h-4 w-4 accent-[#40533d]" />
            </label>
          )}
          {status !== "published" && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => update(item.slug, { visibilityStatus: "published", featured: item.featured }).then(() => onNotice("Listing is now visible in the shop."))} className="rounded-lg bg-[#40533d] px-3 py-2 text-xs font-bold text-white">Accept & publish</button>
              {status !== "rejected" && <button onClick={() => update(item.slug, { visibilityStatus: "rejected" }).then(() => onNotice("Listing was kept hidden."))} className="rounded-lg border px-3 py-2 text-xs font-bold text-red-700">Reject</button>}
            </div>
          )}
          {status === "published" && item.providerName && (
            <button onClick={() => update(item.slug, { visibilityStatus: "pending" }).then(() => onNotice("Listing hidden pending review."))} className="mt-3 text-xs font-bold text-[#40533d]">Unpublish</button>
          )}
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#789078]">Cloudinary collection · {item.images.length}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.images.map((image, index) => (
                <div key={image} className="group relative h-14 w-14 overflow-hidden rounded-lg border">
                  <img src={cloudinaryImage(image, { width: 120, height: 120 })} alt="" className="h-full w-full object-cover" />
                  {index === 0 && <span className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 text-center text-[9px] font-bold text-white">COVER</span>}
                  <div className="absolute inset-0 hidden place-items-center gap-1 bg-black/60 p-1 group-hover:grid">
                    <button type="button" onClick={() => update(item.slug, { coverImagePublicId: image }).then(() => onNotice("Cover image updated."))} className="rounded bg-white px-1 py-1 text-[9px] font-bold">{index === 0 ? "Current" : "Cover"}</button>
                    <button type="button" onClick={() => update(item.slug, { removeImagePublicId: image }).then(() => onNotice("Image removed."))} className="rounded bg-white px-1 py-1 text-[9px] font-bold text-red-700">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer justify-center rounded-xl border border-dashed border-[#b8c6b6] px-3 py-3 text-sm font-semibold text-[#40533d] transition hover:bg-[#f6f8f5]">
            {uploading === item.slug ? "Uploading…" : "Add collection image"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(item.slug, e)} />
          </label>
        </div>
      </div>
    </article>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const workspace = (searchParams.get("workspace") === "equipment" ? "equipment" : searchParams.get("workspace") === "plants" ? "plants" : "") as Workspace | "";
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", category: equipmentCategories[0]?.slug ?? "tools", price: "", priceDZD: "", short: "", featured: true });
  const [queue, setQueue] = useState<Record<string, number>>({});

  useEffect(() => {
    if (getParse().User.current()?.get("role") !== "admin") return;
    fetch("/api/marketplace/summary", opts())
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((summary) => setQueue(summary.counts ?? {}))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const user = getParse().User.current();
    if (!user) {
      router.replace(`/${locale}/sign-in`);
      return;
    }
    if (user.get("role") !== "admin") {
      setAllowed(false);
      return;
    }
    setAllowed(true);
    fetch("/api/admin/products", opts())
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setItems)
      .catch(() => setNotice("Could not load the catalog."));
  }, [locale, router]);

  async function update(slug: string, payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/products", opts({ method: "POST", body: JSON.stringify({ slug, ...payload }) }));
    if (!response.ok) throw new Error();
    const saved = await response.json();
    setItems((all) => {
      const exists = all.some((item) => item.slug === slug);
      return exists ? all.map((item) => (item.slug === slug ? { ...item, ...saved } : item)) : [...all, saved];
    });
  }

  async function upload(slug: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(slug);
    try {
      const signed = await fetch("/api/cloudinary/sign", opts({ method: "POST", body: JSON.stringify({ folder: "products" }) }));
      if (!signed.ok) throw new Error();
      const data = await signed.json();
      const uploadForm = new FormData();
      uploadForm.set("file", file);
      uploadForm.set("api_key", data.apiKey);
      uploadForm.set("timestamp", String(data.timestamp));
      uploadForm.set("signature", data.signature);
      uploadForm.set("folder", data.folder);
      const result = await fetch(`https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`, { method: "POST", body: uploadForm }).then((r) => r.json());
      if (!result.public_id) throw new Error();
      await update(slug, { imagePublicId: result.public_id });
      setNotice("Cloudinary collection updated.");
    } catch {
      setNotice("Image upload failed.");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  }

  async function addEquipment(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await fetch("/api/admin/products", opts({
        method: "POST",
        body: JSON.stringify({
          create: true,
          kind: "equipment",
          name: form.name,
          category: form.category,
          price: Number(form.price || 0),
          ...(form.priceDZD ? { priceDZD: Number(form.priceDZD) } : {}),
          short: form.short,
          featured: form.featured,
        }),
      }));
      if (!response.ok) throw new Error();
      const saved = await response.json();
      setItems((all) => [saved, ...all]);
      setForm({ name: "", category: equipmentCategories[0]?.slug ?? "tools", price: "", priceDZD: "", short: "", featured: true });
      setNotice("Equipment added and published.");
    } catch {
      setNotice("Could not add equipment.");
    } finally {
      setCreating(false);
    }
  }

  function openWorkspace(next?: string) {
    if (!next) {
      router.push(`/${locale}/admin`);
      return;
    }
    if (next === "plants" || next === "equipment") {
      router.push(`/${locale}/admin?workspace=${next}`);
      return;
    }
    router.push(`/${locale}/admin/${next}`);
  }

  const visible = useMemo(() => items.filter((item) => item.kind === (workspace || "plant")), [items, workspace]);
  const pending = visible.filter((item) => item.visibilityStatus === "pending");

  if (allowed === null) return <main className="admin-shell network-surface min-h-screen px-6 py-20 text-[#18231b]">Checking administrator access…</main>;
  if (!allowed) {
    return (
      <main className="admin-shell network-surface min-h-screen px-6 py-20 text-[#18231b]">
        <h1 className="text-2xl font-semibold">Administrator access required</h1>
      </main>
    );
  }

  if (!workspace) {
    return (
      <AdminShell active="" onSelect={openWorkspace}>
        <section className="px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-brand text-[#638260]">Tannelli administration</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Operations hub</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607060]">Manage catalog approvals, people, expert verification, fulfilment and platform operations from one connected workspace.</p>
              </div>
              <div className="network-card flex items-center gap-2 rounded-2xl px-4 py-3 text-xs text-[#607060]">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgb(16_185_129_/_0.18)]" />
                {items.filter((item) => item.visibilityStatus === "pending").length} listings awaiting review
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Requests held for moderation", value: queue.requests ?? 0, href: "moderation" },
                { label: "Flagged messages", value: queue.messages ?? 0, href: "moderation" },
                { label: "Experts awaiting verification", value: queue.experts ?? 0, href: "experts" },
              ].map((item) => (
                <button key={item.label} onClick={() => openWorkspace(item.href)} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${item.value ? "border-amber-300 bg-amber-50 text-amber-900" : "border-[#dce5dc] bg-white text-[#607060]"}`}>
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-xl font-semibold">{item.value}</span>
                </button>
              ))}
            </div>
            <div className="relative mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {adminCards.map((card) => (
                <button
                  key={card.key}
                  onClick={() => openWorkspace(card.key)}
                  className="network-card network-card-hover group rounded-[1.75rem] p-5 text-left"
                >
                  <div className="flex items-start justify-between">
                    <span className="network-node grid h-12 w-12 place-items-center border border-[#dce5dc] text-[#40533d]">
                      <AdminIcon name={card.icon} />
                    </span>
                    <span className="text-[#9aaa98] transition group-hover:translate-x-1">↗</span>
                  </div>
                  <h2 className="mt-6 text-base font-semibold">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#687568]">{card.text}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#40533d]">
                    Open workspace
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell active={workspace} onSelect={openWorkspace}>
      <section className="px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => openWorkspace()} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#40533d] transition hover:gap-3">← Overview</button>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-brand text-[#638260]">{workspace === "plants" ? "Plant catalog" : "Popular equipment"}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{workspace === "plants" ? "Plant gallery & expert availability" : "Everything to plant, feed, water and keep it thriving"}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607060]">
                {workspace === "plants"
                  ? "Set prices, upload collection images, choose cover images and control expert availability."
                  : "Add Tannelli equipment, feature it on the homepage, and accept or reject company submissions before they become visible."}
              </p>
            </div>
            <div className="rounded-full bg-[#40533d] px-5 py-3 text-xs font-semibold text-white shadow-[0_14px_36px_rgb(64_83_61_/_0.28)]">
              {visible.length} {workspace}
            </div>
          </div>
          {notice && <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

          {workspace === "equipment" && (
            <form onSubmit={addEquipment} className="network-card mt-8 grid gap-3 rounded-[1.75rem] p-5 sm:grid-cols-2 lg:grid-cols-6">
              <label className="text-xs font-semibold lg:col-span-2">Name<input required value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal" /></label>
              <label className="text-xs font-semibold">Category
                <select value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal">
                  {equipmentCategories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">USD<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal" /></label>
              <label className="text-xs font-semibold">DZD<input type="number" min="0" value={form.priceDZD} onChange={(e) => setForm((current) => ({ ...current, priceDZD: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal" /></label>
              <label className="text-xs font-semibold sm:col-span-2 lg:col-span-4">Short description<input value={form.short} onChange={(e) => setForm((current) => ({ ...current, short: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal" /></label>
              <label className="flex items-center gap-2 text-xs font-semibold lg:col-span-1"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((current) => ({ ...current, featured: e.target.checked }))} className="h-4 w-4 accent-[#40533d]" />Popular</label>
              <button disabled={creating} className="rounded-lg bg-[#40533d] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white lg:col-span-1">{creating ? "Adding…" : "Add equipment"}</button>
            </form>
          )}

          {pending.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Awaiting your approval</h2>
              <p className="mt-1 text-sm text-[#607060]">Provider listings are not visible in the shop until you accept them.</p>
              <div className="mt-4 grid gap-5 xl:grid-cols-2">
                {pending.map((item) => (
                  <CatalogCard key={item.slug} item={item} uploading={uploading} editing={editing} draft={draft} setDraft={setDraft} setEditing={setEditing} update={update} upload={upload} onNotice={setNotice} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {visible.filter((item) => item.visibilityStatus !== "pending").map((item) => (
              <CatalogCard key={item.slug} item={item} uploading={uploading} editing={editing} draft={draft} setDraft={setDraft} setEditing={setEditing} update={update} upload={upload} onNotice={setNotice} />
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

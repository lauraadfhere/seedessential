"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/components/locale-link";
import { PageHero } from "@/components/page-hero";
import { getParse } from "@/lib/parse/client";
import { useI18n } from "@/lib/i18n";
import { categories } from "@/lib/data";
import { cloudinaryImage } from "@/lib/cloudinary-client";
import { buttonClasses } from "@/components/ui";
import { isProviderRole } from "@/lib/roles";
import { algeriaWilayas, algeriaDeliveryNote } from "@/lib/algeria";

type Listing = {
  slug: string;
  name: string;
  category: string;
  price: number;
  priceDzd?: number;
  images: string[];
  short: string;
  originWilaya?: string;
  coverageWilayas?: string[];
  visibilityStatus: "published" | "pending" | "rejected";
};

type Insights = {
  totals: { listings: number; published: number; recommendations: number; demand30d: number };
  products: { slug: string; name: string; recommendations: number; experts: string[]; wilayas: string[]; lastRecommendedAt?: string }[];
  demandByWilaya: { name: string; count: number }[];
  demandByTopic: { name: string; count: number }[];
};

const equipmentCategories = categories.filter((item) => item.kind === "equipment");

function DemandBars({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7d8a7b]">{title}</p>
      {rows.length ? (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.name} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-2 text-xs">
              <span className="truncate font-semibold">{row.name}</span>
              <span className="h-2 overflow-hidden rounded-full bg-[#e3ebe1]"><span className="block h-full rounded-full bg-[#40533d]" style={{ width: `${(row.count / max) * 100}%` }} /></span>
              <span className="text-right text-[#607060]">{row.count}</span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-xs text-[#789078]">No requests in your coverage in the last 30 days.</p>}
    </div>
  );
}

function token() {
  return getParse().User.current()?.getSessionToken() ?? "";
}

function opts(init: RequestInit = {}) {
  return { ...init, headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...(init.headers ?? {}) } };
}

export default function ProviderPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [items, setItems] = useState<Listing[]>([]);
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState("");
  const [form, setForm] = useState({ name: "", category: equipmentCategories[0]?.slug ?? "tools", price: "", priceDZD: "", short: "", originWilaya: "Alger" });
  const [coverage, setCoverage] = useState<string[]>(["Alger"]);
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    const user = getParse().User.current();
    if (!user) {
      router.replace(`/${locale}/sign-in`);
      return;
    }
    if (!isProviderRole(user.get("role"))) {
      setAllowed(false);
      return;
    }
    setAllowed(true);
    fetch("/api/provider/products", opts())
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setItems)
      .catch(() => setNotice("Could not load your equipment list."));
    fetch("/api/provider/insights", opts())
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setInsights)
      .catch(() => undefined);
  }, [locale, router]);

  const recommendationsBySlug = new Map(insights?.products.map((product) => [product.slug, product]) ?? []);

  async function createListing(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await fetch("/api/provider/products", opts({
        method: "POST",
        body: JSON.stringify({
          create: true,
          name: form.name,
          category: form.category,
          price: Number(form.price || 0),
          ...(form.priceDZD ? { priceDZD: Number(form.priceDZD) } : {}),
          short: form.short,
          originWilaya: form.originWilaya,
          coverageWilayas: coverage,
        }),
      }));
      if (!response.ok) throw new Error();
      const saved = await response.json();
      setItems((all) => [saved, ...all]);
      setForm({ name: "", category: equipmentCategories[0]?.slug ?? "tools", price: "", priceDZD: "", short: "", originWilaya: form.originWilaya });
      setNotice("Submitted for administration review. It will stay hidden until Tannelli accepts it.");
    } catch {
      setNotice("Could not submit this listing.");
    } finally {
      setCreating(false);
    }
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
      const response = await fetch("/api/provider/products", opts({ method: "POST", body: JSON.stringify({ slug, imagePublicId: result.public_id }) }));
      if (!response.ok) throw new Error();
      const saved = await response.json();
      setItems((all) => all.map((item) => (item.slug === slug ? { ...item, ...saved } : item)));
      setNotice("Image added. The listing returned to review until administration accepts the update.");
    } catch {
      setNotice("Image upload failed.");
    } finally {
      setUploading("");
      event.target.value = "";
    }
  }

  if (allowed === null) return <main className="network-surface section py-20">Checking provider access…</main>;
  if (!allowed) {
    return (
      <main className="network-surface section py-20">
        <h1 className="text-2xl font-semibold">Provider access required</h1>
        <p className="mt-3 max-w-xl text-[#607060]">Register as a company provider to submit equipment. Listings are reviewed by Tannelli before they appear in the shop.</p>
        <Link href="/sign-up" className="mt-6 inline-block text-sm font-bold text-[#40533d]">Create a provider account →</Link>
      </main>
    );
  }

  return (
    <main className="network-surface">
      <PageHero eyebrow="Equipment providers" title="Your equipment list" text="Add the tools, soil, irrigation and care products you supply. Choose the Algerian wilayas you sell from and deliver to — Tannelli reviews every listing before shoppers can see it." />
      <section className="section py-10">
        {notice && <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        {insights && (
          <div className="mb-8 grid gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))]">
            {[
              { label: "Listings", value: insights.totals.listings, hint: `${insights.totals.published} visible in shop` },
              { label: "Expert recommendations", value: insights.totals.recommendations, hint: "Your products prescribed to growers" },
              { label: "Grower demand · 30 days", value: insights.totals.demand30d, hint: "Requests in your delivery wilayas" },
              { label: "Top recommended", value: insights.products[0]?.recommendations ? insights.products[0].name : "—", hint: insights.products[0]?.recommendations ? `${insights.products[0].recommendations} recommendations` : "Not yet recommended" },
            ].map((card, index) => (
              <div key={card.label} className={`rounded-2xl border p-5 ${index === 1 ? "border-[#40533d] bg-[#40533d] text-white" : "border-[#e3e9e1] bg-white"}`}>
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${index === 1 ? "text-white/70" : "text-[#7d8a7b]"}`}>{card.label}</p>
                <p className="mt-3 truncate text-2xl font-semibold">{card.value}</p>
                <p className={`mt-1 text-sm ${index === 1 ? "text-white/75" : "text-[#607060]"}`}>{card.hint}</p>
              </div>
            ))}
            <div className="network-card grid gap-6 rounded-[1.5rem] p-5 sm:grid-cols-2 lg:col-span-4">
              <DemandBars title="Where growers need help" rows={insights.demandByWilaya} />
              <DemandBars title="What they ask about" rows={insights.demandByTopic} />
            </div>
          </div>
        )}
        <form onSubmit={createListing} className="network-card grid gap-3 rounded-[1.75rem] p-5 sm:grid-cols-2 lg:grid-cols-6">
          <label className="text-xs font-semibold lg:col-span-2">Equipment name<input required value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Category
            <select value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal">
              {equipmentCategories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold">USD<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">DZD<input type="number" min="0" value={form.priceDZD} onChange={(e) => setForm((current) => ({ ...current, priceDZD: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Ships from
            <select value={form.originWilaya} onChange={(e) => setForm((current) => ({ ...current, originWilaya: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal">
              {algeriaWilayas.map((wilaya) => <option key={wilaya.code} value={wilaya.name}>{wilaya.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold sm:col-span-2 lg:col-span-5">Short description<input value={form.short} onChange={(e) => setForm((current) => ({ ...current, short: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal" /></label>
          <div className="sm:col-span-2 lg:col-span-6">
            <p className="text-xs font-semibold">Deliver to wilayas</p>
            <p className="mt-1 text-[11px] text-[#607060]">{algeriaDeliveryNote} Same coverage model as experts.</p>
            <div className="mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
              {algeriaWilayas.map((wilaya) => (
                <button type="button" key={wilaya.code} onClick={() => setCoverage((current) => current.includes(wilaya.name) ? current.filter((item) => item !== wilaya.name) : [...current, wilaya.name])} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${coverage.includes(wilaya.name) ? "bg-[#40533d] text-white" : "border border-[#dce5dc] text-[#40533d]"}`}>
                  {wilaya.name}
                </button>
              ))}
            </div>
          </div>
          <button disabled={creating} className={`${buttonClasses({ shape: "rect" })} lg:col-span-1`}>{creating ? "Sending…" : "Submit for review"}</button>
        </form>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.slug} className="network-card overflow-hidden rounded-[1.75rem]">
              <div className="grid sm:grid-cols-[8rem_1fr]">
                <div className="aspect-square bg-[#eef3ed]">
                  {item.images[0] ? <img src={cloudinaryImage(item.images[0], { width: 320, height: 320 })} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="p-5">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.visibilityStatus === "published" ? "bg-emerald-50 text-emerald-800" : item.visibilityStatus === "pending" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}>{item.visibilityStatus === "published" ? "Visible in shop" : item.visibilityStatus === "pending" ? "Waiting for Tannelli" : "Not accepted"}</span>
                  <h2 className="mt-3 font-semibold">{item.name}</h2>
                  <p className="mt-1 text-sm text-[#607060]">{item.short || "No description yet."}</p>
                  <p className="mt-2 text-sm font-semibold">${item.price}{item.priceDzd ? ` · ${item.priceDzd} DZD` : ""}</p>
                  {item.originWilaya && <p className="mt-1 text-xs text-[#789078]">Ships from {item.originWilaya}{(item.coverageWilayas?.length ?? 0) > 0 ? ` · ${item.coverageWilayas?.length} wilayas` : ""}</p>}
                  {(recommendationsBySlug.get(item.slug)?.recommendations ?? 0) > 0 && (
                    <p className="mt-2 rounded-lg bg-[#eaf0e8] px-2.5 py-1.5 text-xs font-semibold text-[#263b2d]">
                      ✦ Recommended {recommendationsBySlug.get(item.slug)!.recommendations}× by {recommendationsBySlug.get(item.slug)!.experts.join(", ") || "experts"}
                    </p>
                  )}
                  <label className="mt-4 inline-flex cursor-pointer text-sm font-bold text-[#40533d]">
                    {uploading === item.slug ? "Uploading…" : "Add photo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(item.slug, e)} />
                  </label>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

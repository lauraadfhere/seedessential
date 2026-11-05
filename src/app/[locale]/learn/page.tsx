"use client";

import { useMemo, useState } from "react";
import { Link } from "@/components/locale-link";
import { PageHero } from "@/components/page-hero";
import { guides } from "@/lib/data";

const filters = ["All guides", "Plant care", "Urban gardening", "Irrigation", "Seasonal planting"];

export default function Learn() {
  const [active, setActive] = useState("All guides");
  const visibleGuides = useMemo(() => active === "All guides" ? guides : guides.filter((guide) => guide.category.toLowerCase().includes(active.split(" ")[0].toLowerCase()) || guide.title.toLowerCase().includes(active.split(" ")[0].toLowerCase())), [active]);
  return <main><PageHero eyebrow="Knowledge center" title="Learn as you grow" text="Clear, practical guides for every season, space and skill level." /><section className="section py-12"><div className="mb-7 flex gap-2 overflow-auto" aria-label="Guide categories">{filters.map((filter) => <button key={filter} type="button" onClick={() => setActive(filter)} aria-pressed={active === filter} className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${active === filter ? "border-[#40533d] bg-[#40533d] text-white" : "hover:border-[#40533d]"}`}>{filter}</button>)}</div>{visibleGuides.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visibleGuides.map((guide) => <Link href={`/learn/${guide.slug}`} key={guide.slug} className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{guide.category} · {guide.minutes} min read</p><h2 className="mt-3 text-xl font-semibold">{guide.title}</h2><p className="mt-3 text-sm leading-relaxed text-neutral-600">{guide.excerpt}</p><p className="mt-6 text-sm font-semibold underline">Read guide</p></Link>)}</div> : <div className="rounded-2xl border border-dashed p-10 text-center"><p className="font-semibold">No guides in this category yet.</p><button type="button" onClick={() => setActive("All guides")} className="mt-3 text-sm font-semibold underline">Show all guides</button></div>}</section></main>;
}

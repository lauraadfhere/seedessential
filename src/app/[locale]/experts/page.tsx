"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/components/locale-link";
import { Button, Stars, cn } from "@/components/ui";
import { Avatar, EmptyState } from "@/components/marketplace";
import { TrustBadge } from "@/components/trust";
import { SearchIcon } from "@/components/icons";
import { algeriaWilayas } from "@/lib/algeria";
import { consultationTypes } from "@/lib/data";
import type { ExpertSummary } from "@/lib/marketplace-types";

const topics = [
  { value: "", label: "All experts" },
  { value: "agronom", label: "Agronomy" },
  { value: "irrigation", label: "Irrigation" },
  { value: "landscap", label: "Landscaping" },
  { value: "soil", label: "Soil" },
  { value: "pest", label: "Pests & diseases" },
  { value: "indoor", label: "Indoor & urban" },
  { value: "greenhouse", label: "Greenhouse" },
];

export default function ExpertsPage() {
  return (
    <Suspense fallback={<main className="network-surface section py-20 text-sm text-[#607060]">Loading experts…</main>}>
      <ExpertsDirectory />
    </Suspense>
  );
}

function ExpertsDirectory() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<{ key: string; list: ExpertSummary[]; failed: boolean } | null>(null);
  const [topic, setTopic] = useState("");
  const [wilaya, setWilaya] = useState(searchParams.get("wilaya") ?? "");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sort, setSort] = useState<"rating" | "experience" | "price" | "trust">("trust");

  const requestKey = new URLSearchParams({ ...(wilaya ? { wilaya } : {}), ...(onlineOnly ? { online: "1" } : {}) }).toString();
  const experts = result?.key === requestKey ? result.list : null;
  const failed = result?.key === requestKey && result.failed;

  useEffect(() => {
    fetch(`/api/experts?${requestKey}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((list: ExpertSummary[]) => setResult({ key: requestKey, list, failed: false }))
      .catch(() => setResult({ key: requestKey, list: [], failed: true }));
  }, [requestKey]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (experts ?? [])
      .filter((expert) => {
        const haystack = [expert.name, expert.professionalCategory, expert.bio, ...expert.specialties].join(" ").toLowerCase();
        return (!topic || haystack.includes(topic)) && (!term || haystack.includes(term));
      })
      .sort((a, b) => {
        if (sort === "trust") return (b.trustScore ?? 0) - (a.trustScore ?? 0) || b.rating - a.rating;
        if (sort === "rating") return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
        if (sort === "experience") return b.experienceYears - a.experienceYears;
        return a.consultationPrice - b.consultationPrice;
      });
  }, [experts, query, sort, topic]);

  return (
    <main className="network-surface">
      <section className="section py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-[#607060]">
            Verified agronomists, irrigation engineers and plant-care specialists across Algeria — online or on site in their wilayas.
          </p>
          <Link href="/experts/request" className="inline-flex shrink-0 items-center justify-center bg-[#40533d] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#334532]">
            Post a request
          </Link>
        </div>

        <div className="ui-card mt-6 p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_12rem_auto]">
            <label className="ui-field flex items-center gap-2 !py-0">
              <SearchIcon className="h-4 w-4 text-[#789078]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, crop, specialty…" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
            </label>
            <select value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="ui-field">
              <option value="">All wilayas</option>
              {algeriaWilayas.map((item) => <option key={item.code} value={item.name}>{item.code} · {item.name}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="ui-field">
              <option value="trust">Most trusted</option>
              <option value="rating">Top rated</option>
              <option value="experience">Most experienced</option>
              <option value="price">Lowest price</option>
            </select>
            <label className="ui-field flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="h-4 w-4 accent-[#40533d]" /> Online
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map((item) => (
              <button key={item.label} type="button" onClick={() => setTopic(item.value)} className={cn("border px-3.5 py-1.5 text-xs font-semibold transition", topic === item.value ? "border-[#40533d] bg-[#40533d] text-white" : "border-[#dce5dc] bg-white text-[#40533d] hover:border-[#40533d]")}>{item.label}</button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-[#607060]">{experts === null ? "Loading experts…" : `${visible.length} verified expert${visible.length === 1 ? "" : "s"}${wilaya ? ` covering ${wilaya}` : ""}`}</p>

        {experts === null ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((key) => <div key={key} className="ui-card h-64 animate-pulse" />)}</div>
        ) : visible.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((expert) => (
              <article key={expert.id} className="ui-card flex flex-col p-5 transition hover:border-[#40533d]/40">
                <Link href={`/experts/${expert.slug}`} className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Avatar src={expert.avatar} name={expert.name} className="h-14 w-14 text-base" />
                    <div className="flex flex-col items-end gap-1">
                      <TrustBadge tier={expert.trustTier ?? "new"} score={expert.trustScore} compact />
                      {expert.online && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Online</span>}
                    </div>
                  </div>
                  <h2 className="mt-4 font-semibold text-[#18231b]">{expert.name}</h2>
                  <p className="text-sm text-[#607060]">{expert.professionalCategory}</p>
                  <p className="mt-1 text-xs font-semibold text-[#40533d]">{expert.location || "Algeria"}{expert.experienceYears ? ` · ${expert.experienceYears} yrs` : ""}</p>
                  {expert.specialties.length > 0 && <p className="mt-3 line-clamp-2 text-sm text-[#607060]">{expert.specialties.slice(0, 3).join(" · ")}</p>}
                  {expert.coverageWilayas.length > 0 && <p className="mt-2 text-[11px] leading-4 text-[#789078]">Covers {expert.coverageWilayas.slice(0, 3).join(", ")}{expert.coverageWilayas.length > 3 ? ` +${expert.coverageWilayas.length - 3}` : ""}</p>}
                </Link>
                <div className="mt-5 flex items-center justify-between border-t border-[#e6ede5] pt-4">
                  <span className="text-sm"><Stars rating={expert.rating} /> <span className="text-xs text-[#789078]">({expert.reviewsCount})</span></span>
                  <Link href={`/experts/request?expert=${expert.slug}`} className="bg-[#40533d] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">Ask</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title={failed ? "The expert directory is temporarily unavailable" : "No expert matches these filters yet"}
              text="Post your request anyway — it reaches every verified expert covering your wilaya, plus online experts across Algeria."
              action={<Button href="/experts/request" shape="rect">Post a request</Button>}
            />
          </div>
        )}
      </section>

      <section className="border-y border-[#e4ebe3] bg-white py-12">
        <div className="section">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#789078]">How growers work with experts</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {consultationTypes.map((c) => (
              <div className="ui-card p-5" key={c.name}>
                <h3 className="font-semibold text-[#18231b]">{c.name}</h3>
                <p className="mt-1 text-sm text-[#607060]">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

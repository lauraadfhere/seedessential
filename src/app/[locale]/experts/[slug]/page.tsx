"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Stars } from "@/components/ui";
import { Link } from "@/components/locale-link";
import { Avatar, EmptyState, Notice, StarInput, timeAgo } from "@/components/marketplace";
import { RichEditor } from "@/components/rich-editor";
import { api, ApiError } from "@/lib/api-client";
import type { ExpertSummary } from "@/lib/marketplace-types";

type Review = { id: string; rating: number; body: string; author: string; createdAt?: string };
type Profile = {
  expert: ExpertSummary;
  reviews: Review[];
  summary: { average: number; count: number; distribution: { stars: number; count: number }[] };
  eligibility: { signedIn: boolean; canReview: boolean };
};

export default function ExpertProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Profile | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  const load = useCallback(() => {
    return api<Profile>(`/api/experts/${encodeURIComponent(slug)}`)
      .then(setData)
      .catch(() => setData(null));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    if (rating < 1) return setMessage({ tone: "error", text: "Choose a rating from 1 to 5 stars." });
    setSaving(true);
    setMessage(null);
    try {
      const result = await api<{ status: "published" | "pending" }>(`/api/experts/${encodeURIComponent(slug)}`, { method: "POST", json: { rating, body } });
      setMessage({
        tone: result.status === "published" ? "success" : "info",
        text: result.status === "published" ? "Thank you! Your review is now public." : "Thank you! Your review will appear once our team has checked it.",
      });
      setRating(0);
      setBody("");
      await load();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof ApiError ? error.message : "Could not save your review" });
    } finally {
      setSaving(false);
    }
  }

  if (data === undefined) return <main className="network-surface section py-20 text-sm text-[#607060]">Loading expert…</main>;
  if (data === null) return <main className="network-surface section py-16"><EmptyState title="Expert not found" text="This profile is unavailable or awaiting verification." action={<Button href="/experts" shape="rect">Browse experts</Button>} /></main>;

  const { expert, reviews, summary, eligibility } = data;
  return (
    <main className="network-surface">
      <section className="border-b bg-white/80">
        <div className="section grid gap-7 py-12 md:grid-cols-[auto_1fr_auto] md:items-center">
          <Avatar src={expert.avatar} name={expert.name} className="h-24 w-24 text-xl ring-4 ring-[#eaf0e8]" />
          <div>
            <p className="text-sm font-semibold text-[#638260]">{expert.professionalCategory}</p>
            <h1 className="mt-1 text-3xl font-semibold">{expert.name}</h1>
            <p className="mt-1 text-neutral-600">{[expert.experienceYears ? `${expert.experienceYears} years experience` : "", expert.location, expert.online ? "Online consultations" : ""].filter(Boolean).join(" · ")}</p>
            <div className="mt-3 flex items-center gap-3 text-sm"><Stars rating={expert.rating} /><span>{expert.reviewsCount} reviews</span><span className="text-neutral-400">·</span><span>{expert.completedRequests} requests solved</span></div>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <Button href={`/experts/request?expert=${expert.slug}`} shape="rect">Request {expert.name.split(" ")[0]}</Button>
            {expert.consultationPrice > 0 && <p className="text-sm text-[#607060]">From {new Intl.NumberFormat("fr-DZ").format(expert.consultationPrice)} DA</p>}
          </div>
        </div>
      </section>
      <section className="section grid gap-10 py-12 lg:grid-cols-[1.3fr_.7fr]">
        <div>
          <h2 className="text-2xl font-semibold">About {expert.name.split(" ")[0]}</h2>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-neutral-600">{expert.bio || "This expert hasn't written a bio yet."}</p>
          {expert.specialties.length > 0 && (
            <>
              <h3 className="mt-8 font-semibold">Specialisations</h3>
              <div className="mt-3 flex flex-wrap gap-2">{expert.specialties.map((item) => <span key={item} className="rounded-full bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{item}</span>)}</div>
            </>
          )}

          <h3 className="mt-10 font-semibold">Reviews from growers</h3>
          <div className="network-card mt-4 rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-3xl font-semibold">{summary.count ? summary.average.toFixed(1) : "–"}</p>
              <div className="text-sm text-[#607060]">
                <Stars rating={summary.average} />
                <p className="mt-1">{summary.count} published {summary.count === 1 ? "review" : "reviews"}, each from a grower whose consultation was completed.</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-xs text-[#607060]">
              {summary.distribution.map((row) => (
                <li key={row.stars} className="flex items-center gap-3">
                  <span className="w-10">{row.stars} ★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef3ee]"><span className="block h-full bg-amber-400" style={{ width: summary.count ? `${(row.count / summary.count) * 100}%` : "0%" }} /></span>
                  <span className="w-6 text-right">{row.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[#789078]">Reviews are checked before they go public. Contact details and links are removed automatically.</p>
          </div>

          {eligibility.canReview && (
            <form onSubmit={submitReview} className="network-card mt-4 space-y-4 rounded-2xl p-5">
              <div>
                <p className="font-semibold">Share your experience</p>
                <p className="mt-1 text-sm text-[#607060]">You worked with {expert.name.split(" ")[0]} on a completed consultation. Your review helps other growers choose.</p>
              </div>
              <StarInput value={rating} onChange={setRating} />
              <RichEditor value={body} onChange={setBody} maxLength={1000} placeholder="What went well, and what could be better?" rows={4} />
              {message && <Notice tone={message.tone}>{message.text}</Notice>}
              <button type="submit" disabled={saving} className="rounded-xl bg-[#40533d] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Sending…" : "Publish review"}</button>
            </form>
          )}
          {!eligibility.canReview && message && <div className="mt-4"><Notice tone={message.tone}>{message.text}</Notice></div>}
          {!eligibility.canReview && !eligibility.signedIn && (
            <p className="mt-4 text-sm text-[#607060]">Sign in to leave a review after a completed consultation.</p>
          )}

          <div className="mt-6 space-y-3">
            {reviews.length ? reviews.map((review) => (
              <div key={review.id} className="network-card rounded-2xl p-4">
                <p className="text-sm font-semibold text-amber-600">{"★".repeat(review.rating)}<span className="ml-2 text-xs font-normal text-[#789078]">{review.author} · {timeAgo(review.createdAt)}</span></p>
                {review.body && <p className="mt-2 text-sm text-[#38463a]">{review.body}</p>}
              </div>
            )) : <p className="text-sm text-[#789078]">No reviews yet.</p>}
          </div>
        </div>
        <aside className="network-card h-fit rounded-2xl p-6">
          <h2 className="font-semibold">Coverage</h2>
          <p className="mt-2 text-sm text-[#607060]">{expert.online ? "Accepts online requests from all 58 wilayas." : "On-site requests only."}</p>
          {expert.coverageWilayas.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{expert.coverageWilayas.map((item) => <span key={item} className="rounded-full border border-[#dce5dc] px-2.5 py-1 text-xs font-semibold text-[#40533d]">{item}</span>)}</div>}
          {expert.languages.length > 0 && <p className="mt-5 text-sm"><span className="font-semibold">Languages:</span> {expert.languages.join(", ")}</p>}
          <Link href={`/experts/request?expert=${expert.slug}`} className="mt-6 block rounded-xl bg-[#40533d] px-4 py-3 text-center text-sm font-bold text-white">Send a detailed request</Link>
        </aside>
      </section>
    </main>
  );
}

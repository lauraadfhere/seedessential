"use client";

import { FormEvent, useEffect, useState } from "react";
import { getParse } from "@/lib/parse/client";
import { RequireAuth } from "@/components/require-auth";
import { CLAIM_SUBJECTS, ClaimSubject } from "@/lib/claims-types";

type Claim = {
  id: string;
  targetType: string;
  targetName: string;
  subject: string;
  body: string;
  status: string;
  resolution: string;
  createdAt?: string;
};

const token = () => getParse().User.current()?.getSessionToken() ?? "";

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Under moderation", tone: "bg-neutral-100 text-neutral-700 ring-neutral-200" },
  open: { label: "Received", tone: "bg-amber-50 text-amber-900 ring-amber-200" },
  in_review: { label: "Under review", tone: "bg-sky-50 text-sky-800 ring-sky-200" },
  resolved: { label: "Resolved", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  rejected: { label: "Closed — not upheld", tone: "bg-neutral-100 text-neutral-700 ring-neutral-200" },
};

const SUBJECT_ICONS: Record<ClaimSubject, string> = {
  order: "M5 7h14v13H5zM8 7V5h8v2M8 11h8",
  request: "M4 5h16v11H9l-5 4V5ZM8 9h8M8 12h5",
  listing: "M4 8l8-4 8 4v8l-8 4-8-4V8ZM4 8l8 4 8-4M12 12v8",
  expert: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21c0-3.9 3.1-7 7-7s7 3.1 7 7",
};

function SubjectIcon({ subject, className = "h-5 w-5" }: { subject: ClaimSubject; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={SUBJECT_ICONS[subject]} />
    </svg>
  );
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [subject, setSubject] = useState<ClaimSubject>("order");
  const [targetName, setTargetName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  function load() {
    return fetch("/api/complaints", { headers: { Authorization: `Bearer ${token()}` } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load failed"))))
      .then((data: Claim[]) => setClaims(data))
      .catch(() => setNotice("Could not load your claims. Please refresh the page."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setNotice("");
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: subject === "expert" || subject === "request" ? "service" : "product",
          targetName,
          subject: title,
          body,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not send your claim.");
      setTargetName("");
      setTitle("");
      setBody("");
      setNotice("Your claim was received. Tannelli will review the evidence and reply here.");
      setLoading(true);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send your claim.");
    } finally {
      setSending(false);
    }
  }

  const current = CLAIM_SUBJECTS.find((item) => item.value === subject);

  return (
    <RequireAuth loadingLabel="Opening claims…">
      <main className="network-surface pb-16">
        <section className="tmpl-hero">
          <div className="tmpl-rail py-9 sm:py-11">
            <h1 className="tmpl-hero-title">Claims</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">
              Open a claim when something goes wrong between a grower, an expert or a seller. Tannelli reviews evidence from both sides.
            </p>
          </div>
        </section>
        <nav className="tmpl-crumbs" aria-label="Breadcrumb">
          <a href="/" className="text-link hover:underline">Home</a>
          <span className="mx-1.5 text-[#9aab96]">›</span>
          <span className="text-[#243322]">Claims</span>
        </nav>

        <section className="tmpl-rail pb-10">
          {notice && <p role="status" className="tmpl-notice mb-5">{notice}</p>}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {CLAIM_SUBJECTS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setSubject(item.value)}
                aria-pressed={subject === item.value}
                className={`tmpl-panel p-5 text-left transition ${subject === item.value ? "border-[#40533d] ring-2 ring-[#40533d]/20" : "hover:border-[#40533d]/40"}`}
              >
                <span className="grid h-10 w-10 place-items-center bg-[#40533d]/10 text-[#40533d]">
                  <SubjectIcon subject={item.value} />
                </span>
                <h2 className="mt-4 font-semibold text-[#18231b]">{item.label}</h2>
                <p className="mt-1 text-sm text-[#607060]">{item.help}</p>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="tmpl-panel mt-6">
            <div className="tmpl-panel-head flex items-center gap-3">
              <SubjectIcon subject={subject} className="h-5 w-5 text-[#40533d]" />
              <span>File a claim: {current?.label.toLowerCase()}</span>
            </div>
            <div className="tmpl-panel-body grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#18231b]">
                Name of the product, service or expert
                <input required value={targetName} onChange={(e) => setTargetName(e.target.value)} className="ui-field mt-1" />
              </label>
              <label className="text-xs font-semibold text-[#18231b]">
                Subject
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" className="ui-field mt-1" />
              </label>
              <label className="text-xs font-semibold text-[#18231b] sm:col-span-2">
                Describe what happened
                <textarea required rows={4} value={body} onChange={(e) => setBody(e.target.value)} className="ui-field mt-1" />
              </label>
              <div className="sm:col-span-2">
                <button disabled={sending} className="bg-[#40533d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#30412e] disabled:opacity-60">
                  {sending ? "Sending…" : "Submit claim"}
                </button>
              </div>
            </div>
          </form>

          <h2 className="tmpl-section-title mt-10">Your claims</h2>
          <div className="mt-4 tmpl-list">
            {loading && claims.length === 0 && <div className="tmpl-list-row text-sm text-[#607060]">Loading your claims…</div>}
            {!loading && claims.length === 0 && <div className="tmpl-list-row text-sm text-[#607060]">You have no claims yet.</div>}
            {claims.map((claim) => {
              const meta = STATUS_LABELS[claim.status] ?? { label: claim.status, tone: "bg-neutral-100 text-neutral-700 ring-neutral-200" };
              const subjectKey: ClaimSubject = claim.targetType === "service" ? "expert" : "listing";
              return (
                <article key={claim.id} className="tmpl-list-row">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center bg-[#40533d]/10 text-[#40533d]">
                        <SubjectIcon subject={subjectKey} className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-[#18231b]">{claim.subject}</h3>
                        <p className="text-xs text-[#607060]">{claim.targetName}{claim.createdAt ? ` · ${new Date(claim.createdAt).toLocaleDateString()}` : ""}</p>
                      </div>
                    </div>
                    <span className={`tmpl-chip ring-1 ${meta.tone}`}>{meta.label}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#405040]">{claim.body}</p>
                  {claim.resolution && <p className="mt-3 border border-rule bg-panel p-3 text-sm text-[#18231b]"><span className="font-semibold">Decision:</span> {claim.resolution}</p>}
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}

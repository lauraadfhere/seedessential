"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { browserSessionToken, fetchMe } from "@/lib/appwrite/browser-auth";
import { useI18n } from "@/lib/i18n";
import { AdminPageBar } from "@/components/header-parts";

type AdminClaim = {
  id: string;
  targetType: string;
  targetName: string;
  subject: string;
  body: string;
  status: string;
  resolution: string;
  createdAt?: string;
};

const STATUSES = ["open", "in_review", "resolved", "rejected"];
const STATUS_LABELS: Record<string, string> = {
  open: "Received",
  in_review: "Under review",
  resolved: "Resolved",
  rejected: "Closed — not upheld",
  pending: "Under moderation",
};
const STATUS_TONES: Record<string, string> = {
  open: "bg-amber-50 text-amber-900 ring-amber-200",
  in_review: "bg-sky-50 text-sky-800 ring-sky-200",
  resolved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  pending: "bg-neutral-100 text-neutral-700 ring-neutral-200",
};
const token = () => browserSessionToken();

export function AdminClaimsPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [filter, setFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetchMe().then((user) => {
      if (!user) return router.replace(`/${locale}/sign-in`);
      if (user.role !== "admin") return router.replace(`/${locale}/dashboard`);
      fetch("/api/complaints", { headers: { Authorization: `Bearer ${token()}` } })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load failed"))))
        .then((data: AdminClaim[]) => setClaims(data))
        .catch(() => setNotice("Could not load claims. Please refresh the page."))
        .finally(() => setLoading(false));
    });
  }, [locale, router]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    claims.forEach((claim) => {
      result[claim.status] = (result[claim.status] ?? 0) + 1;
    });
    return result;
  }, [claims]);

  const visible = filter ? claims.filter((claim) => claim.status === filter) : claims;

  async function update(claim: AdminClaim, status: string) {
    setBusy(claim.id);
    setNotice("");
    try {
      const resolution = drafts[claim.id] ?? claim.resolution;
      const response = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: claim.id, status, resolution }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Update failed");
      setClaims((current) => current.map((item) => (item.id === claim.id ? { ...item, status, resolution } : item)));
      setNotice("Claim updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The change could not be saved.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="network-surface min-h-screen py-10">
      <section className="section max-w-6xl">
        <AdminPageBar />
        <p className="mt-8 text-xs font-bold uppercase tracking-brand text-[#638260]">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold">Claims & support</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">Review customer claims, record the decision and close cases with a clear resolution note.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? "" : status)}
              className={`network-card p-4 text-left ${filter === status ? "border-[#40533d]" : ""}`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{STATUS_LABELS[status]}</p>
              <p className="mt-1 text-2xl font-semibold text-[#40533d]">{counts[status] ?? 0}</p>
            </button>
          ))}
        </div>

        {notice && <p role="status" className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

        <div className="mt-6 grid gap-4">
          {loading && claims.length === 0 && <p className="text-sm text-neutral-500">Loading claims…</p>}
          {!loading && visible.length === 0 && <p className="text-sm text-neutral-500">No claims to show.</p>}
          {visible.map((claim) => (
            <article key={claim.id} className="network-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-neutral-900">{claim.subject}</h2>
                  <p className="text-xs text-neutral-500">
                    {claim.targetType === "service" ? "Expert / service" : "Product"}: {claim.targetName}
                    {claim.createdAt ? ` · ${new Date(claim.createdAt).toLocaleDateString(locale)}` : ""}
                  </p>
                </div>
                <span className={`border px-3 py-1 text-[11px] font-bold ring-1 ${STATUS_TONES[claim.status] ?? STATUS_TONES.pending}`}>
                  {STATUS_LABELS[claim.status] ?? claim.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-700">{claim.body}</p>
              <label className="mt-4 block text-xs font-semibold text-neutral-700">
                Resolution note
                <textarea
                  rows={2}
                  value={drafts[claim.id] ?? claim.resolution}
                  onChange={(e) => setDrafts((current) => ({ ...current, [claim.id]: e.target.value }))}
                  className="ui-field mt-1 text-sm font-normal"
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.filter((status) => status !== claim.status).map((status) => (
                  <button
                    key={status}
                    disabled={busy === claim.id}
                    onClick={() => update(claim, status)}
                    className="border border-[#40533d]/30 px-3 py-2 text-xs font-bold text-[#40533d] transition hover:bg-[#40533d] hover:text-white disabled:opacity-50"
                  >
                    Mark as {STATUS_LABELS[status].toLowerCase()}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

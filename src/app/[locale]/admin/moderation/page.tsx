"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { Link } from "@/components/locale-link";
import { EmptyState, Notice, RequestCard, StatCard, Tabs, timeAgo } from "@/components/marketplace";
import { api } from "@/lib/api-client";
import { MODERATION_FLAG_LABELS } from "@/lib/moderation";
import type { RequestMessage, RequestRecord } from "@/lib/marketplace-types";

type FlaggedMessage = RequestMessage & { flags: string[]; requestId?: string; requestTitle: string };
type PendingReview = { id: string; rating: number; body: string; author: string; expert: string; createdAt?: string };
type Queue = { requests: RequestRecord[]; flaggedRequests: RequestRecord[]; messages: FlaggedMessage[]; reviews: PendingReview[] };
type Tab = "held" | "flagged" | "messages" | "reviews" | "all";

const flagText = (flags: string[]) => flags.map((flag) => MODERATION_FLAG_LABELS[flag] ?? flag).join(" · ");

function ModerationDesk() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [all, setAll] = useState<RequestRecord[]>([]);
  const [tab, setTab] = useState<Tab>("held");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(
    () =>
      Promise.all([api<Queue>("/api/admin/moderation"), api<RequestRecord[]>("/api/expert-requests")])
        .then(([next, everything]) => {
          setQueue(next);
          setAll(everything);
        })
        .catch((reason) => setNotice(reason instanceof Error ? reason.message : "Could not load the moderation queue.")),
    [],
  );
  useEffect(() => { void load(); }, [load]);

  async function act(key: string, run: () => Promise<unknown>, message: string) {
    setBusy(key);
    try {
      await run();
      setNotice(message);
      await load();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Action failed.");
    } finally {
      setBusy("");
    }
  }

  const requestAction = (request: RequestRecord, action: "approve" | "reject") => {
    const note = action === "reject" ? window.prompt("Reason shown to the grower:", "This request does not meet the community guidelines.") : "";
    if (note === null) return;
    void act(request.id, () => api(`/api/expert-requests/${request.id}`, { method: "PATCH", json: { action, note } }), action === "approve" ? "Request approved and visible to experts." : "Request rejected.");
  };

  if (!queue) return <main className="network-surface section py-20 text-sm text-[#607060]">{notice || "Loading moderation queue…"}</main>;

  const button = "rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50";
  return (
    <main className="network-surface min-h-screen py-10">
      <section className="section max-w-6xl space-y-6">
        <Link href="/admin" className="text-sm font-bold text-[#40533d]">← Administration hub</Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-brand text-[#638260]">Trust & safety</p>
          <h1 className="mt-2 text-3xl font-semibold">Marketplace moderation</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#607060]">Requests, conversations and reviews are screened automatically. Contact details are masked; abusive or spam content is held here for a decision.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Held requests" value={queue.requests.length} hint="Hidden from experts" accent={queue.requests.length > 0} />
          <StatCard label="Flagged requests" value={queue.flaggedRequests.length} hint="Published, contact info masked" />
          <StatCard label="Flagged messages" value={queue.messages.length} hint="Auto-flagged or reported" />
          <StatCard label="Reviews to check" value={queue.reviews.length} hint="Held before publishing" />
        </div>
        {notice && <Notice>{notice}</Notice>}
        <Tabs value={tab} onChange={setTab} items={[
          { value: "held", label: "Held", count: queue.requests.length },
          { value: "flagged", label: "Flagged", count: queue.flaggedRequests.length },
          { value: "messages", label: "Messages", count: queue.messages.length },
          { value: "reviews", label: "Reviews", count: queue.reviews.length },
          { value: "all", label: "All requests", count: all.length },
        ]} />

        {tab === "held" && (queue.requests.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {queue.requests.map((request) => (
              <RequestCard key={request.id} request={request} footer={
                <div className="space-y-2">
                  <p className="text-[11px] text-amber-800">{flagText(request.moderationFlags) || "Manual review"}</p>
                  <div className="flex gap-2">
                    <button disabled={busy === request.id} onClick={() => requestAction(request, "approve")} className={`${button} bg-[#40533d] text-white`}>Approve</button>
                    <button disabled={busy === request.id} onClick={() => requestAction(request, "reject")} className={`${button} border border-red-200 text-red-700`}>Reject</button>
                  </div>
                </div>
              } />
            ))}
          </div>
        ) : <EmptyState title="Nothing held" text="New requests that trip the abuse or spam filters will appear here." />)}

        {tab === "flagged" && (queue.flaggedRequests.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {queue.flaggedRequests.map((request) => (
              <RequestCard key={request.id} request={request} footer={
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-[#607060]">{flagText(request.moderationFlags)}</p>
                  <div className="flex shrink-0 gap-1">
                    <button disabled={busy === request.id} onClick={() => act(request.id, () => api("/api/admin/moderation", { method: "POST", json: { type: "requestFlags", id: request.id, action: "dismiss" } }), "Marked as reviewed.")} className={`${button} border border-[#cfdccb] text-[#40533d]`}>OK</button>
                    <button disabled={busy === request.id} onClick={() => requestAction(request, "reject")} className={`${button} border border-red-200 text-red-700`}>Reject</button>
                  </div>
                </div>
              } />
            ))}
          </div>
        ) : <EmptyState title="No flagged requests" />)}

        {tab === "messages" && (queue.messages.length ? (
          <div className="space-y-3">
            {queue.messages.map((message) => (
              <article key={message.id} className="network-card rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#789078]">
                  <span><span className="font-semibold text-[#18231b]">{message.authorName}</span> ({message.authorRole}) · {timeAgo(message.createdAt)} · in <Link href={`/requests/${message.requestId}`} className="font-semibold text-[#40533d] underline">{message.requestTitle}</Link></span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-900">{flagText(message.flags)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{message.body}</p>
                <div className="mt-4 flex gap-2">
                  <button disabled={busy === message.id} onClick={() => act(message.id, () => api(`/api/expert-requests/${message.requestId}/messages`, { method: "PATCH", json: { messageId: message.id, action: "restore" } }), "Message kept visible.")} className={`${button} border border-[#cfdccb] text-[#40533d]`}>Keep visible</button>
                  <button disabled={busy === message.id} onClick={() => act(message.id, () => api(`/api/expert-requests/${message.requestId}/messages`, { method: "PATCH", json: { messageId: message.id, action: "hide" } }), "Message removed.")} className={`${button} bg-red-600 text-white`}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyState title="No flagged messages" />)}

        {tab === "reviews" && (queue.reviews.length ? (
          <div className="space-y-3">
            {queue.reviews.map((review) => (
              <article key={review.id} className="network-card flex flex-wrap items-start justify-between gap-4 rounded-2xl p-5">
                <div>
                  <p className="text-sm font-semibold text-amber-600">{"★".repeat(review.rating)} <span className="text-xs font-normal text-[#789078]">{review.author} → {review.expert} · {timeAgo(review.createdAt)}</span></p>
                  <p className="mt-2 text-sm">{review.body}</p>
                </div>
                <div className="flex gap-2">
                  <button disabled={busy === review.id} onClick={() => act(review.id, () => api("/api/admin/moderation", { method: "POST", json: { type: "review", id: review.id, action: "publish" } }), "Review published.")} className={`${button} bg-[#40533d] text-white`}>Publish</button>
                  <button disabled={busy === review.id} onClick={() => act(review.id, () => api("/api/admin/moderation", { method: "POST", json: { type: "review", id: review.id, action: "reject" } }), "Review rejected.")} className={`${button} border border-red-200 text-red-700`}>Reject</button>
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyState title="No reviews waiting" />)}

        {tab === "all" && (all.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {all.map((request) => <RequestCard key={request.id} request={request} footer={<p className="text-xs text-[#607060]">{request.customer?.name} → {request.assignedExpert?.name ?? "unassigned"}</p>} />)}
          </div>
        ) : <EmptyState title="No requests yet" />)}
      </section>
    </main>
  );
}

export default function ModerationPage() {
  return (
    <Suspense fallback={<main className="network-surface section py-20">Loading…</main>}>
      <RequireAuth roles={["admin"]} loadingLabel="Opening moderation…">
        <ModerationDesk />
      </RequireAuth>
    </Suspense>
  );
}

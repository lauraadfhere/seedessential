"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { Link } from "@/components/locale-link";
import { Price, cn } from "@/components/ui";
import { ProductVisual } from "@/components/product-card";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Avatar, EmptyState, Notice, PhotoGallery, PhotoPicker, StarInput, StatusPill, StatusTimeline, UrgencyTag, timeAgo } from "@/components/marketplace";
import { api } from "@/lib/api-client";
import { getParse } from "@/lib/parse/client";
import { products as seededProducts, type Product } from "@/lib/data";
import { categoryLabel, type RecommendedProduct, type RequestMessage, type RequestRecord } from "@/lib/marketplace-types";
import { MODERATION_FLAG_LABELS } from "@/lib/moderation";

type Detail = { request: RequestRecord; messages: RequestMessage[] };

const sunLabels: Record<string, string> = { low: "Low light / shade", medium: "Partial sun", full: "Full sun" };

function useCatalog(enabled: boolean) {
  const [catalog, setCatalog] = useState<Product[]>(seededProducts);
  useEffect(() => {
    if (!enabled) return;
    fetch("/api/catalog/products").then((response) => (response.ok ? response.json() : Promise.reject())).then(setCatalog).catch(() => undefined);
  }, [enabled]);
  return catalog;
}

function Fact({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="rounded-xl bg-[#f6f8f5] px-4 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d8a7b]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#18231b]">{value}</dd>
    </div>
  );
}

function RecommendedProducts({ items, catalog }: { items: RecommendedProduct[]; catalog: Product[] }) {
  if (!items.length) return null;
  const total = items.reduce((sum, item) => {
    const product = catalog.find((entry) => entry.slug === item.slug);
    return sum + (product?.priceDzd ?? Math.round((product?.price ?? 0) * 135));
  }, 0);
  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#638260]">Recommended plants & equipment</p>
          <p className="mt-1 text-sm text-[#607060]">Supplied by Tannelli and verified providers — delivered across Algeria.</p>
        </div>
        {total > 0 && <p className="shrink-0 text-sm font-semibold">≈ {new Intl.NumberFormat("fr-DZ").format(total)} DA</p>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const product = catalog.find((entry) => entry.slug === item.slug);
          return (
            <div key={item.slug} className="flex gap-3 rounded-2xl border border-[#e3e9e1] bg-white p-3">
              <Link href={`/shop/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                {product ? <ProductVisual product={product} className="h-full w-full" /> : <span className="grid h-full place-items-center bg-[#eef3ed] text-xs">{item.name.slice(0, 2)}</span>}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/shop/${item.slug}`} className="truncate text-sm font-semibold hover:underline">{item.name}</Link>
                {item.providerName && <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-[#789078]">by {item.providerName}</p>}
                {item.note && <p className="mt-1 line-clamp-2 text-xs text-[#607060]">“{item.note}”</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  {product ? <Price value={product.price} dzd={product.priceDzd} className="text-sm" /> : <span className="text-xs text-[#789078]">Unavailable</span>}
                  {product && <AddToCartButton product={product} label="Add to cart" className="rounded-lg bg-[#40533d] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-40" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecommendForm({ request, catalog, onSaved }: { request: RequestRecord; catalog: Product[]; onSaved: (next: RequestRecord) => void }) {
  const [recommendation, setRecommendation] = useState(request.recommendation);
  const [plan, setPlan] = useState(request.maintenancePlan);
  const [budget, setBudget] = useState(request.estimatedBudget ? String(request.estimatedBudget) : "");
  const [picked, setPicked] = useState<{ slug: string; note: string }[]>(request.recommendedProducts.map((item) => ({ slug: item.slug, note: item.note ?? "" })));
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | "plant" | "equipment">("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalog
      .filter((item) => (kind === "all" || item.kind === kind) && !picked.some((entry) => entry.slug === item.slug))
      .filter((item) => !term || `${item.name} ${item.short} ${item.category}`.toLowerCase().includes(term))
      .slice(0, 8);
  }, [catalog, kind, picked, search]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      onSaved(await api<RequestRecord>(`/api/expert-requests/${request.id}`, { method: "PATCH", json: { action: "recommend", recommendation, maintenancePlan: plan, estimatedBudget: Number(budget) || 0, products: picked } }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the recommendation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="network-card space-y-5 rounded-[1.5rem] p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#638260]">Your recommendation</p>
        <h2 className="mt-1 text-lg font-semibold">{request.recommendation ? "Update your advice" : "Send your diagnosis and plan"}</h2>
      </div>
      <label className="block text-sm font-semibold">Diagnosis & advice
        <textarea required minLength={30} value={recommendation} onChange={(e) => setRecommendation(e.target.value)} rows={6} placeholder="What is happening, why, and what the grower should do first." className="mt-2 w-full rounded-xl border border-neutral-300 p-3 text-sm font-normal outline-none focus:border-[#40533d] focus:ring-2 focus:ring-[#40533d]/20" />
      </label>
      <label className="block text-sm font-semibold">Care / maintenance schedule
        <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={4} placeholder={"Week 1: …\nWeek 2: …"} className="mt-2 w-full rounded-xl border border-neutral-300 p-3 text-sm font-normal outline-none focus:border-[#40533d] focus:ring-2 focus:ring-[#40533d]/20" />
      </label>
      <label className="block text-sm font-semibold">Estimated budget (DA)
        <input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-300 p-3 text-sm font-normal" />
      </label>

      <div className="rounded-2xl border border-[#dce5dc] bg-[#f7faf6] p-4">
        <p className="text-sm font-semibold">Link products from the marketplace</p>
        <p className="mt-1 text-xs text-[#789078]">The grower can add them to their cart in one tap. Provider equipment is credited to the supplier.</p>
        {picked.length > 0 && (
          <ul className="mt-3 space-y-2">
            {picked.map((entry) => {
              const product = catalog.find((item) => item.slug === entry.slug);
              return (
                <li key={entry.slug} className="flex items-center gap-2 rounded-xl bg-white p-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{product?.name ?? entry.slug}</span>
                  <input value={entry.note} onChange={(e) => setPicked((all) => all.map((item) => (item.slug === entry.slug ? { ...item, note: e.target.value } : item)))} placeholder="Why / dosage" maxLength={200} className="w-40 rounded-lg border px-2 py-1 text-xs sm:w-56" />
                  <button type="button" onClick={() => setPicked((all) => all.filter((item) => item.slug !== entry.slug))} className="px-2 text-sm font-bold text-red-600" aria-label="Remove product">×</button>
                </li>
              );
            })}
          </ul>
        )}
        {picked.length < 8 && (
          <>
            <div className="mt-3 flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plants, irrigation, soil…" className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm" />
              <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="rounded-lg border bg-white px-2 text-sm">
                <option value="all">All</option><option value="plant">Plants</option><option value="equipment">Equipment</option>
              </select>
            </div>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {results.map((item) => (
                <button key={item.slug} type="button" onClick={() => setPicked((all) => [...all, { slug: item.slug, note: "" }])} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-left text-xs hover:bg-[#eaf0e8]">
                  <span className="truncate font-semibold">{item.name}</span>
                  <span className="shrink-0 text-[#40533d]">+ Add</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <button disabled={saving} className="w-full rounded-xl bg-[#40533d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#334532] disabled:opacity-50">{saving ? "Sending…" : request.recommendation ? "Update recommendation" : "Send recommendation"}</button>
    </form>
  );
}

function Thread({ request, messages, setMessages, canWrite, isAdmin }: { request: RequestRecord; messages: RequestMessage[]; setMessages: (update: (all: RequestMessage[]) => RequestMessage[]) => void; canWrite: boolean; isAdmin: boolean }) {
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const currentUserId = getParse().User.current()?.id;
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() && !attachments.length) return;
    setSending(true);
    setNotice("");
    try {
      const result = await api<{ message: RequestMessage; notice?: string }>(`/api/expert-requests/${request.id}/messages`, { method: "POST", json: { body, attachments } });
      setMessages((all) => [...all, result.message]);
      setBody("");
      setAttachments([]);
      if (result.notice) setNotice(result.notice);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Message not sent.");
    } finally {
      setSending(false);
    }
  }

  async function moderate(message: RequestMessage, action: "report" | "hide" | "restore") {
    try {
      const result = await api<{ message: RequestMessage }>(`/api/expert-requests/${request.id}/messages`, { method: "PATCH", json: { messageId: message.id, action } });
      setMessages((all) => all.map((item) => (item.id === message.id ? result.message : item)));
      setNotice(action === "report" ? "Thanks — our moderation team will review this message." : "Message updated.");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Action failed.");
    }
  }

  return (
    <section className="network-card rounded-[1.5rem] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Conversation</h2>
        <span className="text-xs text-[#789078]">Moderated · contact details hidden</span>
      </div>
      <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {!messages.length && <p className="rounded-xl bg-[#f6f8f5] p-4 text-sm text-[#607060]">No messages yet. Ask a question or share an update photo.</p>}
        {messages.map((message) => {
          const mine = message.authorId === currentUserId;
          if (message.system) return <p key={message.id} className="text-center text-[11px] font-semibold text-[#789078]">{message.body} · {timeAgo(message.createdAt)}</p>;
          return (
            <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-3", mine ? "bg-[#40533d] text-white" : "bg-[#f1f5ef] text-[#18231b]", message.hidden && "opacity-60")}>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", mine ? "text-white/60" : "text-[#7d8a7b]")}>{message.authorName} · {message.authorRole === "expert" ? "Expert" : message.authorRole === "admin" ? "Tannelli" : "Grower"} · {timeAgo(message.createdAt)}</p>
                {message.body && <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p>}
                {message.attachments.length > 0 && <PhotoGallery photos={message.attachments} className="mt-2 !grid-cols-3" />}
                <div className="mt-1 flex gap-3 text-[10px] font-bold">
                  {message.flagged && <span className={mine ? "text-amber-200" : "text-amber-700"}>Flagged</span>}
                  {!mine && !isAdmin && <button type="button" onClick={() => moderate(message, "report")} className="text-[#789078] hover:text-red-600">Report</button>}
                  {isAdmin && <button type="button" onClick={() => moderate(message, message.hidden ? "restore" : "hide")} className="text-red-600">{message.hidden ? "Restore" : "Hide"}</button>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {notice && <div className="mt-3"><Notice tone="info">{notice}</Notice></div>}
      {canWrite ? (
        <form onSubmit={send} className="mt-4 space-y-2 border-t border-[#e6ede5] pt-4">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={3000} placeholder="Write a message…" className="w-full rounded-xl border border-neutral-300 p-3 text-sm outline-none focus:border-[#40533d] focus:ring-2 focus:ring-[#40533d]/20" />
          <div className="flex items-end justify-between gap-3">
            <PhotoPicker value={attachments} onChange={setAttachments} max={4} compact />
            <button disabled={sending || (!body.trim() && !attachments.length)} className="rounded-xl bg-[#40533d] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">{sending ? "Sending…" : "Send"}</button>
          </div>
        </form>
      ) : (
        <p className="mt-4 border-t border-[#e6ede5] pt-4 text-xs text-[#789078]">{request.status === "completed" || request.status === "cancelled" ? "This conversation is closed." : "Messaging opens once an expert accepts the request."}</p>
      )}
    </section>
  );
}

function ActionPanel({ request, onChange }: { request: RequestRecord; onChange: (next: RequestRecord, message?: string) => void }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [note, setNote] = useState("");
  const actions = request.viewer.actions;

  async function run(action: string, payload: Record<string, unknown> = {}, message?: string) {
    if (action === "cancel" && !window.confirm("Cancel this request? Experts will no longer see it.")) return;
    setBusy(action);
    setError("");
    try {
      onChange(await api<RequestRecord>(`/api/expert-requests/${request.id}`, { method: "PATCH", json: { action, ...payload } }), message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed.");
    } finally {
      setBusy("");
    }
  }

  const button = (action: string, label: string, variant: "primary" | "outline" | "danger" = "primary", payload?: Record<string, unknown>, message?: string) => (
    <button key={action} type="button" disabled={Boolean(busy)} onClick={() => run(action, payload, message)} className={cn("w-full rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-50", variant === "primary" ? "bg-[#40533d] text-white hover:bg-[#334532]" : variant === "danger" ? "border border-red-200 text-red-700 hover:bg-red-50" : "border border-[#cfdccb] text-[#40533d] hover:bg-[#eaf0e8]")}>
      {busy === action ? "Working…" : label}
    </button>
  );

  if (!actions.some((action) => action !== "message" && action !== "recommend")) return null;

  return (
    <div className="network-card space-y-3 rounded-[1.5rem] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#638260]">Next step</p>
      {actions.includes("accept") && (
        <>
          <p className="text-sm text-[#607060]">Accepting assigns this request to you and opens a private conversation with the grower.</p>
          {button("accept", "Accept request", "primary", {}, "You accepted this request. Introduce yourself in the conversation.")}
          {button("decline", "Not for me", "outline", {}, "Request hidden from your inbox.")}
        </>
      )}
      {actions.includes("complete") && (
        <div className="space-y-3">
          <p className="text-sm text-[#607060]">Happy with the advice? Close the request and rate your expert.</p>
          <StarInput value={rating} onChange={setRating} />
          <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={3} maxLength={1000} placeholder="Share what helped (optional)" className="w-full rounded-xl border border-neutral-300 p-3 text-sm" />
          {button("complete", "Mark as solved", "primary", { rating, review }, "Thanks! Your rating helps other growers.")}
        </div>
      )}
      {(actions.includes("approve") || actions.includes("reject")) && (
        <div className="space-y-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Moderation note (shown to the grower)" className="w-full rounded-xl border border-neutral-300 p-3 text-sm" />
          {actions.includes("approve") && button("approve", "Approve & publish", "primary", { note }, "Request approved and visible to experts.")}
          {actions.includes("reject") && button("reject", "Reject request", "danger", { note }, "Request rejected.")}
        </div>
      )}
      {actions.includes("reopen") && button("reopen", "Reopen to other experts", "outline", {}, "Request reopened.")}
      {actions.includes("cancel") && button("cancel", "Cancel request", "danger", {}, "Request cancelled.")}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = data?.request;
  const participant = Boolean(request && (request.viewer.isOwner || request.viewer.isAssignedExpert || request.viewer.role === "admin"));
  const catalog = useCatalog(Boolean(request && (request.recommendedProducts.length || request.viewer.actions.includes("recommend"))));

  const load = useCallback(
    () =>
      api<Detail>(`/api/expert-requests/${id}`)
        .then(setData)
        .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load this request.")),
    [id],
  );

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!participant) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 20000);
    return () => window.clearInterval(timer);
  }, [load, participant]);

  if (error) return <main className="network-surface section py-16"><EmptyState title="Request unavailable" text={error} action={<Link href="/consultations" className="text-sm font-bold text-[#40533d]">← Back to my requests</Link>} /></main>;
  if (!request) return <main className="network-surface section py-20 text-sm text-[#607060]">Loading request…</main>;

  const backHref = request.viewer.role === "admin" ? "/admin/moderation" : request.viewer.role === "expert" ? "/expert" : "/consultations";
  const update = (next: RequestRecord, message?: string) => {
    setData((current) => (current ? { ...current, request: next } : current));
    if (message) setNotice(message);
    void load();
  };

  return (
    <main className="network-surface min-h-screen pb-16">
      <section className="border-b border-[#e3e9e1] bg-white/80">
        <div className="section py-8">
          <Link href={backHref} className="text-xs font-bold uppercase tracking-wider text-[#40533d]">← Back</Link>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StatusPill status={request.status} />
            <UrgencyTag urgency={request.urgency} />
            <span className="rounded-full bg-[#eaf0e8] px-2.5 py-1 text-[11px] font-bold text-[#40533d]">{categoryLabel(request.category)}</span>
            <span className="rounded-full bg-[#eaf0e8] px-2.5 py-1 text-[11px] font-bold text-[#40533d]">{request.mode === "onsite" ? "On site visit" : "Online"}</span>
            <span className="text-xs text-[#789078]">#{request.id.slice(-6).toUpperCase()} · {timeAgo(request.createdAt)}</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{request.title}</h1>
          <div className="mt-6 max-w-3xl"><StatusTimeline status={request.status} /></div>
        </div>
      </section>

      <div className="section mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {notice && <Notice>{notice}</Notice>}
          {request.moderationNote && (request.viewer.isOwner || request.viewer.role === "admin") && <Notice tone={request.status === "rejected" ? "error" : "info"}>Moderation: {request.moderationNote}</Notice>}
          {request.moderationFlags.length > 0 && request.viewer.role === "admin" && <Notice tone="info">Flags: {request.moderationFlags.map((flag) => MODERATION_FLAG_LABELS[flag] ?? flag).join(" · ")}</Notice>}

          <section className="network-card rounded-[1.5rem] p-6">
            <h2 className="text-lg font-semibold">The situation</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-[#38463a]">{request.objective}</p>
            <dl className="mt-5 grid gap-2 sm:grid-cols-3">
              <Fact label="Wilaya" value={[request.wilaya, request.location].filter(Boolean).join(" · ")} />
              <Fact label="Plants / crop" value={request.plantType} />
              <Fact label="Space" value={request.spaceDetails} />
              <Fact label="Area" value={request.areaSize} />
              <Fact label="Sun" value={sunLabels[request.sunExposure] ?? request.sunExposure} />
              <Fact label="Soil" value={request.soilInfo} />
              <Fact label="Water" value={request.waterAvailability} />
              <Fact label="Budget" value={request.budget ? `${new Intl.NumberFormat("fr-DZ").format(request.budget)} DA` : undefined} />
            </dl>
            {request.photos.length > 0 && <div className="mt-6"><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#7d8a7b]">Photos</p><PhotoGallery photos={request.photos} /></div>}
          </section>

          {request.recommendation && (
            <section className="rounded-[1.5rem] border-2 border-[#40533d] bg-white p-6 shadow-[0_18px_40px_rgb(64_83_61_/_0.12)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#638260]">Expert recommendation</p>
                  <p className="mt-1 text-sm text-[#607060]">by {request.assignedExpert?.name} · {timeAgo(request.answeredAt)}</p>
                </div>
                {request.estimatedBudget > 0 && <span className="rounded-full bg-[#eaf0e8] px-3 py-1.5 text-sm font-semibold">Est. {new Intl.NumberFormat("fr-DZ").format(request.estimatedBudget)} DA</span>}
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7">{request.recommendation}</p>
              {request.maintenancePlan && (
                <div className="mt-5 rounded-xl bg-[#f6f8f5] p-4">
                  <p className="text-sm font-semibold">Care schedule</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#38463a]">{request.maintenancePlan}</p>
                </div>
              )}
              <RecommendedProducts items={request.recommendedProducts} catalog={catalog} />
              {request.rating && <p className="mt-5 text-sm font-semibold text-amber-600">{"★".repeat(request.rating)}<span className="ml-2 font-normal text-[#607060]">{request.review}</span></p>}
            </section>
          )}

          {request.viewer.actions.includes("recommend") && <RecommendForm request={request} catalog={catalog} onSaved={(next) => update(next, "Recommendation sent to the grower.")} />}

          {participant && (
            <Thread
              request={request}
              messages={data.messages}
              setMessages={(updater) => setData((current) => (current ? { ...current, messages: updater(current.messages) } : current))}
              canWrite={request.viewer.actions.includes("message") || request.viewer.role === "admin"}
              isAdmin={request.viewer.role === "admin"}
            />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <ActionPanel request={request} onChange={update} />
          {request.assignedExpert ? (
            <div className="network-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#638260]">Your expert</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar src={request.assignedExpert.avatar} name={request.assignedExpert.name} className="h-12 w-12 text-sm" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{request.assignedExpert.name}</p>
                  <p className="truncate text-xs text-[#607060]">{request.assignedExpert.professionalCategory}{request.assignedExpert.location ? ` · ${request.assignedExpert.location}` : ""}</p>
                </div>
              </div>
              <Link href={`/experts/${request.assignedExpert.slug}`} className="mt-4 inline-block text-xs font-bold text-[#40533d]">View profile →</Link>
            </div>
          ) : request.preferredExpert ? (
            <div className="network-card rounded-[1.5rem] p-5 text-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#638260]">Requested expert</p>
              <p className="mt-2 font-semibold">{request.preferredExpert.name}</p>
              <p className="mt-1 text-xs text-[#607060]">Waiting for their answer. If they decline, it opens to other matching experts.</p>
            </div>
          ) : (
            <div className="network-card rounded-[1.5rem] p-5 text-sm text-[#607060]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#638260]">Matching</p>
              <p className="mt-2">{request.status === "submitted" ? "In moderation — usually reviewed within a few hours." : `Visible to verified experts covering ${request.wilaya}${request.mode === "online" ? " and online experts across Algeria" : ""}.`}</p>
            </div>
          )}
          {request.customer && !request.viewer.isOwner && (
            <div className="network-card rounded-[1.5rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#638260]">Grower</p>
              <p className="mt-2 font-semibold">{request.customer.name}</p>
              <p className="text-xs text-[#607060]">{request.customer.accountKind === "farmer" ? "Farmer" : "Home grower"} · {request.wilaya}</p>
            </div>
          )}
          {request.viewer.isOwner && request.status === "answered" && (
            <Link href="/cart" className="block rounded-[1.5rem] bg-[#263b2d] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Ready to act?</p>
              <p className="mt-2 text-sm">Add the recommended products, then check out with delivery to {request.wilaya}.</p>
              <span className="mt-3 inline-block text-sm font-bold underline">Open cart →</span>
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}

export default function RequestDetailPage() {
  return (
    <Suspense fallback={<main className="network-surface section py-20">Loading…</main>}>
      <RequireAuth loadingLabel="Opening request…">
        <RequestDetail />
      </RequireAuth>
    </Suspense>
  );
}

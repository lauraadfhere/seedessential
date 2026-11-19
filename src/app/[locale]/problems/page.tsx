"use client";

import { FormEvent, useEffect, useState } from "react";
import { getParse } from "@/lib/parse/client";
import { authHeaders } from "@/lib/api-client";
import { RichEditor, renderMarkdown } from "@/components/rich-editor";
import { DocumentUploader } from "@/components/document-uploader";

type UploadedDocument = { name: string; url: string; publicId: string; type: string; size: number };

type Offer = { id: string; kind: "suggestion" | "equipment" | "bid"; message: string; priceDzd: number | null; authorName: string; createdAt?: string };
type Problem = {
  id: string;
  title: string;
  body: string;
  category: string;
  budgetDzd: number | null;
  attachments: UploadedDocument[];
  authorName: string;
  createdAt?: string;
  offers: Offer[];
};

const KIND_LABELS: Record<Offer["kind"], string> = {
  suggestion: "Suggestion",
  equipment: "Equipment",
  bid: "Price offer",
};

const token = () => getParse().User.current()?.getSessionToken() ?? "";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<UploadedDocument[]>([]);
  const [posting, setPosting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/problems");
      const data = await response.json();
      if (response.ok) setProblems(data);
      else setNotice(data.error ?? "Could not load the board.");
    } catch {
      setNotice("Could not load the board.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSignedIn(Boolean(token()));
    load();
  }, []);

  async function postProblem(event: FormEvent) {
    event.preventDefault();
    setPosting(true);
    setNotice("");
    try {
      const response = await fetch("/api/problems", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ title, category, budgetDzd: budget, body, attachments }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.error ?? "Could not post your problem.");
        return;
      }
      setNotice(data.held ? "Your problem was received and will appear after review." : "Your problem is on the board.");
      setTitle("");
      setCategory("");
      setBudget("");
      setBody("");
      setAttachments([]);
      await load();
    } catch {
      setNotice("Could not post your problem. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <main className="network-surface pb-16">
      <section className="tmpl-hero">
        <div className="tmpl-rail py-9 sm:py-11">
          <h1 className="tmpl-hero-title">Problems board</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">
            Describe a plant problem. Members can suggest help, recommend equipment or send a price offer.
          </p>
        </div>
      </section>
      <nav className="tmpl-crumbs" aria-label="Breadcrumb">
        <a href="/" className="text-link hover:underline">Home</a>
        <span className="mx-1.5 text-[#9aab96]">›</span>
        <span className="text-[#243322]">Problems</span>
      </nav>

      <div className="tmpl-rail max-w-3xl pb-12">
        {notice && <p role="status" className="tmpl-notice mb-5">{notice}</p>}

        {signedIn ? (
          <div className="tmpl-panel">
            <div className="tmpl-panel-head">Post a problem</div>
            <form onSubmit={postProblem} className="tmpl-panel-body space-y-4">
              <label className="block text-sm font-semibold">
                Title
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required className="ui-field mt-1" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Category
                  <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} placeholder="Pests, watering, soil…" className="ui-field mt-1" />
                </label>
                <label className="block text-sm font-semibold">
                  Budget (DZD, optional)
                  <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="numeric" className="ui-field mt-1" />
                </label>
              </div>
              <RichEditor id="problem-body" label="Details" value={body} onChange={setBody} maxLength={5000} rows={6} required placeholder="What is happening, since when, and what you have tried." />
              <DocumentUploader label="Photos or documents" description="Add up to 5 files (JPG, PNG or PDF, 10 MB each)" value={attachments} onChange={setAttachments} folder="projects" maxFiles={5} />
              <button type="submit" disabled={posting} className="min-h-[44px] w-full bg-[#40533d] px-4 py-2 font-bold text-white disabled:opacity-50 sm:w-auto">
                {posting ? "Posting…" : "Post problem"}
              </button>
            </form>
          </div>
        ) : (
          <p className="tmpl-notice">Sign in to post a problem or reply.</p>
        )}

        <section className="mt-8 space-y-4" aria-label="Open problems">
          {loading && <p className="text-sm text-neutral-600">Loading…</p>}
          {!loading && problems.length === 0 && <div className="tmpl-list"><div className="tmpl-list-row text-sm text-[#607060]">No problems posted yet.</div></div>}
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} signedIn={signedIn} onChanged={load} />
          ))}
        </section>
      </div>
    </main>
  );
}

function ProblemCard({ problem, signedIn, onChanged }: { problem: Problem; signedIn: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Offer["kind"]>("suggestion");
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function sendOffer(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/problems", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "offer", problemId: problem.id, kind, message, priceDzd: price }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not send your reply.");
        return;
      }
      setMessage("");
      setPrice("");
      onChanged();
    } catch {
      setError("Could not send your reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <article className="tmpl-list">
      <div className="tmpl-list-head flex flex-wrap items-center gap-2 !font-normal">
        {problem.category && <span className="tmpl-chip">{problem.category}</span>}
        <span className="text-xs text-[#607060]">{problem.authorName}</span>
        {problem.budgetDzd ? <span className="tmpl-chip tmpl-chip-info">Budget {problem.budgetDzd} DZD</span> : null}
      </div>
      <div className="p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[#243322] break-words">{problem.title}</h2>
        <div className="prose prose-sm mt-2 max-w-none break-words text-neutral-800" dangerouslySetInnerHTML={{ __html: renderMarkdown(problem.body) }} />
        {problem.attachments.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {problem.attachments.map((file) => (
              <li key={file.url}><a href={file.url} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center border border-rule px-3 text-sm font-semibold text-[#40533d]">{file.name}</a></li>
            ))}
          </ul>
        )}

        <h3 className="mt-5 text-sm font-semibold">Replies ({problem.offers.length})</h3>
        <ul className="mt-2 divide-y divide-rule border border-rule bg-panel">
          {problem.offers.map((offer) => (
            <li key={offer.id} className="bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                <span className="tmpl-chip tmpl-chip-ok">{KIND_LABELS[offer.kind]}</span>
                <span>{offer.authorName}</span>
                {offer.priceDzd != null && <span className="font-bold text-[#40533d]">{offer.priceDzd} DZD</span>}
              </div>
              <p className="mt-1 whitespace-pre-line break-words">{offer.message}</p>
            </li>
          ))}
          {problem.offers.length === 0 && <li className="p-3 text-sm text-[#607060]">No replies yet.</li>}
        </ul>

        {signedIn ? (
          <div className="mt-4">
            <button type="button" onClick={() => setOpen((value) => !value)} className="min-h-[44px] border border-rule px-4 text-sm font-semibold text-[#40533d]">
              {open ? "Close" : "Reply or send an offer"}
            </button>
            {open && (
              <form onSubmit={sendOffer} className="mt-3 space-y-3 border border-rule bg-panel p-4">
                <fieldset className="flex flex-wrap gap-2">
                  <legend className="sr-only">Reply type</legend>
                  {(Object.keys(KIND_LABELS) as Offer["kind"][]).map((option) => (
                    <label key={option} className="inline-flex min-h-[44px] items-center gap-2 border border-rule bg-white px-3 text-sm">
                      <input type="radio" name={`kind-${problem.id}`} checked={kind === option} onChange={() => setKind(option)} />
                      {KIND_LABELS[option]}
                    </label>
                  ))}
                </fieldset>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={3} required placeholder="Your suggestion, the equipment you recommend, or what you offer." className="ui-field text-base" />
                {kind === "bid" && (
                  <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" required placeholder="Price in DZD" className="ui-field min-h-[44px] sm:w-56" />
                )}
                {error && <p className="text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={sending} className="min-h-[44px] w-full bg-[#40533d] px-4 font-bold text-white disabled:opacity-50 sm:w-auto">{sending ? "Sending…" : "Send"}</button>
              </form>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">Sign in to reply.</p>
        )}
      </div>
    </article>
  );
}

"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "@/components/locale-link";
import { RequireAuth } from "@/components/require-auth";
import { PhotoPicker, mediaUrl } from "@/components/marketplace";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/components/ui";

type Analysis = {
  plant: string;
  confidence: "low" | "medium" | "high";
  symptoms: string[];
  likelyCauses: string[];
  care: string[];
  watchFor: string[];
  askExpert: boolean;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
  photos: string[];
  analysis: Analysis | null;
  createdAt: string;
};

type Thread = { id: string; title: string; plant?: string; updatedAt?: string };

const prompts = [
  "My tomato leaves are turning yellow from the bottom.",
  "White powder on zucchini leaves after humid nights.",
  "Which indoor plant copes with low light in Algiers?",
  "Olive tree has few flowers this spring. What should I check?",
];

function confidenceTone(value: Analysis["confidence"]) {
  if (value === "high") return "bg-emerald-50 text-emerald-800";
  if (value === "medium") return "bg-amber-50 text-amber-900";
  return "bg-neutral-100 text-neutral-700";
}

function Diagnosis({ analysis }: { analysis: Analysis }) {
  const blocks = [
    ["What I see", analysis.symptoms],
    ["Likely causes", analysis.likelyCauses],
    ["What to do", analysis.care],
    ["Watch for", analysis.watchFor],
  ] as const;
  return (
    <div className="mt-3 border border-[#e4ebe3] bg-[#f7faf6] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-[#18231b]">{analysis.plant}</p>
        <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", confidenceTone(analysis.confidence))}>{analysis.confidence} confidence</span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {blocks.filter(([, items]) => items.length).map(([label, items]) => (
          <div key={label}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#789078]">{label}</p>
            <ul className="mt-1 space-y-1 text-sm text-[#18231b]">
              {items.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        ))}
      </div>
      {analysis.askExpert && (
        <Link href="/experts/request" className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-[#40533d]">
          Ask a verified expert →
        </Link>
      )}
    </div>
  );
}

function RuddgeChat() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ threads: Thread[] }>("/api/ruddge").then((data) => setThreads(data.threads)).catch(() => undefined);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function openThread(id: string) {
    setActive(id);
    setListOpen(false);
    setError("");
    const data = await api<{ messages: ChatMessage[] }>(`/api/ruddge/${id}`);
    setMessages(data.messages);
  }

  function startNew() {
    setActive(null);
    setMessages([]);
    setPhotos([]);
    setDraft("");
    setError("");
    setListOpen(false);
  }

  async function send(text = draft) {
    const message = text.trim();
    if (sending || (message.length < 8 && !photos.length)) return;
    setSending(true);
    setError("");
    const optimistic: ChatMessage = { id: `local-${Date.now()}`, role: "user", body: message || "Photo diagnosis", photos, analysis: null, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, optimistic]);
    setDraft("");
    const sentPhotos = photos;
    setPhotos([]);
    try {
      const data = await api<{ thread: Thread; messages: ChatMessage[] }>("/api/ruddge", {
        method: "POST",
        json: { threadId: active, message, photos: sentPhotos },
      });
      setActive(data.thread.id);
      setMessages(data.messages);
      setThreads((current) => [data.thread, ...current.filter((item) => item.id !== data.thread.id)]);
    } catch (reason) {
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setDraft(message);
      setPhotos(sentPhotos);
      setError(reason instanceof ApiError ? reason.message : "Could not reach RuddgeAI.");
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  const latest = [...messages].reverse().find((item) => item.analysis)?.analysis;

  return (
    <main className="network-surface">
      <section className="section grid gap-4 py-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:py-8">
        <aside className={cn("ui-card lg:block", listOpen ? "block" : "hidden")}>
          <div className="flex items-center justify-between border-b border-[#e4ebe3] px-4 py-3">
            <p className="text-sm font-semibold">Chats</p>
            <button type="button" onClick={startNew} className="text-xs font-bold uppercase tracking-wider text-[#40533d]">New</button>
          </div>
          <ul className="max-h-64 overflow-y-auto lg:max-h-[32rem]">
            {threads.length === 0 && <li className="px-4 py-6 text-sm text-[#789078]">No chats yet.</li>}
            {threads.map((thread) => (
              <li key={thread.id}>
                <button type="button" onClick={() => void openThread(thread.id)} className={cn("block w-full px-4 py-3 text-left text-sm hover:bg-[#f4f7f3]", active === thread.id && "bg-[#eef3ed] font-semibold")}>
                  <span className="line-clamp-2">{thread.plant || thread.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="ui-card flex min-h-[32rem] flex-col">
          <div className="flex items-center justify-between border-b border-[#e4ebe3] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#18231b]">RuddgeAI</p>
              <p className="text-xs text-[#789078]">Plant diagnosis for farmers and experts</p>
            </div>
            <button type="button" onClick={() => setListOpen((value) => !value)} className="text-xs font-bold uppercase tracking-wider text-[#40533d] lg:hidden">Chats</button>
          </div>

          <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.length === 0 && !sending && (
              <div>
                <p className="max-w-lg text-sm leading-6 text-[#607060]">Ask about any plant on the market, or upload a photo of leaves, fruit or soil. RuddgeAI reads the picture, names likely causes, and stays in the chat for follow-up questions.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {prompts.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => void send(prompt)} className="border border-[#dce5dc] bg-white px-3 py-2 text-left text-xs text-[#40533d] hover:border-[#40533d]">{prompt}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <article key={message.id} className={cn("max-w-[42rem]", message.role === "user" ? "ml-auto" : "")}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#789078]">{message.role === "user" ? "You" : "RuddgeAI"}</p>
                {message.photos.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {message.photos.map((photo) => <img key={photo} src={mediaUrl(photo, 160)} alt="" className="h-16 w-16 object-cover" />)}
                  </div>
                )}
                <p className={cn("mt-1 px-3 py-2 text-sm leading-6", message.role === "user" ? "bg-[#40533d] text-white" : "bg-[#f4f7f3] text-[#18231b]")}>{message.body}</p>
                {message.analysis && <Diagnosis analysis={message.analysis} />}
              </article>
            ))}
            {sending && <p className="text-sm text-[#607060]">Reading the plant…</p>}
            {error && <p className="text-sm text-red-700">{error}</p>}
          </div>

          <form onSubmit={onSubmit} className="border-t border-[#e4ebe3] p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <PhotoPicker value={photos} onChange={setPhotos} folder="ruddge" max={3} compact label="Photos" />
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} placeholder="Ask about a plant, a symptom, or what to plant next…" className="ui-field min-h-[3rem] flex-1 resize-none" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} />
              <button disabled={sending} className="bg-[#40533d] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50">{sending ? "…" : "Ask"}</button>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#789078]">Educational guidance for Algeria. It does not replace a verified expert, and it will not give instructions for spreading disease.</p>
            {latest?.askExpert && <Link href="/experts" className="mt-1 inline-block text-[11px] font-bold text-[#40533d]">Browse experts if this needs a visit →</Link>}
          </form>
        </div>
      </section>
    </main>
  );
}

export default function RuddgePage() {
  return (
    <Suspense fallback={<main className="section py-16 text-sm text-[#607060]">Opening RuddgeAI…</main>}>
      <RequireAuth loadingLabel="Opening RuddgeAI…">
        <RuddgeChat />
      </RequireAuth>
    </Suspense>
  );
}

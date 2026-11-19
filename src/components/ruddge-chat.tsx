"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { chromeText } from "@/lib/chrome-i18n";
import { api, ApiError } from "@/lib/api-client";
import { useAccount } from "./header-parts";

type ChatMessage = { id: string; role: "user" | "assistant"; body: string };
type ChatResponse = { thread: { id: string }; messages: ChatMessage[] };

/** Floating RuddgeAI chat, bottom-left. Keeps one thread per open session. */
export function RuddgeChat() {
  const { locale } = useI18n();
  const copy = chromeText(locale);
  const { account, ready } = useAccount();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy || !account) return;
    setDraft("");
    setError("");
    setBusy(true);
    setMessages((list) => [...list, { id: `local-${Date.now()}`, role: "user", body: text }]);
    try {
      const data = await api<ChatResponse>("/api/ruddge", {
        method: "POST",
        json: { message: text, locale, ...(threadId ? { threadId } : {}) },
      });
      setThreadId(data.thread.id);
      const last = [...data.messages].reverse().find((item) => item.role === "assistant");
      if (last) setMessages((list) => [...list, last]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.chatError);
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    setThreadId(undefined);
    setMessages([]);
    setError("");
  }

  return (
    <div className="fixed bottom-5 left-5 z-[55] sm:bottom-6 sm:left-6">
      {open && (
        <section
          role="dialog"
          aria-label={copy.chatTitle}
          className="mb-3 flex h-[min(460px,70vh)] w-[min(340px,calc(100vw-2.5rem))] flex-col overflow-hidden border border-rule bg-white"
        >
          <header className="flex items-center justify-between gap-2 border-b bg-[#40533d] px-4 py-3 text-white">
            <p className="text-sm font-semibold">{copy.chatTitle}</p>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button type="button" onClick={newChat} className="border border-white/20 px-2 py-1 text-xs hover:bg-white/15">
                  {copy.chatNew}
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label={copy.close} className="grid h-7 w-7 place-items-center hover:bg-white/15">
                ×
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-surface p-4 text-sm">
            {!ready ? null : !account ? (
              <div className="space-y-3">
                <p className="text-neutral-600">{copy.chatIntro}</p>
                <Link href="/sign-in" className="inline-block bg-[#40533d] px-4 py-2 font-semibold text-white hover:bg-[#1f3a1c]">
                  {copy.chatSignIn}
                </Link>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-neutral-600">{copy.chatIntro}</p>
            ) : (
              messages.map((item) => (
                <div key={item.id} className={item.role === "user" ? "ml-8 border border-[#40533d] bg-[#40533d] px-3 py-2 text-white" : "mr-8 whitespace-pre-line border border-rule bg-white px-3 py-2 text-neutral-800"}>
                  {item.role === "user" && <span className="block text-[11px] uppercase tracking-wide opacity-70">{copy.chatYou}</span>}
                  {item.body}
                </div>
              ))
            )}
            {busy && <p className="text-xs text-neutral-500">{copy.chatThinking}</p>}
            {error && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</p>}
          </div>

          {account && (
            <form onSubmit={send} className="flex gap-2 border-t p-3">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={copy.chatPlaceholder}
                aria-label={copy.chatPlaceholder}
                maxLength={2000}
                className="ui-field min-w-0 flex-1 !py-2 text-sm"
              />
              <button type="submit" disabled={busy || !draft.trim()} className="bg-[#40533d] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {copy.chatSend}
              </button>
            </form>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={copy.chatOpen}
        className="flex items-center gap-2 rounded-full bg-[#40533d] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1f3a1c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9ad83a]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />
        </svg>
        <span className="hidden sm:inline">{copy.chatOpen}</span>
      </button>
    </div>
  );
}

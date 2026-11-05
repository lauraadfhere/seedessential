"use client";

import { useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Notice } from "@/components/marketplace";
import { api, ApiError } from "@/lib/api-client";

const TOPICS = ["General question", "Order support", "Expert consultation", "Business enquiry"];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await api("/api/contact", {
        method: "POST",
        json: {
          name: form.get("name"),
          email: form.get("email"),
          topic: form.get("topic"),
          message: form.get("message"),
        },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send your message. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <PageHero eyebrow="Contact" title="How can we help?" text="Our team can help with an order, an expert request, business project or a question about Tannelli." />
      <section className="section max-w-2xl py-12">
        {sent ? (
          <div className="rounded-2xl bg-emerald-50 p-7">
            <h2 className="text-xl font-semibold">Message received.</h2>
            <p className="mt-2">We’ll reply as soon as possible.</p>
          </div>
        ) : (
          <form className="grid gap-4 rounded-2xl border p-6" onSubmit={submit}>
            <input name="name" required maxLength={120} className="rounded-xl border p-3" placeholder="Your name" />
            <input name="email" required type="email" maxLength={160} className="rounded-xl border p-3" placeholder="Email address" />
            <select name="topic" className="rounded-xl border bg-white p-3">
              {TOPICS.map((topic) => <option key={topic}>{topic}</option>)}
            </select>
            <textarea name="message" required maxLength={3000} className="min-h-32 rounded-xl border p-3" placeholder="Your message" />
            {error && <Notice tone="error">{error}</Notice>}
            <button type="submit" disabled={saving} className="rounded-xl bg-[#40533d] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Sending…" : "Send message"}</button>
          </form>
        )}
      </section>
    </main>
  );
}

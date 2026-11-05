"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui";
import { EmptyState, Notice, RequestCard, Tabs } from "@/components/marketplace";
import { api } from "@/lib/api-client";
import type { RequestRecord } from "@/lib/marketplace-types";

type Consultation = {
  id: string;
  serviceTitle: string;
  scheduledAt: string | null;
  meetingUrl: string;
  status: string;
  expert: { name: string; professionalCategory: string } | null;
};

type Tab = "active" | "answered" | "closed";

const groups: Record<Tab, string[]> = {
  active: ["submitted", "open", "matched"],
  answered: ["answered"],
  closed: ["completed", "cancelled", "rejected"],
};

function ConsultationsBody() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("active");

  useEffect(() => {
    Promise.all([
      api<RequestRecord[]>("/api/expert-requests?scope=mine"),
      api<Consultation[]>("/api/consultations").catch(() => []),
    ])
      .then(([mine, booked]) => {
        setRequests(mine);
        setConsultations(booked);
        if (!mine.some((item) => groups.active.includes(item.status)) && mine.some((item) => item.status === "answered")) setTab("answered");
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load your requests."))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => requests.filter((item) => groups[tab].includes(item.status)), [requests, tab]);
  const count = (key: Tab) => requests.filter((item) => groups[key].includes(item.status)).length;

  return (
    <main className="network-surface min-h-screen font-barlow">
      <PageHero eyebrow="Expert solutions" title="My expert requests" text="Follow every request from submission to recommendation — chat with your expert and shop what they recommend.">
        <Button href="/experts/request" shape="rect" variant="light">New request</Button>
      </PageHero>

      <section className="section py-10">
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs value={tab} onChange={setTab} items={[
            { value: "active", label: "In progress", count: count("active") },
            { value: "answered", label: "Recommendations", count: count("answered") },
            { value: "closed", label: "Closed", count: count("closed") },
          ]} />
          <Button href="/experts" shape="rect" variant="outline">Browse experts</Button>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((key) => <div key={key} className="h-72 animate-pulse rounded-[1.5rem] bg-white/70" />)}</div>
        ) : visible.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                footer={request.assignedExpert ? <p className="text-xs text-[#607060]">Expert: <span className="font-semibold text-[#18231b]">{request.assignedExpert.name}</span></p> : <p className="text-xs text-[#789078]">{request.status === "submitted" ? "Waiting for moderation" : request.status === "open" ? "Waiting for an expert to accept" : "—"}</p>}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title={tab === "active" ? "No request in progress" : tab === "answered" ? "No recommendation yet" : "Nothing closed yet"}
              text="Describe your plants, soil and water — add photos — and verified experts in your wilaya will answer."
              action={<Button href="/experts/request" shape="rect">Request expert help</Button>}
            />
          </div>
        )}

        {consultations.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold">Booked consultations</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="network-card flex items-center justify-between gap-4 rounded-[1.5rem] p-5">
                  <div>
                    <p className="font-semibold">{consultation.serviceTitle}</p>
                    {consultation.expert && <p className="mt-1 text-sm text-[#607060]">with {consultation.expert.name}</p>}
                    {consultation.scheduledAt && <p className="mt-1 text-sm text-[#607060]">{new Date(consultation.scheduledAt).toLocaleString()}</p>}
                  </div>
                  {consultation.meetingUrl && <a href={consultation.meetingUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#40533d] px-4 py-2 text-xs font-bold text-white">Join</a>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function ConsultationsPage() {
  return (
    <Suspense fallback={<main className="network-surface section py-20">Loading…</main>}>
      <RequireAuth loadingLabel="Loading your requests…">
        <ConsultationsBody />
      </RequireAuth>
    </Suspense>
  );
}

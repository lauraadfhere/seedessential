"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { Link } from "@/components/locale-link";
import { cn } from "@/components/ui";
import { Avatar, EmptyState, Notice, PhotoPicker, RequestCard, StatCard, Tabs } from "@/components/marketplace";
import { ChatIcon, CheckIcon, ClockIcon, LeafMark } from "@/components/icons";
import { api } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";
import { algeriaWilayas } from "@/lib/algeria";
import { categoryLabel, REQUEST_CATEGORIES, type ExpertSummary, type RequestRecord } from "@/lib/marketplace-types";

type Tab = "inbox" | "active" | "done" | "profile";
type Profile = ExpertSummary & { rejectionReason?: string };

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: (next: Profile, notice: string) => void }) {
  const [form, setForm] = useState({
    name: profile.name,
    professionalCategory: profile.professionalCategory,
    specialties: profile.specialties.join(", "),
    languages: profile.languages.join(", "),
    bio: profile.bio,
    location: profile.location || "Alger",
    experienceYears: String(profile.experienceYears || ""),
    consultationPrice: String(profile.consultationPrice || ""),
    online: profile.online,
  });
  const [coverage, setCoverage] = useState<string[]>(profile.coverageWilayas);
  const [avatar, setAvatar] = useState<string[]>(profile.avatar && !/^https?:/.test(profile.avatar) ? [profile.avatar] : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form) => (value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const split = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await api<Profile & { notice?: string }>("/api/expert/profile", {
        method: "PUT",
        json: { ...form, specialties: split(form.specialties), languages: split(form.languages), coverageWilayas: coverage, avatar: avatar[0] },
      });
      onSaved(saved, saved.notice ?? "Profile saved. Growers see these details in the expert directory.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  const field = "mt-2 w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm font-normal outline-none focus:border-[#40533d] focus:ring-2 focus:ring-[#40533d]/20";
  return (
    <form onSubmit={save} className="network-card grid gap-5 rounded-[1.5rem] p-6 lg:grid-cols-2">
      <div className="lg:col-span-2 flex items-center gap-4">
        <PhotoPicker value={avatar} onChange={(next) => setAvatar(next.slice(-1))} max={1} folder="experts" label="Profile photo" />
      </div>
      <label className="text-sm font-semibold">Display name<input required value={form.name} onChange={(e) => set("name")(e.target.value)} className={field} /></label>
      <label className="text-sm font-semibold">Main field of expertise
        <input required list="expert-fields" value={form.professionalCategory} onChange={(e) => set("professionalCategory")(e.target.value)} placeholder="e.g. Agronomy, Irrigation" className={field} />
        <datalist id="expert-fields">{REQUEST_CATEGORIES.map((item) => <option key={item.value} value={item.label} />)}</datalist>
      </label>
      <label className="text-sm font-semibold">Specialties<input value={form.specialties} onChange={(e) => set("specialties")(e.target.value)} placeholder="Drip irrigation, soil analysis, olive trees" className={field} /></label>
      <label className="text-sm font-semibold">Languages<input value={form.languages} onChange={(e) => set("languages")(e.target.value)} placeholder="Arabic, French, Tamazight" className={field} /></label>
      <label className="text-sm font-semibold">Based in
        <select value={form.location} onChange={(e) => set("location")(e.target.value)} className={field}>
          {algeriaWilayas.map((wilaya) => <option key={wilaya.code} value={wilaya.name}>{wilaya.code} · {wilaya.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-semibold">Years of experience<input type="number" min={0} max={60} value={form.experienceYears} onChange={(e) => set("experienceYears")(e.target.value)} className={field} /></label>
        <label className="text-sm font-semibold">Starting price (DA)<input type="number" min={0} value={form.consultationPrice} onChange={(e) => set("consultationPrice")(e.target.value)} className={field} /></label>
      </div>
      <label className="text-sm font-semibold lg:col-span-2">About your practice
        <textarea value={form.bio} onChange={(e) => set("bio")(e.target.value)} rows={4} maxLength={1500} className={field} />
      </label>
      <label className="flex items-center justify-between gap-4 rounded-xl bg-[#f6f8f5] p-4 text-sm lg:col-span-2">
        <span><span className="font-semibold">Available for online consultations</span><span className="block text-xs text-[#607060]">Receive online requests from every wilaya, not only the ones you cover on site.</span></span>
        <input type="checkbox" checked={form.online} onChange={(e) => set("online")(e.target.checked)} className="h-5 w-5 accent-[#40533d]" />
      </label>
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Wilayas you cover on site <span className="font-normal text-[#789078]">({coverage.length})</span></p>
          <div className="flex gap-3 text-xs font-bold text-[#40533d]">
            <button type="button" onClick={() => setCoverage(algeriaWilayas.map((item) => item.name))}>All</button>
            <button type="button" onClick={() => setCoverage([])}>None</button>
          </div>
        </div>
        <div className="mt-3 flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
          {algeriaWilayas.map((wilaya) => (
            <button type="button" key={wilaya.code} onClick={() => setCoverage((current) => (current.includes(wilaya.name) ? current.filter((item) => item !== wilaya.name) : [...current, wilaya.name]))} className={cn("rounded-full px-3 py-1.5 text-xs font-bold", coverage.includes(wilaya.name) ? "bg-[#40533d] text-white" : "border border-[#dce5dc] text-[#40533d]")}>
              {wilaya.name}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="lg:col-span-2"><Notice tone="error">{error}</Notice></div>}
      <div className="flex items-center gap-4 lg:col-span-2">
        <button disabled={saving} className="rounded-xl bg-[#40533d] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save profile"}</button>
        {profile.status === "active" && <Link href={`/experts/${profile.slug}`} className="text-sm font-bold text-[#40533d]">View public profile →</Link>}
      </div>
    </form>
  );
}

function ExpertStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const initialTab = (["inbox", "active", "done", "profile"].includes(searchParams.get("tab") ?? "") ? searchParams.get("tab") : "inbox") as Tab;
  const [tab, setTabState] = useState<Tab>(initialTab);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState("");

  const setTab = (next: Tab) => {
    setTabState(next);
    router.replace(`/${locale}/expert?tab=${next}`, { scroll: false });
  };

  const load = useCallback(
    () =>
      Promise.all([api<Profile>("/api/expert/profile"), api<RequestRecord[]>("/api/expert-requests")])
        .then(([me, list]) => {
          setProfile(me);
          setRequests(list);
        })
        .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load your workspace.")),
    [],
  );
  useEffect(() => { void load(); }, [load]);

  const inbox = useMemo(() => requests.filter((item) => item.status === "open" && !item.viewer.isAssignedExpert && (!topic || item.category === topic)), [requests, topic]);
  const active = requests.filter((item) => item.viewer.isAssignedExpert && ["matched", "answered"].includes(item.status));
  const done = requests.filter((item) => item.viewer.isAssignedExpert && ["completed", "cancelled"].includes(item.status));

  async function quick(request: RequestRecord, action: "accept" | "decline") {
    setBusy(request.id);
    try {
      const next = await api<RequestRecord>(`/api/expert-requests/${request.id}`, { method: "PATCH", json: { action } });
      if (action === "accept") {
        router.push(`/${locale}/requests/${next.id}`);
        return;
      }
      setRequests((all) => all.filter((item) => item.id !== request.id));
      setNotice("Request hidden from your inbox.");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Action failed.");
      void load();
    } finally {
      setBusy("");
    }
  }

  if (error) return <main className="network-surface section py-16"><EmptyState title="Expert workspace unavailable" text={error} /></main>;
  if (!profile) return <main className="network-surface section py-20 text-sm text-[#607060]">Loading your expert workspace…</main>;

  const verified = profile.status === "active";
  return (
    <main className="network-surface min-h-screen pb-16">
      <section className="bg-[#263b2d] text-white">
        <div className="section flex flex-wrap items-center justify-between gap-6 py-10">
          <div className="flex items-center gap-4">
            <Avatar src={profile.avatar} name={profile.name} className="h-16 w-16 text-lg ring-4 ring-white/15" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Expert workspace</p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{profile.name}</h1>
              <p className="mt-1 text-sm text-white/70">{profile.professionalCategory} · {profile.location || "Algeria"} · ★ {profile.rating.toFixed(1)} ({profile.reviewsCount})</p>
            </div>
          </div>
          <span className={cn("rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider", verified ? "bg-emerald-400/20 text-emerald-100" : profile.status === "rejected" ? "bg-red-400/20 text-red-100" : "bg-amber-400/20 text-amber-100")}>
            {verified ? "Verified expert" : profile.status === "rejected" ? "Changes requested" : "Verification pending"}
          </span>
        </div>
      </section>

      <div className="section mt-8 space-y-6">
        {!verified && (
          <Notice tone={profile.status === "rejected" ? "error" : "info"}>
            {profile.status === "rejected"
              ? `Your application needs changes: ${profile.rejectionReason ?? "please update your profile"}. Saving your profile sends it back for review.`
              : "Our team is reviewing your credentials. Complete your profile now — open requests appear here as soon as you're verified."}
          </Notice>
        )}
        {notice && <Notice>{notice}</Notice>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="New requests" value={inbox.length} hint="Matching your coverage" icon={ClockIcon} accent={inbox.length > 0} />
          <StatCard label="In progress" value={active.filter((item) => item.status === "matched").length} hint="Waiting for your advice" icon={ChatIcon} />
          <StatCard label="Answered" value={active.filter((item) => item.status === "answered").length} hint="Waiting for the grower" icon={LeafMark} />
          <StatCard label="Completed" value={profile.completedRequests} hint={`${profile.reviewsCount} reviews`} icon={CheckIcon} />
        </div>

        <Tabs value={tab} onChange={setTab} items={[
          { value: "inbox", label: "Request inbox", count: inbox.length },
          { value: "active", label: "My clients", count: active.length },
          { value: "done", label: "History", count: done.length },
          { value: "profile", label: "Profile" },
        ]} />

        {tab === "inbox" && (
          <>
            <div className="flex flex-wrap gap-2">
              {[{ value: "", label: "All topics" }, ...REQUEST_CATEGORIES].map((item) => (
                <button key={item.value} type="button" onClick={() => setTopic(item.value)} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-bold", topic === item.value ? "border-[#40533d] bg-[#40533d] text-white" : "border-[#dce5dc] bg-white text-[#40533d]")}>{item.label}</button>
              ))}
            </div>
            {inbox.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {inbox.map((request) => (
                  <RequestCard key={request.id} request={request} footer={
                    <div className="flex items-center gap-2">
                      {request.preferredExpert && <span className="mr-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">Sent to you</span>}
                      <button disabled={busy === request.id} onClick={() => quick(request, "decline")} className="ml-auto rounded-lg px-3 py-2 text-xs font-bold text-[#607060] hover:bg-[#f1f5ef]">Pass</button>
                      <button disabled={busy === request.id} onClick={() => quick(request, "accept")} className="rounded-lg bg-[#40533d] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy === request.id ? "…" : "Accept"}</button>
                    </div>
                  } />
                ))}
              </div>
            ) : (
              <EmptyState title={verified ? "No open requests right now" : "Inbox opens after verification"} text={verified ? `New requests from ${profile.coverageWilayas.length ? `${profile.coverageWilayas.length} covered wilayas` : "all wilayas"}${profile.online ? " and online requests" : ""}${topic ? ` about ${categoryLabel(topic)}` : ""} will appear here.` : undefined} action={<button onClick={() => setTab("profile")} className="text-sm font-bold text-[#40533d]">Review coverage →</button>} />
            )}
          </>
        )}

        {tab === "active" && (active.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((request) => <RequestCard key={request.id} request={request} footer={<Link href={`/requests/${request.id}`} className="text-xs font-bold text-[#40533d]">{request.status === "matched" ? "Write recommendation →" : "Open conversation →"}</Link>} />)}
          </div>
        ) : <EmptyState title="No active clients" text="Accept a request from your inbox to start advising a grower." />)}

        {tab === "done" && (done.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{done.map((request) => <RequestCard key={request.id} request={request} footer={request.rating ? <p className="text-xs font-semibold text-amber-600">{"★".repeat(request.rating)} <span className="font-normal text-[#607060]">{request.review}</span></p> : undefined} />)}</div>
        ) : <EmptyState title="No completed requests yet" />)}

        {tab === "profile" && <ProfileForm profile={profile} onSaved={(next, message) => { setProfile((current) => ({ ...current, ...next })); setNotice(message); void load(); }} />}
      </div>
    </main>
  );
}

export default function ExpertStudioPage() {
  return (
    <Suspense fallback={<main className="network-surface section py-20">Loading…</main>}>
      <RequireAuth roles={["expert"]} loadingLabel="Opening your expert workspace…">
        <ExpertStudio />
      </RequireAuth>
    </Suspense>
  );
}

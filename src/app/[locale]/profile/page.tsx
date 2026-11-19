"use client";

import { Suspense, useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { Link } from "@/components/locale-link";
import { Avatar, Notice } from "@/components/marketplace";
import { CompletenessMeter, TrustBreakdown } from "@/components/trust";
import { DocumentUploader } from "@/components/document-uploader";
import { cn } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { api, uploadToCloudinary } from "@/lib/api-client";
import { algeriaWilayas } from "@/lib/algeria";
import { audienceLabel } from "@/lib/roles";
import { COMPANY_TYPES, GARDEN_TYPES, GROWING_INTERESTS, type AccountProfile, type BusinessProfile } from "@/lib/profile";

type Draft = {
  name: string;
  phone: string;
  avatar: string;
  wilaya: string;
  bio: string;
  farmSize: string;
  mainCrops: string;
  gardenType: string;
  interests: string[];
  business: BusinessProfile | null;
};

function draftFrom(me: AccountProfile): Draft {
  return {
    name: me.name,
    phone: me.phone,
    avatar: me.avatar,
    wilaya: me.wilaya,
    bio: me.bio,
    farmSize: me.farmSize,
    mainCrops: me.mainCrops.join(", "),
    gardenType: me.gardenType,
    interests: me.interests,
    business: me.business,
  };
}

const input = "mt-1.5 ui-field";

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={cn("block text-sm font-semibold text-[#18231b]", wide && "sm:col-span-2")}>
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-[#789078]">{hint}</span>}
    </label>
  );
}

function Section({ title, text, children, aside }: { title: string; text?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="tmpl-panel">
      <div className="tmpl-panel-head flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {text && <p className="mt-1 text-xs font-normal text-[#607060]">{text}</p>}
        </div>
        {aside}
      </div>
      <div className="tmpl-panel-body grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function WilayaSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n();
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={input}>
      <option value="">{t("profile.selectWilaya")}</option>
      {algeriaWilayas.map((item) => <option key={item.code} value={item.name}>{item.code} · {item.name}</option>)}
    </select>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (value: string[]) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button key={option} type="button" onClick={() => onChange(active ? value.filter((item) => item !== option) : [...value, option])} className={cn("tmpl-chip", active ? "!border-[#40533d] !bg-[#40533d] !text-white" : "hover:!border-[#40533d]")}>
            {option}
          </button>
        );
      })}
    </div>
  );
}

const VERIFICATION_COPY: Record<BusinessProfile["verificationStatus"], { label: string; tone: string; text: string }> = {
  unverified: { label: "Not verified", tone: "tmpl-chip", text: "Upload your trade registry extract (RC) or tax card so we can verify your business." },
  pending: { label: "Under review", tone: "tmpl-chip tmpl-chip-alert", text: "An administrator is reviewing your documents." },
  verified: { label: "Verified business", tone: "tmpl-chip tmpl-chip-ok", text: "Your listings show a verified seller badge and rank higher." },
  rejected: { label: "Verification rejected", tone: "tmpl-chip tmpl-chip-alert", text: "Update your documents and save to resubmit." },
};

function ProfileLoading() {
  const { t } = useI18n();
  return <main className="section py-16 text-sm text-[#607060]">{t("profile.loading")}</main>;
}

function ProfileBody() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [me, setMe] = useState<AccountProfile | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(searchParams.get("welcome") ? t("profile.welcome") : "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    api<AccountProfile>("/api/me")
      .then((data) => {
        setMe(data);
        setDraft(draftFrom(data));
      })
      .catch((reason) => setError(reason.message));
  }, []);

  if (error && !me) return <main className="section py-16"><Notice tone="error">{error}</Notice></main>;
  if (!me || !draft) return <ProfileLoading />;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => (current ? { ...current, [key]: value } : current));
  const setBusiness = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) =>
    setDraft((current) => (current && current.business ? { ...current, business: { ...current.business, [key]: value } } : current));

  async function upload(event: ChangeEvent<HTMLInputElement>, target: "avatar" | "logo") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(target);
    setError("");
    try {
      const { publicId } = await uploadToCloudinary(file, target === "logo" ? "businessDocuments" : "profiles");
      if (target === "avatar") {
        set("avatar", publicId);
        setNotice(t("profile.photoUploaded"));
      } else setBusiness("logo", publicId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("profile.uploadFailed"));
    } finally {
      setUploading("");
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const saved = await api<AccountProfile & { notice?: string }>("/api/me", {
        method: "PUT",
        json: {
          name: draft.name,
          phone: draft.phone,
          avatar: draft.avatar,
          wilaya: draft.wilaya,
          bio: draft.bio,
          farmSize: draft.farmSize,
          mainCrops: draft.mainCrops.split(",").map((item) => item.trim()).filter(Boolean),
          gardenType: draft.gardenType,
          interests: draft.interests,
          business: draft.business,
        },
      });
      setMe(saved);
      setDraft(draftFrom(saved));
      setNotice(saved.notice || t("profile.saved"));
      window.dispatchEvent(new Event("tannelli:auth"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const business = draft.business;
  const verification = business ? VERIFICATION_COPY[business.verificationStatus] : null;

  return (
    <main className="network-surface min-h-screen py-10">
      <form onSubmit={save} className="section grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <section className="tmpl-panel text-center">
            <div className="tmpl-panel-body">
              <div className="relative mx-auto w-fit">
                <Avatar src={draft.avatar} name={draft.name} className="h-24 w-24 text-2xl" />
                <label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-[#40533d] text-white" title={t("profile.photoChange")} aria-label={t("profile.photoChange")}>
                  {uploading === "avatar" ? <span className="tannelli-spinner h-4 w-4 border-2" aria-hidden="true" /> : "✎"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => upload(event, "avatar")} />
                </label>
              </div>
              <h1 className="mt-4 text-xl font-semibold">{me.name || "Your profile"}</h1>
              <p className="mt-1 text-sm text-[#607060]">{me.email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                <span className="tmpl-chip">{audienceLabel(me.role, me.accountKind)}</span>
                {me.status === "pending" && <span className="tmpl-chip tmpl-chip-alert">Pending verification</span>}
              </div>
              {draft.avatar && <button type="button" onClick={() => set("avatar", "")} className="mt-2 text-xs font-semibold text-red-700 hover:underline">{t("profile.photoRemove")}</button>}
              <p className="mt-3 text-xs text-[#789078]">{t("profile.memberSince")} {new Date(me.createdAt).toLocaleDateString()}</p>
            </div>
          </section>
          <CompletenessMeter completeness={me.completeness} />
          {me.trust && <TrustBreakdown score={me.trust.score} tier={me.trust.tier} signals={me.trust.signals} penalties={me.trust.penalties} title={me.role === "provider" ? "Seller trust" : "Expert trust"} />}
          {(me.role === "expert" || me.role === "provider") && !me.trust && (
            <Notice tone="info">Your trust score appears after your first saved profile or completed job.</Notice>
          )}
        </aside>

        <div className="space-y-5">
          {notice && <Notice>{notice}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}

          <Section title={me.role === "provider" ? t("profile.accountContact") : t("profile.aboutYou")} text={t("profile.aboutYouText")}>
            <Field label={t("profile.fullName")}><input required value={draft.name} onChange={(event) => set("name", event.target.value)} className={input} autoComplete="name" /></Field>
            <Field label={t("profile.phone")} hint={t("profile.phoneHint")}><input value={draft.phone} onChange={(event) => set("phone", event.target.value)} className={input} placeholder="+213 5xx xx xx xx" autoComplete="tel" /></Field>
            <Field label={t("profile.wilaya")}><WilayaSelect value={draft.wilaya} onChange={(value) => set("wilaya", value)} /></Field>
            <Field label={t("profile.email")}><input value={me.email} disabled className={cn(input, "bg-[#f6f8f5] text-[#789078]")} /></Field>
            {me.role !== "provider" && (
              <Field label={me.accountKind === "farmer" ? t("profile.aboutFarm") : t("profile.aboutYou")} wide>
                <textarea rows={3} value={draft.bio} onChange={(event) => set("bio", event.target.value)} className={input} placeholder={me.accountKind === "farmer" ? "What you grow, irrigation, soil, challenges…" : "What you like to grow and where…"} />
              </Field>
            )}
          </Section>

          {me.role === "customer" && me.accountKind === "farmer" && (
            <Section title={t("profile.yourFarm")} text={t("profile.yourFarmText")}>
              <Field label={t("profile.farmSize")} hint={t("profile.farmSizeHint")}><input value={draft.farmSize} onChange={(event) => set("farmSize", event.target.value)} className={input} /></Field>
              <Field label={t("profile.mainCrops")} hint={t("profile.separateCommas")}><input value={draft.mainCrops} onChange={(event) => set("mainCrops", event.target.value)} className={input} placeholder="Tomatoes, olives, dates" /></Field>
            </Section>
          )}

          {me.role === "customer" && me.accountKind !== "farmer" && (
            <Section title={t("profile.growingSpace")}>
              <Field label={t("profile.spaceType")}><select value={draft.gardenType} onChange={(event) => set("gardenType", event.target.value)} className={input}><option value="">{t("profile.choose")}</option>{GARDEN_TYPES.map((item) => <option key={item}>{item}</option>)}</select></Field>
              <div className="sm:col-span-2"><p className="text-sm font-semibold">{t("profile.interests")}</p><Chips options={GROWING_INTERESTS} value={draft.interests} onChange={(value) => set("interests", value)} /></div>
            </Section>
          )}

          {me.role === "expert" && me.expert && (
            <section className="tmpl-panel">
              <div className="tmpl-panel-head flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">{t("profile.professional")}</h2>
                  <p className="mt-1 text-xs font-normal text-[#607060]">{me.expert.professionalCategory || t("profile.addExpertise")} · {me.expert.specialties.length} {t("profile.specialties")} · {me.expert.coverageWilayas.length || t("profile.noneCoverage")} {t("profile.coverageWilayas")}</p>
                </div>
                <span className={cn("tmpl-chip", me.expert.status === "active" ? "tmpl-chip-ok" : "tmpl-chip-alert")}>{me.expert.status === "active" ? t("profile.verified") : me.expert.status}</span>
              </div>
              <div className="tmpl-panel-body">
                <p className="text-sm leading-6 text-[#607060]">{t("profile.expertBody")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/expert?tab=profile" className="ui-btn !px-4 !py-2 !text-xs uppercase tracking-wider">{t("profile.editStudio")}</Link>
                  {me.expert.status === "active" && <Link href={`/experts/${me.expert.slug}`} className="ui-btn ui-btn-outline !px-4 !py-2 !text-xs uppercase tracking-wider">{t("profile.viewPublic")}</Link>}
                </div>
              </div>
            </section>
          )}

          {me.role === "provider" && business && verification && (
            <>
              <Section title="Company" text="Shown on your listings and seller page." aside={<span className={verification.tone}>{verification.label}</span>}>
                <div className="flex items-center gap-4 sm:col-span-2">
                  <Avatar src={business.logo || draft.avatar} name={business.companyName} className="h-16 w-16 text-lg" />
                  <label className="cursor-pointer text-sm font-bold text-[#40533d]">
                    {uploading === "logo" ? "Uploading…" : business.logo ? "Change logo" : "Upload logo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => upload(event, "logo")} />
                  </label>
                </div>
                <Field label="Company name" hint={business.verificationStatus === "verified" ? "Locked after verification" : undefined}><input required value={business.companyName} disabled={business.verificationStatus === "verified"} onChange={(event) => setBusiness("companyName", event.target.value)} className={input} /></Field>
                <Field label="Company type"><select value={business.companyType} onChange={(event) => setBusiness("companyType", event.target.value)} className={input}><option value="">Choose…</option>{COMPANY_TYPES.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Trade registry number (RC)"><input value={business.registryNumber} disabled={business.verificationStatus === "verified"} onChange={(event) => setBusiness("registryNumber", event.target.value)} className={input} placeholder="e.g. 16/00-1234567B21" /></Field>
                <Field label="Tax ID (NIF)" hint="Optional"><input value={business.taxId} disabled={business.verificationStatus === "verified"} onChange={(event) => setBusiness("taxId", event.target.value)} className={input} /></Field>
                <Field label="Business phone"><input value={business.contactPhone} onChange={(event) => setBusiness("contactPhone", event.target.value)} className={input} /></Field>
                <Field label="Website" hint="Optional, https://…"><input value={business.website} onChange={(event) => setBusiness("website", event.target.value)} className={input} /></Field>
                <Field label="Address"><input value={business.address} onChange={(event) => setBusiness("address", event.target.value)} className={input} /></Field>
                <Field label="Head-office wilaya"><WilayaSelect value={business.wilaya} onChange={(value) => setBusiness("wilaya", value)} /></Field>
                <Field label="Description" hint="What you sell, brands, after-sales service. 60+ characters." wide><textarea rows={4} value={business.description} onChange={(event) => setBusiness("description", event.target.value)} className={input} /></Field>
                <div className="sm:col-span-2">
                  <div className="flex items-baseline justify-between"><p className="text-sm font-semibold">Delivery coverage</p><span className="text-xs text-[#789078]">{business.coverageWilayas.length} selected</span></div>
                  <div className="mt-2 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto border border-rule bg-panel p-2">
                    {algeriaWilayas.map((item) => {
                      const active = business.coverageWilayas.includes(item.name);
                      return <button key={item.code} type="button" onClick={() => setBusiness("coverageWilayas", active ? business.coverageWilayas.filter((name) => name !== item.name) : [...business.coverageWilayas, item.name])} className={cn("tmpl-chip", active ? "!border-[#40533d] !bg-[#40533d] !text-white" : "")}>{item.name}</button>;
                    })}
                  </div>
                </div>
              </Section>
              <section className="tmpl-panel">
                <div className="tmpl-panel-head">Business verification</div>
                <div className="tmpl-panel-body">
                  <p className="text-sm text-[#607060]">{verification.text}</p>
                  {business.rejectionReason && business.verificationStatus === "rejected" && <p className="mt-2 text-sm text-red-700">Reason: {business.rejectionReason}</p>}
                  <DocumentUploader className="mt-4" label="Documents" description="Trade registry extract, tax card or agricultural approval (PDF, JPG, PNG)." folder="businessDocuments" value={business.verificationDocuments.map((doc) => ({ ...doc, size: 0 }))} onChange={(docs) => setBusiness("verificationDocuments", docs.map(({ name, url, publicId, type }) => ({ name, url, publicId, type })))} maxFiles={6} />
                </div>
              </section>
            </>
          )}

          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 border border-rule bg-white/95 px-5 py-3 backdrop-blur">
            <p className="text-xs text-[#607060]">{t("profile.changesNote")}</p>
            <button disabled={saving || Boolean(uploading)} className="ui-btn disabled:opacity-60">{saving ? t("profile.saving") : t("profile.save")}</button>
          </div>
        </div>
      </form>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<main className="section py-16 text-sm text-[#607060]">Loading your profile…</main>}>
      <RequireAuth loadingLabel="Loading your profile…">
        <ProfileBody />
      </RequireAuth>
    </Suspense>
  );
}

"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DeepCard, DeepInput, DeepSelect, DeepButton, DeepFormContainer } from "@/components/deep-ui";
import { RichEditor } from "@/components/rich-editor";
import { PageHero } from "@/components/page-hero";
import { RequireAuth } from "@/components/require-auth";
import { Avatar, Notice, PhotoPicker, StatusPill } from "@/components/marketplace";
import { Link } from "@/components/locale-link";
import { useI18n } from "@/lib/i18n";
import { api, ApiError } from "@/lib/api-client";
import { algeriaWilayas } from "@/lib/algeria";
import { moderateText, MODERATION_FLAG_LABELS } from "@/lib/moderation";
import { MAX_REQUEST_PHOTOS, REQUEST_CATEGORIES, URGENCY_LEVELS, type ExpertSummary, type RequestRecord } from "@/lib/marketplace-types";
import { cn } from "@/components/ui";

const initialForm = {
  title: "",
  category: "agronomy",
  wilaya: "Alger",
  location: "",
  mode: "online",
  urgency: "normal",
  plantType: "",
  spaceDetails: "garden",
  sunExposure: "medium",
  areaSize: "",
  budget: "",
  soilInfo: "",
  waterAvailability: "",
  objective: "",
};

function RequestForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const expertSlug = searchParams.get("expert") ?? "";
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState<string[]>([]);
  const [expert, setExpert] = useState<ExpertSummary | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<RequestRecord | null>(null);
  const steps = [t("request.step1"), t("request.step2"), t("request.step3")];

  useEffect(() => {
    if (!expertSlug) return;
    api<{ expert: ExpertSummary }>(`/api/experts/${encodeURIComponent(expertSlug)}`)
      .then(({ expert }) => {
        setExpert(expert);
        setForm((current) => ({ ...current, wilaya: expert.coverageWilayas[0] ?? current.wilaya }));
      })
      .catch(() => setExpert(null));
  }, [expertSlug]);

  const set = (key: keyof typeof initialForm) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const moderationHints = useMemo(() => {
    const flags = new Set<string>();
    [form.title, form.objective, form.soilInfo, form.waterAvailability, form.location].forEach((value) => moderateText(value).flags.forEach((flag) => flags.add(flag)));
    return [...flags];
  }, [form.title, form.objective, form.soilInfo, form.waterAvailability, form.location]);

  const completeness = useMemo(() => {
    const checks = [form.title.length >= 5, form.objective.length >= 30, Boolean(form.plantType), Boolean(form.areaSize), Boolean(form.soilInfo), Boolean(form.waterAvailability), photos.length > 0, Number(form.budget) > 0];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form, photos]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setErrors({});
    setSending(true);
    try {
      const created = await api<RequestRecord>("/api/expert-requests", {
        method: "POST",
        json: { ...form, budget: Number(form.budget) || 0, photos, preferredExpert: expert?.slug },
      });
      setSent(created);
      setForm(initialForm);
      setPhotos([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      if (reason instanceof ApiError && reason.fields) setErrors(reason.fields);
      setError(reason instanceof Error ? reason.message : "Could not send your request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <PageHero eyebrow={t("request.eyebrow")} title={t("request.title")} text={t("request.intro")} />
      <DeepFormContainer
        title={t("request.formTitle")}
        description={t("request.formIntro")}
        sidePanel={
          <div className="space-y-5">
            {expert && (
              <div className="rounded-2xl border border-[#dce5dc] bg-[#f7faf6] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#638260]">Sent directly to</p>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar src={expert.avatar} name={expert.name} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{expert.name}</p>
                    <p className="truncate text-xs text-[#607060]">{expert.professionalCategory}</p>
                  </div>
                </div>
                <Link href="/experts/request" className="mt-3 inline-block text-xs font-bold text-[#40533d] underline">Open to all matching experts instead</Link>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#607060]"><span>Request quality</span><span>{completeness}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e3ebe1]"><div className="h-full rounded-full bg-[#40533d] transition-all" style={{ width: `${completeness}%` }} /></div>
              <p className="mt-2 text-xs leading-5 text-[#789078]">Detailed requests with photos get accepted faster and receive more precise advice.</p>
            </div>
            <div className="rounded-2xl bg-[#40533d] p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">{t("request.purposeLabel")}</p>
              <h2 className="mt-2 text-xl font-semibold leading-tight">{t("request.purposeTitle")}</h2>
              <div className="mt-5 space-y-4 border-t border-white/15 pt-5">
                {steps.map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/25 text-xs font-bold">0{index + 1}</span>
                    <p className="pt-1 text-sm font-medium text-white/85">{step}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t border-white/15 pt-4 text-xs leading-5 text-white/55">{t("request.note")}</p>
            </div>
          </div>
        }
      >
        {sent ? (
          <DeepCard variant="default" className="p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-xl text-emerald-700">✓</span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{t("request.received")}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#18231b]">{sent.title}</h2>
            <div className="mt-3 flex justify-center"><StatusPill status={sent.status} /></div>
            <p className="mx-auto mt-3 max-w-lg leading-7 text-[#617061]">
              {sent.status === "submitted"
                ? "Your request is being reviewed by our moderation team before experts can see it."
                : sent.preferredExpert
                  ? `${sent.preferredExpert.name} has been notified. If they decline, the request opens to other matching experts.`
                  : "Experts covering your wilaya (and online experts) can now accept it. You'll follow everything from your request page."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <DeepButton href={`/requests/${sent.id}`}>Open my request</DeepButton>
              <DeepButton variant="outline" onClick={() => setSent(null)}>{t("request.another")}</DeepButton>
            </div>
          </DeepCard>
        ) : (
          <form onSubmit={submit} className="space-y-8" noValidate>
            <fieldset className="space-y-5">
              <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#638260]">1 · What do you need?</legend>
              <DeepInput label="Request title" placeholder="e.g. Yellow leaves on my tomato greenhouse" value={form.title} onChange={set("title")} required maxLength={120} error={errors.title} />
              <div>
                <p className="mb-2 text-sm font-semibold text-neutral-800">Topic <span className="text-red-500">*</span></p>
                <div className="flex flex-wrap gap-2">
                  {REQUEST_CATEGORIES.map((item) => (
                    <button key={item.value} type="button" onClick={() => set("category")(item.value)} className={cn("rounded-full border px-3.5 py-2 text-xs font-bold transition", form.category === item.value ? "border-[#40533d] bg-[#40533d] text-white" : "border-[#dce5dc] bg-white text-[#40533d] hover:border-[#40533d]")}>{item.label}</button>
                  ))}
                </div>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>
              <RichEditor id="request-objective" label={t("request.help")} placeholder={t("request.helpPlaceholder")} value={form.objective} onChange={set("objective")} required rows={5} maxLength={3000} error={errors.objective} />
            </fieldset>

            <fieldset className="space-y-5">
              <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#638260]">2 · Where and how</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <DeepSelect label="Wilaya" value={form.wilaya} onChange={set("wilaya")} required options={algeriaWilayas.map((item) => ({ value: item.name, label: `${item.code} · ${item.name}` }))} error={errors.wilaya} />
                <DeepInput label={t("request.location")} placeholder="Commune or nearest town" value={form.location} onChange={set("location")} />
                <div>
                  <p className="mb-2 text-sm font-semibold text-neutral-800">Consultation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: "online", label: "Online", note: "Photos, chat & video" }, { value: "onsite", label: "On site", note: "Expert visits you" }].map((item) => (
                      <button key={item.value} type="button" onClick={() => set("mode")(item.value)} className={cn("rounded-xl border-2 p-3 text-left transition", form.mode === item.value ? "border-[#40533d] bg-[#40533d]/5" : "border-neutral-200 bg-white hover:border-[#40533d]/40")}>
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="block text-[11px] text-[#789078]">{item.note}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <DeepSelect label="Urgency" value={form.urgency} onChange={set("urgency")} options={URGENCY_LEVELS.map((item) => ({ value: item.value, label: item.label }))} />
              </div>
            </fieldset>

            <fieldset className="space-y-5">
              <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[#638260]">3 · Your growing conditions</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <DeepInput label={t("request.plantType")} placeholder={t("request.plantExamples")} value={form.plantType} onChange={set("plantType")} />
                <DeepSelect label={t("request.space")} value={form.spaceDetails} onChange={set("spaceDetails")} options={[
                  { value: "balcony", label: t("request.balcony") },
                  { value: "garden", label: t("request.garden") },
                  { value: "indoor", label: t("request.indoor") },
                  { value: "farm", label: t("request.farm") },
                  { value: "greenhouse", label: t("request.greenhouse") },
                ]} />
                <DeepSelect label={t("request.sun")} value={form.sunExposure} onChange={set("sunExposure")} options={[
                  { value: "low", label: t("request.lowShade") },
                  { value: "medium", label: t("request.medium") },
                  { value: "full", label: t("request.fullSun") },
                ]} />
                <DeepInput label={t("request.availableSpace")} placeholder={t("request.spaceExample")} value={form.areaSize} onChange={set("areaSize")} />
                <DeepInput label="Soil" placeholder="e.g. clay, sandy, recently fertilised" value={form.soilInfo} onChange={set("soilInfo")} />
                <DeepInput label="Water access" placeholder="e.g. well, drip line, municipal water 2×/week" value={form.waterAvailability} onChange={set("waterAvailability")} />
                <DeepInput label={`${t("request.budget")} (DA)`} type="number" min={0} placeholder="e.g. 25000" value={form.budget} onChange={set("budget")} />
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border-2 border-dashed border-[#b8c6b6] bg-[#f7faf6] p-5">
              <PhotoPicker value={photos} onChange={setPhotos} max={MAX_REQUEST_PHOTOS} label={`${t("request.photos")} (${t("request.optional")})`} hint={t("request.photosHelp")} />
            </fieldset>

            {moderationHints.length > 0 && (
              <Notice tone="info">
                {moderationHints.map((flag) => MODERATION_FLAG_LABELS[flag] ?? flag).join(" · ")} — contact details are hidden automatically. You can chat safely with your expert on Tannelli once they accept.
              </Notice>
            )}
            {error && <Notice tone="error">{error}</Notice>}

            <div className="flex flex-col gap-3 border-t border-[#e6ede5] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-xs leading-5 text-[#789078]">{t("request.privacy")}</p>
              <DeepButton type="submit" size="lg" loading={sending}>{t("request.submit")} →</DeepButton>
            </div>
          </form>
        )}
      </DeepFormContainer>
    </main>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={<main className="network-surface section py-20">Loading…</main>}>
      <RequireAuth loadingLabel="Preparing your expert request…">
        <RequestForm />
      </RequireAuth>
    </Suspense>
  );
}

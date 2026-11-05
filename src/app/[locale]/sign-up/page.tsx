"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/components/locale-link";
import { AuthShell } from "@/components/auth-shell";
import { DeepCard, DeepInput, DeepButton, DeepOptionCard, DeepFormContainer, DeepInfoPanel, DeepTextarea, DeepSelect } from "@/components/deep-ui";
import { ImageUploader } from "@/components/image-uploader";
import { DocumentUploader } from "@/components/document-uploader";
import { getParse } from "@/lib/parse/client";
import { algeriaWilayas } from "@/lib/algeria";
import { useI18n } from "@/lib/i18n";
import {
  SIGNUP_ACCOUNT_TYPES,
  homePathForRole,
  type AccountKind,
} from "@/lib/roles";

function initialKind(raw: string | null): AccountKind {
  if (raw === "expert") return "expert";
  if (raw === "provider" || raw === "merchant" || raw === "company") return "merchant";
  if (raw === "farmer") return "farmer";
  if (raw === "user") return "user";
  return "farmer";
}

function RoleOnboardingFields({
  kind,
  values,
  setField,
}: {
  kind: AccountKind;
  values: Record<string, string>;
  setField: (key: string) => (value: string) => void;
}) {
  const wilayaOptions = algeriaWilayas.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }));
  const wilaya = (
    <DeepSelect
      label="Wilaya"
      placeholder="Choose a wilaya"
      options={wilayaOptions}
      value={values.wilaya ?? ""}
      onChange={setField("wilaya")}
      required
    />
  );

  if (kind === "farmer") {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#111]">Your farm</h2>
        <DeepInput label="Farm name" value={values.farmName ?? ""} onChange={setField("farmName")} required />
        {wilaya}
        <DeepInput label="Commune" value={values.commune ?? ""} onChange={setField("commune")} />
        <DeepInput label="Farm size (hectares)" type="number" min={0} value={values.farmSize ?? ""} onChange={setField("farmSize")} />
        <DeepSelect
          label="Farming type"
          placeholder="Choose a type"
          options={[
            { value: "crop", label: "Crop farming" },
            { value: "livestock", label: "Livestock" },
            { value: "mixed", label: "Mixed" },
            { value: "greenhouse", label: "Greenhouse" },
          ]}
          value={values.farmingType ?? ""}
          onChange={setField("farmingType")}
          required
        />
        <DeepInput label="Main crops" placeholder="e.g., tomatoes, olives, dates" value={values.mainCrops ?? ""} onChange={setField("mainCrops")} />
      </div>
    );
  }

  if (kind === "user") {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#111]">Your garden</h2>
        {wilaya}
        <DeepSelect
          label="Growing space"
          placeholder="Choose a space"
          options={[
            { value: "balcony", label: "Balcony" },
            { value: "backyard", label: "Backyard" },
            { value: "indoor", label: "Indoor" },
            { value: "other", label: "Other" },
          ]}
          value={values.spaceType ?? ""}
          onChange={setField("spaceType")}
          required
        />
        <DeepInput label="Interests" placeholder="e.g., herbs, vegetables, flowers" value={values.interests ?? ""} onChange={setField("interests")} />
      </div>
    );
  }

  if (kind === "expert") {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#111]">Your coverage</h2>
        {wilaya}
        <DeepInput label="Languages" placeholder="e.g., Arabic, French, English" value={values.languages ?? ""} onChange={setField("languages")} required />
        <DeepSelect
          label="Fee model"
          placeholder="Choose a fee model"
          options={[
            { value: "per_consultation", label: "Per consultation" },
            { value: "hourly", label: "Hourly" },
            { value: "subscription", label: "Subscription" },
          ]}
          value={values.feeModel ?? ""}
          onChange={setField("feeModel")}
          required
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#111]">Business details</h2>
      <DeepInput label="Legal name" value={values.legalName ?? ""} onChange={setField("legalName")} required />
      <DeepInput label="Commercial register (RC)" value={values.rcNumber ?? ""} onChange={setField("rcNumber")} required />
      <DeepInput label="Tax identification (NIF)" value={values.nifNumber ?? ""} onChange={setField("nifNumber")} required />
      <DeepInput label="Categories sold" placeholder="e.g., seeds, tools, fertilizer" value={values.categories ?? ""} onChange={setField("categories")} />
      <DeepInput label="Payout account" placeholder="Bank or CCP account" value={values.payoutAccount ?? ""} onChange={setField("payoutAccount")} />
    </div>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t, dir } = useI18n();
  const [step, setStep] = useState<"select" | "details" | "verification">("select");
  const [accountKind, setAccountKind] = useState<AccountKind>(() => initialKind(searchParams.get("account")));
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [profilePicturePublicId, setProfilePicturePublicId] = useState("");
  
  // Expert-specific fields
  const [expertise, setExpertise] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [verificationDocs, setVerificationDocs] = useState<Array<{
    name: string;
    url: string;
    publicId: string;
    type: string;
    size: number;
  }>>([]);
  
  // Role-specific onboarding answers (SeedExpress section 4.2)
  const [onb, setOnb] = useState<Record<string, string>>({});
  const setField = (key: string) => (value: string) => setOnb((current) => ({ ...current, [key]: value }));

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => SIGNUP_ACCOUNT_TYPES.find((item) => item.kind === accountKind)!,
    [accountKind],
  );

  function continueEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!accepted) {
      setError(t("auth.acceptRequired"));
      return;
    }
    setStep("details");
  }

  function continueToVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    
    if (!profilePicture) {
      setError("Profile picture is required");
      return;
    }
    
    // For experts, move to verification step
    if (accountKind === "expert") {
      setStep("verification");
      return;
    }
    
    // For non-experts, create account directly
    createAccount(event);
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          accountKind,
          companyName: companyName.trim() || name.trim(),
          avatar: profilePicturePublicId,
          avatarUrl: profilePicture,
          locale,
          expertise: expertise.trim(),
          bio: bio.trim(),
          experienceYears,
          documents: verificationDocs,
          onboarding: onb,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t("auth.signUpError"));
      await getParse().User.become(data.sessionToken);
      window.dispatchEvent(new Event("tannelli:auth"));
      router.replace(`/${locale}${accountKind === "farmer" || accountKind === "user" ? "/profile?welcome=1" : homePathForRole(data.role)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("auth.signUpError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell darkHeader>
      <DeepFormContainer
        title={t("auth.enrollTitle")}
        description={t("auth.enrollIntro")}
        step={step === "select" ? 1 : step === "details" ? 2 : 3}
        totalSteps={accountKind === "expert" ? 3 : 2}
        variant="dotted"
        dir={dir}
        sidePanel={
          step === "details" && (
            <DeepInfoPanel
              title="Your account information"
              items={[
                { label: "Account type", value: t(selected.titleKey) },
                { label: "Name", value: name || "—" },
                { label: "Email", value: email || "—" },
              ]}
            />
          )
        }
      >
        {step === "select" ? (
          <form className="space-y-6" onSubmit={continueEnrollment}>
            <div>
              <h2 className="text-lg font-semibold text-[#111] mb-4">{t("auth.selectType")}</h2>
              <div className="space-y-3">
                {SIGNUP_ACCOUNT_TYPES.map((option) => (
                  <DeepOptionCard
                    key={option.kind}
                    selected={accountKind === option.kind}
                    onClick={() => setAccountKind(option.kind)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-4 w-4 rounded-full border-2 border-[#40533d] flex items-center justify-center">
                        {accountKind === option.kind && (
                          <div className="h-2 w-2 rounded-full bg-[#40533d]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="block text-sm font-semibold text-neutral-900">{t(option.titleKey)}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-neutral-600">{t(option.detailKey)}</span>
                      </div>
                    </div>
                  </DeepOptionCard>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-neutral-200 bg-[#f8f9f8] p-4">
              <p className="text-sm text-neutral-700">
                {t("auth.reviewTerms")}{" "}
                <Link href="/about" className="font-semibold text-[#40533d] hover:underline">{t("auth.terms")}</Link>
                {" "}{t("auth.and")}{" "}
                <Link href="/about" className="font-semibold text-[#40533d] hover:underline">{t("auth.serviceAgreement")}</Link>.
              </p>
              <label className="flex items-start gap-3 mt-4 text-sm text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[#40533d]"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>{t("auth.acceptTerms")}</span>
              </label>
            </div>

            {error && <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <Link href="/contact" className="text-sm font-semibold text-[#40533d] hover:underline">{t("auth.helpPage")}</Link>
              <div className="flex gap-3">
                <Link href="/sign-in">
                  <DeepButton variant="outline">{t("auth.cancel")}</DeepButton>
                </Link>
                <DeepButton type="submit">{t("auth.continue")}</DeepButton>
              </div>
            </div>
          </form>
        ) : step === "details" ? (
          <form className="space-y-6" onSubmit={continueToVerification}>
            <div className="rounded-md border border-neutral-200 bg-[#f8f9f8] px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-neutral-500">{t("auth.accountType")}:</span>{" "}
                  <span className="ml-2 text-sm font-semibold text-neutral-900">{t(selected.titleKey)}</span>
                </div>
                <button type="button" onClick={() => setStep("select")} className="text-xs font-semibold text-[#40533d] hover:underline">
                  {t("auth.change")}
                </button>
              </div>
            </div>

            <DeepInput
              label={t("auth.fullName")}
              value={name}
              onChange={setName}
              required
              autoComplete="name"
            />

            {accountKind === "merchant" && (
              <DeepInput
                label={t("auth.companyName")}
                value={companyName}
                onChange={setCompanyName}
                required
                autoComplete="organization"
              />
            )}

            <DeepInput
              label={t("auth.email")}
              type="email"
              value={email}
              onChange={setEmail}
              required
              autoComplete="email"
            />

            <DeepInput
              label={t("auth.password")}
              type="password"
              value={password}
              onChange={setPassword}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-xs text-neutral-500">{t("auth.passwordHint")}</p>

            <RoleOnboardingFields kind={accountKind} values={onb} setField={setField} />

            <ImageUploader
              label="Profile Picture"
              value={profilePicture}
              onChange={(url, publicId) => {
                setProfilePicture(url);
                setProfilePicturePublicId(publicId);
              }}
              folder="profiles"
              required
            />

            {accountKind === "merchant" && <p className="text-xs leading-5 text-neutral-600">{t("auth.merchantNote")}</p>}
            {accountKind === "expert" && <p className="text-xs leading-5 text-neutral-600">{t("auth.expertNote")}</p>}

            {error && <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <Link href="/sign-in" className="text-sm font-semibold text-[#40533d] hover:underline">{t("auth.alreadyEnrolled")}</Link>
              <DeepButton type="submit" loading={loading}>
                {accountKind === "expert" ? "Continue to Verification" : (loading ? t("auth.creating") : t("auth.createAccount"))}
              </DeepButton>
            </div>
          </form>
        ) : (
          // Expert Verification Step
          <form className="space-y-6" onSubmit={createAccount}>
            <div className="rounded-md border border-neutral-200 bg-[#f8f9f8] px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-neutral-500">{t("auth.accountType")}:</span>{" "}
                  <span className="ml-2 text-sm font-semibold text-neutral-900">{t(selected.titleKey)}</span>
                </div>
                <button type="button" onClick={() => setStep("select")} className="text-xs font-semibold text-[#40533d] hover:underline">
                  {t("auth.change")}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#111]">Expert Verification</h2>
              <p className="text-sm text-neutral-600">
                Please provide your professional information and documents for verification. Your account will be reviewed by our admin team before activation.
              </p>
            </div>

            <DeepInput
              label="Area of Expertise"
              placeholder="e.g., Horticulture, Landscape Design, Agricultural Engineering"
              value={expertise}
              onChange={setExpertise}
              required
            />

            <DeepTextarea
              label="Professional Bio"
              placeholder="Brief description of your background and expertise..."
              value={bio}
              onChange={setBio}
              required
              rows={4}
            />

            <DeepInput
              label="Years of Experience"
              type="number"
              placeholder="e.g., 5"
              value={experienceYears}
              onChange={setExperienceYears}
              required
              min={0}
            />

            <DocumentUploader
              label="Verification Documents"
              description="Upload certificates, licenses, diplomas, or other professional documents (PDF, JPG, PNG)"
              value={verificationDocs}
              onChange={setVerificationDocs}
              folder="experts"
              required
              maxFiles={5}
              maxSizeMB={10}
            />

            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-900">
                <strong>Note:</strong> Your account will remain in pending status until our admin team reviews and verifies your documents. You will receive an email notification once your account is approved.
              </p>
            </div>

            {error && <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="text-sm font-semibold text-[#40533d] hover:underline"
              >
                Back
              </button>
              <DeepButton type="submit" loading={loading}>
                {loading ? t("auth.creating") : "Submit for Verification"}
              </DeepButton>
            </div>
          </form>
        )}
      </DeepFormContainer>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-full flex-1 items-center justify-center bg-[#ebebeb]">Loading…</div>}>
      <SignUpForm />
    </Suspense>
  );
}

"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/components/locale-link";
import { AuthShell } from "@/components/auth-shell";
import { DeepCard, DeepInput, DeepButton } from "@/components/deep-ui";
import { getParse } from "@/lib/parse/client";
import { useI18n } from "@/lib/i18n";
import { homePathForRole } from "@/lib/roles";

function safeNextPath(raw: string | null, locale: string) {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith(`/${locale}/`) && value !== `/${locale}`) return null;
  if (value.includes("//") || value.includes("\\")) return null;
  return value;
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t, dir } = useI18n();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nextPath = safeNextPath(searchParams.get("next"), locale);

  function continueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email.trim()) {
      setError(t("auth.emailRequired"));
      return;
    }
    setStep("password");
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await getParse().User.logIn(email.trim().toLowerCase(), password);
      const me = await fetch("/api/me", { headers: { Authorization: `Bearer ${user.getSessionToken()}` } });
      if (me.status === 403) {
        const data = await me.json().catch(() => ({}));
        await getParse().User.logOut().catch(() => undefined);
        setError(data.reason ? `${data.error} Reason: ${data.reason}` : data.error || "This account is suspended.");
        return;
      }
      window.dispatchEvent(new Event("tannelli:auth"));
      router.replace(nextPath ?? `/${locale}${homePathForRole(user.get("role"))}`);
    } catch {
      setError(t("auth.signInError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] [background-image:radial-gradient(#40533d_1px,transparent_1px)] [background-size:20px_20px] px-4 py-10 sm:py-14" dir={dir}>
        <DeepCard variant="form" className="w-full max-w-[28rem] p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#111] sm:text-[1.5rem]">{t("auth.signInTitle")}</h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t("auth.securityNote")}</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {t("auth.signInHelp")}{" "}
              <Link href="/sign-up" className="font-semibold text-[#40533d] hover:underline">{t("auth.enrollToday")}</Link>.
            </p>
          </div>

          {step === "email" ? (
            <form className="space-y-6" onSubmit={continueWithEmail}>
              <DeepInput
                label={t("auth.email")}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={setEmail}
                required
                autoFocus
              />
              {error && <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>}
              <DeepButton type="submit" fullWidth>
                {t("auth.continue")}
              </DeepButton>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={signIn}>
              <div className="rounded-md border border-neutral-200 bg-[#f8f9f8] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-neutral-500">{t("auth.email")}:</span>{" "}
                    <span className="ml-2 text-sm font-semibold text-neutral-900">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setPassword("");
                      setError("");
                    }}
                    className="text-xs font-semibold text-[#40533d] hover:underline"
                  >
                    {t("auth.change")}
                  </button>
                </div>
              </div>
              <DeepInput
                label={t("auth.password")}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                required
                autoFocus
              />
              {error && <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>}
              <DeepButton type="submit" fullWidth loading={loading}>
                {loading ? t("auth.signingIn") : t("auth.signIn")}
              </DeepButton>
            </form>
          )}

          <div className="mt-8 space-y-4 text-sm">
            <p>
              <Link href="/forgot-password" className="font-semibold text-[#40533d] hover:underline">
                {t("auth.forgotPassword")}
              </Link>
            </p>
            <p className="text-neutral-600">
              {t("auth.needHelp")}{" "}
              <Link href="/contact" className="font-semibold text-[#40533d] hover:underline">{t("auth.contactSupport")}</Link>
            </p>
            <p className="text-neutral-600">
              {t("auth.notEnrolled")}{" "}
              <Link href="/sign-up" className="font-semibold text-[#40533d] hover:underline">{t("auth.signUp")}</Link>{" "}
              {t("auth.enrollCta")}
            </p>
          </div>

          {nextPath && (
            <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-900">{t("auth.returnNotice")}</p>
            </div>
          )}

          <p className="mt-6 text-xs leading-relaxed text-neutral-500">
            {t("auth.privacyCommitment")}{" "}
            <Link href="/about" className="text-[#40533d] hover:underline">{t("auth.privacyPolicy")}</Link>.
          </p>
        </DeepCard>
      </main>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-full flex-1 items-center justify-center bg-[#ebebeb]">Loading…</div>}>
      <SignInForm />
    </Suspense>
  );
}

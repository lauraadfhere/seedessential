"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/components/locale-link";
import { AuthShell } from "@/components/auth-shell";
import { DeepCard, DeepInput, DeepButton } from "@/components/deep-ui";
import { setSessionSecret } from "@/lib/appwrite/client";
import { useI18n } from "@/lib/i18n";
import { homePathForRole } from "@/lib/roles";

function safeNextPath(raw: string | null, locale: string) {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith(`/${locale}/`) && value !== `/${locale}`) return null;
  if (value.includes("//") || value.includes("\\")) return null;
  return value;
}

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@seed.demo", password: "Admin#2026demo", hint: "Moderate & verify" },
  { role: "Customer", email: "customer@seed.demo", password: "Customer#2026demo", hint: "Grower requests" },
  { role: "Expert", email: "expert@seed.demo", password: "Expert#2026demo", hint: "Inbox & advice" },
  { role: "Merchant", email: "merchant@seed.demo", password: "Merchant#2026demo", hint: "Equipment listings" },
] as const;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t, dir } = useI18n();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoBusy, setDemoBusy] = useState<string>("");
  const nextPath = safeNextPath(searchParams.get("next"), locale);

  async function completeLogin(loginEmail: string, loginPassword: string) {
    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Sign-in failed");
    }
    setSessionSecret(data.secret);
    window.dispatchEvent(new Event("tannelli:auth"));
    router.replace(nextPath ?? `/${locale}${data.homePath || homePathForRole(data.user?.role)}`);
  }

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
      await completeLogin(email, password);
    } catch (reason) {
      setError(reason instanceof Error && reason.message && !reason.message.includes("Invalid") ? reason.message : t("auth.signInError"));
    } finally {
      setLoading(false);
    }
  }

  async function signInAsDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setError("");
    setDemoBusy(account.email);
    setEmail(account.email);
    setPassword(account.password);
    setStep("password");
    try {
      await completeLogin(account.email, account.password);
    } catch (reason) {
      setError(reason instanceof Error && reason.message ? reason.message : t("auth.signInError"));
    } finally {
      setDemoBusy("");
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

          <div className="mb-6 border border-rule bg-panel">
            <div className="border-b border-rule bg-panel-head px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#40533d]">Demo access</p>
              <p className="mt-0.5 text-xs text-[#607060]">Pick a role — no typing needed.</p>
            </div>
            <div className="grid gap-px bg-rule sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={Boolean(demoBusy) || loading}
                  onClick={() => void signInAsDemo(account)}
                  className="bg-white px-3 py-3 text-left transition hover:bg-panel disabled:opacity-60"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#18231b]">{account.role}</span>
                    <span className="tmpl-chip !normal-case !tracking-normal">{demoBusy === account.email ? "Signing in…" : "Use"}</span>
                  </span>
                  <span className="mt-1 block text-[11px] text-[#607060]">{account.hint}</span>
                  <span className="mt-1 block truncate text-[10px] text-[#789078]">{account.email}</span>
                </button>
              ))}
            </div>
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
              {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
              <DeepButton type="submit" fullWidth>
                {t("auth.continue")}
              </DeepButton>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={signIn}>
              <div className="border border-rule bg-panel px-4 py-3">
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
              {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
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
              <Link href="/sign-up" className="font-semibold text-[#40533d] hover:underline">{t("auth.signUp")}</Link>
            </p>
          </div>
        </DeepCard>
      </main>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center text-sm text-neutral-600">Loading…</main>}>
      <SignInForm />
    </Suspense>
  );
}

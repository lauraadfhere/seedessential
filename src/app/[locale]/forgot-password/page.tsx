"use client";

import { useState } from "react";
import { Link } from "@/components/locale-link";
import { AuthShell } from "@/components/auth-shell";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <AuthShell>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-[28rem] border border-neutral-300 bg-white px-6 py-8 shadow-[0_2px_8px_rgb(0_0_0_/_0.08)] sm:px-8">
          <h1 className="text-xl font-semibold text-[#2f4a30]">{t("auth.forgotPassword")}</h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{t("auth.signInHelp")}</p>

          {sent ? (
            <p className="mt-8 rounded border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
              {t("auth.returnNotice")} <strong>{email}</strong>
            </p>
          ) : (
            <form
              className="mt-8 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                setSent(true);
              }}
            >
              <label className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-center">
                <span className="text-sm font-semibold text-neutral-800">{t("auth.email")}:</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded border border-neutral-400 px-3 py-2 text-sm outline-none focus:border-[#40533d]"
                />
              </label>
              <button type="submit" className="w-full rounded bg-[#40533d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#334532]">
                {t("auth.continue")}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-neutral-700">
            <Link href="/sign-in" className="font-semibold text-[#2f6b3a] hover:underline">{t("auth.signIn")}</Link>
          </p>
        </div>
      </main>
    </AuthShell>
  );
}

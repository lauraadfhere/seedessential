"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getParse } from "@/lib/parse/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui";

type RequireAuthProps = {
  children: ReactNode;
  /** If set, user must have one of these roles. */
  roles?: string[];
  loadingLabel?: string;
};

/**
 * Client-side gate for Parse sessions. Shows a short loading state, then
 * redirects guests to sign-in with a return URL, or shows an access panel
 * when the role does not match.
 */
export function RequireAuth({
  children,
  roles,
  loadingLabel = "Checking your access…",
}: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const [state, setState] = useState<"loading" | "allowed" | "forbidden">("loading");

  useEffect(() => {
    const user = getParse().User.current();
    if (!user) {
      const query = searchParams.toString();
      const next = `${pathname}${query ? `?${query}` : ""}`;
      router.replace(`/${locale}/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }
    const role = (user.get("role") as string | undefined) || "customer";
    if (roles?.length && !roles.includes(role)) {
      setState("forbidden");
      return;
    }
    setState("allowed");
  }, [locale, pathname, roles, router, searchParams]);

  if (state === "loading") {
    return (
      <main className="network-surface flex min-h-[50vh] items-center justify-center px-4 py-20">
        <div className="depth-card max-w-md px-8 py-10 text-center font-barlow">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#638260]">Secure area</p>
          <p className="mt-3 text-base font-semibold text-[#18231b]">{loadingLabel}</p>
        </div>
      </main>
    );
  }

  if (state === "forbidden") {
    return (
      <main className="network-surface flex min-h-[50vh] items-center justify-center px-4 py-20">
        <div className="depth-card max-w-md px-8 py-10 text-center font-barlow">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">Access restricted</p>
          <h1 className="mt-3 text-xl font-bold text-[#111]">You do not have access to this space</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Sign in with the right account, or go back to your home workspace.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/" shape="rect" variant="outline">Back home</Button>
            <Button href="/profile" shape="rect">My profile</Button>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

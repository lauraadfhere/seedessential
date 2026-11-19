"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSessionSecret } from "@/lib/appwrite/client";
import { authHeaders } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui";

type RequireAuthProps = {
  children: ReactNode;
  /** If set, user must have one of these roles. */
  roles?: string[];
  loadingLabel?: string;
};

/**
 * Client-side gate for Appwrite sessions. Shows a short loading state, then
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
  const { locale } = useI18n();
  const [state, setState] = useState<"loading" | "allowed" | "forbidden">("loading");

  useEffect(() => {
    let live = true;
    const run = async () => {
      const token = getSessionSecret();
      if (!token) {
        const query = window.location.search.replace(/^\?/, "");
        const next = `${pathname}${query ? `?${query}` : ""}`;
        router.replace(`/${locale}/sign-in?next=${encodeURIComponent(next)}`);
        return;
      }
      try {
        const response = await fetch("/api/me", { headers: authHeaders(), cache: "no-store" });
        if (!response.ok) {
          const query = window.location.search.replace(/^\?/, "");
          const next = `${pathname}${query ? `?${query}` : ""}`;
          router.replace(`/${locale}/sign-in?next=${encodeURIComponent(next)}`);
          return;
        }
        const me = await response.json();
        const role = (me.role as string | undefined) || "customer";
        if (roles?.length && !roles.includes(role)) {
          if (live) setState("forbidden");
          return;
        }
        if (live) setState("allowed");
      } catch {
        router.replace(`/${locale}/sign-in`);
      }
    };
    void run();
    return () => {
      live = false;
    };
  }, [locale, pathname, roles, router]);

  if (state === "loading") {
    return <main className="section py-20 text-sm text-[#607060]">{loadingLabel}</main>;
  }

  if (state === "forbidden") {
    return (
      <main className="section py-16">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="mt-2 max-w-lg text-neutral-600">This area is for a different account type. Switch account or go back to your dashboard.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/dashboard">Open dashboard</Button>
          <Button href="/sign-in" variant="outline">
            Sign in with another account
          </Button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

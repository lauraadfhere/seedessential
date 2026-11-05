import { NextResponse, type NextRequest } from "next/server";

const locales = ["en", "fr", "ar"];
const defaultLocale = "en";

function getPreferredLocale(request: NextRequest) {
  const header = request.headers.get("accept-language");
  if (!header) return defaultLocale;
  const preferred = header.split(",")[0]?.split("-")[0]?.toLowerCase();
  return locales.includes(preferred ?? "") ? preferred! : defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (Next.js internals)
     * - api (API routes, handled separately)
     * - files with an extension (favicon.ico, BRAND.png, etc.)
     */
    "/((?!_next|api|.*\\..*).*)",
  ],
};

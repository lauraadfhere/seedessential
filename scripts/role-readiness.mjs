import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const root = new URL("..", import.meta.url);
const routes = [
  "src/app/[locale]/shop/page.tsx",
  "src/app/[locale]/cart/page.tsx",
  "src/app/[locale]/dashboard/page.tsx",
  "src/app/[locale]/expert/page.tsx",
  "src/app/[locale]/provider/page.tsx",
  "src/app/[locale]/admin/page.tsx",
  "src/app/[locale]/admin/experts/page.tsx",
  "src/app/[locale]/projects/page.tsx",
  "src/app/[locale]/orders/page.tsx",
  "src/app/[locale]/privacy/page.tsx",
  "src/app/[locale]/terms/page.tsx",
  "src/app/[locale]/payments/page.tsx",
  "src/app/[locale]/seasonal-calendar/page.tsx",
  "src/app/[locale]/faqs/page.tsx",
  "src/app/[locale]/careers/page.tsx",
  "src/app/[locale]/delivery/page.tsx",
  "src/app/[locale]/returns/page.tsx",
];

const protectedEndpoints = [
  "src/app/api/cart/route.ts",
  "src/app/api/wishlist/route.ts",
  "src/app/api/checkout/route.ts",
  "src/app/api/orders/route.ts",
  "src/app/api/projects/route.ts",
  "src/app/api/projects/[id]/tasks/route.ts",
  "src/app/api/projects/[id]/tasks/[taskId]/route.ts",
  "src/app/api/expert-requests/route.ts",
  "src/app/api/consultations/route.ts",
];

async function exists(path) {
  await access(new URL(path, root), constants.F_OK);
}

for (const route of routes) await exists(route);
const footer = await readFile(new URL("src/components/site-footer.tsx", root), "utf8");
for (const destination of ["/seasonal-calendar", "/faqs", "/careers", "/delivery", "/returns", "/privacy", "/terms", "/payments"]) {
  if (!footer.includes(`"${destination}"`)) throw new Error(`Footer does not link to ${destination}.`);
}
for (const endpoint of protectedEndpoints) {
  const source = await readFile(new URL(endpoint, root), "utf8");
  if (!source.includes("requireUser(request)")) throw new Error(`${endpoint} does not authenticate the request session.`);
  if (source.includes("User.currentAsync()")) throw new Error(`${endpoint} still depends on server-global user state.`);
}

const adminSource = await readFile(new URL("src/app/api/admin/experts/route.ts", root), "utf8");
if (!adminSource.includes("requireAdmin(request)") || !adminSource.includes("verifiedBy\", admin")) {
  throw new Error("Expert review is not bound to the authenticated administrator.");
}

console.log(`Role readiness simulation passed: ${routes.length} pages and ${protectedEndpoints.length} protected flows verified.`);

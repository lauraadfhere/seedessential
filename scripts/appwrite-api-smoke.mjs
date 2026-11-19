/**
 * Smoke-test local Next.js Appwrite auth APIs.
 * Usage: node --env-file=.env.local scripts/appwrite-api-smoke.mjs
 */
const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:3000";

const DEMO = [
  ["admin@seed.demo", "Admin#2026demo", "admin", "/admin"],
  ["customer@seed.demo", "Customer#2026demo", "customer", "/dashboard"],
  ["expert@seed.demo", "Expert#2026demo", "expert", "/expert"],
  ["merchant@seed.demo", "Merchant#2026demo", "provider", "/provider"],
];

const fail = [];
const ok = [];
const log = (pass, msg) => {
  (pass ? ok : fail).push(msg);
  console.log(pass ? `✓ ${msg}` : `✗ ${msg}`);
};

async function signIn(email, password) {
  const res = await fetch(`${BASE}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

console.log(`\n=== API smoke @ ${BASE} ===\n`);

for (const [email, password, role, home] of DEMO) {
  const { res, data } = await signIn(email, password);
  log(res.ok && data.secret && data.user?.role === role, `POST /api/auth/sign-in ${email} → ${res.status} role=${data.user?.role}`);
  if (!res.ok || !data.secret) continue;

  const me = await fetch(`${BASE}/api/me`, {
    headers: { Authorization: `Bearer ${data.secret}` },
  });
  const meBody = await me.json().catch(() => ({}));
  log(me.ok && meBody.role === role, `GET /api/me ${email} → ${me.status} role=${meBody.role}`);

  if (role === "expert") {
    const profile = await fetch(`${BASE}/api/expert/profile`, {
      headers: { Authorization: `Bearer ${data.secret}` },
    });
    const body = await profile.json().catch(() => ({}));
    log(
      profile.ok && body.slug && body.status === "active",
      `GET /api/expert/profile → ${profile.status} slug=${body.slug} status=${body.status}`,
    );

    const requests = await fetch(`${BASE}/api/expert-requests`, {
      headers: { Authorization: `Bearer ${data.secret}` },
    });
    const list = await requests.json().catch(() => null);
    log(requests.ok && Array.isArray(list), `GET /api/expert-requests → ${requests.status} items=${Array.isArray(list) ? list.length : "?"}`);
  }

  const summary = await fetch(`${BASE}/api/marketplace/summary`, {
    headers: { Authorization: `Bearer ${data.secret}` },
  });
  const sum = await summary.json().catch(() => ({}));
  log(summary.ok && typeof sum.attention === "number", `GET /api/marketplace/summary ${email} → ${summary.status}`);

  log(String(data.homePath || "").includes(home.replace("/", "")), `homePath ${email} → ${data.homePath} (expect ~${home})`);
}

// Bad password should 401
{
  const { res, data } = await signIn("expert@seed.demo", "WrongPassword!");
  log(res.status === 401, `bad password → ${res.status} (${data.error || "no error"})`);
}

console.log(`\n=== Summary ===`);
console.log(`${ok.length} passed, ${fail.length} failed`);
if (fail.length) {
  fail.forEach((f) => console.log(" -", f));
  process.exit(1);
}
console.log("Local Appwrite APIs look healthy.");

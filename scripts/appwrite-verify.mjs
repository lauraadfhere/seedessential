/**
 * End-to-end Appwrite health check for Seed.
 * Usage: node --env-file=.env.local scripts/appwrite-verify.mjs
 */
import { Account, Client, Query, TablesDB, Users } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const key = process.env.APPWRITE_API_KEY;
const DB = process.env.APPWRITE_DATABASE_ID || "seed_main";

const TABLES = [
  "profiles",
  "expert_profiles",
  "consultation_requests",
  "request_messages",
  "businesses",
  "claims",
];

const DEMO = [
  ["admin@seed.demo", "Admin#2026demo", "admin"],
  ["customer@seed.demo", "Customer#2026demo", "customer"],
  ["expert@seed.demo", "Expert#2026demo", "expert"],
  ["merchant@seed.demo", "Merchant#2026demo", "provider"],
];

const fail = [];
const ok = [];
const log = (pass, msg) => {
  (pass ? ok : fail).push(msg);
  console.log(pass ? `✓ ${msg}` : `✗ ${msg}`);
};

if (!endpoint || !project || !key) {
  console.error("Missing Appwrite env");
  process.exit(1);
}

const admin = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
const tables = new TablesDB(admin);
const users = new Users(admin);

console.log("\n=== Schema ===");
try {
  const db = await tables.get({ databaseId: DB });
  log(true, `database ${db.$id}`);
} catch (e) {
  log(false, `database ${DB}: ${e.message}`);
}

for (const tableId of TABLES) {
  try {
    const table = await tables.getTable({ databaseId: DB, tableId });
    const cols = await tables.listColumns({ databaseId: DB, tableId });
    const indexes = await tables.listIndexes({ databaseId: DB, tableId });
    const available = cols.columns.filter((c) => c.status === "available").length;
    const processing = cols.columns.filter((c) => c.status !== "available").length;
    log(
      processing === 0,
      `table ${tableId}: ${cols.total} columns (${available} ready${processing ? `, ${processing} pending` : ""}), ${indexes.total} indexes`,
    );
    if (processing) {
      cols.columns
        .filter((c) => c.status !== "available")
        .forEach((c) => console.log(`    · ${c.key} status=${c.status}`));
    }
  } catch (e) {
    log(false, `table ${tableId}: ${e.message}`);
  }
}

console.log("\n=== Demo users & rows ===");
for (const [email, , expectedRole] of DEMO) {
  try {
    const listed = await users.list({ queries: [Query.equal("email", email)] });
    if (!listed.total) {
      log(false, `user missing ${email}`);
      continue;
    }
    const user = listed.users[0];
    const prefsRole = user.prefs?.role;
    const profiles = await tables.listRows({
      databaseId: DB,
      tableId: "profiles",
      queries: [Query.equal("userId", user.$id), Query.limit(1)],
    });
    const profile = profiles.rows[0];
    const role = profile?.role || prefsRole;
    log(role === expectedRole, `${email}: role=${role} (want ${expectedRole}), profile=${!!profile}`);

    if (expectedRole === "expert") {
      const experts = await tables.listRows({
        databaseId: DB,
        tableId: "expert_profiles",
        queries: [Query.equal("userId", user.$id), Query.limit(1)],
      });
      const expert = experts.rows[0];
      log(
        !!expert && expert.status === "active" && expert.slug === "demo-expert",
        `${email}: expert_profiles slug=${expert?.slug} status=${expert?.status}`,
      );
    }
    if (expectedRole === "provider") {
      const businesses = await tables.listRows({
        databaseId: DB,
        tableId: "businesses",
        queries: [Query.equal("userId", user.$id), Query.limit(1)],
      });
      log(businesses.total > 0, `${email}: business row=${businesses.total > 0}`);
    }
  } catch (e) {
    log(false, `${email}: ${e.message}`);
  }
}

console.log("\n=== Auth sessions ===");
for (const [email, password, expectedRole] of DEMO) {
  try {
    const probe = new Client().setEndpoint(endpoint).setProject(project);
    const probeSession = await new Account(probe).createEmailPasswordSession({ email, password });
    const session = await users.createSession({ userId: probeSession.userId });
    if (!session.secret) {
      log(false, `${email}: session secret missing`);
      continue;
    }
    const me = await new Account(
      new Client().setEndpoint(endpoint).setProject(project).setSession(session.secret),
    ).get();
    const profiles = await tables.listRows({
      databaseId: DB,
      tableId: "profiles",
      queries: [Query.equal("userId", me.$id), Query.limit(1)],
    });
    const role = profiles.rows[0]?.role || me.prefs?.role;
    log(role === expectedRole && me.email === email, `${email}: session OK → ${me.name} (${role})`);
  } catch (e) {
    log(false, `${email}: login ${e.message}`);
  }
}

console.log("\n=== Write smoke (expert profile update) ===");
try {
  const listed = await users.list({ queries: [Query.equal("email", "expert@seed.demo")] });
  const user = listed.users[0];
  const experts = await tables.listRows({
    databaseId: DB,
    tableId: "expert_profiles",
    queries: [Query.equal("userId", user.$id), Query.limit(1)],
  });
  const expert = experts.rows[0];
  const stamp = `ok-${Date.now()}`;
  await tables.updateRow({
    databaseId: DB,
    tableId: "expert_profiles",
    rowId: expert.$id,
    data: { bio: `Demo agronomist (${stamp})` },
  });
  const again = await tables.getRow({
    databaseId: DB,
    tableId: "expert_profiles",
    rowId: expert.$id,
  });
  log(String(again.bio).includes(stamp), "expert_profiles update/read round-trip");
} catch (e) {
  log(false, `expert write: ${e.message}`);
}

console.log("\n=== Summary ===");
console.log(`${ok.length} passed, ${fail.length} failed`);
if (fail.length) {
  console.log("Failures:");
  fail.forEach((f) => console.log(" -", f));
  process.exit(1);
}
console.log("Appwrite backend looks healthy.");

/**
 * Creates Appwrite TablesDB schema + demo accounts.
 * Usage: node --env-file=.env.local scripts/appwrite-setup.mjs
 */
import { Client, TablesDB, Users, ID, Permission, Role, Query } from "node-appwrite";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID || "seed_main";

if (!ENDPOINT || !PROJECT || !KEY) {
  console.error("Missing Appwrite env");
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(KEY);
const tables = new TablesDB(client);
const users = new Users(client);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureDatabase() {
  try {
    await tables.get({ databaseId: DB_ID });
    console.log("database exists", DB_ID);
  } catch {
    await tables.create({ databaseId: DB_ID, name: "Seed Main" });
    console.log("database created", DB_ID);
  }
}

async function ensureTable(tableId, name) {
  try {
    await tables.getTable({ databaseId: DB_ID, tableId });
    console.log("table exists", tableId);
  } catch {
    await tables.createTable({
      databaseId: DB_ID,
      tableId,
      name,
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      rowSecurity: true,
    });
    console.log("table created", tableId);
  }
}

async function ensureString(tableId, key, size, required = false, array = false) {
  try {
    await tables.getColumn({ databaseId: DB_ID, tableId, key });
  } catch {
    await tables.createStringColumn({ databaseId: DB_ID, tableId, key, size, required, array });
    console.log("  + string", tableId, key);
  }
}

async function ensureInteger(tableId, key, required = false) {
  try {
    await tables.getColumn({ databaseId: DB_ID, tableId, key });
  } catch {
    await tables.createIntegerColumn({ databaseId: DB_ID, tableId, key, required });
    console.log("  + integer", tableId, key);
  }
}

async function ensureFloat(tableId, key, required = false) {
  try {
    await tables.getColumn({ databaseId: DB_ID, tableId, key });
  } catch {
    await tables.createFloatColumn({ databaseId: DB_ID, tableId, key, required });
    console.log("  + float", tableId, key);
  }
}

async function ensureBoolean(tableId, key, required = false, xdefault) {
  try {
    await tables.getColumn({ databaseId: DB_ID, tableId, key });
  } catch {
    await tables.createBooleanColumn({ databaseId: DB_ID, tableId, key, required, xdefault });
    console.log("  + boolean", tableId, key);
  }
}

async function ensureIndex(tableId, key, type, columns) {
  try {
    await tables.getIndex({ databaseId: DB_ID, tableId, key });
  } catch {
    await tables.createIndex({ databaseId: DB_ID, tableId, key, type, columns });
    console.log("  + index", tableId, key);
  }
}

await ensureDatabase();

for (const [id, name] of [
  ["profiles", "Profiles"],
  ["expert_profiles", "Expert profiles"],
  ["consultation_requests", "Consultation requests"],
  ["request_messages", "Request messages"],
  ["businesses", "Businesses"],
  ["claims", "Claims"],
  ["ruddge_threads", "Ruddge threads"],
  ["ruddge_messages", "Ruddge messages"],
]) {
  await ensureTable(id, name);
}

for (const [key, size, req] of [
  ["userId", 64, true],
  ["email", 254, false],
  ["name", 120, false],
  ["role", 32, true],
  ["accountKind", 32, false],
  ["status", 32, false],
  ["phone", 40, false],
  ["wilaya", 60, false],
  ["bio", 2000, false],
  ["avatar", 200, false],
  ["locale", 8, false],
  ["farmSize", 40, false],
  ["gardenType", 40, false],
  ["expertiseDomain", 80, false],
  ["companyName", 120, false],
  ["suspensionReason", 500, false],
]) {
  await ensureString("profiles", key, size, req);
}
await ensureString("profiles", "mainCrops", 40, false, true);
await ensureString("profiles", "interests", 40, false, true);
await ensureString("profiles", "specialties", 40, false, true);
await ensureString("profiles", "coverageWilayas", 60, false, true);

for (const [key, size, req] of [
  ["userId", 64, true],
  ["slug", 80, true],
  ["name", 120, true],
  ["professionalCategory", 80, false],
  ["bio", 2000, false],
  ["location", 60, false],
  ["avatar", 200, false],
  ["status", 32, false],
  ["rejectionReason", 1000, false],
  ["trustTier", 32, false],
]) {
  await ensureString("expert_profiles", key, size, req);
}
await ensureString("expert_profiles", "specialties", 60, false, true);
await ensureString("expert_profiles", "languages", 40, false, true);
await ensureString("expert_profiles", "coverageWilayas", 60, false, true);
await ensureInteger("expert_profiles", "experienceYears");
await ensureInteger("expert_profiles", "consultationPrice");
await ensureInteger("expert_profiles", "reviewsCount");
await ensureInteger("expert_profiles", "completedRequests");
await ensureInteger("expert_profiles", "trustScore");
await ensureFloat("expert_profiles", "rating");
await ensureBoolean("expert_profiles", "online", false, true);

for (const [key, size] of [
  ["customerId", 64],
  ["title", 160],
  ["objective", 4000],
  ["category", 40],
  ["status", 32],
  ["moderationStatus", 32],
  ["mode", 24],
  ["urgency", 24],
  ["wilaya", 60],
  ["location", 120],
  ["plantType", 120],
  ["spaceDetails", 120],
  ["areaSize", 80],
  ["sunExposure", 40],
  ["soilInfo", 500],
  ["waterAvailability", 500],
  ["preferredExpertId", 64],
  ["assignedExpertId", 64],
  ["moderationNote", 1000],
]) {
  await ensureString("consultation_requests", key, size);
}
await ensureString("consultation_requests", "moderationFlags", 40, false, true);
await ensureString("consultation_requests", "declinedBy", 64, false, true);
await ensureString("consultation_requests", "photos", 200, false, true);
await ensureInteger("consultation_requests", "budget");

await ensureString("request_messages", "requestId", 64, true);
await ensureString("request_messages", "authorId", 64, true);
await ensureString("request_messages", "authorRole", 32);
await ensureString("request_messages", "authorName", 120);
await ensureString("request_messages", "body", 4000, true);
await ensureString("request_messages", "flags", 40, false, true);

await ensureString("businesses", "userId", 64, true);
await ensureString("businesses", "companyName", 120);
await ensureString("businesses", "companyType", 60);
await ensureString("businesses", "description", 2000);
await ensureString("businesses", "website", 200);
await ensureString("businesses", "address", 200);
await ensureString("businesses", "wilaya", 60);
await ensureString("businesses", "contactPhone", 40);
await ensureString("businesses", "registryNumber", 40);
await ensureString("businesses", "vatNumber", 40);
await ensureString("businesses", "logo", 200);
await ensureString("businesses", "verificationStatus", 32);
await ensureString("businesses", "coverageWilayas", 60, false, true);

await ensureString("claims", "userId", 64, true);
await ensureString("claims", "targetType", 40);
await ensureString("claims", "targetName", 120);
await ensureString("claims", "subject", 200);
await ensureString("claims", "body", 4000);
await ensureString("claims", "status", 32);
await ensureString("claims", "resolution", 2000);

await ensureString("ruddge_threads", "userId", 64, true);
await ensureString("ruddge_threads", "title", 120);
await ensureString("ruddge_threads", "plant", 80);
await ensureString("ruddge_threads", "locale", 8);

await ensureString("ruddge_messages", "threadId", 64, true);
await ensureString("ruddge_messages", "authorId", 64);
await ensureString("ruddge_messages", "role", 16, true);
await ensureString("ruddge_messages", "body", 4000);
await ensureString("ruddge_messages", "photos", 200, false, true);
await ensureString("ruddge_messages", "analysisJson", 8000);
await ensureString("ruddge_messages", "model", 120);

console.log("Waiting for columns…");
await sleep(8000);

await ensureIndex("profiles", "userId_unique", "unique", ["userId"]);
await ensureIndex("profiles", "role_idx", "key", ["role"]);
await ensureIndex("expert_profiles", "userId_unique", "unique", ["userId"]);
await ensureIndex("expert_profiles", "slug_unique", "unique", ["slug"]);
await ensureIndex("expert_profiles", "status_idx", "key", ["status"]);
await ensureIndex("consultation_requests", "customer_idx", "key", ["customerId"]);
await ensureIndex("consultation_requests", "status_idx", "key", ["status"]);
await ensureIndex("consultation_requests", "assigned_idx", "key", ["assignedExpertId"]);
await ensureIndex("request_messages", "request_idx", "key", ["requestId"]);
await ensureIndex("businesses", "userId_unique", "unique", ["userId"]);
await ensureIndex("claims", "user_idx", "key", ["userId"]);
await ensureIndex("ruddge_threads", "user_idx", "key", ["userId"]);
await ensureIndex("ruddge_messages", "thread_idx", "key", ["threadId"]);
await ensureIndex("ruddge_messages", "author_idx", "key", ["authorId"]);

await sleep(4000);

const DEMO = [
  { email: "admin@seed.demo", password: "Admin#2026demo", name: "Platform Admin", role: "admin", accountKind: "user" },
  { email: "customer@seed.demo", password: "Customer#2026demo", name: "Demo Customer", role: "customer", accountKind: "farmer" },
  { email: "expert@seed.demo", password: "Expert#2026demo", name: "Demo Expert", role: "expert", accountKind: "expert" },
  { email: "merchant@seed.demo", password: "Merchant#2026demo", name: "Demo Merchant", role: "provider", accountKind: "merchant" },
];

for (const demo of DEMO) {
  let user;
  const existing = await users.list({ queries: [Query.equal("email", demo.email)] });
  if (existing.total > 0) {
    user = existing.users[0];
    await users.updateName({ userId: user.$id, name: demo.name });
    await users.updatePassword({ userId: user.$id, password: demo.password });
    console.log("updated user", demo.email);
  } else {
    user = await users.create({
      userId: ID.unique(),
      email: demo.email,
      password: demo.password,
      name: demo.name,
    });
    console.log("created user", demo.email);
  }

  await users.updatePrefs({
    userId: user.$id,
    prefs: { role: demo.role, accountKind: demo.accountKind, status: "active" },
  });

  const profileData = {
    userId: user.$id,
    email: demo.email,
    name: demo.name,
    role: demo.role,
    accountKind: demo.accountKind,
    status: "active",
    locale: "en",
    wilaya: "Alger",
  };

  const profiles = await tables.listRows({
    databaseId: DB_ID,
    tableId: "profiles",
    queries: [Query.equal("userId", user.$id)],
  });
  if (profiles.total > 0) {
    await tables.updateRow({
      databaseId: DB_ID,
      tableId: "profiles",
      rowId: profiles.rows[0].$id,
      data: profileData,
    });
  } else {
    await tables.createRow({
      databaseId: DB_ID,
      tableId: "profiles",
      rowId: ID.unique(),
      data: profileData,
      permissions: [
        Permission.read(Role.any()),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
      ],
    });
  }

  if (demo.role === "expert") {
    const expertData = {
      userId: user.$id,
      slug: "demo-expert",
      name: demo.name,
      professionalCategory: "Agronomy",
      specialties: ["Tomato diseases", "Irrigation planning", "Soil health"],
      bio: "Demo agronomist for showcase walkthroughs — accepts grower requests across Algiers and online.",
      location: "Alger",
      coverageWilayas: ["Alger", "Blida", "Boumerdès", "Tipaza"],
      languages: ["Arabic", "French", "English"],
      experienceYears: 10,
      consultationPrice: 2500,
      rating: 4.9,
      reviewsCount: 42,
      completedRequests: 38,
      online: true,
      status: "active",
      trustScore: 92,
      trustTier: "trusted",
    };
    const experts = await tables.listRows({
      databaseId: DB_ID,
      tableId: "expert_profiles",
      queries: [Query.equal("userId", user.$id)],
    });
    if (experts.total > 0) {
      await tables.updateRow({
        databaseId: DB_ID,
        tableId: "expert_profiles",
        rowId: experts.rows[0].$id,
        data: expertData,
      });
    } else {
      await tables.createRow({
        databaseId: DB_ID,
        tableId: "expert_profiles",
        rowId: ID.unique(),
        data: expertData,
        permissions: [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ],
      });
    }
    console.log("  linked expert_profiles demo-expert");
  }

  if (demo.role === "provider") {
    const businessData = {
      userId: user.$id,
      companyName: "Demo Merchant Co",
      companyType: "nursery",
      description: "Demo merchant account for equipment listings.",
      wilaya: "Alger",
      coverageWilayas: ["Alger", "Blida"],
      verificationStatus: "verified",
      contactPhone: "+213555000000",
    };
    const businesses = await tables.listRows({
      databaseId: DB_ID,
      tableId: "businesses",
      queries: [Query.equal("userId", user.$id)],
    });
    if (businesses.total > 0) {
      await tables.updateRow({
        databaseId: DB_ID,
        tableId: "businesses",
        rowId: businesses.rows[0].$id,
        data: businessData,
      });
    } else {
      await tables.createRow({
        databaseId: DB_ID,
        tableId: "businesses",
        rowId: ID.unique(),
        data: businessData,
        permissions: [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ],
      });
    }
    console.log("  linked businesses Demo Merchant Co");
  }
}

console.log("Appwrite setup complete.");

/**
 * Seeds 12 demo consultation requests + message exchanges for the expert/customer demos.
 * Usage: node --env-file=.env.local scripts/appwrite-seed-requests.mjs
 */
import { Client, ID, Permission, Query, Role, TablesDB, Users } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const key = process.env.APPWRITE_API_KEY;
const DB = process.env.APPWRITE_DATABASE_ID || "seed_main";

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
const tables = new TablesDB(client);
const users = new Users(client);

async function ensureString(tableId, key, size, required = false) {
  try {
    await tables.getColumn({ databaseId: DB, tableId, key });
  } catch {
    await tables.createStringColumn({ databaseId: DB, tableId, key, size, required });
    console.log("  + column", tableId, key);
    await new Promise((r) => setTimeout(r, 2500));
  }
}

async function userByEmail(email) {
  const listed = await users.list({ queries: [Query.equal("email", email)] });
  if (!listed.total) throw new Error(`Missing user ${email}`);
  return listed.users[0];
}

async function clearDemoRows() {
  for (const tableId of ["request_messages", "consultation_requests"]) {
    const listed = await tables.listRows({ databaseId: DB, tableId, queries: [Query.limit(100)] });
    for (const row of listed.rows) {
      if (row.demoSeed || String(row.title || "").startsWith("[Demo]") || String(row.body || "").includes("[demo-seed]")) {
        await tables.deleteRow({ databaseId: DB, tableId, rowId: row.$id });
      }
    }
  }
  // Also wipe all consultation_requests + messages for a clean demo (safe on this project)
  const allReq = await tables.listRows({ databaseId: DB, tableId: "consultation_requests", queries: [Query.limit(100)] });
  for (const row of allReq.rows) {
    await tables.deleteRow({ databaseId: DB, tableId: "consultation_requests", rowId: row.$id });
  }
  const allMsg = await tables.listRows({ databaseId: DB, tableId: "request_messages", queries: [Query.limit(200)] });
  for (const row of allMsg.rows) {
    await tables.deleteRow({ databaseId: DB, tableId: "request_messages", rowId: row.$id });
  }
  console.log("cleared previous requests/messages");
}

const SCENARIOS = [
  {
    status: "open",
    title: "[Demo] Tomato leaves yellowing after drip install",
    objective:
      "My cherry tomatoes started yellowing two weeks after I installed a new drip line on the balcony. Soil stays wet at the base. Need a clear diagnosis and what to change this week.",
    category: "pests",
    plantType: "Cherry tomato",
    wilaya: "Alger",
    location: "Bab Ezzouar balcony",
    urgency: "soon",
    mode: "online",
    spaceDetails: "balcony",
    areaSize: "6 m²",
    sunExposure: "full",
    soilInfo: "Peat mix in 20L pots",
    waterAvailability: "Municipal, drip 2×/day",
    budget: 4000,
    customerName: "Yasmine K.",
  },
  {
    status: "open",
    title: "[Demo] Olive trees dropping fruit early",
    objective:
      "Three young olive trees in Tipaza are dropping fruit before ripening. Irrigation is irregular in summer. Looking for a practical watering and pruning plan.",
    category: "orchard",
    plantType: "Olive",
    wilaya: "Tipaza",
    location: "Coastal plot",
    urgency: "normal",
    mode: "onsite",
    spaceDetails: "garden",
    areaSize: "400 m²",
    sunExposure: "full",
    soilInfo: "Sandy limestone",
    waterAvailability: "Well, limited in August",
    budget: 12000,
    customerName: "Karim B.",
  },
  {
    status: "open",
    title: "[Demo] Whiteflies on greenhouse peppers",
    objective:
      "Pepper plants under plastic in Blida have sticky leaves and whiteflies. Already tried soap spray twice. Need an integrated plan that is safe for harvest.",
    category: "pests",
    plantType: "Bell pepper",
    wilaya: "Blida",
    location: "Family greenhouse",
    urgency: "urgent",
    mode: "online",
    spaceDetails: "greenhouse",
    areaSize: "80 m²",
    sunExposure: "medium",
    soilInfo: "Compost + native soil",
    waterAvailability: "Drip from tank",
    budget: 8000,
    customerName: "Nadia M.",
  },
  {
    status: "open",
    title: "[Demo] Soil test needed before planting potatoes",
    objective:
      "Want to plant potatoes in Boumerdès this season. Soil looks clay-heavy and stays cold. Need fertilisation advice and variety recommendations for our climate.",
    category: "soil",
    plantType: "Potato",
    wilaya: "Boumerdès",
    location: "Open field",
    urgency: "normal",
    mode: "online",
    spaceDetails: "farm",
    areaSize: "0.5 ha",
    sunExposure: "full",
    soilInfo: "Heavy clay",
    waterAvailability: "Furrow irrigation",
    budget: 15000,
    customerName: "Demo Customer",
  },
  {
    status: "matched",
    title: "[Demo] Drip scheduling for citrus orchard",
    objective:
      "I have 25 citrus trees. Current schedule is 40 minutes every evening. Leaves curl at noon. Need a corrected drip schedule and mulching advice.",
    category: "irrigation",
    plantType: "Citrus",
    wilaya: "Alger",
    location: "Hydra garden",
    urgency: "soon",
    mode: "online",
    spaceDetails: "garden",
    areaSize: "250 m²",
    sunExposure: "full",
    soilInfo: "Loam with compost",
    waterAvailability: "Municipal meter",
    budget: 6000,
    customerName: "Samir A.",
    thread: [
      { role: "customer", body: "Thanks for accepting. Evening irrigation was recommended by a neighbour — happy to change it." },
      { role: "expert", body: "[demo-seed] Move irrigation to early morning, 20–25 min, 3×/week for now. Add 5 cm wood mulch under the canopy (keep trunk clear)." },
      { role: "customer", body: "Should I reduce emitter flow as well?" },
      { role: "expert", body: "[demo-seed] Keep current emitters; just shorten runtime and watch soil moisture at 15 cm depth before the next cycle." },
    ],
  },
  {
    status: "matched",
    title: "[Demo] Indoor monstera brown tips",
    objective:
      "Indoor monstera in Alger apartment has brown tips. Near AC vent. Watering once a week. Need care correction.",
    category: "indoor",
    plantType: "Monstera",
    wilaya: "Alger",
    location: "Apartment living room",
    urgency: "normal",
    mode: "online",
    spaceDetails: "indoor",
    areaSize: "Pot Ø 24 cm",
    sunExposure: "medium",
    soilInfo: "Aroid mix",
    waterAvailability: "Tap water",
    budget: 2500,
    customerName: "Lina R.",
    thread: [
      { role: "customer", body: "Photo uploaded earlier — tips are crispy, not soft." },
      { role: "expert", body: "[demo-seed] Move 1–1.5 m away from the AC. Water only when the top 3 cm are dry. Mist is optional; humidity tray helps more." },
    ],
  },
  {
    status: "matched",
    title: "[Demo] Lawn yellow patches after fertiliser",
    objective:
      "Applied NPK last weekend in Tipaza; now yellow burn patches. Irrigation afterwards was light. Need recovery steps.",
    category: "soil",
    plantType: "Lawn / turf",
    wilaya: "Tipaza",
    location: "Front lawn",
    urgency: "soon",
    mode: "online",
    spaceDetails: "garden",
    areaSize: "120 m²",
    sunExposure: "full",
    soilInfo: "Sandy",
    waterAvailability: "Sprinklers",
    budget: 5000,
    customerName: "Omar H.",
    thread: [
      { role: "customer", body: "I used roughly a handful per m² — maybe too much?" },
      { role: "expert", body: "[demo-seed] Likely salt burn. Deep water now for 20 minutes to leach salts. Skip fertiliser for 3 weeks, then use half rate." },
      { role: "customer", body: "Can I overseed the burned spots next week?" },
    ],
  },
  {
    status: "answered",
    title: "[Demo] Powdery mildew on zucchini",
    objective:
      "White powder on zucchini leaves in Blida. Harvest still OK. Need organic treatment plan and spacing advice for next bed.",
    category: "pests",
    plantType: "Zucchini",
    wilaya: "Blida",
    location: "Raised beds",
    urgency: "soon",
    mode: "online",
    spaceDetails: "garden",
    areaSize: "30 m²",
    sunExposure: "full",
    soilInfo: "Raised bed mix",
    waterAvailability: "Hose",
    budget: 3500,
    customerName: "Demo Customer",
    recommendation:
      "Remove the worst leaves and dispose (do not compost). Spray potassium bicarbonate or milk spray early morning, 2× this week. Water at soil level only. Next season space plants 80 cm and prune for airflow.",
    maintenancePlan: "Weekly leaf check; stop foliar wetting; rotate cucurbits next year.",
    thread: [
      { role: "customer", body: "Started two weeks ago after humid nights." },
      { role: "expert", body: "[demo-seed] Classic powdery mildew. Full recommendation is ready in the advice panel — start with leaf removal today." },
      { role: "customer", body: "Is sulphur OK too?" },
      { role: "expert", body: "[demo-seed] Yes if temps stay below ~30°C; avoid mixing with oils the same week." },
    ],
  },
  {
    status: "answered",
    title: "[Demo] When to prune fig trees",
    objective:
      "Two fig trees in Boumerdès — when and how to prune without losing this year's crop.",
    category: "orchard",
    plantType: "Fig",
    wilaya: "Boumerdès",
    location: "Backyard",
    urgency: "normal",
    mode: "online",
    spaceDetails: "garden",
    areaSize: "2 trees",
    sunExposure: "full",
    soilInfo: "Clay-loam",
    waterAvailability: "Hose",
    budget: 3000,
    customerName: "Amina Z.",
    recommendation:
      "Prune late winter (Feb) after frost risk. Remove crossing wood and suckers; keep an open vase. Do not hard-prune now if fruit is set — only light cleaning of dead wood.",
    maintenancePlan: "Mulch in spring; deep water every 10–14 days in summer.",
    thread: [
      { role: "customer", body: "One tree has lots of suckers at the base." },
      { role: "expert", body: "[demo-seed] Cut suckers flush now. Main structural pruning waits until late winter — details are in the recommendation." },
    ],
  },
  {
    status: "answered",
    title: "[Demo] Herb balcony — basil keeps bolting",
    objective:
      "Basil bolts within days on an Alger balcony. Mint is fine. Need variety and potting tips.",
    category: "agronomy",
    plantType: "Basil",
    wilaya: "Alger",
    location: "West balcony",
    urgency: "normal",
    mode: "online",
    spaceDetails: "balcony",
    areaSize: "4 pots",
    sunExposure: "full",
    soilInfo: "Generic potting soil",
    waterAvailability: "Daily watering",
    budget: 2000,
    customerName: "Demo Customer",
    recommendation:
      "Use Genovese or Napoli types; pinch flower buds weekly. Afternoon shade cloth (30%) in July–August. Richer potting mix + weekly light organic feed. Water morning only.",
    maintenancePlan: "Pinch tips every 7 days; replace plants mid-summer if woody.",
    thread: [
      { role: "expert", body: "[demo-seed] Recommendation posted. Pinching + light afternoon shade usually stops early bolting here." },
      { role: "customer", body: "Perfect — ordering shade cloth today." },
    ],
  },
  {
    status: "completed",
    title: "[Demo] Compost pile smelling ammonia",
    objective:
      "Home compost in Tipaza smells strongly of ammonia. Browns/greens ratio unclear. Need a fix.",
    category: "soil",
    plantType: "Compost system",
    wilaya: "Tipaza",
    location: "Garden corner",
    urgency: "normal",
    mode: "online",
    spaceDetails: "garden",
    areaSize: "1 m³ pile",
    sunExposure: "medium",
    soilInfo: "n/a",
    waterAvailability: "n/a",
    budget: 1500,
    customerName: "Farid S.",
    recommendation:
      "Add 2–3 parts dry browns (cardboard, dry leaves) and turn thoroughly. Keep moisture like a wrung sponge. Cover from rain. Smell should fade in a few days.",
    maintenancePlan: "Turn weekly; layer browns after each kitchen scrap addition.",
    thread: [
      { role: "customer", body: "Mostly kitchen scraps and grass clippings." },
      { role: "expert", body: "[demo-seed] Too much nitrogen. Add browns and turn — full steps in the recommendation." },
      { role: "customer", body: "Smell is gone after two days. Closing this — thank you!" },
      { role: "expert", body: "[demo-seed] Great. Keep the browns nearby for the next scraps." },
    ],
  },
  {
    status: "completed",
    title: "[Demo] Raised bed layout for winter greens",
    objective:
      "Planning a 1×3 m raised bed in Alger for winter lettuce, spinach, peas. Need spacing map and companion tips.",
    category: "agronomy",
    plantType: "Winter greens",
    wilaya: "Alger",
    location: "Terrace raised bed",
    urgency: "normal",
    mode: "online",
    spaceDetails: "garden",
    areaSize: "3 m²",
    sunExposure: "medium",
    soilInfo: "Fresh raised-bed mix",
    waterAvailability: "Watering can",
    budget: 4500,
    customerName: "Demo Customer",
    recommendation:
      "North row: peas on trellis. Middle: spinach (15 cm). South: looseleaf lettuce (20 cm). Sow succession every 2 weeks. Interplant dill lightly for beneficials.",
    maintenancePlan: "Shade cloth only on heat spikes; harvest outer leaves weekly.",
    thread: [
      { role: "expert", body: "[demo-seed] Layout recommendation is ready. Start peas on the north edge for height." },
      { role: "customer", body: "Planted this weekend — marking completed." },
    ],
  },
];

console.log("Ensuring extra columns…");
await ensureString("consultation_requests", "customerName", 120);
await ensureString("consultation_requests", "recommendation", 5000);
await ensureString("consultation_requests", "maintenancePlan", 3000);
await ensureString("consultation_requests", "demoSeed", 8);
await ensureString("request_messages", "demoSeed", 8);
await new Promise((r) => setTimeout(r, 4000));

const customer = await userByEmail("customer@seed.demo");
const expertUser = await userByEmail("expert@seed.demo");
const experts = await tables.listRows({
  databaseId: DB,
  tableId: "expert_profiles",
  queries: [Query.equal("userId", expertUser.$id), Query.limit(1)],
});
const expert = experts.rows[0];
if (!expert) throw new Error("Demo expert profile missing — run npm run appwrite:setup first");

await clearDemoRows();

const perms = [
  Permission.read(Role.any()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

let created = 0;
let messages = 0;

for (const scenario of SCENARIOS) {
  const assigned = ["matched", "answered", "completed"].includes(scenario.status);
  const row = await tables.createRow({
    databaseId: DB,
    tableId: "consultation_requests",
    rowId: ID.unique(),
    data: {
      customerId: customer.$id,
      customerName: scenario.customerName,
      title: scenario.title,
      objective: scenario.objective,
      category: scenario.category,
      status: scenario.status,
      moderationStatus: "approved",
      mode: scenario.mode,
      urgency: scenario.urgency,
      wilaya: scenario.wilaya,
      location: scenario.location,
      plantType: scenario.plantType,
      spaceDetails: scenario.spaceDetails,
      areaSize: scenario.areaSize,
      sunExposure: scenario.sunExposure,
      soilInfo: scenario.soilInfo,
      waterAvailability: scenario.waterAvailability,
      budget: scenario.budget,
      photos: [],
      moderationFlags: [],
      declinedBy: [],
      assignedExpertId: assigned ? expert.$id : "",
      preferredExpertId: "",
      recommendation: scenario.recommendation || "",
      maintenancePlan: scenario.maintenancePlan || "",
      demoSeed: "1",
    },
    permissions: perms,
  });
  created += 1;

  const thread = scenario.thread || [];
  // Always add an opening customer message
  const opening = {
    role: "customer",
    body: `Hi — sharing more context for: ${scenario.title.replace("[Demo] ", "")}`,
  };
  const fullThread = [opening, ...thread];

  for (const msg of fullThread) {
    const isExpert = msg.role === "expert";
    await tables.createRow({
      databaseId: DB,
      tableId: "request_messages",
      rowId: ID.unique(),
      data: {
        requestId: row.$id,
        authorId: isExpert ? expertUser.$id : customer.$id,
        authorRole: isExpert ? "expert" : "customer",
        authorName: isExpert ? "Demo Expert" : scenario.customerName,
        body: msg.body,
        flags: [],
        demoSeed: "1",
      },
      permissions: perms,
    });
    messages += 1;
  }
  console.log(`+ ${scenario.status.padEnd(10)} ${scenario.title}`);
}

// Bump expert completed count for realism
await tables.updateRow({
  databaseId: DB,
  tableId: "expert_profiles",
  rowId: expert.$id,
  data: {
    completedRequests: Math.max(Number(expert.completedRequests || 0), 2) + 2,
    reviewsCount: Math.max(Number(expert.reviewsCount || 0), 42),
  },
});

console.log(`\nSeeded ${created} requests and ${messages} messages.`);
console.log("Open expert demo → Request inbox / My clients / History.");

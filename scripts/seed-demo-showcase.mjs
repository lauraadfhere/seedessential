// Seeds a full demo journey: demo users + ExpertProfile for demo expert,
// open / matched / answered consultation requests, messages, and a sample problem.
// Idempotent via demoTag marker. Usage:
//   node --env-file=.env.local scripts/seed-demo-showcase.mjs
import { createRequire } from "node:module";
const Parse = createRequire(import.meta.url)("parse/node");

Parse.initialize(process.env.NEXT_PUBLIC_PARSE_APP_ID, process.env.NEXT_PUBLIC_PARSE_JS_KEY, process.env.PARSE_MASTER_KEY);
Parse.serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

const DEMO_TAG = "tannelli-demo-showcase-v1";
const PASSWORDS = {
  admin: "Admin#2026demo",
  customer: "Customer#2026demo",
  expert: "Expert#2026demo",
  merchant: "Merchant#2026demo",
};

const publicAcl = new Parse.ACL();
publicAcl.setPublicReadAccess(true);

async function upsertUser({ email, password, name, role, accountKind, extra = {} }) {
  let user = await new Parse.Query(Parse.User).equalTo("username", email).first({ useMasterKey: true });
  const created = !user;
  user = user ?? new Parse.User();
  user.set({
    username: email,
    email,
    password,
    name,
    role,
    accountKind,
    locale: "en",
    status: "active",
    ...extra,
  });
  await user.save(null, { useMasterKey: true });
  console.log(`${created ? "created" : "updated"} user ${email}`);
  return user;
}

async function upsertDemoExpert(user) {
  let profile = await new Parse.Query("ExpertProfile").equalTo("user", user).first({ useMasterKey: true });
  const created = !profile;
  if (!profile) profile = new (Parse.Object.extend("ExpertProfile"))();
  profile.set({
    user,
    name: "Demo Expert",
    slug: "demo-expert",
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
    verifiedAt: new Date(),
    trustScore: 92,
    trustTier: "trusted",
    demoTag: DEMO_TAG,
  });
  profile.setACL(publicAcl);
  await profile.save(null, { useMasterKey: true });
  console.log(`${created ? "created" : "updated"} ExpertProfile demo-expert`);
  return profile;
}

async function findOrCreateRequest({ customer, assignedExpert, preferredExpert, status, fields, messages = [] }) {
  const query = new Parse.Query("ConsultationRequest").equalTo("demoTag", DEMO_TAG).equalTo("title", fields.title);
  let request = await query.first({ useMasterKey: true });
  const created = !request;
  if (!request) request = new (Parse.Object.extend("ConsultationRequest"))();

  const now = new Date();
  request.set({
    customer,
    preferredExpert: preferredExpert ?? undefined,
    assignedExpert: assignedExpert ?? undefined,
    status,
    moderationStatus: "approved",
    moderationFlags: [],
    moderationReviewed: true,
    declinedBy: [],
    photos: [],
    recommendedProducts: fields.recommendedProducts ?? [],
    recommendedSlugs: (fields.recommendedProducts ?? []).map((p) => p.slug),
    demoTag: DEMO_TAG,
    ...fields,
  });
  if (["matched", "answered", "completed"].includes(status) && !request.get("acceptedAt")) request.set("acceptedAt", now);
  if (["answered", "completed"].includes(status) && !request.get("answeredAt")) request.set("answeredAt", now);
  if (status === "completed" && !request.get("completedAt")) request.set("completedAt", now);

  const acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setReadAccess(customer, true);
  acl.setWriteAccess(customer, true);
  if (assignedExpert?.get("user")) {
    const expertUser = assignedExpert.get("user");
    acl.setReadAccess(expertUser, true);
    acl.setWriteAccess(expertUser, true);
  }
  request.setACL(acl);
  await request.save(null, { useMasterKey: true });
  console.log(`${created ? "created" : "updated"} request "${fields.title}" (${status})`);

  if (messages.length) {
    const existing = await new Parse.Query("RequestMessage").equalTo("request", request).equalTo("demoTag", DEMO_TAG).find({ useMasterKey: true });
    if (existing.length === 0) {
      for (const message of messages) {
        const row = new (Parse.Object.extend("RequestMessage"))();
        row.set({
          request,
          author: message.author,
          authorRole: message.authorRole,
          body: message.body,
          attachments: [],
          system: Boolean(message.system),
          hidden: false,
          flagged: false,
          moderationFlags: [],
          moderationReviewed: true,
          reportedBy: [],
          demoTag: DEMO_TAG,
        });
        row.setACL(acl);
        await row.save(null, { useMasterKey: true });
      }
      console.log(`  + ${messages.length} messages`);
    }
  }

  return request;
}

async function upsertProblem({ author, title, body, category, budgetDzd, offers = [] }) {
  let problem = await new Parse.Query("Problem").equalTo("demoTag", DEMO_TAG).equalTo("title", title).first({ useMasterKey: true });
  const created = !problem;
  if (!problem) problem = new (Parse.Object.extend("Problem"))();
  problem.set({
    author,
    authorName: author.get("name") || "Demo Customer",
    title,
    body,
    category,
    budgetDzd,
    attachments: [],
    status: "open",
    moderationStatus: "approved",
    demoTag: DEMO_TAG,
  });
  problem.setACL(publicAcl);
  await problem.save(null, { useMasterKey: true });
  console.log(`${created ? "created" : "updated"} problem "${title}"`);

  const existingOffers = await new Parse.Query("ProblemOffer").equalTo("problem", problem).equalTo("demoTag", DEMO_TAG).find({ useMasterKey: true });
  if (existingOffers.length === 0) {
    for (const offer of offers) {
      const row = new (Parse.Object.extend("ProblemOffer"))();
      row.set({
        problem,
        author: offer.author,
        authorName: offer.author.get("name") || "Member",
        kind: offer.kind,
        message: offer.message,
        priceDzd: offer.priceDzd ?? null,
        demoTag: DEMO_TAG,
      });
      row.setACL(publicAcl);
      await row.save(null, { useMasterKey: true });
    }
    if (offers.length) console.log(`  + ${offers.length} offers`);
  }

  return problem;
}

const admin = await upsertUser({
  email: "admin@seed.demo",
  password: PASSWORDS.admin,
  name: "Platform Admin",
  role: "admin",
  accountKind: "user",
});
const customer = await upsertUser({
  email: "customer@seed.demo",
  password: PASSWORDS.customer,
  name: "Demo Customer",
  role: "customer",
  accountKind: "farmer",
  extra: { serviceCity: "Alger" },
});
const expertUser = await upsertUser({
  email: "expert@seed.demo",
  password: PASSWORDS.expert,
  name: "Demo Expert",
  role: "expert",
  accountKind: "expert",
  extra: {
    expertiseDomain: "Agronomy",
    specialties: ["Tomato diseases", "Irrigation planning", "Soil health"],
    serviceCity: "Alger",
    coverageWilayas: ["Alger", "Blida", "Boumerdès", "Tipaza"],
  },
});
const merchant = await upsertUser({
  email: "merchant@seed.demo",
  password: PASSWORDS.merchant,
  name: "Demo Merchant",
  role: "provider",
  accountKind: "merchant",
});

const expertProfile = await upsertDemoExpert(expertUser);

await findOrCreateRequest({
  customer,
  preferredExpert: expertProfile,
  status: "open",
  fields: {
    title: "Tomato leaves yellowing on balcony",
    objective: "Leaves on my cherry tomatoes are turning yellow from the bottom up. Need a diagnosis and shopping list.",
    category: "pests",
    mode: "online",
    urgency: "soon",
    wilaya: "Alger",
    location: "Bab El Oued balcony",
    plantType: "Cherry tomato",
    spaceDetails: "balcony",
    areaSize: "6 m²",
    sunExposure: "full",
    soilInfo: "Commercial potting mix, 18 months old",
    waterAvailability: "Daily hand watering",
    budget: 8000,
  },
  messages: [
    { author: customer, authorRole: "customer", body: "Posted this request — photos show yellowing starting on older leaves." },
  ],
});

await findOrCreateRequest({
  customer,
  assignedExpert: expertProfile,
  preferredExpert: expertProfile,
  status: "matched",
  fields: {
    title: "Drip irrigation layout for terrace pots",
    objective: "Help me size a drip kit for 14 pots on a south-facing terrace in Algiers.",
    category: "irrigation",
    mode: "online",
    urgency: "normal",
    wilaya: "Alger",
    location: "Hydra terrace",
    plantType: "Mixed pots",
    spaceDetails: "garden",
    areaSize: "20 m²",
    sunExposure: "full",
    soilInfo: "Various potting mixes",
    waterAvailability: "Tap with timer available",
    budget: 15000,
  },
  messages: [
    { author: customer, authorRole: "customer", body: "Looking for a simple drip layout I can install myself this weekend." },
    { author: expertUser, authorRole: "expert", body: "Accepted — I'll map emitter counts and send a parts list shortly." },
    { author: expertUser, authorRole: "expert", system: true, body: "Expert accepted this request." },
  ],
});

await findOrCreateRequest({
  customer,
  assignedExpert: expertProfile,
  status: "answered",
  fields: {
    title: "Olive tree pruning after transplant",
    objective: "Young olive transplanted last month looks stressed. Need pruning and watering advice.",
    category: "orchard",
    mode: "onsite",
    urgency: "normal",
    wilaya: "Blida",
    location: "Blida garden",
    plantType: "Olive tree",
    spaceDetails: "garden",
    areaSize: "40 m²",
    sunExposure: "full",
    soilInfo: "Clay-loam, recently amended",
    waterAvailability: "Hose twice a week",
    budget: 12000,
    recommendation: "Hold hard pruning for 6–8 weeks. Remove only dead wood, mulch 5 cm deep, water deeply twice weekly, and feed with a balanced organic fertilizer after new growth returns.",
    maintenancePlan: "Week 1–2: deep water + mulch. Week 3–6: monitor shoot tips. Month 2: light tip prune if vigorous.",
    estimatedBudget: 9500,
    recommendedProducts: [
      { slug: "organic-fertilizer", name: "Organic fertilizer", note: "Apply after new growth starts", providerName: "Demo Merchant" },
      { slug: "pruning-shears", name: "Pruning shears", note: "For deadwood only", providerName: "Demo Merchant" },
    ],
  },
  messages: [
    { author: expertUser, authorRole: "expert", body: "Recommendation delivered — start with mulch and deep watering before any shaping cuts." },
    { author: customer, authorRole: "customer", body: "Thanks — I'll order the fertilizer and shears from your list." },
  ],
});

await findOrCreateRequest({
  customer,
  assignedExpert: expertProfile,
  status: "completed",
  fields: {
    title: "Indoor monstera leaf spots",
    objective: "Brown spots on monstera — already isolated. Confirm if fungal and what to buy.",
    category: "indoor",
    mode: "online",
    urgency: "normal",
    wilaya: "Alger",
    location: "Apartment living room",
    plantType: "Monstera deliciosa",
    spaceDetails: "indoor",
    areaSize: "1 plant",
    sunExposure: "medium",
    soilInfo: "Aroid mix",
    waterAvailability: "Weekly",
    budget: 5000,
    recommendation: "Likely bacterial leaf spot from overwatering. Cut affected leaves, improve airflow, water only when top 3 cm are dry, and avoid misting.",
    estimatedBudget: 3200,
    recommendedProducts: [{ slug: "organic-potting-mix", name: "Organic potting mix", note: "Repot if roots stay wet", providerName: "Demo Merchant" }],
    rating: 5,
    review: "Clear diagnosis and the shopping list worked.",
  },
});

try {
  await upsertProblem({
    author: customer,
    title: "Aphids on balcony peppers",
    category: "Pests",
    budgetDzd: 4000,
    body: "Green aphids clustered under pepper leaves for a week. Looking for organic options or a small spray kit.",
    offers: [
      {
        author: expertUser,
        kind: "suggestion",
        message: "Rinse undersides daily and try insecticidal soap before stronger treatments.",
      },
      {
        author: merchant,
        kind: "equipment",
        message: "We stock a ready organic spray kit that fits small balconies.",
        priceDzd: 2800,
      },
    ],
  });
} catch (error) {
  console.warn("Problem board seed skipped (schema may not include Problem yet):", error.message);
}

console.log("\nDemo showcase ready.");
console.log("Sign in as:");
console.log("  customer@seed.demo / Customer#2026demo  → consultations + matched chat");
console.log("  expert@seed.demo   / Expert#2026demo    → inbox + active clients");
console.log("  admin@seed.demo    / Admin#2026demo");
console.log("  merchant@seed.demo / Merchant#2026demo");
void admin;

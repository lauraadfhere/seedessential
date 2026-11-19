// Creates or updates the demo accounts shown on the sign-in page.
// Usage: node --env-file=.env.local scripts/seed-demo-users.mjs
import { createRequire } from "node:module";
const Parse = createRequire(import.meta.url)("parse/node");

Parse.initialize(process.env.NEXT_PUBLIC_PARSE_APP_ID, process.env.NEXT_PUBLIC_PARSE_JS_KEY, process.env.PARSE_MASTER_KEY);
Parse.serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

const DEMO_USERS = [
  { email: "admin@seed.demo", password: "Admin#2026demo", name: "Platform Admin", role: "admin", accountKind: "user" },
  { email: "customer@seed.demo", password: "Customer#2026demo", name: "Demo Customer", role: "customer", accountKind: "farmer" },
  { email: "expert@seed.demo", password: "Expert#2026demo", name: "Demo Expert", role: "expert", accountKind: "expert" },
  { email: "merchant@seed.demo", password: "Merchant#2026demo", name: "Demo Merchant", role: "provider", accountKind: "merchant" },
];

const acl = new Parse.ACL();
acl.setPublicReadAccess(true);

for (const demo of DEMO_USERS) {
  const existing = await new Parse.Query(Parse.User).equalTo("username", demo.email).first({ useMasterKey: true });
  const user = existing ?? new Parse.User();
  // Always (re)set the password so existing demo accounts stay loginable.
  user.set({
    username: demo.email,
    email: demo.email,
    password: demo.password,
    name: demo.name,
    role: demo.role,
    accountKind: demo.accountKind,
    locale: "en",
    status: "active",
  });
  await user.save(null, { useMasterKey: true });
  console.log(`${existing ? "updated" : "created"} ${demo.email} (${demo.role})`);

  if (demo.role === "expert") {
    let profile = await new Parse.Query("ExpertProfile").equalTo("user", user).first({ useMasterKey: true });
    if (!profile) profile = new (Parse.Object.extend("ExpertProfile"))();
    profile.set({
      user,
      name: demo.name,
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
    });
    profile.setACL(acl);
    await profile.save(null, { useMasterKey: true });
    console.log(`  linked ExpertProfile demo-expert`);
  }
}

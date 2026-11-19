// Creates about 30 active agriculture experts (User + ExpertProfile) for the marketplace.
// Idempotent: existing accounts are updated, not duplicated.
// Usage: node --env-file=.env.local scripts/seed-experts.mjs
import { createRequire } from "node:module";
const Parse = createRequire(import.meta.url)("parse/node");

Parse.initialize(process.env.NEXT_PUBLIC_PARSE_APP_ID, process.env.NEXT_PUBLIC_PARSE_JS_KEY, process.env.PARSE_MASTER_KEY);
Parse.serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

const EXPERTS = [
  ["Amina Benali", "Plant pathology", ["Tomato diseases", "Fungal infections", "Integrated pest management"], "Algiers", ["Alger", "Blida", "Boumerdès"], "Arabic, French", 14],
  ["Youcef Haddad", "Irrigation", ["Drip irrigation", "Water saving", "Soil moisture"], "Oran", ["Oran", "Mostaganem", "Relizane"], "Arabic, French", 11],
  ["Sara Mansouri", "Horticulture", ["Ornamental plants", "Indoor plants", "Potting mix"], "Constantine", ["Constantine", "Mila", "Setif"], "Arabic, French, English", 9],
  ["Karim Boudiaf", "Olive cultivation", ["Olive pruning", "Olive flowering", "Orchard care"], "Tizi Ouzou", ["Tizi Ouzou", "Bejaia", "Bouira"], "Arabic, French, Kabyle", 18],
  ["Lamia Ferhat", "Soil science", ["Soil testing", "Fertilization", "Soil structure"], "Setif", ["Setif", "Bordj Bou Arreridj", "M'Sila"], "Arabic, French", 12],
  ["Mourad Slimani", "Cereal crops", ["Wheat", "Barley", "Crop rotation"], "Sétif", ["Setif", "Batna", "Khenchela"], "Arabic, French", 20],
  ["Nadia Kaci", "Greenhouse production", ["Greenhouse climate", "Vegetable crops", "Hydroponics"], "Annaba", ["Annaba", "El Tarf", "Skikda"], "Arabic, French, English", 8],
  ["Rachid Terki", "Pest control", ["Aphids", "Whiteflies", "Biological control"], "Blida", ["Blida", "Alger", "Tipaza"], "Arabic, French", 13],
  ["Houria Bensalem", "Fruit trees", ["Citrus", "Grafting", "Fruit thinning"], "Mostaganem", ["Mostaganem", "Chlef", "Oran"], "Arabic, French", 10],
  ["Walid Cherif", "Viticulture", ["Grapevine care", "Table grapes", "Vine disease"], "Tlemcen", ["Tlemcen", "Ain Temouchent", "Sidi Bel Abbes"], "Arabic, French", 15],
  ["Sofiane Meziane", "Vegetable farming", ["Potatoes", "Onions", "Seasonal planting"], "Biskra", ["Biskra", "El Oued", "Ouargla"], "Arabic, French", 7],
  ["Imane Hamdi", "Organic farming", ["Compost", "Organic certification", "Natural fertilizers"], "Bejaia", ["Bejaia", "Setif", "Jijel"], "Arabic, French, English", 6],
  ["Abdelkader Rahmani", "Date palm", ["Date palm care", "Pollination", "Palm pests"], "Ghardaia", ["Ghardaia", "Ouargla", "Adrar"], "Arabic, French", 22],
  ["Samia Lounis", "Seedling nurseries", ["Seed germination", "Transplanting", "Seedling health"], "Algiers", ["Alger", "Boumerdès", "Tipaza"], "Arabic, French", 5],
  ["Hakim Zerrouki", "Water management", ["Irrigation scheduling", "Water quality", "Rainwater harvesting"], "Djelfa", ["Djelfa", "M'Sila", "Laghouat"], "Arabic, French", 16],
  ["Meriem Bouzid", "Herbs and aromatics", ["Mint", "Basil", "Aromatic herbs"], "Tipaza", ["Tipaza", "Alger", "Chlef"], "Arabic, French, English", 4],
  ["Tarek Ouali", "Agricultural machinery", ["Tractor setup", "Sprayers", "Planting equipment"], "Skikda", ["Skikda", "Annaba", "Jijel"], "Arabic, French", 17],
  ["Ilhem Djerroud", "Weed management", ["Weed identification", "Herbicide safety", "Mulching"], "Mascara", ["Mascara", "Saida", "Tiaret"], "Arabic, French", 9],
  ["Nabil Saadi", "Citrus orchards", ["Citrus pests", "Citrus nutrition", "Orchard layout"], "Blida", ["Blida", "Boumerdès", "Alger"], "Arabic, French", 14],
  ["Karima Aissani", "Soil fertility", ["Organic matter", "Soil amendments", "Nutrient balance"], "Tiaret", ["Tiaret", "Tissemsilt", "Relizane"], "Arabic, French", 11],
  ["Farid Boukhalfa", "Forage crops", ["Alfalfa", "Livestock feed", "Pasture management"], "Sidi Bel Abbes", ["Sidi Bel Abbes", "Tlemcen", "Naama"], "Arabic, French", 19],
  ["Wafa Medjahed", "Plant nutrition", ["Foliar feeding", "Micronutrients", "Deficiency diagnosis"], "Batna", ["Batna", "Khenchela", "Oum El Bouaghi"], "Arabic, French, English", 8],
  ["Yacine Belkacem", "Post-harvest handling", ["Storage", "Cold chain", "Harvest timing"], "Constantine", ["Constantine", "Guelma", "Oum El Bouaghi"], "Arabic, French", 13],
  ["Souad Ait Ali", "Mushroom cultivation", ["Mushroom substrates", "Climate control", "Contamination"], "Tizi Ouzou", ["Tizi Ouzou", "Boumerdès", "Bouira"], "Arabic, French, Kabyle", 6],
  ["Djamel Rezig", "Pest diagnosis", ["Leaf miners", "Mites", "Scale insects"], "El Oued", ["El Oued", "Biskra", "Ouargla"], "Arabic, French", 12],
  ["Fatima Zohra Brahimi", "Garden design", ["Kitchen gardens", "Crop planning", "Small-space growing"], "Alger", ["Alger", "Blida", "Tipaza"], "Arabic, French, English", 7],
  ["Mehdi Lakhdari", "Irrigation design", ["Drip layouts", "Pressure systems", "Pump selection"], "Oran", ["Oran", "Ain Temouchent", "Mostaganem"], "Arabic, French", 15],
  ["Asma Bouchareb", "Seed selection", ["Seed varieties", "Climate adaptation", "Disease resistance"], "Guelma", ["Guelma", "Souk Ahras", "Annaba"], "Arabic, French", 10],
  ["Redouane Mekki", "Livestock and crops", ["Mixed farming", "Manure use", "Farm planning"], "Medea", ["Medea", "Ain Defla", "Blida"], "Arabic, French", 21],
  ["Leila Sahraoui", "Agronomy extension", ["Farm advisory", "Record keeping", "Training for growers"], "Setif", ["Setif", "Bordj Bou Arreridj", "Bejaia"], "Arabic, French, English", 16],
];

const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const acl = new Parse.ACL();
acl.setPublicReadAccess(true);
const PASSWORD = "Expert#2026seed";

for (const [index, [name, category, specialties, city, wilayas, languages, years]] of EXPERTS.entries()) {
  const email = `expert${String(index + 1).padStart(2, "0")}@seed.demo`;
  const slug = slugify(name);
  let user = await new Parse.Query(Parse.User).equalTo("username", email).first({ useMasterKey: true });
  const created = !user;
  user = user ?? new Parse.User();
  user.set({
    username: email,
    email,
    password: PASSWORD,
    name,
    role: "expert",
    accountKind: "expert",
    locale: "en",
    status: "active",
    expertiseDomain: category,
    specialties,
    serviceCity: city,
    coverageWilayas: wilayas,
  });
  await user.save(null, { useMasterKey: true });

  let profile = await new Parse.Query("ExpertProfile").equalTo("user", user).first({ useMasterKey: true });
  if (!profile) profile = new (Parse.Object.extend("ExpertProfile"))();
  profile.set({
    user,
    name,
    slug,
    professionalCategory: category,
    specialties,
    bio: `${name} advises growers on ${category.toLowerCase()} with practical, field-tested guidance for ${wilayas.join(", ")}.`,
    location: city,
    coverageWilayas: wilayas,
    languages: languages.split(", "),
    experienceYears: years,
    consultationPrice: 2000 + (index % 5) * 500,
    rating: 4.5 + (index % 5) / 10,
    reviewsCount: 5 + index,
    completedRequests: 10 + index * 2,
    online: index % 3 !== 0,
    status: "active",
    verifiedAt: new Date(),
  });
  profile.setACL(acl);
  await profile.save(null, { useMasterKey: true });
  console.log(`${created ? "created" : "updated"} ${email} ${slug}`);
}
console.log(`done: ${EXPERTS.length} experts`);

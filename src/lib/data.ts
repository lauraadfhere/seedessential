// Central mock data for the Tannelli MVP. In production these become
// API/database-backed resources (see ARCHITECTURE.md).

export type CategoryKind = "plant" | "equipment";

export type Category = {
  slug: string;
  name: string;
  kind: CategoryKind;
};

export const categories: Category[] = [
  // Plants
  { slug: "indoor-plants", name: "Indoor Plants", kind: "plant" },
  { slug: "outdoor-plants", name: "Outdoor Plants", kind: "plant" },
  { slug: "trees", name: "Trees", kind: "plant" },
  { slug: "fruit-trees", name: "Fruit Trees", kind: "plant" },
  { slug: "flowers", name: "Flowers", kind: "plant" },
  { slug: "vegetables", name: "Vegetables", kind: "plant" },
  { slug: "herbs", name: "Herbs", kind: "plant" },
  { slug: "succulents", name: "Succulents", kind: "plant" },
  { slug: "seeds", name: "Seeds", kind: "plant" },
  { slug: "climbing-plants", name: "Climbing Plants", kind: "plant" },
  // Equipment
  { slug: "pots-planters", name: "Pots & Planters", kind: "equipment" },
  { slug: "soil-compost", name: "Soil & Compost", kind: "equipment" },
  { slug: "fertilizers", name: "Fertilizers & Nutrients", kind: "equipment" },
  { slug: "tools", name: "Gardening Tools", kind: "equipment" },
  { slug: "irrigation", name: "Irrigation & Watering", kind: "equipment" },
  { slug: "lighting", name: "Grow Lighting", kind: "equipment" },
  { slug: "greenhouses", name: "Greenhouses", kind: "equipment" },
  { slug: "protection", name: "Plant Protection", kind: "equipment" },
];

export type Product = {
  slug: string;
  name: string;
  category: string; // category slug
  kind: CategoryKind;
  price: number;
  /** Optional Algerian dinar price supplied by the live product catalog. */
  priceDzd?: number;
  rating: number;
  reviews: number;
  tint: string; // gradient used as a placeholder until a real image is set
  /** Cloudinary public ID (e.g. "tannelli/products/monstera-1"). Falls back
   * to the tint + monogram placeholder when unset. */
  image?: string;
  short: string;
  description: string;
  inStock: boolean;
  specs?: { label: string; value: string }[];
  difficulty?: "Easy" | "Moderate" | "Advanced";
  light?: string;
  climate?: string;
  care?: string;
  usage?: string;
  featured?: boolean;
};

export const products: Product[] = [
  {
    slug: "monstera-deliciosa",
    name: "Monstera Deliciosa",
    category: "indoor-plants",
    kind: "plant",
    price: 34,
    rating: 4.8,
    reviews: 214,
    tint: "from-neutral-100 to-neutral-200",
    short: "The iconic split-leaf statement plant.",
    description:
      "A vigorous, easy-going tropical famous for its dramatic fenestrated leaves. Perfect for bright living rooms and a favourite of first-time plant parents.",
    inStock: true,
    difficulty: "Easy",
    light: "Bright, indirect",
    climate: "Warm, humid indoor",
    care: "Water when top 3cm of soil is dry",
    usage: "Decoration, air quality, statement corner",
    featured: true,
    specs: [
      { label: "Mature height", value: "1.5 – 2.5 m" },
      { label: "Pot size", value: "Ø 19 cm" },
      { label: "Pet friendly", value: "No" },
      { label: "Watering", value: "Weekly" },
    ],
  },
  {
    slug: "snake-plant",
    name: "Snake Plant (Sansevieria)",
    category: "indoor-plants",
    kind: "plant",
    price: 22,
    rating: 4.9,
    reviews: 341,
    tint: "from-neutral-100 to-neutral-200",
    short: "Nearly indestructible low-light survivor.",
    description:
      "Architectural, upright and forgiving — the snake plant thrives on neglect and filters indoor air. Ideal for offices and low-light hallways.",
    inStock: true,
    difficulty: "Easy",
    light: "Low to bright",
    climate: "Any indoor",
    care: "Water every 2–3 weeks",
    usage: "Decoration, air purification",
    featured: true,
    specs: [
      { label: "Mature height", value: "60 – 90 cm" },
      { label: "Pot size", value: "Ø 17 cm" },
      { label: "Pet friendly", value: "No" },
      { label: "Watering", value: "Every 2–3 weeks" },
    ],
  },
  {
    slug: "olive-tree",
    name: "Mediterranean Olive Tree",
    category: "fruit-trees",
    kind: "plant",
    price: 89,
    rating: 4.7,
    reviews: 96,
    tint: "from-neutral-100 to-neutral-200",
    short: "Evergreen symbol of warm, dry climates.",
    description:
      "A hardy, drought-tolerant evergreen that brings a Mediterranean feel to terraces and gardens. Produces fruit in warm, sunny positions.",
    inStock: true,
    difficulty: "Moderate",
    light: "Full sun",
    climate: "Warm, dry / Mediterranean",
    care: "Deep water occasionally, prune yearly",
    usage: "Landscaping, shade, fruit",
    featured: true,
    specs: [
      { label: "Mature height", value: "3 – 6 m" },
      { label: "Pot size", value: "Ø 30 cm" },
      { label: "Frost tolerance", value: "To -8°C" },
      { label: "Fruiting", value: "3–5 years" },
    ],
  },
  {
    slug: "cherry-tomato-seeds",
    name: "Cherry Tomato Seeds",
    category: "seeds",
    kind: "plant",
    price: 4,
    rating: 4.6,
    reviews: 512,
    tint: "from-neutral-100 to-neutral-200",
    short: "Sweet, prolific balcony croppers.",
    description:
      "High-yield cherry tomato seeds ideal for balconies, raised beds and greenhouses. Reliable germination and continuous summer harvests.",
    inStock: true,
    difficulty: "Easy",
    light: "Full sun",
    climate: "Temperate, warm summer",
    care: "Water daily in summer, feed weekly",
    usage: "Food, balcony growing",
    featured: true,
    specs: [
      { label: "Seeds per pack", value: "40" },
      { label: "Sow", value: "Spring, indoors" },
      { label: "Harvest", value: "10–12 weeks" },
      { label: "Germination", value: "7–14 days" },
    ],
  },
  {
    slug: "lavender",
    name: "English Lavender",
    category: "flowers",
    kind: "plant",
    price: 14,
    rating: 4.8,
    reviews: 178,
    tint: "from-neutral-100 to-neutral-200",
    short: "Fragrant, pollinator-loving classic.",
    description:
      "Aromatic silvery foliage with purple summer spikes that bees adore. Thrives in poor, well-drained soil and full sun.",
    inStock: true,
    difficulty: "Easy",
    light: "Full sun",
    climate: "Dry, well-drained",
    care: "Low water, prune after flowering",
    usage: "Decoration, pollinators, fragrance",
    specs: [
      { label: "Mature height", value: "40 – 60 cm" },
      { label: "Pot size", value: "Ø 15 cm" },
      { label: "Flowering", value: "Jun – Aug" },
      { label: "Watering", value: "Low" },
    ],
  },
  {
    slug: "aloe-vera",
    name: "Aloe Vera",
    category: "succulents",
    kind: "plant",
    price: 16,
    rating: 4.9,
    reviews: 265,
    tint: "from-neutral-100 to-neutral-200",
    short: "Healing succulent, thrives on neglect.",
    description:
      "A practical, sculptural succulent whose gel soothes minor burns. Loves bright light and infrequent watering.",
    inStock: true,
    difficulty: "Easy",
    light: "Bright, direct",
    climate: "Warm, dry",
    care: "Water every 2–3 weeks",
    usage: "Decoration, wellbeing",
    specs: [
      { label: "Mature height", value: "30 – 50 cm" },
      { label: "Pot size", value: "Ø 14 cm" },
      { label: "Pet friendly", value: "No" },
      { label: "Watering", value: "Low" },
    ],
  },
  {
    slug: "terracotta-planter-set",
    name: "Terracotta Planter Set (3)",
    category: "pots-planters",
    kind: "equipment",
    price: 29,
    rating: 4.7,
    reviews: 132,
    tint: "from-neutral-100 to-neutral-200",
    short: "Breathable classic pots in three sizes.",
    description:
      "A nested set of frost-resistant terracotta pots with drainage holes and saucers. Naturally breathable walls keep roots healthy.",
    inStock: true,
    usage: "Indoor & balcony potting",
    specs: [
      { label: "Sizes", value: "Ø 12 / 16 / 20 cm" },
      { label: "Material", value: "Fired terracotta" },
      { label: "Drainage", value: "Yes + saucers" },
      { label: "Frost proof", value: "Yes" },
    ],
  },
  {
    slug: "organic-potting-mix",
    name: "Organic Potting Mix 20L",
    category: "soil-compost",
    kind: "equipment",
    price: 12,
    rating: 4.8,
    reviews: 401,
    tint: "from-neutral-100 to-neutral-200",
    short: "Peat-free, nutrient-rich all-purpose mix.",
    description:
      "A balanced, peat-free blend of composted bark, coir and worm castings. Great drainage and a slow-release nutrient charge for 6 weeks.",
    inStock: true,
    usage: "Repotting, raised beds, containers",
    featured: true,
    specs: [
      { label: "Volume", value: "20 L" },
      { label: "Peat free", value: "Yes" },
      { label: "pH", value: "6.0 – 6.8" },
      { label: "Feeds", value: "Up to 6 weeks" },
    ],
  },
  {
    slug: "drip-irrigation-kit",
    name: "Balcony Drip Irrigation Kit",
    category: "irrigation",
    kind: "equipment",
    price: 39,
    rating: 4.6,
    reviews: 87,
    tint: "from-neutral-100 to-neutral-200",
    short: "Automatic watering for up to 20 pots.",
    description:
      "A plug-and-play drip system with a programmable timer, tubing and adjustable drippers. Save water and never miss a watering again.",
    inStock: true,
    usage: "Automated container watering",
    featured: true,
    specs: [
      { label: "Capacity", value: "Up to 20 pots" },
      { label: "Timer", value: "Programmable" },
      { label: "Water saving", value: "~60%" },
      { label: "Power", value: "USB / battery" },
    ],
  },
  {
    slug: "pruning-shears",
    name: "Precision Bypass Pruning Shears",
    category: "tools",
    kind: "equipment",
    price: 24,
    rating: 4.9,
    reviews: 223,
    tint: "from-neutral-100 to-neutral-200",
    short: "Sharp, ergonomic cuts every time.",
    description:
      "Japanese-steel bypass blades with a non-stick coating and cushioned grip for clean, effortless cuts on stems up to 20mm.",
    inStock: true,
    usage: "Pruning, deadheading, harvesting",
    specs: [
      { label: "Blade", value: "SK-5 carbon steel" },
      { label: "Cut capacity", value: "20 mm" },
      { label: "Lock", value: "One-hand" },
      { label: "Warranty", value: "5 years" },
    ],
  },
  {
    slug: "organic-fertilizer",
    name: "All-Purpose Organic Fertilizer",
    category: "fertilizers",
    kind: "equipment",
    price: 18,
    rating: 4.7,
    reviews: 156,
    tint: "from-neutral-100 to-neutral-200",
    short: "Balanced feed for lush, healthy growth.",
    description:
      "A gentle organic NPK feed enriched with seaweed and mycorrhizae. Safe for edibles and won't burn roots.",
    inStock: true,
    usage: "Feeding vegetables, plants & trees",
    specs: [
      { label: "NPK", value: "5-5-5" },
      { label: "Weight", value: "1.5 kg" },
      { label: "Organic", value: "Certified" },
      { label: "Coverage", value: "~30 plants" },
    ],
  },
  {
    slug: "grow-light-panel",
    name: "Full-Spectrum LED Grow Light",
    category: "lighting",
    kind: "equipment",
    price: 49,
    rating: 4.5,
    reviews: 74,
    tint: "from-neutral-100 to-neutral-200",
    short: "Sunlight indoors for winter growing.",
    description:
      "An energy-efficient full-spectrum panel with a timer and adjustable height. Keep seedlings and indoor plants thriving year-round.",
    inStock: false,
    usage: "Seed starting, indoor & winter growing",
    specs: [
      { label: "Spectrum", value: "Full 380–780nm" },
      { label: "Power", value: "24 W" },
      { label: "Timer", value: "3 / 9 / 12 h" },
      { label: "Coverage", value: "60 × 60 cm" },
    ],
  },
];

export type Expert = {
  slug: string;
  name: string;
  role: string;
  category: string;
  experience: string;
  rating: number;
  reviews: number;
  price: number;
  languages: string[];
  location: string;
  coverage?: string[];
  online: boolean;
  specialties: string[];
  bio: string;
};

export const experts: Expert[] = [
  {
    slug: "amina-benali",
    name: "Amina Benali",
    role: "Agronomist",
    category: "Agronomy",
    experience: "12 years",
    rating: 4.9,
    reviews: 187,
    price: 45,
    languages: ["Arabic", "French", "English"],
    location: "Alger, DZ",
    coverage: ["Alger", "Blida", "Tipaza", "Boumerdès", "Bouira"],
    online: true,
    specialties: ["Soil health", "Crop production", "Irrigation planning"],
    bio: "Agronomist specialising in sustainable production for small farms and market gardens across Algeria’s north and high plateaus.",
  },
  {
    slug: "lucas-moreau",
    name: "Lucas Moreau",
    role: "Landscape Designer",
    category: "Landscaping",
    experience: "9 years",
    rating: 4.8,
    reviews: 142,
    price: 60,
    languages: ["French", "English"],
    location: "Oran, DZ",
    coverage: ["Oran", "Mostaganem", "Aïn Témouchent", "Sidi Bel Abbès", "Mascara"],
    online: true,
    specialties: ["Garden design", "Native planting", "Outdoor living"],
    bio: "Landscape designer turning courtyards, terraces and coastal gardens into low-maintenance green retreats across western Algeria.",
  },
  {
    slug: "sara-haddad",
    name: "Sara Haddad",
    role: "Indoor Plant Specialist",
    category: "Indoor & Urban",
    experience: "6 years",
    rating: 5.0,
    reviews: 231,
    price: 30,
    languages: ["Arabic", "English"],
    location: "Constantine, DZ",
    coverage: ["Constantine", "Mila", "Skikda", "Annaba", "Sétif"],
    online: true,
    specialties: ["Houseplant rescue", "Light diagnostics", "Pests & disease"],
    bio: "Houseplant specialist helping apartment growers across eastern Algeria diagnose problems from photos and chat.",
  },
  {
    slug: "kenji-ito",
    name: "Kenji Ito",
    role: "Irrigation Specialist",
    category: "Irrigation",
    experience: "15 years",
    rating: 4.7,
    reviews: 98,
    price: 55,
    languages: ["English"],
    location: "Ouargla, DZ",
    coverage: ["Ouargla", "Ghardaïa", "El Oued", "Touggourt", "Laghouat"],
    online: false,
    specialties: ["Drip systems", "Water saving", "Smart controllers"],
    bio: "Designs efficient, water-saving irrigation for balconies, gardens and productive plots across Algeria’s south and Sahara fringe.",
  },
];

export const consultationTypes = [
  { name: "30-minute consultation", price: 30, note: "Quick advice & diagnosis" },
  { name: "60-minute consultation", price: 55, note: "In-depth problem solving" },
  { name: "Written diagnosis", price: 25, note: "Photo-based report in 48h" },
  { name: "Garden design", price: 180, note: "Custom plan & plant list" },
  { name: "Plant-care plan", price: 40, note: "Personalised care schedule" },
  { name: "Full planting project", price: 350, note: "End-to-end project support" },
];

export type Guide = {
  slug: string;
  title: string;
  category: string;
  minutes: number;
  excerpt: string;
  tint: string;
  /** Cloudinary public ID for the cover image, if set. */
  coverImage?: string;
  /** Cloudinary public ID for a downloadable PDF version of this guide. */
  pdfAttachment?: string;
};

export const guides: Guide[] = [
  {
    slug: "balcony-garden-beginners",
    title: "How to start a balcony garden (beginner's guide)",
    category: "Urban gardening",
    minutes: 8,
    excerpt:
      "Everything you need to turn a small balcony into a productive, beautiful green space — from choosing plants to watering.",
    tint: "from-neutral-100 to-neutral-200",
  },
  {
    slug: "yellow-tomato-leaves",
    title: "Why are my tomato leaves turning yellow?",
    category: "Plant care",
    minutes: 6,
    excerpt:
      "The 5 most common causes of yellowing tomato leaves and how to fix each one before it spreads.",
    tint: "from-neutral-100 to-neutral-200",
  },
  {
    slug: "watering-schedule",
    title: "Building a watering schedule that actually works",
    category: "Irrigation",
    minutes: 7,
    excerpt:
      "How to water by plant type, season and climate — plus when to switch to automatic drip irrigation.",
    tint: "from-neutral-100 to-neutral-200",
  },
  {
    slug: "low-light-plants",
    title: "The 10 best plants for low-light rooms",
    category: "Indoor gardening",
    minutes: 5,
    excerpt:
      "No sunny window? These resilient plants thrive in shade and are almost impossible to kill.",
    tint: "from-neutral-100 to-neutral-200",
  },
  {
    slug: "seasonal-planting",
    title: "What to plant this month",
    category: "Seasonal planting",
    minutes: 4,
    excerpt:
      "A month-by-month planting calendar so you always sow and plant at the right time for your climate.",
    tint: "from-neutral-100 to-neutral-200",
  },
  {
    slug: "sustainable-planting",
    title: "Sustainable planting: peat-free, water-wise, pollinator-friendly",
    category: "Sustainable planting",
    minutes: 9,
    excerpt:
      "Practical ways to garden more sustainably, from peat-free compost to choosing native, drought-tolerant plants.",
    tint: "from-neutral-100 to-neutral-200",
  },
];

export type PlannerProject = {
  id: string;
  name: string;
  type: "balcony" | "backyard" | "vegetable" | "orchard" | "indoor" | "farm";
  progress: number;
  plants: number;
  tasks: number;
  budget: number;
  nextTask: string;
  location?: string;
  crops?: string[];
};

export const sampleProjects: PlannerProject[] = [
  {
    id: "balcony-garden",
    name: "My Balcony Garden",
    type: "balcony",
    progress: 65,
    plants: 8,
    tasks: 3,
    budget: 210,
    nextTask: "Water tomatoes & feed herbs",
    location: "Alger",
    crops: ["Cherry tomato", "Basil", "Mint"],
  },
  {
    id: "vegetable-garden",
    name: "My Vegetable Garden",
    type: "vegetable",
    progress: 40,
    plants: 14,
    tasks: 5,
    budget: 480,
    nextTask: "Sow autumn lettuce",
    location: "Blida",
    crops: ["Tomato", "Lettuce", "Pepper"],
  },
  {
    id: "indoor-plants",
    name: "My Indoor Plants",
    type: "indoor",
    progress: 80,
    plants: 11,
    tasks: 1,
    budget: 160,
    nextTask: "Rotate & dust leaves",
    location: "Oran",
    crops: ["Monstera", "Snake plant"],
  },
];

export type Company = {
  slug: string;
  name: string;
  type: string;
  location: string;
  coverage: string[];
  rating: number;
  reviews: number;
  verified: boolean;
  categories: string[];
  short: string;
  about: string;
  delivery: string;
};

export const companies: Company[] = [
  {
    slug: "sahara-green-systems",
    name: "Sahara Green Systems",
    type: "Irrigation & solar",
    location: "Ouargla, DZ",
    coverage: ["Ouargla", "Ghardaïa", "El Oued", "Laghouat"],
    rating: 4.8,
    reviews: 64,
    verified: true,
    categories: ["irrigation", "solar", "tools"],
    short: "Drip kits and solar pumping for dry-climate farms.",
    about: "Designs and supplies water-saving irrigation and solar pumping for southern Algeria farms and greenhouse projects.",
    delivery: "3–7 working days across covered wilayas",
  },
  {
    slug: "atlas-nursery",
    name: "Atlas Nursery",
    type: "Nursery & plants",
    location: "Blida, DZ",
    coverage: ["Blida", "Alger", "Boumerdès", "Tipaza", "Médéa"],
    rating: 4.9,
    reviews: 188,
    verified: true,
    categories: ["plants", "seeds", "soil-compost"],
    short: "Verified nursery for fruit trees, vegetables and starter plants.",
    about: "Family nursery specialising in Mediterranean fruit trees, vegetable seedlings and peat-free mixes for home growers and municipalities.",
    delivery: "2–4 working days in northern wilayas",
  },
  {
    slug: "nord-agri-tools",
    name: "Nord Agri Tools",
    type: "Equipment supplier",
    location: "Constantine, DZ",
    coverage: ["Constantine", "Annaba", "Sétif", "Skikda", "Mila"],
    rating: 4.6,
    reviews: 97,
    verified: true,
    categories: ["tools", "protection", "greenhouses"],
    short: "Tools, protection and greenhouse kits for eastern Algeria.",
    about: "Supplies professional gardening tools, plant protection and compact greenhouse systems to growers and landscaping companies.",
    delivery: "2–5 working days",
  },
  {
    slug: "medina-grow-lighting",
    name: "Medina Grow Lighting",
    type: "Indoor growing",
    location: "Alger, DZ",
    coverage: ["Alger", "Blida", "Boumerdès", "Tipaza"],
    rating: 4.7,
    reviews: 52,
    verified: true,
    categories: ["lighting", "fertilizers", "pots-planters"],
    short: "Grow lights, nutrients and indoor kits for urban spaces.",
    about: "Helps apartment and balcony growers with efficient LED lighting, nutrients and compact planters suited to Algerian homes.",
    delivery: "1–3 working days in greater Algiers",
  },
];

export type ThreadPreview = {
  id: string;
  withName: string;
  withRole: "expert" | "company";
  subject: string;
  preview: string;
  updatedAt: string;
  unread: boolean;
  href: string;
};

export const sampleThreads: ThreadPreview[] = [
  {
    id: "t1",
    withName: "Amina Benali",
    withRole: "expert",
    subject: "Tomato leaf yellowing",
    preview: "Please send a closer photo of the lower leaves and tell me your watering rhythm.",
    updatedAt: "2h ago",
    unread: true,
    href: "/experts/amina-benali",
  },
  {
    id: "t2",
    withName: "Sahara Green Systems",
    withRole: "company",
    subject: "Drip kit compatibility",
    preview: "The 2ha tomato layout works with our pressure-compensating drip lines.",
    updatedAt: "Yesterday",
    unread: false,
    href: "/companies/sahara-green-systems",
  },
  {
    id: "t3",
    withName: "Sara Haddad",
    withRole: "expert",
    subject: "Indoor light diagnosis",
    preview: "Your snake plant is fine in low light — hold water for another week.",
    updatedAt: "3 days ago",
    unread: false,
    href: "/experts/sara-haddad",
  },
];

export function getCompany(slug: string) {
  return companies.find((company) => company.slug === slug);
}

export function getProject(id: string) {
  return sampleProjects.find((project) => project.id === id);
}

export function companyProducts(company: Company) {
  return products.filter((product) => {
    if (company.categories.includes("plants") && product.kind === "plant") return true;
    return company.categories.includes(product.category);
  });
}

// Plant discovery quiz
export type QuizStep = {
  id: string;
  question: string;
  options: { value: string; label: string }[];
};

export const quizSteps: QuizStep[] = [
  {
    id: "location",
    question: "Where will you plant it?",
    options: [
      { value: "indoor", label: "Indoor" },
      { value: "balcony", label: "Balcony" },
      { value: "garden", label: "Garden" },
      { value: "greenhouse", label: "Greenhouse" },
      { value: "farm", label: "Farm" },
    ],
  },
  {
    id: "sun",
    question: "How much sunlight does the spot get?",
    options: [
      { value: "low", label: "Low / shade" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "Full sun" },
    ],
  },
  {
    id: "space",
    question: "How much space do you have?",
    options: [
      { value: "small", label: "Small" },
      { value: "medium", label: "Medium" },
      { value: "large", label: "Large" },
    ],
  },
  {
    id: "time",
    question: "How much time can you spend on care?",
    options: [
      { value: "low", label: "Very little" },
      { value: "medium", label: "Some" },
      { value: "high", label: "Plenty" },
    ],
  },
  {
    id: "goal",
    question: "What is your main objective?",
    options: [
      { value: "decoration", label: "Decoration" },
      { value: "food", label: "Food" },
      { value: "shade", label: "Shade" },
      { value: "fruit", label: "Fruit" },
      { value: "privacy", label: "Privacy" },
      { value: "environment", label: "Environmental" },
    ],
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function relatedProducts(product: Product, count = 3) {
  return products
    .filter((p) => p.slug !== product.slug && p.kind === product.kind)
    .slice(0, count);
}

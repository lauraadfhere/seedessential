import type { Locale } from "./locales";

const en = {
  shop: "Shop", plants: "Plants", equipment: "Equipment", allProducts: "All products", topRated: "Top rated", sponsoredDeals: "Featured sellers",
  experts: "Experts", findExpert: "Find an expert", postRequest: "Post a request", becomeExpert: "Become an expert",
  ruddge: "RuddgeAI", ruddgeHint: "Scan a plant, get answers",
  learn: "Learn", guides: "Guides", calendar: "Seasonal calendar", planner: "Garden planner", discover: "Plant finder",
  support: "Support", claims: "Claims & disputes", delivery: "Delivery", returns: "Returns", faqs: "FAQs", contact: "Contact us",
  logIn: "Log in", join: "Join free", search: "Search", searchShop: "Plants, seeds, tools…", searchExperts: "Agronomist, irrigation, olive trees…",
  home: "Home", menu: "Menu", close: "Close", workspace: "Workspace",
  notFoundTitle: "Lost the plot.", notFoundText: "This page wandered off with the plants. It may have moved, or the link is out of date.",
  backHome: "Back to home", browseShop: "Browse the shop", tryInstead: "Try one of these instead",
};

export type ChromeText = typeof en;

const fr: ChromeText = {
  shop: "Boutique", plants: "Plantes", equipment: "Équipement", allProducts: "Tous les produits", topRated: "Mieux notés", sponsoredDeals: "Vendeurs à la une",
  experts: "Experts", findExpert: "Trouver un expert", postRequest: "Publier une demande", becomeExpert: "Devenir expert",
  ruddge: "RuddgeAI", ruddgeHint: "Scannez une plante, obtenez des réponses",
  learn: "Apprendre", guides: "Guides", calendar: "Calendrier saisonnier", planner: "Planificateur", discover: "Trouver une plante",
  support: "Assistance", claims: "Réclamations", delivery: "Livraison", returns: "Retours", faqs: "FAQ", contact: "Contact",
  logIn: "Connexion", join: "Inscription", search: "Rechercher", searchShop: "Plantes, graines, outils…", searchExperts: "Agronome, irrigation, oliviers…",
  home: "Accueil", menu: "Menu", close: "Fermer", workspace: "Espace",
  notFoundTitle: "Hors des sentiers.", notFoundText: "Cette page est partie avec les plantes. Elle a peut-être été déplacée, ou le lien est obsolète.",
  backHome: "Retour à l'accueil", browseShop: "Voir la boutique", tryInstead: "Essayez plutôt",
};

const ar: ChromeText = {
  shop: "المتجر", plants: "النباتات", equipment: "المعدات", allProducts: "كل المنتجات", topRated: "الأعلى تقييماً", sponsoredDeals: "بائعون مميزون",
  experts: "الخبراء", findExpert: "ابحث عن خبير", postRequest: "انشر طلباً", becomeExpert: "كن خبيراً",
  ruddge: "RuddgeAI", ruddgeHint: "افحص نبتتك واحصل على إجابات",
  learn: "تعلّم", guides: "الأدلة", calendar: "التقويم الموسمي", planner: "مخطط الحديقة", discover: "اكتشف النبتة",
  support: "الدعم", claims: "الشكاوى والنزاعات", delivery: "التوصيل", returns: "الإرجاع", faqs: "الأسئلة الشائعة", contact: "اتصل بنا",
  logIn: "تسجيل الدخول", join: "إنشاء حساب", search: "بحث", searchShop: "نباتات، بذور، أدوات…", searchExperts: "مهندس زراعي، ري، زيتون…",
  home: "الرئيسية", menu: "القائمة", close: "إغلاق", workspace: "مساحة العمل",
  notFoundTitle: "ضللنا الطريق.", notFoundText: "هذه الصفحة رحلت مع النباتات. ربما نُقلت أو أن الرابط قديم.",
  backHome: "العودة للرئيسية", browseShop: "تصفح المتجر", tryInstead: "جرّب أحد هذه الروابط",
};

const dictionaries: Record<Locale, ChromeText> = { en, fr, ar };

export function chromeText(locale: string): ChromeText {
  return dictionaries[(locale as Locale)] ?? en;
}

/** Page titles for the header's title band, keyed by the first path segment. */
const PAGE_TITLES: Record<string, Partial<Record<Locale, string>> & { en: string }> = {
  shop: { en: "Shop", fr: "Boutique", ar: "المتجر" },
  experts: { en: "Expert solutions", fr: "Solutions expert", ar: "حلول الخبراء" },
  expert: { en: "Expert studio", fr: "Studio expert", ar: "استوديو الخبير" },
  provider: { en: "Seller center", fr: "Espace vendeur", ar: "مركز البائع" },
  requests: { en: "Request", fr: "Demande", ar: "طلب" },
  consultations: { en: "My requests", fr: "Mes demandes", ar: "طلباتي" },
  ruddge: { en: "RuddgeAI", fr: "RuddgeAI", ar: "RuddgeAI" },
  assistant: { en: "RuddgeAI", fr: "RuddgeAI", ar: "RuddgeAI" },
  claims: { en: "Claims & disputes", fr: "Réclamations", ar: "الشكاوى" },
  orders: { en: "Orders", fr: "Commandes", ar: "الطلبيات" },
  cart: { en: "Cart", fr: "Panier", ar: "السلة" },
  profile: { en: "My profile", fr: "Mon profil", ar: "ملفي" },
  learn: { en: "Learn", fr: "Apprendre", ar: "تعلّم" },
  planner: { en: "Garden planner", fr: "Planificateur", ar: "مخطط الحديقة" },
  projects: { en: "Projects", fr: "Projets", ar: "المشاريع" },
  discover: { en: "Plant finder", fr: "Trouver une plante", ar: "اكتشف النبتة" },
  wishlist: { en: "Wishlist", fr: "Favoris", ar: "المفضلة" },
  "seasonal-calendar": { en: "Seasonal calendar", fr: "Calendrier saisonnier", ar: "التقويم الموسمي" },
  about: { en: "About", fr: "À propos", ar: "من نحن" },
  contact: { en: "Contact", fr: "Contact", ar: "اتصل بنا" },
  faqs: { en: "FAQs", fr: "FAQ", ar: "الأسئلة الشائعة" },
  delivery: { en: "Delivery", fr: "Livraison", ar: "التوصيل" },
  returns: { en: "Returns", fr: "Retours", ar: "الإرجاع" },
  payments: { en: "Payments", fr: "Paiements", ar: "الدفع" },
  privacy: { en: "Privacy", fr: "Confidentialité", ar: "الخصوصية" },
  terms: { en: "Terms", fr: "Conditions", ar: "الشروط" },
  careers: { en: "Careers", fr: "Carrières", ar: "الوظائف" },
  business: { en: "For business", fr: "Entreprises", ar: "للشركات" },
};

export function pageTitle(segment: string, locale: string) {
  const entry = PAGE_TITLES[segment];
  if (!entry) return "";
  return entry[locale as Locale] ?? entry.en;
}

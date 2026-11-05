"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "./locales";
import { authDictionaries } from "./auth-i18n";

export type { Locale } from "./locales";
export { DEFAULT_LOCALE, LOCALES, isLocale } from "./locales";

type TranslationKey =
  | "nav.home" | "nav.shop" | "nav.plants" | "nav.equipment" | "nav.experts" | "nav.planner" | "nav.learn" | "nav.projects"
  | "cta.primary" | "cta.secondary" | "hero.title" | "hero.subtitle" | "hero.explore" | "hero.talk"
  | "footer.tagline" | "footer.rights" | "cookie.title" | "cookie.description" | "cookie.accept" | "cookie.reject" | "cookie.manage" | "scroll.top"
  | "account.signIn" | "account.signUp" | "search.placeholder" | "search.description" | "menu.open" | "menu.close" | "common.addToCart" | "common.viewAll"
  | `request.${"eyebrow" | "title" | "intro" | "purposeLabel" | "purposeTitle" | "purposeText" | "step1" | "step2" | "step3" | "note" | "projectLabel" | "formTitle" | "formIntro" | "location" | "cityCountry" | "plantType" | "plantExamples" | "space" | "sun" | "availableSpace" | "spaceExample" | "budget" | "budgetExample" | "help" | "helpPlaceholder" | "photos" | "optional" | "photosHelp" | "privacy" | "submit" | "received" | "receivedTitle" | "receivedText" | "another" | "balcony" | "garden" | "indoor" | "farm" | "greenhouse" | "lowShade" | "medium" | "fullSun"}`;
type Dict = Record<TranslationKey, string>;

const sharedTranslations: Record<Locale, Record<string, string>> = {
  en: {
    "footer.marketplace": "Marketplace", "footer.solutions": "Solutions", "footer.learn": "Learn", "footer.company": "Company", "footer.support": "Support",
    "footer.shopAll": "Shop all", "footer.plants": "Plants", "footer.equipment": "Equipment", "footer.findPlant": "Find the right plant", "footer.experts": "Expert solutions", "footer.planner": "Garden planner", "footer.assistant": "AI assistant", "footer.business": "For businesses", "footer.knowledge": "Knowledge center", "footer.guides": "Plant guides", "footer.calendar": "Seasonal calendar", "footer.faqs": "FAQs", "footer.about": "About us", "footer.becomeExpert": "Become an expert", "footer.becomeSupplier": "Become a supplier", "footer.contact": "Contact", "footer.careers": "Careers", "footer.trackOrders": "Track my orders", "footer.delivery": "Delivery information", "footer.returns": "Returns & guarantee", "footer.privacy": "Privacy", "footer.terms": "Terms", "footer.payments": "Secure payments", "footer.description": "Plants, equipment and expert solutions for every space — from a single windowsill to a working farm.",
    "account.profile": "My profile", "account.dashboard": "Dashboard", "account.signOut": "Sign out", "account.administration": "Administration", "account.equipment": "My equipment", "account.expertise": "My expertise",
    "account.expertVerification": "Expert verification", "account.openMenu": "Open account menu", "account.searchShop": "Search the shop", "search.dialog": "Search Tannelli", "search.close": "Close search", "header.linkedin": "Tannelli on LinkedIn", "header.search": "Search", "cart.close": "Close cart", 
  },
  fr: {
    "footer.marketplace": "Marché", "footer.solutions": "Solutions", "footer.learn": "Apprendre", "footer.company": "Entreprise", "footer.support": "Assistance",
    "footer.shopAll": "Toute la boutique", "footer.plants": "Plantes", "footer.equipment": "Équipement", "footer.findPlant": "Trouver la bonne plante", "footer.experts": "Solutions d’experts", "footer.planner": "Planificateur de jardin", "footer.assistant": "Assistant IA", "footer.business": "Pour les entreprises", "footer.knowledge": "Centre de connaissances", "footer.guides": "Guides de plantes", "footer.calendar": "Calendrier saisonnier", "footer.faqs": "FAQ", "footer.about": "À propos", "footer.becomeExpert": "Devenir expert", "footer.becomeSupplier": "Devenir fournisseur", "footer.contact": "Contact", "footer.careers": "Carrières", "footer.trackOrders": "Suivre mes commandes", "footer.delivery": "Informations de livraison", "footer.returns": "Retours et garantie", "footer.privacy": "Confidentialité", "footer.terms": "Conditions", "footer.payments": "Paiements sécurisés", "footer.description": "Plantes, équipement et solutions d’experts pour chaque espace — d’un rebord de fenêtre à une exploitation.",
    "account.profile": "Mon profil", "account.dashboard": "Tableau de bord", "account.signOut": "Se déconnecter", "account.administration": "Administration", "account.equipment": "Mon équipement", "account.expertise": "Mon expertise",
    "account.expertVerification": "Vérification des experts", "account.openMenu": "Ouvrir le menu du compte", "account.searchShop": "Rechercher dans la boutique", "search.dialog": "Rechercher sur Tannelli", "search.close": "Fermer la recherche", "header.linkedin": "Tannelli sur LinkedIn", "header.search": "Rechercher", "cart.close": "Fermer le panier", 
  },
  ar: {
    "footer.marketplace": "المتجر", "footer.solutions": "الحلول", "footer.learn": "التعلّم", "footer.company": "الشركة", "footer.support": "الدعم",
    "footer.shopAll": "تسوّق الكل", "footer.plants": "النباتات", "footer.equipment": "المعدات", "footer.findPlant": "اعثر على النبات المناسب", "footer.experts": "حلول الخبراء", "footer.planner": "مخطط الحديقة", "footer.assistant": "المساعد الذكي", "footer.business": "للشركات", "footer.knowledge": "مركز المعرفة", "footer.guides": "أدلة النباتات", "footer.calendar": "التقويم الموسمي", "footer.faqs": "الأسئلة الشائعة", "footer.about": "من نحن", "footer.becomeExpert": "كن خبيراً", "footer.becomeSupplier": "كن مورداً", "footer.contact": "تواصل معنا", "footer.careers": "الوظائف", "footer.trackOrders": "تتبع طلباتي", "footer.delivery": "معلومات التوصيل", "footer.returns": "الإرجاع والضمان", "footer.privacy": "الخصوصية", "footer.terms": "الشروط", "footer.payments": "مدفوعات آمنة", "footer.description": "نباتات ومعدات وحلول خبراء لكل مساحة — من نافذة صغيرة إلى مزرعة منتجة.",
    "account.profile": "ملفي الشخصي", "account.dashboard": "لوحة التحكم", "account.signOut": "تسجيل الخروج", "account.administration": "الإدارة", "account.equipment": "معداتي", "account.expertise": "خبرتي",
    "account.expertVerification": "توثيق الخبراء", "account.openMenu": "فتح قائمة الحساب", "account.searchShop": "ابحث في المتجر", "search.dialog": "ابحث في Tannelli", "search.close": "إغلاق البحث", "header.linkedin": "Tannelli على LinkedIn", "header.search": "بحث", "cart.close": "إغلاق السلة", 
  },
};

const dictionaries: Record<Locale, Dict> = {
  en: {
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.plants": "Plants",
    "nav.equipment": "Equipment",
    "nav.experts": "Expert Solutions",
    "nav.planner": "Garden Planner",
    "nav.learn": "Learn",
    "nav.projects": "Projects",
    "cta.primary": "Find Your Solution",
    "cta.secondary": "Ask an Expert",
    "hero.title": "Everything you need to grow.",
    "hero.subtitle":
      "Plants, equipment and expert solutions — all in one place.",
    "hero.explore": "Explore Plants",
    "hero.talk": "Talk to an Expert",
    "footer.tagline": "Grow with confidence.",
    "footer.rights": "All rights reserved.",
    "cookie.title": "We use cookies",
    "cookie.description":
      "We use cookies to keep you signed in, remember your preferences and understand how Tannelli is used. You can accept all cookies or reject non-essential ones.",
    "cookie.accept": "Accept all",
    "cookie.reject": "Reject non-essential",
    "cookie.manage": "Cookie policy",
    "scroll.top": "Back to top",
    "account.signIn": "Sign in",
    "account.signUp": "Sign up",
    "menu.open": "Menu",
    "menu.close": "Close",
    "search.description": "Search plants, equipment and garden essentials.",
    "search.placeholder": "Search plants & equipment",
    "common.addToCart": "Add to cart",
    "common.viewAll": "View all",
    "request.eyebrow": "Expert solutions",
    "request.title": "Tell us what you are growing",
    "request.intro": "Share a few details and we will match you with the right specialist within one business day.",
    "request.purposeLabel": "A better growing plan",
    "request.purposeTitle": "The right advice starts with your space.",
    "request.purposeText": "Tell us what you are working with. Our specialists use your conditions, goals and budget to recommend a practical next step.",
    "request.step1": "Share your growing conditions",
    "request.step2": "Get matched with a specialist",
    "request.step3": "Receive clear next steps",
    "request.note": "You do not need to know the exact plant name. Photos and simple descriptions are welcome.",
    "request.projectLabel": "Your growing project",
    "request.formTitle": "Help us understand what you need",
    "request.formIntro": "The more context you share, the more useful your first recommendation will be.",
    "request.location": "Location",
    "request.cityCountry": "Wilaya, Algeria",
    "request.plantType": "Plant type",
    "request.plantExamples": "Tomatoes, houseplants",
    "request.space": "Your space",
    "request.sun": "Sun exposure",
    "request.availableSpace": "Available space",
    "request.spaceExample": "e.g. 12 m²",
    "request.budget": "Budget (DA)",
    "request.budgetExample": "e.g. 3000 DA",
    "request.help": "What would you like help with?",
    "request.helpPlaceholder": "Describe the issue, project or outcome you want...",
    "request.photos": "Add photos",
    "request.optional": "optional",
    "request.photosHelp": "Photos of your plant, garden or growing space help experts give more precise advice.",
    "request.privacy": "We will only use these details to prepare your expert match.",
    "request.submit": "Find my expert",
    "request.received": "Request received",
    "request.receivedTitle": "Your request is on its way.",
    "request.receivedText": "We will recommend an expert and send your next steps by email. If photos would help, you can reply to that message with more details.",
    "request.another": "Send another request",
    "request.balcony": "Balcony",
    "request.garden": "Garden",
    "request.indoor": "Indoor",
    "request.farm": "Farm",
    "request.greenhouse": "Greenhouse",
    "request.lowShade": "Low / shade",
    "request.medium": "Medium",
    "request.fullSun": "Full sun",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.shop": "Boutique",
    "nav.plants": "Plantes",
    "nav.equipment": "Équipement",
    "nav.experts": "Solutions Expert",
    "nav.planner": "Planificateur",
    "nav.learn": "Apprendre",
    "nav.projects": "Projets",
    "cta.primary": "Trouver ma solution",
    "cta.secondary": "Demander à un expert",
    "hero.title": "Tout ce qu'il faut pour cultiver.",
    "hero.subtitle":
      "Plantes, équipement et solutions d'experts — au même endroit.",
    "hero.explore": "Explorer les plantes",
    "hero.talk": "Parler à un expert",
    "footer.tagline": "Cultivez en toute confiance.",
    "footer.rights": "Tous droits réservés.",
    "cookie.title": "Nous utilisons des cookies",
    "cookie.description":
      "Nous utilisons des cookies pour vous garder connecté, mémoriser vos préférences et comprendre l'utilisation de Tannelli. Vous pouvez tout accepter ou refuser les cookies non essentiels.",
    "cookie.accept": "Tout accepter",
    "cookie.reject": "Refuser le non essentiel",
    "cookie.manage": "Politique de cookies",
    "scroll.top": "Retour en haut",
    "account.signIn": "Se connecter",
    "account.signUp": "S'inscrire",
    "menu.open": "Menu",
    "menu.close": "Fermer",
    "search.description": "Recherchez des plantes, équipements et essentiels de jardin.",
    "search.placeholder": "Rechercher plantes et équipement",
    "common.addToCart": "Ajouter au panier",
    "common.viewAll": "Tout voir",
    "request.eyebrow": "Solutions d'experts",
    "request.title": "Parlez-nous de ce que vous cultivez",
    "request.intro": "Partagez quelques détails et nous vous mettrons en relation avec le bon spécialiste sous un jour ouvré.",
    "request.purposeLabel": "Un meilleur plan de culture",
    "request.purposeTitle": "Les bons conseils commencent par votre espace.",
    "request.purposeText": "Décrivez votre situation. Nos spécialistes tiennent compte de vos conditions, objectifs et budget pour proposer une prochaine étape concrète.",
    "request.step1": "Partagez vos conditions de culture",
    "request.step2": "Trouvez le bon spécialiste",
    "request.step3": "Recevez des prochaines étapes claires",
    "request.note": "Vous n'avez pas besoin de connaître le nom exact de la plante. Les photos et descriptions simples sont les bienvenues.",
    "request.projectLabel": "Votre projet de culture",
    "request.formTitle": "Aidez-nous à comprendre votre besoin",
    "request.formIntro": "Plus vous donnez de contexte, plus votre première recommandation sera utile.",
    "request.location": "Lieu",
    "request.cityCountry": "Wilaya, Algérie",
    "request.plantType": "Type de plante",
    "request.plantExamples": "Tomates, plantes d'intérieur",
    "request.space": "Votre espace",
    "request.sun": "Exposition au soleil",
    "request.availableSpace": "Espace disponible",
    "request.spaceExample": "ex. 12 m²",
    "request.budget": "Budget (DA)",
    "request.budgetExample": "ex. 3000 DA",
    "request.help": "Avec quoi avez-vous besoin d'aide ?",
    "request.helpPlaceholder": "Décrivez le problème, le projet ou le résultat souhaité...",
    "request.photos": "Ajouter des photos",
    "request.optional": "facultatif",
    "request.photosHelp": "Les photos de votre plante, jardin ou espace de culture aident les experts à être plus précis.",
    "request.privacy": "Nous utiliserons ces informations uniquement pour préparer votre mise en relation.",
    "request.submit": "Trouver mon expert",
    "request.received": "Demande reçue",
    "request.receivedTitle": "Votre demande est en route.",
    "request.receivedText": "Nous vous recommanderons un expert et vous enverrons les prochaines étapes par e-mail. Vous pourrez répondre à ce message avec d'autres détails.",
    "request.another": "Envoyer une autre demande",
    "request.balcony": "Balcon",
    "request.garden": "Jardin",
    "request.indoor": "Intérieur",
    "request.farm": "Ferme",
    "request.greenhouse": "Serre",
    "request.lowShade": "Faible / ombre",
    "request.medium": "Moyenne",
    "request.fullSun": "Plein soleil",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.shop": "المتجر",
    "nav.plants": "النباتات",
    "nav.equipment": "المعدات",
    "nav.experts": "حلول الخبراء",
    "nav.planner": "مخطط الحديقة",
    "nav.learn": "تعلّم",
    "nav.projects": "المشاريع",
    "cta.primary": "اعثر على حلّك",
    "cta.secondary": "اسأل خبيراً",
    "hero.title": "كل ما تحتاجه لتزرع.",
    "hero.subtitle": "نباتات ومعدات وحلول خبراء — في مكان واحد.",
    "hero.explore": "استكشف النباتات",
    "hero.talk": "تحدّث إلى خبير",
    "footer.tagline": "ازرع بثقة.",
    "footer.rights": "جميع الحقوق محفوظة.",
    "cookie.title": "نحن نستخدم ملفات تعريف الارتباط",
    "cookie.description":
      "نستخدم ملفات تعريف الارتباط لإبقائك متصلاً وتذكّر تفضيلاتك وفهم كيفية استخدام تانيلي. يمكنك قبول الكل أو رفض غير الضروري منها.",
    "cookie.accept": "قبول الكل",
    "cookie.reject": "رفض غير الضروري",
    "cookie.manage": "سياسة ملفات تعريف الارتباط",
    "scroll.top": "العودة إلى الأعلى",
    "account.signIn": "تسجيل الدخول",
    "account.signUp": "إنشاء حساب",
    "menu.open": "القائمة",
    "menu.close": "إغلاق",
    "search.description": "ابحث عن النباتات والمعدات وكل مستلزمات الحديقة.",
    "search.placeholder": "ابحث عن النباتات والمعدات",
    "common.addToCart": "أضف إلى السلة",
    "common.viewAll": "عرض الكل",
    "request.eyebrow": "حلول الخبراء",
    "request.title": "أخبرنا بما تزرع",
    "request.intro": "شاركنا بعض التفاصيل وسنوصلك بالمتخصص المناسب خلال يوم عمل واحد.",
    "request.purposeLabel": "خطة زراعة أفضل",
    "request.purposeTitle": "النصيحة المناسبة تبدأ من مساحتك.",
    "request.purposeText": "أخبرنا عن ظروفك. سيستخدم خبراؤنا معلومات المساحة والأهداف والميزانية لاقتراح الخطوة التالية المناسبة.",
    "request.step1": "شارك ظروف زراعتك",
    "request.step2": "تواصل مع المتخصص المناسب",
    "request.step3": "احصل على خطوات واضحة",
    "request.note": "لا تحتاج إلى معرفة اسم النبتة بدقة. نرحب بالصور والأوصاف البسيطة.",
    "request.projectLabel": "مشروعك الزراعي",
    "request.formTitle": "ساعدنا على فهم احتياجك",
    "request.formIntro": "كلما شاركت تفاصيل أكثر، كانت توصيتك الأولى أكثر فائدة.",
    "request.location": "الموقع",
    "request.cityCountry": "ولاية، الجزائر",
    "request.plantType": "نوع النبتة",
    "request.plantExamples": "طماطم، نباتات منزلية",
    "request.space": "مساحتك",
    "request.sun": "التعرض للشمس",
    "request.availableSpace": "المساحة المتاحة",
    "request.spaceExample": "مثال: 12 م²",
    "request.budget": "الميزانية بالدينار الجزائري",
    "request.budgetExample": "مثال: 3000 دج",
    "request.help": "بماذا تحتاج إلى المساعدة؟",
    "request.helpPlaceholder": "صف المشكلة أو المشروع أو النتيجة التي تريدها...",
    "request.photos": "إضافة صور",
    "request.optional": "اختياري",
    "request.photosHelp": "تساعد صور النبتة أو الحديقة أو مساحة الزراعة الخبراء على تقديم نصيحة أدق.",
    "request.privacy": "سنستخدم هذه المعلومات فقط لإعداد ترشيح الخبير المناسب.",
    "request.submit": "اعثر على خبير",
    "request.received": "تم استلام الطلب",
    "request.receivedTitle": "طلبك في الطريق.",
    "request.receivedText": "سنرشح لك خبيراً ونرسل الخطوات التالية عبر البريد الإلكتروني. يمكنك الرد على الرسالة وإضافة المزيد من التفاصيل.",
    "request.another": "إرسال طلب آخر",
    "request.balcony": "شرفة",
    "request.garden": "حديقة",
    "request.indoor": "داخلي",
    "request.farm": "مزرعة",
    "request.greenhouse": "بيت زجاجي",
    "request.lowShade": "إضاءة منخفضة / ظل",
    "request.medium": "متوسطة",
    "request.fullSun": "شمس كاملة",
  },
};

/**
 * Locale is derived from the `/[locale]` URL segment (see
 * `src/app/[locale]/layout.tsx` and `src/middleware.ts`) rather than client
 * state — this keeps `/en`, `/fr` and `/ar` fully bookmarkable, crawlable
 * and shareable URLs.
 */
export function useI18n() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const rawLocale = params?.locale;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dir = LOCALES.find((l) => l.code === locale)?.dir ?? "ltr";

  function setLocale(next: Locale) {
    const segments = pathname.split("/");
    if (isLocale(segments[1])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    const query = typeof window === "undefined" ? "" : window.location.search;
    router.push(`${segments.join("/") || `/${next}`}${query}`);
  }

  function t(key: string) {
    if (key in authDictionaries.en) {
      return authDictionaries[locale][key] ?? authDictionaries.en[key] ?? key;
    }
    if (key in sharedTranslations.en) return sharedTranslations[locale][key] ?? sharedTranslations.en[key];
    if (!(key in dictionaries.en)) return key;
    return dictionaries[locale][key as TranslationKey] ?? dictionaries.en[key as TranslationKey];
  }

  return { locale, dir, setLocale, t };
}

/** No-op wrapper kept for readability at the layout call site. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

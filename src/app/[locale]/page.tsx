"use client";

import { useEffect, useState } from "react";

import { Link } from "@/components/locale-link";
import { useI18n } from "@/lib/i18n";
import { Button, Monogram, SectionHeading, Stars, initials } from "@/components/ui";
import { ArrowRightIcon, BagIcon, ChatIcon, LeafMark, SearchIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { experts, guides, products, type Product } from "@/lib/data";
import { mergeLiveCatalog } from "@/lib/catalog";

const paths = [
  { label: "Shop", href: "/shop" },
  { label: "Get Expert Advice", href: "/experts" },
  { label: "Find the Right Plant", href: "/discover" },
  { label: "Plan My Garden", href: "/planner" },
  { label: "Learn", href: "/learn" },
  { label: "Track My Orders", href: "/dashboard" },
];

const categoryGroups = [
  { name: "Plants", detail: "Indoor · Outdoor · Succulents · Cacti", href: "/shop?kind=plant" },
  { name: "Grow your food", detail: "Seeds · Herbs · Vegetables · Fruit trees", href: "/shop?category=seeds" },
  { name: "Pots & growing", detail: "Planters · Soil · Compost · Fertilizers", href: "/shop?category=pots-planters" },
  { name: "Care & tools", detail: "Irrigation · Tools · Lighting · Protection", href: "/shop?category=tools" },
];

const steps = [
  {
    icon: SearchIcon,
    title: "Tell us your space & goal",
    text: "Answer a few quick questions or upload a photo of your space.",
    linkLabel: "Start the quiz",
    href: "/discover",
  },
  {
    icon: LeafMark,
    title: "Get a tailored solution",
    text: "Matched plants, equipment and — when it matters — a real expert's plan.",
    linkLabel: "Meet the experts",
    href: "/experts",
  },
  {
    icon: BagIcon,
    title: "Shop the whole list at once",
    text: "Add the complete solution to your cart and track it from your dashboard.",
    linkLabel: "Visit the shop",
    href: "/shop",
  },
];

const solutionIncludes = [
  "Diagnosis & recommendation",
  "Recommended plants",
  "Recommended equipment",
  "Irrigation & soil plan",
  "Maintenance schedule",
  "One-click shopping list",
];

const reviews = [
  {
    name: "Yasmine K.",
    role: "Balcony grower · Rabat",
    text: "I described my shady balcony and got 5 perfect plants plus a drip kit. Everything arrived together and it's all thriving.",
  },
  {
    name: "Thomas L.",
    role: "First-time gardener · Lyon",
    text: "The expert diagnosed my dying lemon tree from two photos and sent a care plan. Honestly better than my local nursery.",
  },
  {
    name: "Farid B.",
    role: "Restaurant owner · Tunis",
    text: "We used the B2B service for our terrace. Bulk plants, design and maintenance — one invoice, zero hassle.",
  },
];

const arabic = {
  badge: "نباتات · معدات · حلول خبراء",
  heroTail: "من أصيص صغير بجانب النافذة إلى مزرعة منتجة، تربطك تانيلي بالنباتات المناسبة والخبراء المناسبين.",
  growers: "+12,000 محب للنباتات",
  delivered: "توصيل متكامل",
  paths: ["تسوّق", "احصل على استشارة خبير", "اعثر على النبتة المناسبة", "خطّط لحديقتي", "تعلّم", "تتبّع طلباتي"],
  categoryGroups: [
    ["النباتات", "نباتات داخلية · خارجية · عصارية · صبّار"],
    ["ازرع طعامك", "بذور · أعشاب · خضروات · أشجار فاكهة"],
    ["الأصص والزراعة", "أصص · تربة · سماد عضوي · مغذيات"],
    ["العناية والأدوات", "ري · أدوات · إضاءة · حماية"],
  ],
  products: {
    "monstera-deliciosa": { name: "مونستيرا دليسيوسا", short: "نبتة بأوراق منقسمة مميزة وأنيقة." },
    "snake-plant": { name: "نبتة الثعبان", short: "نبتة قوية تتحمل الإضاءة المنخفضة." },
    "olive-tree": { name: "شجرة الزيتون المتوسطية", short: "شجرة دائمة الخضرة للمناخات الدافئة." },
    "cherry-tomato-seeds": { name: "بذور طماطم كرزية", short: "محصول وفير مثالي للشرفات." },
    "terracotta-planter-set": { name: "مجموعة أصص تيراكوتا", short: "أصص كلاسيكية قابلة للتهوية بثلاثة أحجام." },
    "organic-potting-mix": { name: "خليط تربة عضوي 20 لتر", short: "خليط غني بالعناصر وخالٍ من الخث." },
    "drip-irrigation-kit": { name: "طقم ري بالتنقيط للشرفة", short: "ري آلي لما يصل إلى 20 أصيصاً." },
    "pruning-shears": { name: "مقص تقليم دقيق", short: "قصات حادة ومريحة في كل مرة." },
  } as Record<string, { name: string; short: string }>,
  expertRoles: ["مهندسة زراعية", "مصمم حدائق", "أخصائية نباتات داخلية", "أخصائي ري"],
  guideTitles: ["كيف تبدأ حديقة شرفة للمبتدئين", "لماذا تتحول أوراق الطماطم إلى اللون الأصفر؟", "إنشاء جدول ري فعّال", "أفضل النباتات للغرف قليلة الإضاءة"],
  marketplace: "المتجر",
  popularPlants: "نباتات رائجة",
  popularPlantsText: "خيارات المزارعين المفضلة لجمالها وسهولة العناية بها.",
  allPlants: "عرض كل النباتات",
  popularEquipment: "معدات رائجة",
  popularEquipmentText: "كل ما تحتاجه للزراعة والتغذية والري والعناية.",
  allEquipment: "عرض كل المعدات",
  expertEyebrow: "حلول الخبراء",
  expertTitle: "لست متأكداً مما تزرع أو سبب تدهور نبتتك؟",
  expertText: "صف مشكلتك، حمّل صورة، واحصل على توصية حقيقية من مهندس زراعي أو مصمم حدائق أو أخصائي رعاية النباتات، مع قائمة تسوق يمكنك شراؤها بضغطة واحدة.",
  requestExpert: "اطلب حلّاً من خبير",
  tryAi: "جرّب مساعد الذكاء الاصطناعي",
  solution: ["تشخيص وتوصية", "نباتات مقترحة", "معدات مقترحة", "خطة ري وتربة", "جدول صيانة", "قائمة تسوق بضغطة واحدة"],
  how: "كيف تعمل تانيلي",
  howTitle: "من الفكرة إلى حديقة مزدهرة في ثلاث خطوات",
  steps: [
    ["عرّفنا على مساحتك وهدفك", "أجب عن أسئلة سريعة أو حمّل صورة لمساحتك.", "ابدأ الاختبار"],
    ["احصل على حل مصمم لك", "نباتات ومعدات مناسبة، وخطة من خبير حقيقي عندما تحتاج إليها.", "تعرّف على الخبراء"],
    ["تسوّق القائمة كاملة دفعة واحدة", "أضف الحل الكامل إلى سلتك وتابعه من لوحة التحكم.", "اذهب إلى المتجر"],
  ],
  projects: "مشاريع الحديقة", projectsTitle: "خطّط لكل مشروع في مكان واحد",
  projectsText: "أنشئ مشاريع مثل حديقة شرفتي أو بستاني، واجمع النباتات والميزانية والمهام والري ونصائح الخبراء معاً.",
  projectNames: ["حديقة شرفتي", "حديقة الخضروات", "بستاني"], openPlanner: "افتح مخطط الحديقة",
  guides: "أدلة تعليمية", guidesTitle: "تعلّم أثناء نموك", allGuides: "كل الأدلة ←",
  featuredExperts: "خبراء مميزون", featuredTitle: "تعرّف على الخبراء الذين يقفون خلف نباتاتك", browseExperts: "تصفّح كل الخبراء",
  reviews: "آراء العملاء", reviewsTitle: "محبوب من أكثر من 12,000 مزارع",
  reviewText: ["وصفت شرفتي المظللة وحصلت على 5 نباتات مثالية مع نظام ري بالتنقيط. وصل كل شيء معاً وهو ينمو بشكل رائع.", "شخّص الخبير شجرة الليمون المتدهورة من صورتين وأرسل خطة عناية. تجربة أفضل من مشتل الحي.", "استخدمنا خدمة الشركات لتجهيز شرفتنا: نباتات بالجملة وتصميم وصيانة بفواتير بسيطة."],
  reviewRoles: ["مهتمة بالزراعة في الشرفة · الرباط", "مبتدئ في الزراعة · ليون", "صاحب مطعم · تونس"],
  finalTitle: "كل ما تحتاجه للنمو — ابدأ اليوم", finalText: "اعثر على الحل خلال دقائق، أو تحدث إلى خبير يعرف ما يلزم لنباتاتك.",
  finalCards: [["اعثر على نباتك", "اختيارات تناسب مساحتك ومناخك."], ["تحدث إلى خبير", "نصيحة عملية عندما تحتاج إليها."], ["ازرع بثقة", "كل ما تحتاجه في سلة واحدة."]],
};

export default function Home() {
  const { t, locale } = useI18n();
  const [catalog, setCatalog] = useState<Product[] | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/catalog/products", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((live: Product[]) => { if (active) setCatalog(live); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  const ar = locale === "ar" ? arabic : null;
  const localizedPaths = ar ? paths.map((path, index) => ({ ...path, label: ar.paths[index] })) : paths;
  const localizedSteps = ar ? steps.map((step, index) => ({ ...step, title: ar.steps[index][0], text: ar.steps[index][1], linkLabel: ar.steps[index][2] })) : steps;
  const localizedReviews = ar ? reviews.map((review, index) => ({ ...review, role: ar.reviewRoles[index], text: ar.reviewText[index] })) : reviews;
  const localizedCategoryGroups = ar ? categoryGroups.map((group, index) => ({ ...group, name: ar.categoryGroups[index][0], detail: ar.categoryGroups[index][1] })) : categoryGroups;
  const finalCards = ar?.finalCards ?? [["Find your plant", "Matches for your space and climate."], ["Talk to an expert", "Practical guidance when you need it."], ["Grow with confidence", "Everything you need in one cart."]];
  const localizeProducts = (items: typeof products) => ar ? items.map((item) => ({ ...item, ...ar.products[item.slug] })) : items;
  const liveCatalog = localizeProducts(mergeLiveCatalog(catalog));
  const popularPlants = liveCatalog.filter((p) => p.kind === "plant").sort((a, b) => Number(b.featured ?? 0) - Number(a.featured ?? 0)).slice(0, 4);
  const popularEquipment = liveCatalog.filter((p) => p.kind === "equipment").sort((a, b) => Number(b.featured ?? 0) - Number(a.featured ?? 0)).slice(0, 4);
  const localizedExperts = ar ? experts.map((expert, index) => ({ ...expert, role: ar.expertRoles[index] })) : experts;
  const localizedGuides = ar ? guides.map((guide, index) => ({ ...guide, title: ar.guideTitles[index] ?? guide.title })) : guides;

  return (
    <main>
      {/* Hero + SiteHeader share one flat #40533d plane: no shadow/border seam. */}
      <section className="relative overflow-hidden bg-[#40533d] text-white font-haskoy">
        <div className="section relative z-10 grid items-center gap-10 py-6 pb-12 sm:py-7 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] lg:gap-6">
          <div className="relative z-10">
          <span className="font-simplon inline-flex w-fit items-center rounded-full border border-white/30 px-3 py-1 text-[11px] uppercase tracking-brand text-white">
            {ar?.badge ?? "Plants · Equipment · Expert Solutions"}
          </span>
          <h1 className="font-simplon mt-4 max-w-2xl text-[1.65rem] font-normal uppercase leading-tight tracking-[0.08em] text-white sm:text-4xl sm:tracking-[0.1em]">
            {t("hero.title")}
          </h1>
          <p className="font-simplon mt-3 max-w-xl text-sm font-normal leading-relaxed tracking-[0.03em] text-white sm:text-base sm:tracking-[0.045em]">
            {t("hero.subtitle")} {ar?.heroTail ?? "From a single windowsill to a working farm, Tannelli connects you to the right plants and the right people."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/shop" shape="rect" size="md" variant="light">
              {t("hero.explore")}
            </Button>
            <Button href="/experts" variant="outline-dark" shape="rect" size="md">
              {t("hero.talk")}
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
            <span className="flex items-center gap-2 text-white">
              <Stars rating={4.9} /> {ar?.growers ?? "12,000+ growers"}
            </span>
            <span className="h-3 w-px bg-white/25" />
            <span>{ar?.delivered ?? "Delivered together"}</span>
            <span className="h-3 w-px bg-white/25" />
            <span>EN · FR · AR</span>
          </div>
          </div>
          <div className="relative z-10 flex min-h-[16rem] items-center justify-center lg:min-h-[19rem]" aria-label="Tannelli startup objectives">
            <div className="relative z-10 grid h-52 w-52 place-items-center rounded-full border border-white/90 bg-white p-9 text-center text-[#18231b] sm:h-60 sm:w-60">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-[#40533d]">Our purpose</span>
                <strong className="mt-3 block text-2xl font-semibold leading-[1.05] tracking-tight sm:text-3xl">Grow better<br />together.</strong>
                <span className="mx-auto mt-4 block h-px w-10 bg-[#40533d]/40" />
                <span className="mt-3 block text-xs leading-5 text-[#5f6b60]">Everything you need to grow with confidence.</span>
              </div>
            </div>
            <span className="pointer-events-none absolute left-[18%] top-1/2 z-0 h-px w-[64%] bg-white/70" />
            <span className="pointer-events-none absolute left-1/2 top-[25%] z-0 h-[50%] w-px rotate-[28deg] bg-white/60" />
            <div className="absolute right-2 top-2 z-10 grid h-24 w-24 place-items-center rounded-full border border-white/90 bg-white p-4 text-center text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-[#18231b] sm:right-4 sm:top-4 sm:h-28 sm:w-28">Right plant<br />right place</div>
            <div className="absolute bottom-0 left-2 z-10 grid h-28 w-28 place-items-center rounded-full border border-white/90 bg-white p-4 text-center text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-[#18231b] sm:bottom-2 sm:left-4 sm:h-32 sm:w-32">Expert help<br />when it matters</div>
          </div>
        </div>
        <svg aria-hidden="true" viewBox="0 0 1440 180" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full sm:h-28">
          <path d="M0 180V112l170-72 120 54 138-76 155 94 170-57 132 76 155-102 180 95 125-64 170 52v68H0Z" fill="#334532" opacity="0.95" />
          <path d="M0 180v-46l180-52 120 38 170-72 140 67 145-38 140 50 188-78 145 69 125-29 137 37v54H0Z" fill="#263b2d" />
          <g fill="#172a20">
            <path d="M120 164h8v-46h-8z" /><circle cx="124" cy="101" r="31" /><circle cx="98" cy="118" r="22" /><circle cx="149" cy="120" r="24" />
            <path d="M268 166h7v-38h-7z" /><circle cx="272" cy="111" r="27" /><circle cx="250" cy="126" r="19" /><circle cx="293" cy="127" r="20" />
            <path d="M1040 166h8v-47h-8z" /><circle cx="1044" cy="98" r="33" /><circle cx="1016" cy="117" r="23" /><circle cx="1071" cy="119" r="25" />
            <path d="M1245 166h7v-36h-7z" /><circle cx="1248" cy="113" r="26" /><circle cx="1227" cy="128" r="18" /><circle cx="1269" cy="128" r="19" />
          </g>
          <g fill="#223a2b">
            <path d="M438 160h5v-28h-5zM418 146l23-48 23 48h-13l15 25h-50l15-25h-13Z" />
            <path d="M755 160h5v-28h-5zM735 146l23-48 23 48h-13l15 25h-50l15-25h-13Z" />
            <path d="M1362 160h5v-28h-5zM1342 146l23-48 23 48h-13l15 25h-50l15-25h-13Z" />
          </g>
          <path d="M0 180v-20l160-30 130 17 150-42 130 39 160-26 160 35 140-45 150 45 110-18 160 25v20H0Z" fill="#1d3025" />
        </svg>
      </section>

      {/* Below-hero sections: Barlow (NewFont) + depth cards. Hero fonts untouched. */}
      <div className="font-barlow">
      <section className="bg-emerald-950">
        <div className="section grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {localizedPaths.map((p, i) => (
            <Link
              key={p.label}
              href={p.href}
              className="group flex flex-col justify-between gap-4 border-white/10 px-4 py-5 text-white transition hover:bg-white/5 [border-right-width:1px] [border-bottom-width:1px] last:[border-right-width:0] sm:[&:nth-child(3n)]:[border-right-width:0] lg:[&:nth-child(3n)]:[border-right-width:1px] lg:last:[border-right-width:0]"
            >
              <span className="text-xs font-semibold text-white/40">0{i + 1}</span>
              <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white">
                {p.label}
                <ArrowRightIcon className="h-3.5 w-3.5 text-white/40 transition group-hover:translate-x-1 group-hover:text-white" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-b border-neutral-200/80 bg-[#f5f6f4]">
        <div className="section grid grid-cols-2 gap-3 py-6 sm:grid-cols-4">
          {localizedCategoryGroups.map((category, index) => {
            const Icon = [LeafMark, SearchIcon, BagIcon, ChatIcon][index];
            return <Link key={category.name} href={category.href} className="group relative min-h-[8.75rem] overflow-hidden rounded-xl border border-[#d9e5d7] bg-[#f6faf5] p-4 shadow-[0_6px_18px_rgb(24_35_27_/_0.045)] transition duration-300 hover:-translate-y-1 hover:border-[#8fac8a] hover:bg-white hover:shadow-[0_16px_32px_rgb(24_35_27_/_0.12)]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#40533d] text-white shadow-[0_5px_12px_rgb(64_83_61_/_0.2)]"><Icon className="h-4 w-4" /></span>
              <span className="mt-5 block text-sm font-bold tracking-tight text-[#20321f]">{category.name}</span>
              <span className="mt-2 block max-w-[calc(100%-2.5rem)] truncate rounded-full border border-[#dce8da] bg-white px-2.5 py-1 text-[10px] font-medium text-[#5d705a]">{category.detail}</span>
              <span className="absolute bottom-4 right-4 grid h-7 w-7 place-items-center rounded-full border border-[#d2e0cf] bg-white text-[#40533d] transition group-hover:border-[#40533d] group-hover:bg-[#40533d] group-hover:text-white"><ArrowRightIcon className="h-3.5 w-3.5" /></span>
            </Link>;
          })}
        </div>
      </section>

      <section className="section-surface-white py-14">
        <div className="section">
          <SectionHeading
            eyebrow={ar?.marketplace ?? "Marketplace"}
            title={ar?.popularPlants ?? "Popular plants"}
            description={ar?.popularPlantsText ?? "Grower favourites picked for reliability and beauty."}
            badge="New"
            action={<Link href="/shop?kind=plant" className="cta-hosting">{ar?.allPlants ?? "View all plants"}</Link>}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {popularPlants.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </div>
      </section>

      <section className="section-surface py-14">
        <div className="section">
          <SectionHeading
            eyebrow={ar?.marketplace ?? "Marketplace"}
            title={ar?.popularEquipment ?? "Popular equipment"}
            description={ar?.popularEquipmentText ?? "Everything to plant it, feed it, water it and keep it thriving."}
            action={<Link href="/shop?kind=equipment" className="cta-hosting">{ar?.allEquipment ?? "View all equipment"}</Link>}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {popularEquipment.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </div>
      </section>

      <section className="section-surface-white py-14">
        <div className="section">
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
            <div className="rounded-lg bg-[#f0f2f1] px-7 py-9 sm:px-10 sm:py-11">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">{ar?.expertEyebrow ?? "Expert Solutions"}</p>
              <h2 className="mt-4 max-w-lg text-2xl font-bold tracking-tight text-[#111] sm:text-3xl">{ar?.expertTitle ?? "Not sure what to plant, or why it's dying?"}</h2>
              <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-neutral-600">{ar?.expertText ?? "Describe your problem, upload a photo and get a real recommendation from an agronomist, landscape designer or plant specialist — complete with a shopping list you can buy in one click."}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/experts" className="cta-hosting">{ar?.requestExpert ?? "Request an expert solution"}</Link>
                <Button href="/assistant" variant="outline" shape="rect" size="lg">{ar?.tryAi ?? "Try the AI assistant"}</Button>
              </div>
            </div>
            <div className="depth-card relative z-10 self-center p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">What you get</p>
              <ul className="mt-5 space-y-3.5">
                {(ar?.solution ?? solutionIncludes).map((label) => (
                  <li key={label} className="check-row font-medium">{label}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section-surface py-14">
        <div className="section">
          <SectionHeading
            center
            eyebrow={ar?.how ?? "How Tannelli works"}
            title={ar?.howTitle ?? "From idea to thriving in three steps"}
            badge="New"
            description="Choose the path that matches your space and goal."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {localizedSteps.map((s, i) => (
              <div key={s.title} className="depth-card p-6 sm:p-7">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-[#006d44] text-white">
                  <s.icon className="h-4 w-4" />
                </span>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">0{i + 1}</p>
                <h3 className="mt-2 text-base font-bold text-[#111]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.text}</p>
                <Link href={s.href} className="mt-4 inline-flex text-sm font-bold text-[#006d44] hover:underline">{s.linkLabel} →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-surface-white py-14">
        <div className="section grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow={ar?.projects ?? "Garden Projects"} title={ar?.projectsTitle ?? "Plan every project in one place"} />
            <div className="depth-card p-6 sm:p-7">
              <p className="text-neutral-600">{ar?.projectsText ?? <>Create projects like <strong>My Balcony Garden</strong> or <strong>My Orchard</strong> and keep plants, budget, tasks, watering and expert advice together.</>}</p>
              <div className="mt-6 space-y-3">
                {(ar?.projectNames ?? ["My Balcony Garden", "My Vegetable Garden", "My Orchard"]).map((name, i) => (
                  <div key={name} className="flex items-center gap-4 rounded-md bg-[#f5f6f7] p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-xs font-bold shadow-sm">{initials(name)}</span>
                    <div className="flex-1">
                      <p className="font-bold text-[#111]">{name}</p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                        <div className="h-full rounded-full bg-[#006d44]" style={{ width: `${[65, 40, 25][i]}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/planner" className="cta-hosting mt-6 w-full">{ar?.openPlanner ?? "Open the Garden Planner"}</Link>
            </div>
          </div>
          <div>
            <SectionHeading
              eyebrow={ar?.guides ?? "Educational Guides"}
              title={ar?.guidesTitle ?? "Learn as you grow"}
              action={<Button href="/learn" variant="ghost">{ar?.allGuides ?? "All guides →"}</Button>}
            />
            <div className="space-y-3">
              {localizedGuides.slice(0, 4).map((g) => (
                <Link key={g.slug} href={`/learn/${g.slug}`} className="depth-card group flex items-center gap-4 p-4">
                  <Monogram text={initials(g.title)} tint={g.tint} className="h-14 w-14 shrink-0 rounded-md text-sm" />
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{g.category} · {g.minutes} min</p>
                    <p className="mt-1 font-bold leading-snug text-[#111] group-hover:text-[#006d44]">{g.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-surface py-14">
        <div className="section">
          <SectionHeading
            eyebrow={ar?.featuredExperts ?? "Featured Experts"}
            title={ar?.featuredTitle ?? "Meet the people behind your plants"}
            action={<Link href="/experts" className="cta-hosting">{ar?.browseExperts ?? "Browse all experts"}</Link>}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {localizedExperts.map((e) => (
              <Link key={e.slug} href={`/experts/${e.slug}`} className="depth-card group p-6">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[#f0f2f1] text-sm font-bold text-[#40533d]">{initials(e.name)}</span>
                <h3 className="mt-4 font-bold text-[#111]">{e.name}</h3>
                <p className="text-sm text-neutral-500">{e.role}</p>
                <p className="mt-1 text-xs font-bold text-[#006d44]">{e.location}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <Stars rating={e.rating} />
                  <span className="font-bold text-[#111]">from ${e.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-surface-white py-14">
        <div className="section">
          <SectionHeading eyebrow={ar?.reviews ?? "Customer Reviews"} title={ar?.reviewsTitle ?? "Loved by 12,000+ growers"} />
          <div className="grid gap-4 md:grid-cols-3">
            {localizedReviews.map((r) => (
              <figure key={r.name} className="depth-card flex flex-col p-7">
                <Stars rating={5} />
                <blockquote className="mt-4 flex-1 leading-relaxed text-neutral-700">&ldquo;{r.text}&rdquo;</blockquote>
                <figcaption className="mt-6">
                  <p className="font-bold text-[#111]">{r.name}</p>
                  <p className="text-sm text-neutral-500">{r.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section pb-14 pt-4">
        <div className="flex flex-col items-center gap-6 rounded-lg bg-[#40533d] px-8 py-12 text-center text-white shadow-[0_24px_60px_rgb(24_35_27_/_0.28)]">
          <h2 className="font-simplon max-w-2xl text-2xl font-normal uppercase leading-snug tracking-[0.08em] text-white sm:text-3xl sm:tracking-[0.1em]">
            {ar?.finalTitle ?? "Everything you need to grow — start today"}
          </h2>
          <p className="font-simplon max-w-xl text-sm font-normal leading-relaxed tracking-[0.03em] text-white/90 sm:text-base">
            {ar ? "اعثر على الحل خلال دقائق، أو تحدث إلى خبير يعرف ما يلزم لنباتاتك. النباتات والمعدات تُشحن عبر الجزائر من موقع البائع. الأسعار بالدينار الجزائري (دج)." : (locale === "fr" ? "Trouvez votre solution en quelques minutes, ou parlez à un expert qui connaît votre wilaya. Les plantes et l'équipement sont expédiés dans toute l'Algérie depuis l'emplacement du vendeur. Prix en dinars algériens (DA)." : "Find your solution in minutes, or talk to an expert who covers your wilaya. Plants and equipment ship across Algeria from the seller's location. Prices in Algerian Dinars (DA).")}
          </p>
          <div className="grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3">
            {[LeafMark, ChatIcon, BagIcon].map((Icon, index) => (
              <div key={finalCards[index][0]} className="depth-card group border-0 bg-white/[0.08] p-4 text-white shadow-none transition hover:bg-white/[0.12]">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-white/10 text-white transition duration-300 group-hover:bg-[#62a83d]"><Icon className="h-4 w-4" /></span>
                <h3 className="mt-3 text-sm font-bold">{finalCards[index][0]}</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/70">{finalCards[index][1]}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/discover" shape="rect" size="lg" variant="light">{t("cta.primary")}</Button>
            <Button href="/experts" variant="outline-dark" shape="rect" size="lg">{t("cta.secondary")}</Button>
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}

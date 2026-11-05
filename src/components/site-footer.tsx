"use client";

import { Link } from "./locale-link";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { FacebookIcon, InstagramIcon, LinkedInIcon, RssIcon, TikTokIcon } from "./icons";
import { useI18n } from "@/lib/i18n";
import { usePathname } from "next/navigation";

const columns = [
  { title: "footer.marketplace", links: [["footer.shopAll", "/shop"], ["footer.plants", "/shop?kind=plant"], ["footer.equipment", "/shop?kind=equipment"], ["footer.findPlant", "/discover"]] },
  { title: "footer.solutions", links: [["footer.experts", "/experts"], ["footer.planner", "/planner"], ["footer.assistant", "/assistant"], ["footer.business", "/business"]] },
  { title: "footer.learn", links: [["footer.knowledge", "/learn"], ["footer.guides", "/learn"], ["footer.calendar", "/seasonal-calendar"], ["footer.faqs", "/faqs"]] },
  { title: "footer.company", links: [["footer.about", "/about"], ["footer.becomeExpert", "/sign-up?account=expert"], ["footer.becomeSupplier", "/sign-up?account=merchant"], ["footer.contact", "/contact"], ["footer.careers", "/careers"]] },
  { title: "footer.support", links: [["footer.trackOrders", "/dashboard"], ["footer.delivery", "/delivery"], ["footer.returns", "/returns"], ["footer.contact", "/contact"]] },
];

const socials = [{ label: "Facebook", icon: FacebookIcon, href: "https://www.facebook.com" }, { label: "Instagram", icon: InstagramIcon, href: "https://www.instagram.com" }, { label: "LinkedIn", icon: LinkedInIcon, href: "https://www.linkedin.com" }, { label: "TikTok", icon: TikTokIcon, href: "https://www.tiktok.com" }, { label: "RSS", icon: RssIcon, href: "/learn" }];

export function SiteFooter() {
  const { t } = useI18n();
  const pathname = usePathname();
  if (pathname?.includes("/admin") || pathname?.includes("/dashboard")) return null;
  return <footer className="mt-auto bg-black text-neutral-300"><div className="section flex flex-wrap items-center justify-between gap-6 border-b border-white/10 py-6"><LanguageSwitcher /><div className="flex items-center gap-5">{socials.map((social) => <a key={social.label} href={social.href} target={social.href.startsWith("http") ? "_blank" : undefined} rel={social.href.startsWith("http") ? "noreferrer" : undefined} aria-label={social.label} className="text-white/80 transition hover:text-white"><social.icon className="h-[18px] w-[18px]" /></a>)}</div></div><div className="section py-14"><div className="grid gap-10 md:grid-cols-[1.3fr_repeat(5,1fr)]"><div><Logo /><p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">{t("footer.tagline")} {t("footer.description")}</p></div>{columns.map((column) => <div key={column.title}><h3 className="text-sm font-semibold text-white">{t(column.title)}</h3><ul className="mt-4 space-y-2.5">{column.links.map(([label, href]) => <li key={label}><Link href={href} className="text-sm text-neutral-400 transition hover:text-white">{t(label)}</Link></li>)}</ul></div>)}</div><div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Tannelli. {t("footer.rights")}</p><div className="flex gap-5"><Link href="/privacy" className="hover:text-white">{t("footer.privacy")}</Link><Link href="/terms" className="hover:text-white">{t("footer.terms")}</Link><Link href="/payments" className="hover:text-white">{t("footer.payments")}</Link></div></div></div></footer>;
}

import type { Metadata } from "next";
import { Link } from "@/components/locale-link";
import { PlantParade } from "@/components/plant-parade";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist or has moved.",
};

const shortcuts = [
  { label: "Shop plants & equipment", href: "/shop" },
  { label: "Ask an expert", href: "/experts" },
  { label: "Scan with RuddgeAI", href: "/ruddge" },
  { label: "Plan my garden", href: "/planner" },
];

export default function NotFound() {
  return (
    <main className="bg-[#f4f7f3]">
      <div className="overflow-hidden bg-[#1e3226] text-white">
        <div className="section py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Error 404</p>
          <h1 className="mt-3 text-[2rem] font-normal tracking-tight sm:text-5xl">Lost the plot.</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/70 sm:text-base">
            This page wandered off with the plants. It may have moved, or the link is out of date.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/" className="bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1e3226]">Back to home</Link>
            <Link href="/shop" className="border border-white/35 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10">Browse the shop</Link>
          </div>
        </div>
        <PlantParade />
      </div>
      <section className="section py-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#789078]">Try one of these instead</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {shortcuts.map((item) => (
            <Link key={item.href} href={item.href} className="ui-card flex items-center justify-between px-5 py-4 text-sm font-semibold text-[#18231b] transition hover:border-[#40533d]">
              {item.label}
              <span aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

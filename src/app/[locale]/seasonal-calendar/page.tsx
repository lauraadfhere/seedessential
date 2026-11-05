import { PageHero } from "@/components/page-hero";
import { Link } from "@/components/locale-link";

const calendar = [
  ["Spring", "Start vegetables, refresh indoor soil, and set up irrigation before hotter weather."],
  ["Summer", "Water early, mulch outdoor beds, and watch closely for heat stress and pests."],
  ["Autumn", "Plant trees and shrubs, feed soil with compost, and prepare cool-season crops."],
  ["Winter", "Reduce watering indoors, protect tender plants, and plan next season's projects."],
];

export default function SeasonalCalendarPage() {
  return <main><PageHero eyebrow="Growing calendar" title="Plan with the seasons" text="A practical year-round rhythm for plants, gardens and productive spaces in Algeria." /><section className="section max-w-4xl py-12"><div className="grid gap-4 sm:grid-cols-2">{calendar.map(([season, advice]) => <article key={season} className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">{season}</h2><p className="mt-3 leading-relaxed text-neutral-600">{advice}</p></article>)}</div><p className="mt-10 text-neutral-600">Need advice for your wilaya or growing space? <Link href="/experts" className="font-semibold underline">Talk to an expert.</Link></p></section></main>;
}

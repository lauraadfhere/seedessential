import { PageHero } from "@/components/page-hero";
import { Link } from "@/components/locale-link";

const answers = [
  ["How do I place an order?", "Add plants or equipment to your cart, choose delivery details, and complete checkout. Your dashboard keeps the order and delivery status together."],
  ["Can I get advice before buying?", "Yes. Browse expert profiles or submit an expert request with photos and details of your space."],
  ["When are provider listings visible?", "Equipment providers submit listings for Tannelli review. Only accepted listings are shown in the shop."],
  ["How does expert verification work?", "Experts submit their profile and credentials. Tannelli reviews them before expert services become active."],
];

export default function FaqsPage() {
  return <main><PageHero eyebrow="Help center" title="Frequently asked questions" text="Clear answers for shopping, delivery, expert support and marketplace accounts." /><section className="section max-w-4xl py-12"><div className="space-y-4">{answers.map(([question, answer]) => <details key={question} className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3 leading-relaxed text-neutral-600">{answer}</p></details>)}</div><p className="mt-8 text-neutral-600">Still need help? <Link href="/contact" className="font-semibold underline">Contact support.</Link></p></section></main>;
}

import { PageHero } from "@/components/page-hero";
import { Link } from "@/components/locale-link";

export default function ReturnsPage() {
  return <main><PageHero eyebrow="Returns and guarantee" title="Support when an order needs attention" text="We want plants and equipment to arrive in the right condition for your growing project." /><section className="section max-w-3xl space-y-7 py-12 text-neutral-700"><section><h2 className="text-xl font-semibold text-neutral-950">Report an issue promptly</h2><p className="mt-2">Keep your order number and clear photos of the item and packaging. This gives the support team the context needed to review a delivery issue.</p></section><section><h2 className="text-xl font-semibold text-neutral-950">How support helps</h2><p className="mt-2">Tannelli reviews the order, delivery status and supporting details, then explains the next step for replacement, return or resolution.</p></section><Link href="/contact" className="inline-block font-semibold underline">Start a support request</Link></section></main>;
}

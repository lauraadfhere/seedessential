import { PageHero } from "@/components/page-hero";
import { Link } from "@/components/locale-link";

export default function DeliveryPage() {
  return <main><PageHero eyebrow="Delivery" title="Delivery information for Algeria" text="Choose your delivery details at checkout and follow the order from confirmation to arrival." /><section className="section max-w-3xl space-y-7 py-12 text-neutral-700"><section><h2 className="text-xl font-semibold text-neutral-950">Coverage and timing</h2><p className="mt-2">Delivery options and estimates are calculated from your wilaya, basket and selected delivery method. Your final estimate is shown before payment.</p></section><section><h2 className="text-xl font-semibold text-neutral-950">Order tracking</h2><p className="mt-2">After checkout, your dashboard shows the current status from order placement through delivery.</p></section><p>Need help with an existing delivery? <Link href="/contact" className="font-semibold underline">Contact support.</Link></p></section></main>;
}

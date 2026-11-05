import { PageHero } from "@/components/page-hero";
import { Link } from "@/components/locale-link";

export default function TermsPage() {
  return <main><PageHero eyebrow="Terms" title="Clear rules for a trusted marketplace" text="These terms explain how customers, experts and providers use Tannelli safely and fairly." /><section className="section max-w-3xl space-y-7 py-12 text-neutral-700"><section><h2 className="text-xl font-semibold text-neutral-950">Marketplace</h2><p className="mt-2">Product availability, prices and delivery estimates are confirmed at checkout. Provider listings and expert profiles may be reviewed before publication.</p></section><section><h2 className="text-xl font-semibold text-neutral-950">Professional advice</h2><p className="mt-2">Expert and AI guidance supports informed growing decisions; it does not replace urgent on-site, medical or safety advice.</p></section><section><h2 className="text-xl font-semibold text-neutral-950">Questions</h2><p className="mt-2">For account, delivery or marketplace issues, <Link href="/contact" className="font-semibold underline">contact Tannelli support</Link>.</p></section></section></main>;
}

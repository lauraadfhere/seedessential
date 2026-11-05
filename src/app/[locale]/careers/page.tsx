import { PageHero } from "@/components/page-hero";
import { Link } from "@/components/locale-link";

export default function CareersPage() {
  return <main><PageHero eyebrow="Careers" title="Grow with Tannelli" text="We are building Algeria's home for plants, equipment and expert advice. No open roles are listed right now." /><section className="section max-w-3xl space-y-7 py-12 text-neutral-700"><section><h2 className="text-xl font-semibold text-neutral-950">Work with us</h2><p className="mt-2">If you care about gardening, agriculture and helping people grow, we would like to hear from you. Send a short introduction and your CV through the contact page and we will keep it on file.</p></section><section><h2 className="text-xl font-semibold text-neutral-950">Partners and experts</h2><p className="mt-2">Agronomists, nurseries and equipment suppliers can join the platform today.</p></section><p>Get in touch: <Link href="/contact" className="font-semibold underline">Contact us.</Link></p></section></main>;
}

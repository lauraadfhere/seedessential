import { PageHero } from "@/components/page-hero";
import { Link } from "@/components/locale-link";

export default function PaymentsPage() {
  return <main><PageHero eyebrow="Payments" title="Secure checkout, clear order records" text="Tannelli records each checkout, payment method and order status so you can follow your purchase from confirmation to delivery." /><section className="section max-w-3xl space-y-7 py-12 text-neutral-700"><section><h2 className="text-xl font-semibold text-neutral-950">Payment options</h2><p className="mt-2">Available payment methods are shown during checkout. Never share payment credentials through messages or with an expert or provider.</p></section><section><h2 className="text-xl font-semibold text-neutral-950">Order support</h2><p className="mt-2">Your dashboard keeps your order history and delivery status together. If something is wrong, <Link href="/contact" className="font-semibold underline">contact support</Link> with your order number.</p></section></section></main>;
}

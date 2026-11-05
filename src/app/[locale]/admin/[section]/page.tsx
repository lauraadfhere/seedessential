import Link from "next/link";
import { notFound } from "next/navigation";

const sections: Record<string, { title: string; text: string; actions: string[] }> = {
  users: { title: "User management", text: "Manage customer accounts, roles, profile media, addresses and account support.", actions: ["Search users", "Update roles", "Review profile media"] },
  experts: { title: "Expert management", text: "Review expert profiles, specialties, availability, services and consultation eligibility.", actions: ["Review profiles", "Manage specialties", "Check availability"] },
  orders: { title: "Orders & delivery", text: "Follow orders from checkout through fulfilment and delivery.", actions: ["Order queue", "Delivery statuses", "Customer notifications"] },
  payments: { title: "Payments", text: "Review marketplace payments, refunds, commissions and expert payouts.", actions: ["Transactions", "Refunds", "Payouts"] },
  moderation: { title: "Moderation", text: "Moderate product reviews, questions, reports and marketplace content.", actions: ["Review queue", "Reported content", "Policy actions"] },
  claims: { title: "Claims & support", text: "Track customer claims, disputes, order issues and support resolutions.", actions: ["Open claims", "Support tickets", "Resolved cases"] },
  content: { title: "Content management", text: "Manage knowledge-center articles, promotions, guides and SEO content.", actions: ["Articles", "Promotions", "SEO review"] },
  analytics: { title: "Analytics & reports", text: "Measure catalog, customer, expert and marketplace performance.", actions: ["Sales report", "Expert activity", "Catalog performance"] },
};

export default async function AdminSection({ params }: PageProps<"/[locale]/admin/[section]">) {
  const { locale, section } = await params; const data = sections[section]; if (!data) notFound();
  return (
    <main className="network-surface min-h-[70vh] py-12">
      <div className="section">
        <Link href={`/${locale}/admin`} className="text-sm font-bold text-[#40533d]">← Administration hub</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-brand text-accent">Administration</p>
        <h1 className="mt-2 text-4xl font-semibold">{data.title}</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">{data.text}</p>
        <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
          <span className="pointer-events-none absolute inset-x-8 top-10 hidden h-px bg-[#40533d]/12 sm:block" />
          {data.actions.map((action, index) => (
            <div key={action} className="network-card relative rounded-[1.75rem] p-6 pt-8">
              <span className="network-node absolute left-6 top-0 grid h-8 w-8 -translate-y-1/2 place-items-center border border-[#dce5dc] text-[10px] font-bold text-[#40533d]">0{index + 1}</span>
              <h2 className="mt-2 text-lg font-semibold">{action}</h2>
              <p className="mt-2 text-sm text-neutral-600">Workspace module ready for your administration workflow.</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

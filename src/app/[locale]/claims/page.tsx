"use client";

import { Link } from "@/components/locale-link";
import { RequireAuth } from "@/components/require-auth";

const subjects = [
  { href: "/orders", title: "An order", text: "Delivery, damaged plants or the wrong item." },
  { href: "/consultations", title: "An expert request", text: "Advice, no-show or conduct during a consultation." },
  { href: "/shop", title: "A listing", text: "Misleading, unsafe or counterfeit equipment." },
  { href: "/experts", title: "An expert profile", text: "False credentials or misconduct." },
];

export default function ClaimsPage() {
  return (
    <RequireAuth loadingLabel="Opening claims…">
      <main className="network-surface">
        <section className="section py-8 sm:py-10">
          <p className="max-w-xl text-sm leading-6 text-[#607060]">
            Open a claim when something goes wrong between a grower, an expert or a seller. Tannelli reviews evidence from both sides.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {subjects.map((item) => (
              <Link key={item.href} href={item.href} className="ui-card p-5 transition hover:border-[#40533d]/40">
                <h2 className="font-semibold text-[#18231b]">{item.title}</h2>
                <p className="mt-1 text-sm text-[#607060]">{item.text}</p>
                <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-[#40533d]">Open related records →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}

"use client";

import { useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui";
import { Link } from "@/components/locale-link";

export default function Business() {
  const [sent, setSent] = useState(false);
  return (
    <main>
      <PageHero eyebrow="Tannelli for business" title="Greener spaces, expertly delivered" text="Plants, equipment, design and ongoing care for organisations building better places to work, stay and gather." />
      <section className="section grid gap-10 py-12 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">One partner for every growing project</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {["Bulk plants & equipment", "Landscape design", "Irrigation solutions", "Maintenance plans", "Expert consultation", "Corporate & hospitality projects"].map((x) => (
              <div className="network-card p-4" key={x}>{x}</div>
            ))}
          </div>
          <p className="mt-8 text-neutral-600">For landscaping companies, hotels, restaurants, offices, schools, municipalities, farms, nurseries and developers.</p>
          <div className="mt-8 border border-rule bg-panel p-5">
            <p className="font-semibold">Sell equipment on Tannelli</p>
            <p className="mt-2 text-sm text-neutral-600">Register as a company provider, add your equipment list, and Tannelli reviews each product before shoppers can see it.</p>
            <Link href="/sign-up?account=provider" className="mt-3 inline-block text-sm font-bold text-[#40533d]">Register as a provider →</Link>
          </div>
        </div>
        {sent ? (
          <div className="tmpl-panel">
            <div className="tmpl-panel-body">
              <h2 className="text-xl font-semibold">Thanks — we’ll be in touch.</h2>
              <p className="mt-2 text-neutral-600">Our B2B team will contact you shortly.</p>
            </div>
          </div>
        ) : (
          <div className="tmpl-panel">
            <div className="tmpl-panel-head">Start a business enquiry</div>
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="tmpl-panel-body">
              <input required className="ui-field" placeholder="Company name" />
              <input required type="email" className="ui-field mt-3" placeholder="Work email" />
              <textarea required className="ui-field mt-3 min-h-28" placeholder="Tell us about your project" />
              <Button type="submit" shape="rect" className="mt-4">Talk to B2B team</Button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}

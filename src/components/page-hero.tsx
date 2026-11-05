import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: ReactNode }) {
  return <section className="bg-black text-white"><div className="section py-12 sm:py-16"><p className="text-xs font-bold uppercase tracking-brand text-neutral-400">{eyebrow}</p><h1 className="mt-4 max-w-3xl text-3xl font-semibold uppercase tracking-wide sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-300">{text}</p>{children && <div className="mt-7">{children}</div>}</div></section>;
}

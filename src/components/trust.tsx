import { Link } from "./locale-link";
import { cn } from "./ui";
import { TRUST_TIERS, type TrustSignal, type TrustTier } from "@/lib/trust";
import type { Completeness } from "@/lib/profile";

export function TrustBadge({ tier, score, className, compact }: { tier: TrustTier; score?: number; className?: string; compact?: boolean }) {
  const meta = TRUST_TIERS[tier] ?? TRUST_TIERS.new;
  return (
    <span title={meta.description} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset", meta.tone, className)}>
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></svg>
      {compact ? (score ?? meta.label) : meta.label}
      {!compact && score !== undefined && score > 0 && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

export function TrustBreakdown({ score, tier, signals, penalties, title = "Trust score" }: { score: number; tier: TrustTier; signals: TrustSignal[]; penalties?: TrustSignal[]; title?: string }) {
  const meta = TRUST_TIERS[tier] ?? TRUST_TIERS.new;
  return (
    <section className="rounded-[1.5rem] border border-[#e3e9e1] bg-white p-5">
      <div className="flex items-center gap-4">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center">
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e6ede5" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#40533d" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(score / 100) * 97.4} 97.4`} />
          </svg>
          <span className="text-lg font-semibold">{score}</span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7d8a7b]">{title}</p>
          <TrustBadge tier={tier} className="mt-1" />
          <p className="mt-1 text-xs leading-5 text-[#607060]">{meta.description}</p>
        </div>
      </div>
      {signals.length > 0 && (
        <ul className="mt-5 space-y-3">
          {signals.map((item) => (
            <li key={item.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-xs font-semibold text-[#607060]">{item.points}/{item.max}</span>
              </div>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#eef3ed]"><span className="block h-full rounded-full bg-[#40533d]" style={{ width: `${item.max ? (item.points / item.max) * 100 : 0}%` }} /></span>
              <p className="mt-1 text-xs text-[#789078]">{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
      {penalties && penalties.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-[#eef3ed] pt-4">
          {penalties.map((item) => (
            <li key={item.key} className="flex items-baseline justify-between gap-3 text-sm text-red-700">
              <span>{item.label} <span className="text-xs text-red-600/80">— {item.detail}</span></span>
              <span className="text-xs font-bold">{item.points}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CompletenessMeter({ completeness, href, className }: { completeness: Completeness; href?: string; className?: string }) {
  const done = completeness.score >= 100;
  return (
    <section className={cn("rounded-[1.5rem] border p-5", done ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{done ? "Profile complete" : "Complete your profile"}</p>
        <span className="text-sm font-bold">{completeness.score}%</span>
      </div>
      <span className="mt-3 block h-2 overflow-hidden rounded-full bg-white"><span className={cn("block h-full rounded-full transition-all", done ? "bg-emerald-600" : "bg-amber-500")} style={{ width: `${completeness.score}%` }} /></span>
      {!done && (
        <>
          <p className="mt-3 text-xs leading-5 text-[#607060]">Complete profiles rank higher and earn more trust. Still missing:</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {completeness.missing.slice(0, 6).map((item) => <li key={item.key} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200">{item.label}</li>)}
          </ul>
          {href && <Link href={href} className="mt-3 inline-block text-xs font-bold text-[#40533d]">Finish profile →</Link>}
        </>
      )}
    </section>
  );
}

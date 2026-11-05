/** Marching stick figures from the Tannelli 404 / loader visual language. */
const FIGURES = [
  { d: "M18 8c0 3-2 5-6 5s-6-2-6-5 2-6 6-6 6 3 6 6ZM4 36c2-8 6-14 8-14 2 4 4 8 6 8s4-4 6-8c2 0 6 6 8 14", legs: true },
  { d: "M18 10a6 6 0 1 0-12 0 6 6 0 0 0 12 0ZM8 36c1-10 4-16 4-16h8s3 6 4 16", box: true },
  { d: "M16 8a5 5 0 1 0-10 0 5 5 0 0 0 10 0M4 36c1-9 5-16 7-16 2 5 4 8 5 8s3-3 5-8c2 0 6 7 7 16", leaf: true },
  { d: "M17 9a5 5 0 1 0-10 0 5 5 0 0 0 10 0M6 36c1-10 4-16 6-16 1 4 3 8 5 8s4-4 5-8c2 0 5 6 6 16", star: true },
  { d: "M16 10a5 5 0 1 0-10 0 5 5 0 0 0 10 0M5 36c2-10 5-16 6-16 2 4 4 8 5 8s3-4 5-8c1 0 5 6 7 16", dots: true },
] as const;

function Figure({ variant, delay }: { variant: (typeof FIGURES)[number]; delay: number }) {
  return (
    <svg viewBox="0 0 36 40" className="parade-figure h-12 w-12 sm:h-14 sm:w-14" style={{ animationDelay: `${delay}s` }} aria-hidden="true">
      <path d={variant.d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {"box" in variant && <rect x="8" y="14" width="12" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" />}
      {"leaf" in variant && <path d="M20 16c4-6 10-6 10 0-6 0-6 6-10 6 0-4 4-6 0-6Z" fill="none" stroke="currentColor" strokeWidth="1.4" />}
      {"star" in variant && <path d="M18 12 20 17h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" fill="none" stroke="currentColor" strokeWidth="1.3" />}
      {"dots" in variant && <g fill="currentColor"><circle cx="22" cy="16" r="1.2" /><circle cx="26" cy="14" r="1.2" /><circle cx="24" cy="20" r="1.2" /></g>}
      <g className="parade-leg-a"><path d="M12 36v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></g>
      <g className="parade-leg-b"><path d="M20 36v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></g>
    </svg>
  );
}

export function PlantParade({ className }: { className?: string }) {
  const row = [...FIGURES, ...FIGURES, ...FIGURES, ...FIGURES];
  return (
    <div className={className}>
      <div className="parade">
        <div className="parade-track">
          {row.map((figure, index) => (
            <Figure key={index} variant={figure} delay={(index % 5) * -0.18} />
          ))}
        </div>
      </div>
      <div className="parade-ground" />
    </div>
  );
}

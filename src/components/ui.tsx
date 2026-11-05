import { Link } from "./locale-link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Derives a clean 1–2 letter monogram from a name, e.g. "Monstera Deliciosa" -> "MD". */
export function initials(name: string) {
  const words = name
    .replace(/[()]/g, "")
    .split(" ")
    .filter((w) => !["dr.", "dr", "de", "the", "&", "-"].includes(w.toLowerCase()));
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || name.slice(0, 2).toUpperCase();
}

type ButtonProps = {
  variant?: "primary" | "outline" | "ghost" | "accent" | "light" | "outline-dark";
  size?: "md" | "lg";
  shape?: "pill" | "rect";
  children: ReactNode;
  className?: string;
} & Partial<ComponentProps<typeof Link>>;

const base = "inline-flex items-center justify-center gap-2 font-semibold transition select-none whitespace-nowrap";

const variants = {
  primary: "bg-foreground text-white hover:bg-black/80",
  accent: "bg-accent text-white hover:bg-accent-strong",
  outline: "border border-neutral-300 bg-white text-foreground hover:border-foreground",
  ghost: "text-foreground hover:bg-neutral-100",
  light: "bg-white text-foreground hover:bg-neutral-200",
  "outline-dark": "border border-white/30 text-white hover:bg-white/10",
};

const sizes = {
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-sm",
};

const rectSizes = {
  md: "px-5 py-2.5 text-xs",
  lg: "px-7 py-3 text-xs",
};

/** Builds the same visual classes as `Button`, for use on real `<button>`
 * elements (e.g. form submits) where an anchor tag would be invalid. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  shape = "pill",
  className,
}: Pick<ButtonProps, "variant" | "size" | "shape" | "className">) {
  return cn(
    base,
    variants[variant],
    shape === "rect"
      ? cn(rectSizes[size], "rounded-md uppercase tracking-wider font-bold")
      : cn(sizes[size], "rounded-full"),
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  shape = "pill",
  className,
  children,
  href = "#",
  ...rest
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={buttonClasses({ variant, size, shape, className })}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "dark";
  className?: string;
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700",
    green: "bg-accent-soft text-accent-strong",
    dark: "bg-foreground text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-brand text-accent">
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  center,
  badge,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  center?: boolean;
  /** Optional lime “NEW” style chip next to the description (section UI only). */
  badge?: string;
}) {
  return (
    <div
      className={cn(
        "font-barlow mb-8 flex flex-col gap-4",
        center
          ? "items-center text-center"
          : "sm:flex-row sm:items-end sm:justify-between",
      )}
    >
      <div className={cn("max-w-2xl", center && "mx-auto")}>
        {eyebrow && (
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-[#111] sm:text-3xl">
          {title}
        </h2>
        {(description || badge) && (
          <p className="mt-3 text-base leading-relaxed text-neutral-600">
            {badge && <span className="badge-neu mr-2 align-middle">{badge}</span>}
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function NeuBadge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("badge-neu", className)}>{children}</span>;
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <span className="text-accent">★</span>
      <span className="font-semibold">{rating.toFixed(1)}</span>
    </span>
  );
}

export function Price({ value, dzd, className }: { value: number; dzd?: number; className?: string }) {
  // Prioritize DZD as the main currency
  const primaryDzd = dzd !== undefined ? dzd : Math.round(value * 135); // Convert USD to DZD if not provided
  const secondaryUsd = dzd !== undefined ? value : undefined;
  
  return (
      <span className={cn("font-semibold", className)}>
        {new Intl.NumberFormat("fr-DZ").format(primaryDzd)} DA
        {typeof secondaryUsd === "number" && <small className="ml-2 whitespace-nowrap text-[0.62em] font-semibold text-neutral-500">${secondaryUsd.toFixed(2).replace(/\.00$/, "")}</small>}
      </span>
  );
}

export function Monogram({
  text,
  tint,
  className,
}: {
  text: string;
  tint: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center bg-gradient-to-br font-semibold text-foreground/70",
        tint,
        className,
      )}
    >
      {text}
    </div>
  );
}

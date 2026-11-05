// Minimal, dependency-free line icons used across Tannelli.
// Deliberately plain (no emoji) to keep the UI clean and brand-neutral.

type IconProps = {
  className?: string;
};

const base = "h-[1em] w-[1em]";

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.2s-7.2-4.4-9.6-9.1C.9 7.9 2.4 4.7 5.6 4.1c2-.4 3.9.5 5 2.1a5.1 5.1 0 0 1 1.4-1.7c1.2-1 3-1.3 4.6-.9 3.2.7 4.6 3.9 3.1 6.9-2.3 4.8-9.7 9.7-9.7 9.7Z"
      />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 12.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20.5L6 8Z" />
      <path strokeLinecap="round" d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M4.5 20c1.4-3.5 4.4-5.5 7.5-5.5s6.1 2 7.5 5.5" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`${base} ${className ?? ""}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5h16v11H9l-4 3.5v-3.5H4v-11Z" />
    </svg>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5c2-1 5-1 7 0v14c-2-1-5-1-7 0V5ZM20 5c-2-1-5-1-7 0v14c2-1 5-1 7 0V5Z" />
    </svg>
  );
}

export function PackageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8 12 4l8.5 4-8.5 4-8.5-4Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 8v8l8.5 4 8.5-4V8M12 12v8" />
    </svg>
  );
}

export function LeafMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`${base} ${className ?? ""}`}>
      <path d="M5 19c9 0 14-5 14-14-9 0-14 5-14 14Z" strokeLinejoin="round" />
      <path strokeLinecap="round" d="M5 19c0-5 2.5-8.5 6-11" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className ?? ""}`}>
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H16.7V3.7C16.3 3.65 15.2 3.5 13.9 3.5c-2.7 0-4.5 1.6-4.5 4.6v2.8H6.7V14h2.7v7h4.1Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className ?? ""}`}>
      <path d="M4.98 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3.5 9h3v11.5h-3V9Zm6.2 0h2.9v1.6h.04c.4-.76 1.4-1.6 2.9-1.6 3.1 0 3.66 2 3.66 4.6v6.9h-3v-6.1c0-1.46-.03-3.3-2-3.3-2 0-2.3 1.6-2.3 3.2v6.2h-3V9Z" />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className ?? ""}`}>
      <path d="M15.5 3h2.6c.2 1.9 1.4 3.4 3.4 3.7v2.7c-1.3 0-2.5-.4-3.4-1.1v6.5a5.7 5.7 0 1 1-5.7-5.7c.2 0 .5 0 .7.04v2.8a3 3 0 1 0 2.4 2.9V3Z" />
    </svg>
  );
}

export function RssIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <circle cx="5.5" cy="18.5" r="1.6" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M4 11c5 0 9 4 9 9M4 4.5c9 0 15.5 6.5 15.5 15.5" />
    </svg>
  );
}

export function TruckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h12l2 6h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9v6h10" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

export function CreditCardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path strokeLinecap="round" d="M2 10h20" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={`${base} ${className ?? ""}`}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 6v6l4 2" />
    </svg>
  );
}

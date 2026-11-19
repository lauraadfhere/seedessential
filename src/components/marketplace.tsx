"use client";

import { useRef, useState, type ChangeEvent, type ComponentType, type ReactNode } from "react";
import { Link } from "./locale-link";
import { cn, initials } from "./ui";
import { cloudinaryImage } from "@/lib/cloudinary-client";
import { uploadToCloudinary, type UploadFolder } from "@/lib/api-client";
import {
  STATUS_META,
  STATUS_STEPS,
  URGENCY_LEVELS,
  categoryLabel,
  type RequestRecord,
  type RequestStatus,
} from "@/lib/marketplace-types";

/** Accepts either a Cloudinary public ID or an absolute URL (older profiles store URLs). */
export function mediaUrl(source: string, size = 320) {
  if (/^https?:\/\//.test(source)) return source;
  return cloudinaryImage(source, { width: size, height: size });
}

export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#eaf0e8] font-semibold text-[#40533d]", className ?? "h-10 w-10 text-sm")}>
      {src ? <img src={mediaUrl(src, 160)} alt="" className="h-full w-full object-cover" /> : initials(name || "T")}
    </span>
  );
}

export function StatusPill({ status, className }: { status: RequestStatus; className?: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.submitted;
  return <span className={cn("tmpl-chip inline-flex items-center gap-1.5 !rounded-none ring-1 ring-inset", meta.tone, className)}><span className="h-1.5 w-1.5 bg-current" />{meta.label}</span>;
}

export function UrgencyTag({ urgency }: { urgency: string }) {
  if (urgency === "normal") return null;
  const label = URGENCY_LEVELS.find((item) => item.value === urgency)?.label ?? urgency;
  return <span className={cn("tmpl-chip !rounded-none", urgency === "urgent" ? "tmpl-chip-alert !bg-red-600 !text-white !border-red-600" : "bg-amber-100 text-amber-900")}>{label}</span>;
}

export function StatusTimeline({ status }: { status: RequestStatus }) {
  const step = STATUS_META[status]?.step ?? 0;
  if (step < 0) {
    return (
      <p className="text-xs font-semibold text-[#607060]">
        {status === "rejected" ? "This request was not published. See the moderation note for next steps." : "This request was cancelled and is no longer visible to experts."}
      </p>
    );
  }
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Request progress">
      {STATUS_STEPS.map((label, index) => (
        <li key={label} className="min-w-0">
          <span className={cn("block h-1.5 rounded-full", index <= step ? "bg-[#40533d]" : "bg-[#dce5dc]")} />
          <span className={cn("mt-1.5 block truncate text-[11px] font-semibold uppercase tracking-wide", index <= step ? "text-[#263b2d]" : "text-[#9aa79a]")}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

export function PhotoGallery({ photos, className }: { photos: string[]; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!photos.length) return null;
  return (
    <>
      <div className={cn("grid grid-cols-3 gap-2 sm:grid-cols-4", className)}>
        {photos.map((photo) => (
          <button key={photo} type="button" onClick={() => setOpen(photo)} className="group relative aspect-square overflow-hidden rounded-xl bg-[#eef3ed]">
            <img src={mediaUrl(photo, 400)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          </button>
        ))}
      </div>
      {open && (
        <div role="dialog" aria-modal="true" onClick={() => setOpen(null)} className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
          <img src={/^https?:/.test(open) ? open : cloudinaryImage(open, { width: 1400, crop: "fit" })} alt="" className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl" />
          <button type="button" className="absolute right-5 top-5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white">Close</button>
        </div>
      )}
    </>
  );
}

/** Multi-image picker that uploads straight to Cloudinary and returns public IDs. */
export function PhotoPicker({
  value,
  onChange,
  max = 6,
  folder = "consultationRequests",
  label = "Photos",
  hint,
  compact,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  folder?: UploadFolder;
  label?: string;
  hint?: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, max - value.length));
    event.target.value = "";
    if (!files.length) return;
    setError("");
    setBusy(files.length);
    const added: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) { setError(`${file.name} is not an image.`); continue; }
      if (file.size > 8 * 1024 * 1024) { setError(`${file.name} is larger than 8 MB.`); continue; }
      try {
        added.push((await uploadToCloudinary(file, folder)).publicId);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Upload failed");
      } finally {
        setBusy((count) => count - 1);
      }
    }
    if (added.length) onChange([...value, ...added]);
  }

  return (
    <div>
      {!compact && (
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-neutral-800">{label}</p>
          <span className="text-xs text-[#789078]">{value.length}/{max}</span>
        </div>
      )}
      {hint && !compact && <p className="mt-1 text-xs leading-5 text-[#789078]">{hint}</p>}
      <div className={cn("flex flex-wrap gap-2", !compact && "mt-3")}>
        {value.map((photo) => (
          <div key={photo} className={cn("group relative overflow-hidden border border-rule bg-panel", compact ? "h-14 w-14" : "h-24 w-24")}>
            <img src={mediaUrl(photo, 200)} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((item) => item !== photo))} aria-label="Remove photo" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/65 text-xs font-bold text-white opacity-90 hover:bg-red-600">×</button>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, index) => (
          <div key={`busy-${index}`} className={cn("grid animate-pulse place-items-center border border-rule bg-panel text-[11px] font-bold text-[#607060]", compact ? "h-14 w-14" : "h-24 w-24")}>Uploading</div>
        ))}
        {value.length + busy < max && (
          <button type="button" onClick={() => input.current?.click()} className={cn("grid place-items-center border-2 border-dashed border-rule text-[#40533d] transition hover:border-[#40533d] hover:bg-[#f3f7f1]", compact ? "h-14 w-14 text-xl" : "h-24 w-24 text-xs font-bold")}>
            {compact ? "+" : <span className="text-center"><span className="block text-2xl leading-none">+</span>Add photo</span>}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="sr-only" onChange={pick} />
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function timeAgo(value?: string) {
  if (!value) return "";
  const seconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  const units: [number, string][] = [[31536000, "y"], [2592000, "mo"], [604800, "w"], [86400, "d"], [3600, "h"], [60, "m"]];
  for (const [size, unit] of units) if (seconds >= size) return `${Math.floor(seconds / size)}${unit} ago`;
  return "just now";
}

/** Marketplace-style listing card used by growers, experts and admins. */
export function RequestCard({ request, footer }: { request: RequestRecord; footer?: ReactNode }) {
  return (
    <article className="network-card network-card-hover group flex flex-col overflow-hidden">
      <div className="tmpl-list-head !py-2.5 text-[12px] font-semibold uppercase tracking-wide text-[#5a6b58]">
        {categoryLabel(request.category)} · {request.mode === "onsite" ? "On site" : "Online"}
      </div>
      <Link href={`/requests/${request.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/7] border-b border-rule bg-panel">
          {request.photos[0] ? (
            <img src={mediaUrl(request.photos[0], 640)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-xs font-bold uppercase tracking-[0.2em] text-[#7d917a]">{categoryLabel(request.category)}</span>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5"><StatusPill status={request.status} className="!bg-white" /><UrgencyTag urgency={request.urgency} /></div>
          {request.photos.length > 1 && <span className="tmpl-chip absolute bottom-3 right-3 !border-0 !bg-black/65 !text-white">+{request.photos.length - 1} photos</span>}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 font-semibold leading-snug text-[#18231b] group-hover:underline">{request.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#607060]">{request.objective}</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-rule pt-3 text-xs text-[#789078]">
            <span>{request.wilaya || "Algeria"}</span>
            {request.budget > 0 && <span>Budget {new Intl.NumberFormat("fr-DZ").format(request.budget)} DA</span>}
            <span>{timeAgo(request.createdAt)}</span>
            {request.messagesCount > 0 && <span>{request.messagesCount} messages</span>}
          </div>
        </div>
      </Link>
      {footer && <div className="border-t border-rule bg-panel-head px-4 py-3">{footer}</div>}
    </article>
  );
}

export function StatCard({ label, value, hint, href, icon: Icon, accent }: { label: string; value: ReactNode; hint?: string; href?: string; icon?: ComponentType<{ className?: string }>; accent?: boolean }) {
  const body = (
    <div className={cn("tmpl-panel h-full transition", accent ? "!border-[#40533d] !bg-[#40533d] text-white" : "bg-white hover:border-[#b7c4b4]")}>
      <div className={cn("flex items-center justify-between border-b px-4 py-2.5", accent ? "border-white/20" : "border-rule bg-panel-head")}>
        <p className={cn("text-xs font-bold uppercase tracking-[0.14em]", accent ? "text-white/70" : "text-[#7d8a7b]")}>{label}</p>
        {Icon && <Icon className={cn("h-5 w-5", accent ? "text-white/80" : "text-[#638260]")} />}
      </div>
      <div className="px-4 py-4">
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {hint && <p className={cn("mt-1 text-sm", accent ? "text-white/75" : "text-[#607060]")}>{hint}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="border border-rule bg-panel px-5 py-10 text-center">
      <p className="font-semibold text-[#18231b]">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#607060]">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" role="radio" aria-checked={value === star} onClick={() => onChange(star)} className={cn("text-3xl leading-none transition", star <= value ? "text-amber-500" : "text-neutral-300 hover:text-amber-300")}>★</button>
      ))}
    </div>
  );
}

export function Notice({ tone = "success", children }: { tone?: "success" | "error" | "info"; children: ReactNode }) {
  const tones = {
    success: "border-s-4 border-s-ok border border-rule bg-panel text-[#243322]",
    error: "border-s-4 border-s-alert border border-rule bg-[#fdf2f2] text-alert",
    info: "border-s-4 border-s-link border border-rule bg-panel text-[#243322]",
  };
  return <p role={tone === "error" ? "alert" : "status"} className={cn("px-4 py-3 text-sm", tones[tone])}>{children}</p>;
}

/** Filter-bar tabs with counters (UMPT chip bar, not pills). */
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="tmpl-filter-bar overflow-x-auto" role="tablist">
      {items.map((item) => (
        <button key={item.value} role="tab" aria-selected={value === item.value} type="button" onClick={() => onChange(item.value)} className={cn("flex shrink-0 items-center gap-2 border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition", value === item.value ? "border-rule bg-panel font-semibold text-link" : "border-transparent text-[#40533d] hover:bg-panel")}>
          {item.label}
          {item.count !== undefined && <span className={cn("px-1.5 py-0.5 text-[11px]", value === item.value ? "bg-white text-link" : "bg-panel text-[#607060]")}>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}

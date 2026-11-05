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
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset", meta.tone, className)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{meta.label}</span>;
}

export function UrgencyTag({ urgency }: { urgency: string }) {
  if (urgency === "normal") return null;
  const label = URGENCY_LEVELS.find((item) => item.value === urgency)?.label ?? urgency;
  return <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", urgency === "urgent" ? "bg-red-600 text-white" : "bg-amber-100 text-amber-900")}>{label}</span>;
}

export function StatusTimeline({ status }: { status: RequestStatus }) {
  const step = STATUS_META[status]?.step ?? 0;
  if (step < 0) return null;
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Request progress">
      {STATUS_STEPS.map((label, index) => (
        <li key={label} className="min-w-0">
          <span className={cn("block h-1.5 rounded-full", index <= step ? "bg-[#40533d]" : "bg-[#dce5dc]")} />
          <span className={cn("mt-1.5 block truncate text-[10px] font-semibold uppercase tracking-wide", index <= step ? "text-[#263b2d]" : "text-[#9aa79a]")}>{label}</span>
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
          <div key={photo} className={cn("group relative overflow-hidden rounded-xl border border-[#dce5dc] bg-[#eef3ed]", compact ? "h-14 w-14" : "h-24 w-24")}>
            <img src={mediaUrl(photo, 200)} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((item) => item !== photo))} aria-label="Remove photo" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/65 text-xs font-bold text-white opacity-90 hover:bg-red-600">×</button>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, index) => (
          <div key={`busy-${index}`} className={cn("grid animate-pulse place-items-center rounded-xl bg-[#e3ebe1] text-[10px] font-bold text-[#607060]", compact ? "h-14 w-14" : "h-24 w-24")}>Uploading</div>
        ))}
        {value.length + busy < max && (
          <button type="button" onClick={() => input.current?.click()} className={cn("grid place-items-center rounded-xl border-2 border-dashed border-[#b8c6b6] text-[#40533d] transition hover:border-[#40533d] hover:bg-[#f3f7f1]", compact ? "h-14 w-14 text-xl" : "h-24 w-24 text-xs font-bold")}>
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
    <article className="network-card network-card-hover group flex flex-col overflow-hidden rounded-[1.5rem]">
      <Link href={`/requests/${request.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/7] bg-gradient-to-br from-[#eaf0e8] to-[#d9e5d6]">
          {request.photos[0] ? (
            <img src={mediaUrl(request.photos[0], 640)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-xs font-bold uppercase tracking-[0.2em] text-[#7d917a]">{categoryLabel(request.category)}</span>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5"><StatusPill status={request.status} className="bg-white/95" /><UrgencyTag urgency={request.urgency} /></div>
          {request.photos.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">+{request.photos.length - 1} photos</span>}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#638260]">{categoryLabel(request.category)} · {request.mode === "onsite" ? "On site" : "Online"}</p>
          <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-[#18231b] group-hover:underline">{request.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#607060]">{request.objective}</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-xs text-[#789078]">
            <span>📍 {request.wilaya || "Algeria"}</span>
            {request.budget > 0 && <span>Budget {new Intl.NumberFormat("fr-DZ").format(request.budget)} DA</span>}
            <span>{timeAgo(request.createdAt)}</span>
            {request.messagesCount > 0 && <span>💬 {request.messagesCount}</span>}
          </div>
        </div>
      </Link>
      {footer && <div className="border-t border-[#e6ede5] px-5 py-3">{footer}</div>}
    </article>
  );
}

export function StatCard({ label, value, hint, href, icon: Icon, accent }: { label: string; value: ReactNode; hint?: string; href?: string; icon?: ComponentType<{ className?: string }>; accent?: boolean }) {
  const body = (
    <div className={cn("h-full rounded-2xl border p-5 transition", accent ? "border-[#40533d] bg-[#40533d] text-white" : "border-[#e3e9e1] bg-white hover:border-[#c9d6c6] hover:shadow-[0_10px_30px_rgb(24_35_27_/_0.08)]")}>
      <div className="flex items-center justify-between">
        <p className={cn("text-xs font-bold uppercase tracking-[0.14em]", accent ? "text-white/70" : "text-[#7d8a7b]")}>{label}</p>
        {Icon && <Icon className={cn("h-5 w-5", accent ? "text-white/80" : "text-[#638260]")} />}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className={cn("mt-1 text-sm", accent ? "text-white/75" : "text-[#607060]")}>{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[#c9d6c6] bg-white/70 px-6 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eaf0e8] text-xl text-[#40533d]">✦</span>
      <p className="mt-4 font-semibold text-[#18231b]">{title}</p>
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
  const tones = { success: "border-emerald-200 bg-emerald-50 text-emerald-800", error: "border-red-200 bg-red-50 text-red-700", info: "border-sky-200 bg-sky-50 text-sky-800" };
  return <p role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone])}>{children}</p>;
}

/** Pill tabs with counters, used across workspaces. */
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full border border-[#dce5dc] bg-white p-1" role="tablist">
      {items.map((item) => (
        <button key={item.value} role="tab" aria-selected={value === item.value} type="button" onClick={() => onChange(item.value)} className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition", value === item.value ? "bg-[#40533d] text-white" : "text-[#40533d] hover:bg-[#eaf0e8]")}>
          {item.label}
          {item.count !== undefined && <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", value === item.value ? "bg-white/20" : "bg-[#eaf0e8]")}>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}

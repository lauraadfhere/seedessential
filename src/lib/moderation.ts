/**
 * Lightweight, deterministic content moderation shared by the request form
 * (instant feedback) and the API (authoritative check).
 *
 * - Contact details are masked so deals stay inside Tannelli, where both
 *   sides are protected by reviews and moderation.
 * - Abusive or spam content is flagged and held for an administrator.
 */

export type ModerationResult = {
  text: string;
  flags: string[];
  /** True when the content must wait for an administrator before going public. */
  hold: boolean;
};

const PHONE = /(?:\+?213|0)[\s.-]?[5-7](?:[\s.-]?\d){8}|\b\d(?:[\s.-]?\d){8,12}\b/g;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL = /\b(?:https?:\/\/|www\.)\S+/gi;
const SOCIAL = /\b(?:whats\s?app|viber|telegram|instagram|facebook|messenger|wa\.me)\b/gi;

// Kept short and explicit; extend from the admin moderation queue findings.
const BLOCKED_TERMS = [
  "casino", "betting", "loan offer", "crypto investment", "viagra", "escort",
  "arnaque", "escroquerie", "نصب", "احتيال", "قمار",
  "idiot", "stupid", "imbecile", "connard", "salope", "حمار", "كلب",
];

export function moderateText(input: string): ModerationResult {
  const flags = new Set<string>();
  let text = input.replace(/\u0000/g, "").trim();

  if (EMAIL.test(text)) { flags.add("contact_email"); text = text.replace(EMAIL, "[contact hidden]"); }
  if (URL.test(text)) { flags.add("external_link"); text = text.replace(URL, "[link hidden]"); }
  if (PHONE.test(text)) { flags.add("contact_phone"); text = text.replace(PHONE, "[contact hidden]"); }
  if (SOCIAL.test(text)) flags.add("off_platform");
  EMAIL.lastIndex = URL.lastIndex = PHONE.lastIndex = SOCIAL.lastIndex = 0;

  const lower = text.toLowerCase();
  if (BLOCKED_TERMS.some((term) => lower.includes(term))) flags.add("blocked_term");
  if (/(.)\1{9,}/.test(text)) flags.add("spam_pattern");
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length > 40 && letters === letters.toUpperCase()) flags.add("shouting");

  const hold = flags.has("blocked_term") || flags.has("spam_pattern");
  return { text, flags: [...flags], hold };
}

export const MODERATION_FLAG_LABELS: Record<string, string> = {
  contact_email: "Email address removed",
  contact_phone: "Phone number removed",
  external_link: "External link removed",
  off_platform: "Mentions off-platform messaging",
  blocked_term: "Blocked or abusive term",
  spam_pattern: "Spam-like pattern",
  shouting: "All capitals",
  manual_report: "Reported by a user",
};

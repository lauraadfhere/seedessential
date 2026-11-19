/** Default profile image when a user has not uploaded an avatar yet. */
export const DEFAULT_AVATAR_URL =
  "https://www.gravatar.com/avatar/78c62ce901dcd8f94b9765c1ed1fda25?s=192&d=identicon&r=PG";

/** Returns a usable avatar URL (uploaded asset or the shared default). */
export function resolveAvatarUrl(source?: string | null, size = 192) {
  const value = typeof source === "string" ? source.trim() : "";
  if (!value) {
    return DEFAULT_AVATAR_URL.replace("s=192", `s=${Math.max(64, Math.min(512, size))}`);
  }
  return value;
}

export function hasCustomAvatar(source?: string | null) {
  const value = typeof source === "string" ? source.trim() : "";
  return Boolean(value) && !value.includes("gravatar.com/avatar/78c62ce901dcd8f94b9765c1ed1fda25");
}

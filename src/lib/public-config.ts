/**
 * Public (browser-safe) configuration.
 *
 * Everything here is already shipped to every visitor, so none of it is a
 * secret: the Parse application id / JavaScript key are protected by the
 * class-level permissions and ACLs on the Parse side, and the Cloudinary cloud
 * name only identifies the delivery account. The Parse master key and the
 * Cloudinary API secret must never be added to this file.
 *
 * Resolution order:
 *   1. the environment, when the value was inlined at build time or is
 *      available on the server at runtime;
 *   2. the known production identifiers below.
 *
 * The fallback exists because `NEXT_PUBLIC_*` values are frozen into the
 * browser bundle when the app is built, and Cloudflare Workers Builds does not
 * expose dashboard *runtime* variables to the build step. Without a fallback a
 * build that runs without those variables produces a client bundle where they
 * are `undefined`, which is what made the deployed site throw "Missing Parse
 * configuration" during hydration.
 */
const FALLBACKS = {
  NEXT_PUBLIC_PARSE_APP_ID: "rrbodmxViK4CBzFVzG5mK7AkFNRcRoMiJAcs9RGQ",
  NEXT_PUBLIC_PARSE_JS_KEY: "R8lmfcjTXOxRYlLHO2YpaCLtHqPNcs33gNQjNpCD",
  NEXT_PUBLIC_PARSE_SERVER_URL: "https://parseapi.back4app.com/",
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "n08p7st8",
  NEXT_PUBLIC_ENABLE_WATERMARK: "false",
} as const;

export type PublicEnvKey = keyof typeof FALLBACKS;

/** Reads a public config value, preferring the environment over the fallback. */
export function publicEnv(key: PublicEnvKey): string {
  const fromEnv =
    typeof process !== "undefined" && process.env ? process.env[key] : undefined;

  return fromEnv && fromEnv.length > 0 ? fromEnv : FALLBACKS[key];
}

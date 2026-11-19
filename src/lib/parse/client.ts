/**
 * Client-safe Parse initialization.
 *
 * Uses the Application ID + JavaScript Key only — these are designed by
 * Parse to be exposed in the browser and are protected by each class's
 * Class-Level Permissions (CLPs) and object ACLs on the server side. Never
 * put the Master Key in this file.
 *
 * Safe to import from both Client Components and Server Components/Actions
 * for regular (non-privileged) reads and writes.
 *
 * Import the package entry (`parse` → lib/browser) rather than
 * `parse/dist/parse.min.js`. Turbopack cannot resolve the min bundle's
 * internal `./cipher-core` requires from crypto-js.
 */
import Parse from "parse";
import { publicEnv } from "@/lib/public-config";

let initialized = false;

export function getParse(): typeof Parse {
  if (!initialized) {
    const appId = publicEnv("NEXT_PUBLIC_PARSE_APP_ID");
    const jsKey = publicEnv("NEXT_PUBLIC_PARSE_JS_KEY");
    const serverURL = publicEnv("NEXT_PUBLIC_PARSE_SERVER_URL");

    if (!appId || !jsKey || !serverURL) {
      throw new Error(
        "Missing Parse configuration. Set NEXT_PUBLIC_PARSE_APP_ID, " +
          "NEXT_PUBLIC_PARSE_JS_KEY and NEXT_PUBLIC_PARSE_SERVER_URL.",
      );
    }

    // The app does not use LiveQuery. Keep a harmless stub so initialize()
    // never depends on the LiveQuery constructor shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ParseAny = Parse as any;
    if (!ParseAny.LiveQuery) ParseAny.LiveQuery = {};

    Parse.initialize(appId, jsKey);
    Parse.serverURL = serverURL;
    initialized = true;
  }

  return Parse;
}

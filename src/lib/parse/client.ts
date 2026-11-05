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
 */
import Parse from "parse";

let initialized = false;

export function getParse(): typeof Parse {
  if (!initialized) {
    const appId = process.env.NEXT_PUBLIC_PARSE_APP_ID;
    const jsKey = process.env.NEXT_PUBLIC_PARSE_JS_KEY;
    const serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

    if (!appId || !jsKey || !serverURL) {
      throw new Error(
        "Missing Parse configuration. Set NEXT_PUBLIC_PARSE_APP_ID, " +
          "NEXT_PUBLIC_PARSE_JS_KEY and NEXT_PUBLIC_PARSE_SERVER_URL in .env.local.",
      );
    }

    Parse.initialize(appId, jsKey);
    Parse.serverURL = serverURL;
    initialized = true;
  }

  return Parse;
}

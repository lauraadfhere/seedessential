/**
 * Server-only Parse client using the Master Key.
 *
 * The `server-only` import below makes the build fail loudly if this module
 * is ever imported from client code, since the Master Key must never reach
 * the browser. Use this only in Server Actions, Route Handlers, or scripts —
 * for anything that needs to bypass ACLs/CLPs (admin dashboards, schema
 * management, trusted server-side writes).
 */
import "server-only";
import Parse from "parse/node";

let initialized = false;

export function getParseAdmin(): typeof Parse {
  if (!initialized) {
    const appId = process.env.NEXT_PUBLIC_PARSE_APP_ID;
    const jsKey = process.env.NEXT_PUBLIC_PARSE_JS_KEY;
    const masterKey = process.env.PARSE_MASTER_KEY;
    const serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

    if (!appId || !masterKey || !serverURL) {
      throw new Error(
        "Missing Parse admin configuration. Set NEXT_PUBLIC_PARSE_APP_ID, " +
          "PARSE_MASTER_KEY and NEXT_PUBLIC_PARSE_SERVER_URL in .env.local.",
      );
    }

    Parse.initialize(appId, jsKey, masterKey);
    Parse.serverURL = serverURL;
    initialized = true;
  }

  return Parse;
}

/** Convenience wrapper: run a query/mutation with Master Key privileges. */
export function withMasterKey<T>(fn: (parse: typeof Parse) => Promise<T>) {
  return fn(getParseAdmin());
}

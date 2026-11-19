import "server-only";
import { Client, TablesDB, Users, Account } from "node-appwrite";
import { appwriteEndpoint, appwriteProjectId } from "./config";

/** Privileged server client (API key). */
export function createAdminClient() {
  const key = process.env.APPWRITE_API_KEY;
  if (!key) throw new Error("Missing APPWRITE_API_KEY. Set it in .env.local / Worker secrets.");

  const client = new Client()
    .setEndpoint(appwriteEndpoint())
    .setProject(appwriteProjectId())
    .setKey(key);

  return {
    client,
    get tables() {
      return new TablesDB(client);
    },
    /** @deprecated use `tables` — Appwrite Cloud 1.8+ TablesDB */
    get databases() {
      return new TablesDB(client);
    },
    get users() {
      return new Users(client);
    },
    get account() {
      return new Account(client);
    },
  };
}

/** Session-scoped server client (acts as the signed-in user). */
export function createSessionClient(sessionSecret: string) {
  const client = new Client()
    .setEndpoint(appwriteEndpoint())
    .setProject(appwriteProjectId())
    .setSession(sessionSecret);

  return {
    client,
    get account() {
      return new Account(client);
    },
    get tables() {
      return new TablesDB(client);
    },
    get databases() {
      return new TablesDB(client);
    },
  };
}

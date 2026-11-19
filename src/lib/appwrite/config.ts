/** Shared Appwrite project identifiers (safe for browser when public). */
export function appwriteEndpoint() {
  return (
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
    "https://fra.cloud.appwrite.io/v1"
  ).replace(/\/$/, "");
}

export function appwriteProjectId() {
  return process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6ad515c80023f767eed7";
}

export function appwriteDatabaseId() {
  return process.env.APPWRITE_DATABASE_ID || "seed_main";
}

export const COLLECTIONS = {
  profiles: "profiles",
  expertProfiles: "expert_profiles",
  consultationRequests: "consultation_requests",
  requestMessages: "request_messages",
  businesses: "businesses",
  claims: "claims",
} as const;

export const SESSION_STORAGE_KEY = "tannelli_appwrite_session";

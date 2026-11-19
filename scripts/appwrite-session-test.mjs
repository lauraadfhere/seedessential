import { Client, Users, Account, Query } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const key = process.env.APPWRITE_API_KEY;

const admin = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
const users = new Users(admin);

const list = await users.list({ queries: [Query.equal("email", "expert@seed.demo")] });
const user = list.users[0];
console.log("user", user.$id);

try {
  const session = await users.createSession({ userId: user.$id });
  console.log("users.createSession secretLen", (session.secret || "").length, "keys", Object.keys(session));
  if (session.secret) {
    const sessionClient = new Client().setEndpoint(endpoint).setProject(project).setSession(session.secret);
    const me = await new Account(sessionClient).get();
    console.log("account.get via secret", me.email, me.name);
  }
} catch (e) {
  console.log("users.createSession fail", e.type, e.message);
}

// Also try REST create session with email
const res = await fetch(`${endpoint}/account/sessions/email`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Appwrite-Project": project,
  },
  body: JSON.stringify({ email: "expert@seed.demo", password: "Expert#2026demo" }),
});
const body = await res.json();
console.log("REST session", res.status, "secretLen", (body.secret || "").length, "id", body.$id);

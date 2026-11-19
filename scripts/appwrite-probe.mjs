import { Client, Databases, Users } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const users = new Users(client);

try {
  const list = await db.list();
  console.log(
    "databases",
    list.total,
    list.databases.map((d) => d.$id).join(","),
  );
} catch (e) {
  console.log("db.list fail", e.type || e.code, e.message);
}

try {
  const u = await users.list();
  console.log("users", u.total);
} catch (e) {
  console.log("users.list fail", e.type || e.code, e.message);
}

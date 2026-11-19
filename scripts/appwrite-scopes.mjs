import { Client } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

// Hit a few endpoints to learn which scopes work.
const tests = [
  ["users.read", "/users"],
  ["databases.read", "/databases"],
  ["tables?", "/tablesdb"],
];

for (const [label, path] of tests) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}${path}`, {
    headers: {
      "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
      "X-Appwrite-Key": process.env.APPWRITE_API_KEY,
    },
  });
  const text = await res.text();
  console.log(label, res.status, text.slice(0, 160).replace(/\s+/g, " "));
}

// Try TablesDB create
import { TablesDB, ID } from "node-appwrite";
const tables = new TablesDB(client);
try {
  const list = await tables.list();
  console.log("tablesdb.list", list.total);
} catch (e) {
  console.log("tablesdb.list fail", e.message);
}

try {
  await tables.createTable({
    databaseId: process.env.APPWRITE_DATABASE_ID || "seed_main",
    tableId: "profiles",
    name: "Profiles",
  });
  console.log("createTable ok");
} catch (e) {
  console.log("createTable fail", e.type || e.code, e.message);
}

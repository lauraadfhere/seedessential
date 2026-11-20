import "server-only";
import { Query } from "node-appwrite";
import type { AppwriteAccount } from "./auth";
import { COLLECTIONS } from "./config";
import { createRow, getRow, listRows, updateRow, type Row } from "./db";

export type RuddgeAnalysis = {
  plant: string;
  confidence: "low" | "medium" | "high";
  symptoms: string[];
  likelyCauses: string[];
  care: string[];
  watchFor: string[];
  askExpert: boolean;
};

export function serializeThread(row: Row) {
  return {
    id: row.$id,
    title: String(row.title || "Plant question"),
    plant: row.plant ? String(row.plant) : undefined,
    updatedAt: String(row.$updatedAt || row.$createdAt || new Date().toISOString()),
  };
}

export function serializeMessage(row: Row) {
  let analysis: RuddgeAnalysis | null = null;
  if (typeof row.analysisJson === "string" && row.analysisJson) {
    try {
      analysis = JSON.parse(row.analysisJson) as RuddgeAnalysis;
    } catch {
      analysis = null;
    }
  }
  return {
    id: row.$id,
    role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
    body: String(row.body || ""),
    photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
    analysis,
    model: row.model ? String(row.model) : undefined,
    createdAt: String(row.$createdAt || new Date().toISOString()),
  };
}

export async function listThreadsFor(userId: string) {
  const listed = await listRows(COLLECTIONS.ruddgeThreads, [
    Query.equal("userId", userId),
    Query.orderDesc("$updatedAt"),
    Query.limit(30),
  ]);
  return listed.rows.map(serializeThread);
}

export async function getOwnedThread(threadId: string, userId: string) {
  try {
    const row = await getRow(COLLECTIONS.ruddgeThreads, threadId);
    if (String(row.userId) !== userId) return null;
    return row;
  } catch {
    return null;
  }
}

export async function createThread(user: AppwriteAccount, title: string, locale: string) {
  return createRow(COLLECTIONS.ruddgeThreads, {
    userId: user.id,
    title: title.slice(0, 80) || "Plant question",
    locale: locale.slice(0, 5) || "en",
    plant: "",
  });
}

export async function listMessagesFor(threadId: string) {
  const listed = await listRows(COLLECTIONS.ruddgeMessages, [
    Query.equal("threadId", threadId),
    Query.orderAsc("$createdAt"),
    Query.limit(80),
  ]);
  return listed.rows;
}

export async function countUserMessagesToday(userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  try {
    const listed = await listRows(COLLECTIONS.ruddgeMessages, [
      Query.equal("authorId", userId),
      Query.equal("role", "user"),
      Query.greaterThanEqual("$createdAt", since),
      Query.limit(100),
    ]);
    return listed.total;
  } catch {
    return 0;
  }
}

export async function saveTurn(input: {
  thread: Row;
  user: AppwriteAccount;
  body: string;
  photos: string[];
  reply: string;
  analysis: RuddgeAnalysis | null;
  model: string;
}) {
  const userMessage = await createRow(COLLECTIONS.ruddgeMessages, {
    threadId: input.thread.$id,
    authorId: input.user.id,
    role: "user",
    body: input.body || "Photo diagnosis",
    photos: input.photos,
    analysisJson: "",
    model: "",
  });
  const assistantMessage = await createRow(COLLECTIONS.ruddgeMessages, {
    threadId: input.thread.$id,
    authorId: "",
    role: "assistant",
    body: input.reply,
    photos: [],
    analysisJson: input.analysis ? JSON.stringify(input.analysis) : "",
    model: input.model,
  });

  const patch: Record<string, unknown> = {};
  if (input.analysis?.plant && input.analysis.plant !== "Unknown") patch.plant = input.analysis.plant;
  if (!input.thread.title || input.thread.title === "Plant question") {
    patch.title = (input.analysis?.plant && input.analysis.plant !== "Unknown" ? input.analysis.plant : input.body).slice(0, 80);
  }
  const thread = Object.keys(patch).length
    ? await updateRow(COLLECTIONS.ruddgeThreads, input.thread.$id, patch)
    : input.thread;

  return { thread, userMessage, assistantMessage };
}

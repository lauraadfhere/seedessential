import "server-only";
import { ID, type Models } from "node-appwrite";
import { createAdminClient } from "./admin";
import { appwriteDatabaseId } from "./config";

export type Row = Models.DefaultRow & Record<string, unknown>;

function tables() {
  return createAdminClient().tables;
}

function dbId() {
  return appwriteDatabaseId();
}

export async function listRows(tableId: string, queries: string[] = []) {
  const result = await tables().listRows({ databaseId: dbId(), tableId, queries });
  return {
    total: result.total,
    rows: result.rows as Row[],
  };
}

export async function createRow(tableId: string, data: Record<string, unknown>, permissions?: string[]) {
  return (await tables().createRow({
    databaseId: dbId(),
    tableId,
    rowId: ID.unique(),
    data,
    permissions,
  })) as Row;
}

export async function updateRow(tableId: string, rowId: string, data: Record<string, unknown>) {
  return (await tables().updateRow({
    databaseId: dbId(),
    tableId,
    rowId,
    data,
  })) as Row;
}

export async function getRow(tableId: string, rowId: string) {
  return (await tables().getRow({ databaseId: dbId(), tableId, rowId })) as Row;
}

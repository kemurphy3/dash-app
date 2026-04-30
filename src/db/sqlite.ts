import * as SQLite from "expo-sqlite";

export type RunResult = { lastInsertRowId: number; changes: number };

export const db = SQLite.openDatabaseSync("dash.db");

export async function execAsync(sql: string): Promise<void> {
  await db.execAsync(sql);
}

export async function runAsync(sql: string, params: any[] = []): Promise<RunResult> {
  const result = await db.runAsync(sql, params);
  return {
    lastInsertRowId: Number(result.lastInsertRowId ?? 0),
    changes: Number(result.changes ?? 0),
  };
}

export async function getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
  return db.getAllAsync<T>(sql, params);
}

export async function getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
  const row = await db.getFirstAsync<T>(sql, params);
  return row ?? null;
}


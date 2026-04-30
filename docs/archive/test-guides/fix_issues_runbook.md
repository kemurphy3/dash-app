# DASH MVP: Fix Issues First Runbook

Goal: Get the app to a clean boot and clean TypeScript compile, then lock in database helpers and notification basics. This file is for fixes only. Testing walkthrough is in `runtime_test_runbook.md`.

## Rules (No Vibes)
After each major section below, you must run and record:
1) `npm run typecheck`
2) If typecheck passes: `npx expo start` and confirm the app boots without a red screen.

If any step fails:
- Stop and fix immediately.
- Capture evidence (logs, screenshots).
- Do not proceed until the section gate passes.

Store evidence in: `docs/test-runs/YYYY-MM-DD/`

## Evidence to Capture for Every Failure
- Terminal output (full output for the failing command).
- Red screen stack trace screenshot (if present).
- The file path(s) you modified.
- The verification command(s) you re-ran.

---

# Phase 0: Repo Hygiene Gate
## 0.1 Confirm .gitignore is protecting you
Verify `.gitignore` exists at repo root and includes at minimum:
- `node_modules/`
- `.expo/`
- `.expo-shared/`
- `dist/`, `build/`
- `android/build/`, `android/app/build/`, `.gradle/`, `.cxx/`
- `ios/build/`
- `.cache/`

Run:
- `git status`

If `node_modules/` or build artifacts show up, stop and fix `.gitignore` first.

Gate:
- `git status` does not list `node_modules/` or build artifacts.

---

# Phase 1: TypeScript and Expo Boot Gate
## 1.1 Install dependencies
Run:
- `npm install`

If this fails, capture logs and resolve before continuing.

## 1.2 Typecheck baseline
Run:
- `npm run typecheck`

If you do not have a typecheck script, add it to package.json:
- `"typecheck": "tsc -p tsconfig.json --noEmit"`

Gate:
- Typecheck passes or the remaining errors are known and explicitly listed as the next fixes.

---

# Phase 2: Fix expo-sqlite API mismatch and DB helpers
Problem: expo-sqlite API differs by version. Older patterns like `db.transaction` and callback APIs will fail in newer versions. You need one consistent DB layer.

## 2.1 Confirm expo-sqlite version
Check package.json dependency for expo-sqlite.

Decision:
- Use `openDatabaseSync` plus async helpers (recommended for MVP consistency).
- Do not mix multiple sqlite access patterns across files.

## 2.2 Implement a single DB wrapper module
Create or update: `src/db/sqlite.ts`

Paste this implementation and adapt paths as needed:

```ts
import * as SQLite from "expo-sqlite";

export type RunResult = { lastInsertRowId: number; changes: number };

export const db = SQLite.openDatabaseSync("dash.db");

export async function execAsync(sql: string): Promise<void> {
  // Use only for controlled migrations. Avoid semicolon splitting for arbitrary SQL.
  await db.execAsync(sql);
}

export async function runAsync(sql: string, params: any[] = []): Promise<RunResult> {
  const res = await db.runAsync(sql, params);
  return { lastInsertRowId: res.lastInsertRowId ?? 0, changes: res.changes ?? 0 };
}

export async function getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
  const rows = await db.getAllAsync(sql, params);
  return rows as T[];
}

export async function getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
  const row = await db.getFirstAsync(sql, params);
  return (row as T) ?? null;
}

# DASH App Bug Fix Instructions

## Context
This is an Expo React Native TypeScript app using expo-sqlite for local storage. The codebase has 78 TypeScript errors that must be fixed before the app can run.

**Repo:** https://github.com/kemurphy3/dash-app.git
**Local path:** C:\Users\kemur\Git\dash-app

## Critical Issue: expo-sqlite API Mismatch

The code was written for **expo-sqlite SDK 51+** (newer async API), but the project has **expo-sqlite 13.2.2** (SDK 50) which uses a different API.

### What's wrong:
- `SQLite.openDatabaseAsync()` does NOT exist → use `openDatabase()` (synchronous)
- `db.runAsync()` does NOT exist
- `db.getAllAsync()` does NOT exist  
- `db.getFirstAsync()` does NOT exist
- `db.execAsync(sql)` does NOT work → signature is `execAsync(queries: Query[], readOnly: boolean)`

### Available API (from node_modules/expo-sqlite/build/SQLite.d.ts):
```typescript
class SQLiteDatabase {
  exec(queries: Query[], readOnly: boolean, callback: SQLiteCallback): void;
  execAsync(queries: Query[], readOnly: boolean): Promise;
  transactionAsync(asyncCallback: SQLTransactionAsyncCallback, readOnly?: boolean): Promise;
  transaction(callback: SQLTransactionCallback, ...): void;
  closeAsync(): Promise;
}

// Transaction async callback gives you:
interface SQLTransactionAsync {
  executeSqlAsync(sqlStatement: string, args?: SQLStatementArg[]): Promise;
}

function openDatabase(name: string, ...): SQLiteDatabase;
```

### Fix Strategy:
Create helper functions in `src/db/helpers.ts` that wrap `transactionAsync` to provide the missing methods:
```typescript
import { SQLiteDatabase } from 'expo-sqlite';

type SQLParams = (string | number | null)[];

export async function runAsync(
  db: SQLiteDatabase,
  sql: string,
  params: SQLParams = []
): Promise {
  let result = { lastInsertRowId: 0, changes: 0 };
  await db.transactionAsync(async (tx) => {
    const r = await tx.executeSqlAsync(sql, params);
    result = {
      lastInsertRowId: r.insertId ?? 0,
      changes: r.rowsAffected,
    };
  }, false);
  return result;
}

export async function getAllAsync(
  db: SQLiteDatabase,
  sql: string,
  params: SQLParams = []
): Promise {
  let rows: T[] = [];
  await db.transactionAsync(async (tx) => {
    const result = await tx.executeSqlAsync(sql, params);
    rows = result.rows._array as T[];
  }, true);
  return rows;
}

export async function getFirstAsync(
  db: SQLiteDatabase,
  sql: string,
  params: SQLParams = []
): Promise {
  const rows = await getAllAsync(db, sql, params);
  return rows[0] ?? null;
}

export async function execAsync(
  db: SQLiteDatabase,
  sql: string
): Promise {
  await db.transactionAsync(async (tx) => {
    const statements = sql.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await tx.executeSqlAsync(statement, []);
      }
    }
  }, false);
}
```

Then update all files to use these helpers instead of calling methods directly on `db`.

## Files That Need Fixing (in order):

### 1. Create: `src/db/helpers.ts`
Create the helper file above.

### 2. Fix: `src/db/index.ts`
- Change `SQLite.openDatabaseAsync(DB_NAME)` → `openDatabase(DB_NAME)` 
- Import from `expo-sqlite` not `* as SQLite`
- Remove the `execAsync` call for PRAGMA (move to migrations)
- Re-export helpers

### 3. Fix: `src/db/migrations.ts`
- Import and use `execAsync`, `getFirstAsync`, `runAsync` from `./helpers`
- Replace all `db.execAsync()`, `db.getFirstAsync()`, `db.runAsync()` calls

### 4. Fix: `src/db/queries.ts` (32 errors - largest file)
- Import helpers from `./helpers`
- Replace all `db.getAllAsync()` → `getAllAsync(db, ...)`
- Replace all `db.getFirstAsync()` → `getFirstAsync(db, ...)`
- Replace all `db.runAsync()` → `runAsync(db, ...)`
- Add explicit types to all `.map()` and `.filter()` callbacks to fix implicit `any`

### 5. Fix: `src/import/storage.ts` (14 errors)
- Import helpers from `../db/helpers`
- Replace all direct `db.*Async()` calls with helper functions

### 6. Fix: `src/utils/weekProgression.ts` (12 errors)
- Import helpers from `../db/helpers`
- Replace all direct `db.*Async()` calls with helper functions
- Add explicit types to `.filter()` and `.reduce()` callbacks

### 7. Fix: `app/(main)/settings/index.tsx` (6 errors)
- The reset function uses `db.execAsync()` and `db.runAsync()` directly
- Import and use helpers instead

## Secondary Issue: Style Prop Type Errors (5 errors)

### What's wrong:
`Card` and `Button` components have `style?: ViewStyle` but arrays are being passed.

### Files affected:
- `app/(main)/import/conflicts.tsx:67`
- `app/(main)/import/preview.tsx:132`
- `app/(main)/review/index.tsx:196`
- `app/(main)/today/task.tsx:188`

### Fix:
Change the prop type in `src/components/Card.tsx` and `src/components/Button.tsx`:
```typescript
// Change this:
style?: ViewStyle;

// To this:
style?: ViewStyle | ViewStyle[];
```

Or use `StyleProp<ViewStyle>` from react-native which handles both.

## Verification

After all fixes, run:
```bash
npm run typecheck
```

Expected output: `Found 0 errors`

Then run:
```bash
npx expo start
```

App should boot without red screens.
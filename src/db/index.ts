import * as SQLite from 'expo-sqlite';
import { db as sqliteDb, execAsync, getAllAsync, getFirstAsync, runAsync } from './sqlite';
import { runMigrations } from './migrations';

let initialized = false;

/**
 * Initialize the database connection and run migrations
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (initialized) {
    return sqliteDb;
  }
  
  console.log('[DB] Opening database...');
  
  // Enable foreign keys
  await execAsync('PRAGMA foreign_keys = ON');
  
  // Run migrations
  await runMigrations();
  
  initialized = true;
  console.log('[DB] Database initialized');
  return sqliteDb;
}

/**
 * Get the database instance (must call initDatabase first)
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!initialized) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return sqliteDb;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (initialized) {
    await sqliteDb.closeAsync();
    initialized = false;
    console.log('[DB] Database closed');
  }
}

// Re-export wrapper functions
export { db, execAsync, getAllAsync, getFirstAsync, runAsync } from './sqlite';
export type { RunResult } from './sqlite';

// Re-export everything from queries
export * from './queries';

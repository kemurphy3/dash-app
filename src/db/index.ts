import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

const DB_NAME = 'dash.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database connection and run migrations
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }
  
  console.log('[DB] Opening database...');
  db = await SQLite.openDatabaseAsync(DB_NAME);
  
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON');
  
  // Run migrations
  await runMigrations(db);
  
  console.log('[DB] Database initialized');
  return db;
}

/**
 * Get the database instance (must call initDatabase first)
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('[DB] Database closed');
  }
}

// Re-export everything from queries
export * from './queries';

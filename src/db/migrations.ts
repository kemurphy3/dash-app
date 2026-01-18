import * as SQLite from 'expo-sqlite';
import { SCHEMA_STATEMENTS } from './schema';

const DB_VERSION = 1;

/**
 * Run all database migrations
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Get current version
  const currentVersion = await getDatabaseVersion(db);
  
  console.log(`[DB] Current version: ${currentVersion}, Target version: ${DB_VERSION}`);
  
  if (currentVersion < 1) {
    await migrateToV1(db);
  }
  
  // Add future migrations here
  // if (currentVersion < 2) {
  //   await migrateToV2(db);
  // }
  
  // Update version
  await setDatabaseVersion(db, DB_VERSION);
  console.log(`[DB] Migrations complete. Now at version ${DB_VERSION}`);
}

/**
 * Get the current database version
 */
async function getDatabaseVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    return result?.user_version ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Set the database version
 */
async function setDatabaseVersion(db: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version}`);
}

/**
 * Migration to version 1 - Initial schema
 */
async function migrateToV1(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[DB] Running migration to v1...');
  
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON');
  
  // Run all schema statements
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execAsync(statement);
  }
  
  // Insert default settings
  await db.runAsync(
    `INSERT OR IGNORE INTO settings (key, value) VALUES 
      ('has_completed_onboarding', 'false'),
      ('quiet_hours_enabled', 'false'),
      ('quiet_hours_start', '22:00'),
      ('quiet_hours_end', '07:00'),
      ('streaks_enabled', 'false')
    `
  );
  
  console.log('[DB] Migration to v1 complete');
}

// Future migration example:
// async function migrateToV2(db: SQLite.SQLiteDatabase): Promise<void> {
//   console.log('[DB] Running migration to v2...');
//   await db.execAsync('ALTER TABLE domains ADD COLUMN some_new_field TEXT');
//   console.log('[DB] Migration to v2 complete');
// }

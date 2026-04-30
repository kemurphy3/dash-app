import { SCHEMA_STATEMENTS } from './schema';
import { execAsync, getFirstAsync, runAsync } from './sqlite';

const DB_VERSION = 2;

/**
 * Run all database migrations
 */
export async function runMigrations(): Promise<void> {
  // Get current version
  const currentVersion = await getDatabaseVersion();
  
  console.log(`[DB] Current version: ${currentVersion}, Target version: ${DB_VERSION}`);
  
  if (currentVersion < 1) {
    await migrateToV1();
  }
  
  if (currentVersion < 2) {
    await migrateToV2();
  }
  
  // Update version
  await setDatabaseVersion(DB_VERSION);
  console.log(`[DB] Migrations complete. Now at version ${DB_VERSION}`);
}

/**
 * Get the current database version
 */
async function getDatabaseVersion(): Promise<number> {
  try {
    const result = await getFirstAsync<{ user_version: number }>(
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
async function setDatabaseVersion(version: number): Promise<void> {
  await execAsync(`PRAGMA user_version = ${version}`);
}

/**
 * Migration to version 1 - Initial schema
 */
async function migrateToV1(): Promise<void> {
  console.log('[DB] Running migration to v1...');
  
  // Enable foreign keys
  await execAsync('PRAGMA foreign_keys = ON');
  
  // Run all schema statements
  for (const statement of SCHEMA_STATEMENTS) {
    await execAsync(statement);
  }
  
  // Insert default settings
  await runAsync(
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

/**
 * Migration to version 2 - Add deferred_to to task_logs
 */
async function migrateToV2(): Promise<void> {
  console.log('[DB] Running migration to v2...');
  
  try {
    await execAsync('ALTER TABLE task_logs ADD COLUMN deferred_to TEXT');
    console.log('[DB] Migration to v2 complete');
  } catch (e) {
    // Column may already exist, ignore error
    console.log('[DB] Column deferred_to may already exist, continuing...');
  }
}

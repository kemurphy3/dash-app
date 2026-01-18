import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { ParsedPlan, ParsedDomain, ParsedPlaybook, ParsedTask } from './types';
import { DomainType } from '../types';
import { 
  getDomainByType, 
  createDomain, 
  updateDomainActivePlaybook,
  updateDomainTriggerTime,
} from '../db';

// ============================================================
// PLAN TABLE OPERATIONS
// ============================================================

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  durationWeeks: number | null;
  currentWeek: number;
  importSource: string | null;
  importDate: string | null;
  createdAt: string;
}

/**
 * Create the plans table if it doesn't exist
 */
export async function ensurePlanTable(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      duration_weeks INTEGER,
      current_week INTEGER DEFAULT 1,
      import_source TEXT,
      import_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  
  // Add columns to playbooks if they don't exist
  // SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we catch errors
  try {
    await db.execAsync(`ALTER TABLE playbooks ADD COLUMN plan_id TEXT REFERENCES plans(id)`);
  } catch (e) {
    // Column already exists
  }
  
  try {
    await db.execAsync(`ALTER TABLE playbooks ADD COLUMN week_start INTEGER`);
  } catch (e) {
    // Column already exists
  }
  
  try {
    await db.execAsync(`ALTER TABLE playbooks ADD COLUMN week_end INTEGER`);
  } catch (e) {
    // Column already exists
  }
  
  try {
    await db.execAsync(`ALTER TABLE playbooks ADD COLUMN active_days TEXT`);
  } catch (e) {
    // Column already exists
  }
  
  try {
    await db.execAsync(`ALTER TABLE playbooks ADD COLUMN import_source TEXT`);
  } catch (e) {
    // Column already exists
  }
}

/**
 * Create a new plan record
 */
export async function createPlan(
  db: SQLite.SQLiteDatabase,
  name: string,
  description: string | null,
  durationWeeks: number | null,
  importSource: string = 'chatgpt'
): Promise<Plan> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO plans (id, name, description, duration_weeks, current_week, import_source, import_date, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
    [id, name, description, durationWeeks, importSource, now.split('T')[0], now]
  );
  
  return {
    id,
    name,
    description,
    durationWeeks,
    currentWeek: 1,
    importSource,
    importDate: now.split('T')[0],
    createdAt: now,
  };
}

/**
 * Get a plan by ID
 */
export async function getPlanById(
  db: SQLite.SQLiteDatabase,
  planId: string
): Promise<Plan | null> {
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    description: string | null;
    duration_weeks: number | null;
    current_week: number;
    import_source: string | null;
    import_date: string | null;
    created_at: string;
  }>('SELECT * FROM plans WHERE id = ?', [planId]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationWeeks: row.duration_weeks,
    currentWeek: row.current_week,
    importSource: row.import_source,
    importDate: row.import_date,
    createdAt: row.created_at,
  };
}

/**
 * Update the current week for a plan
 */
export async function updatePlanCurrentWeek(
  db: SQLite.SQLiteDatabase,
  planId: string,
  week: number
): Promise<void> {
  await db.runAsync(
    'UPDATE plans SET current_week = ? WHERE id = ?',
    [week, planId]
  );
}

// ============================================================
// IMPORT ORCHESTRATION
// ============================================================

export interface ImportSaveResult {
  success: boolean;
  planId: string | null;
  domainsCreated: number;
  playbooksCreated: number;
  tasksCreated: number;
  error: string | null;
}

/**
 * Save a parsed plan to the database
 * This is the main function that orchestrates the entire import
 */
export async function saveParsedPlan(
  db: SQLite.SQLiteDatabase,
  parsedPlan: ParsedPlan,
  replaceExisting: boolean = true
): Promise<ImportSaveResult> {
  // Ensure tables exist
  await ensurePlanTable(db);
  
  let planId: string | null = null;
  let domainsCreated = 0;
  let playbooksCreated = 0;
  let tasksCreated = 0;
  
  try {
    // Create the plan record (for tracking and multi-week support)
    const plan = await createPlan(
      db,
      parsedPlan.name,
      parsedPlan.description,
      parsedPlan.durationWeeks,
      'chatgpt'
    );
    planId = plan.id;
    
    // Process each domain
    for (const parsedDomain of parsedPlan.domains) {
      const domainResult = await saveDomainFromImport(
        db,
        parsedDomain,
        plan.id,
        replaceExisting
      );
      
      if (domainResult.created) {
        domainsCreated++;
      }
      playbooksCreated += domainResult.playbooksCreated;
      tasksCreated += domainResult.tasksCreated;
    }
    
    return {
      success: true,
      planId,
      domainsCreated,
      playbooksCreated,
      tasksCreated,
      error: null,
    };
  } catch (e) {
    console.error('[Import] Failed to save plan:', e);
    return {
      success: false,
      planId,
      domainsCreated,
      playbooksCreated,
      tasksCreated,
      error: e instanceof Error ? e.message : 'Unknown error saving plan',
    };
  }
}

/**
 * Save a single domain from an import
 */
async function saveDomainFromImport(
  db: SQLite.SQLiteDatabase,
  parsedDomain: ParsedDomain,
  planId: string,
  replaceExisting: boolean
): Promise<{ created: boolean; playbooksCreated: number; tasksCreated: number }> {
  let playbooksCreated = 0;
  let tasksCreated = 0;
  let domainCreated = false;
  
  // Check if domain already exists
  let domain = await getDomainByType(db, parsedDomain.type);
  
  if (domain) {
    // Update trigger time
    await updateDomainTriggerTime(db, domain.id, parsedDomain.triggerTime);
    
    // If replacing, delete existing playbooks for this domain
    if (replaceExisting) {
      await db.runAsync(
        'DELETE FROM playbooks WHERE domain_id = ?',
        [domain.id]
      );
    }
  } else {
    // Create new domain
    domain = await createDomain(db, parsedDomain.type, parsedDomain.triggerTime);
    domainCreated = true;
  }
  
  // Create playbooks
  let firstPlaybookId: string | null = null;
  
  for (const parsedPlaybook of parsedDomain.playbooks) {
    const playbookResult = await savePlaybookFromImport(
      db,
      parsedPlaybook,
      domain.id,
      planId
    );
    
    if (!firstPlaybookId) {
      firstPlaybookId = playbookResult.playbookId;
    }
    
    playbooksCreated++;
    tasksCreated += playbookResult.tasksCreated;
  }
  
  // Set the first playbook as active (or the one that matches current week/day)
  if (firstPlaybookId) {
    await updateDomainActivePlaybook(db, domain.id, firstPlaybookId);
  }
  
  return {
    created: domainCreated,
    playbooksCreated,
    tasksCreated,
  };
}

/**
 * Save a single playbook from an import
 */
async function savePlaybookFromImport(
  db: SQLite.SQLiteDatabase,
  parsedPlaybook: ParsedPlaybook,
  domainId: string,
  planId: string
): Promise<{ playbookId: string; tasksCreated: number }> {
  const playbookId = uuidv4();
  const now = new Date().toISOString();
  
  // Convert active_days array to JSON string
  const activeDaysJson = parsedPlaybook.activeDays 
    ? JSON.stringify(parsedPlaybook.activeDays)
    : null;
  
  await db.runAsync(
    `INSERT INTO playbooks (id, domain_id, name, is_template, plan_id, week_start, week_end, active_days, import_source, created_at, updated_at)
     VALUES (?, ?, ?, 0, ?, ?, ?, ?, 'chatgpt', ?, ?)`,
    [
      playbookId,
      domainId,
      parsedPlaybook.name,
      planId,
      parsedPlaybook.weekStart,
      parsedPlaybook.weekEnd,
      activeDaysJson,
      now,
      now,
    ]
  );
  
  // Create tasks
  let tasksCreated = 0;
  for (let i = 0; i < parsedPlaybook.tasks.length; i++) {
    await saveTaskFromImport(db, parsedPlaybook.tasks[i], playbookId, i);
    tasksCreated++;
  }
  
  return { playbookId, tasksCreated };
}

/**
 * Save a single task from an import
 */
async function saveTaskFromImport(
  db: SQLite.SQLiteDatabase,
  parsedTask: ParsedTask,
  playbookId: string,
  sortOrder: number
): Promise<string> {
  const taskId = uuidv4();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO tasks (id, playbook_id, title, description, duration_minutes, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      taskId,
      playbookId,
      parsedTask.title,
      parsedTask.description,
      parsedTask.durationMinutes,
      sortOrder,
      now,
      now,
    ]
  );
  
  return taskId;
}

// ============================================================
// CONFLICT DETECTION
// ============================================================

export interface ConflictInfo {
  domainType: DomainType;
  existingPlaybookName: string | null;
  existingPlaybookCount: number;
  newPlaybookCount: number;
}

/**
 * Check for conflicts before importing
 */
export async function checkImportConflicts(
  db: SQLite.SQLiteDatabase,
  parsedPlan: ParsedPlan
): Promise<ConflictInfo[]> {
  const conflicts: ConflictInfo[] = [];
  
  for (const parsedDomain of parsedPlan.domains) {
    const domain = await getDomainByType(db, parsedDomain.type);
    
    if (domain && domain.activePlaybookId) {
      // Count existing playbooks
      const countResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM playbooks WHERE domain_id = ?',
        [domain.id]
      );
      
      // Get name of active playbook
      const activePlaybook = await db.getFirstAsync<{ name: string }>(
        'SELECT name FROM playbooks WHERE id = ?',
        [domain.activePlaybookId]
      );
      
      if (countResult && countResult.count > 0) {
        conflicts.push({
          domainType: parsedDomain.type,
          existingPlaybookName: activePlaybook?.name || null,
          existingPlaybookCount: countResult.count,
          newPlaybookCount: parsedDomain.playbooks.length,
        });
      }
    }
  }
  
  return conflicts;
}

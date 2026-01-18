import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { 
  Domain, 
  DomainType, 
  Playbook, 
  PlaybookWithTasks, 
  Task, 
  TaskLog, 
  TaskStatus,
  Settings,
  WeeklyStats,
  DomainStat,
} from '../types';
import { getTodayDateString, getWeekRange } from '../utils/date';

// ============================================================
// DOMAIN QUERIES
// ============================================================

export async function getDomains(db: SQLite.SQLiteDatabase): Promise<Domain[]> {
  const results = await db.getAllAsync<{
    id: string;
    type: string;
    trigger_time: string;
    active_playbook_id: string | null;
    notifications_enabled: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM domains ORDER BY trigger_time');
  
  return results.map(row => ({
    id: row.id,
    type: row.type as DomainType,
    triggerTime: row.trigger_time,
    activePlaybookId: row.active_playbook_id,
    notificationsEnabled: row.notifications_enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getDomainById(db: SQLite.SQLiteDatabase, id: string): Promise<Domain | null> {
  const row = await db.getFirstAsync<{
    id: string;
    type: string;
    trigger_time: string;
    active_playbook_id: string | null;
    notifications_enabled: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM domains WHERE id = ?', [id]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    type: row.type as DomainType,
    triggerTime: row.trigger_time,
    activePlaybookId: row.active_playbook_id,
    notificationsEnabled: row.notifications_enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDomainByType(db: SQLite.SQLiteDatabase, type: DomainType): Promise<Domain | null> {
  const row = await db.getFirstAsync<{
    id: string;
    type: string;
    trigger_time: string;
    active_playbook_id: string | null;
    notifications_enabled: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM domains WHERE type = ?', [type]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    type: row.type as DomainType,
    triggerTime: row.trigger_time,
    activePlaybookId: row.active_playbook_id,
    notificationsEnabled: row.notifications_enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createDomain(
  db: SQLite.SQLiteDatabase,
  type: DomainType,
  triggerTime: string
): Promise<Domain> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO domains (id, type, trigger_time, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?)`,
    [id, type, triggerTime, now, now]
  );
  
  return {
    id,
    type,
    triggerTime,
    activePlaybookId: null,
    notificationsEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateDomainTriggerTime(
  db: SQLite.SQLiteDatabase,
  domainId: string,
  triggerTime: string
): Promise<void> {
  await db.runAsync(
    `UPDATE domains SET trigger_time = ?, updated_at = datetime('now') WHERE id = ?`,
    [triggerTime, domainId]
  );
}

export async function updateDomainActivePlaybook(
  db: SQLite.SQLiteDatabase,
  domainId: string,
  playbookId: string
): Promise<void> {
  await db.runAsync(
    `UPDATE domains SET active_playbook_id = ?, updated_at = datetime('now') WHERE id = ?`,
    [playbookId, domainId]
  );
}

export async function updateDomainNotifications(
  db: SQLite.SQLiteDatabase,
  domainId: string,
  enabled: boolean
): Promise<void> {
  await db.runAsync(
    `UPDATE domains SET notifications_enabled = ?, updated_at = datetime('now') WHERE id = ?`,
    [enabled ? 1 : 0, domainId]
  );
}

// ============================================================
// PLAYBOOK QUERIES
// ============================================================

export async function getPlaybookById(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<Playbook | null> {
  const row = await db.getFirstAsync<{
    id: string;
    domain_id: string;
    name: string;
    is_template: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM playbooks WHERE id = ?', [id]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    domainId: row.domain_id,
    name: row.name,
    isTemplate: row.is_template === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPlaybookWithTasks(
  db: SQLite.SQLiteDatabase,
  playbookId: string
): Promise<PlaybookWithTasks | null> {
  const playbook = await getPlaybookById(db, playbookId);
  if (!playbook) return null;
  
  const tasks = await getTasksForPlaybook(db, playbookId);
  
  return {
    ...playbook,
    tasks,
  };
}

export async function getPlaybooksForDomain(
  db: SQLite.SQLiteDatabase,
  domainId: string
): Promise<Playbook[]> {
  const results = await db.getAllAsync<{
    id: string;
    domain_id: string;
    name: string;
    is_template: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM playbooks WHERE domain_id = ? AND is_template = 0 ORDER BY created_at DESC', [domainId]);
  
  return results.map(row => ({
    id: row.id,
    domainId: row.domain_id,
    name: row.name,
    isTemplate: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createPlaybook(
  db: SQLite.SQLiteDatabase,
  domainId: string,
  name: string,
  isTemplate: boolean = false
): Promise<Playbook> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO playbooks (id, domain_id, name, is_template, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, domainId, name, isTemplate ? 1 : 0, now, now]
  );
  
  return {
    id,
    domainId,
    name,
    isTemplate,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updatePlaybookName(
  db: SQLite.SQLiteDatabase,
  playbookId: string,
  name: string
): Promise<void> {
  await db.runAsync(
    `UPDATE playbooks SET name = ?, updated_at = datetime('now') WHERE id = ?`,
    [name, playbookId]
  );
}

export async function deletePlaybook(
  db: SQLite.SQLiteDatabase,
  playbookId: string
): Promise<void> {
  // Tasks will be cascade deleted due to foreign key
  await db.runAsync('DELETE FROM playbooks WHERE id = ?', [playbookId]);
}

// ============================================================
// TASK QUERIES
// ============================================================

export async function getTasksForPlaybook(
  db: SQLite.SQLiteDatabase,
  playbookId: string
): Promise<Task[]> {
  const results = await db.getAllAsync<{
    id: string;
    playbook_id: string;
    title: string;
    description: string | null;
    duration_minutes: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM tasks WHERE playbook_id = ? ORDER BY sort_order', [playbookId]);
  
  return results.map(row => ({
    id: row.id,
    playbookId: row.playbook_id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getTaskById(
  db: SQLite.SQLiteDatabase,
  taskId: string
): Promise<Task | null> {
  const row = await db.getFirstAsync<{
    id: string;
    playbook_id: string;
    title: string;
    description: string | null;
    duration_minutes: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM tasks WHERE id = ?', [taskId]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    playbookId: row.playbook_id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTask(
  db: SQLite.SQLiteDatabase,
  playbookId: string,
  title: string,
  description: string | null,
  durationMinutes: number,
  sortOrder: number
): Promise<Task> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO tasks (id, playbook_id, title, description, duration_minutes, sort_order, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, playbookId, title, description, durationMinutes, sortOrder, now, now]
  );
  
  return {
    id,
    playbookId,
    title,
    description,
    durationMinutes,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateTask(
  db: SQLite.SQLiteDatabase,
  taskId: string,
  updates: Partial<Pick<Task, 'title' | 'description' | 'durationMinutes' | 'sortOrder'>>
): Promise<void> {
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    values.push(updates.description);
  }
  if (updates.durationMinutes !== undefined) {
    setClauses.push('duration_minutes = ?');
    values.push(updates.durationMinutes);
  }
  if (updates.sortOrder !== undefined) {
    setClauses.push('sort_order = ?');
    values.push(updates.sortOrder);
  }
  
  if (setClauses.length === 0) return;
  
  setClauses.push("updated_at = datetime('now')");
  values.push(taskId);
  
  await db.runAsync(
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteTask(
  db: SQLite.SQLiteDatabase,
  taskId: string
): Promise<void> {
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [taskId]);
}

export async function reorderTasks(
  db: SQLite.SQLiteDatabase,
  taskIds: string[]
): Promise<void> {
  for (let i = 0; i < taskIds.length; i++) {
    await db.runAsync(
      `UPDATE tasks SET sort_order = ?, updated_at = datetime('now') WHERE id = ?`,
      [i, taskIds[i]]
    );
  }
}

// ============================================================
// TASK LOG QUERIES
// ============================================================

export async function getTaskLogsForDate(
  db: SQLite.SQLiteDatabase,
  domainId: string,
  date: string
): Promise<TaskLog[]> {
  const results = await db.getAllAsync<{
    id: string;
    task_id: string;
    domain_id: string;
    scheduled_date: string;
    status: string;
    completed_at: string | null;
    created_at: string;
  }>(
    'SELECT * FROM task_logs WHERE domain_id = ? AND scheduled_date = ?',
    [domainId, date]
  );
  
  return results.map(row => ({
    id: row.id,
    taskId: row.task_id,
    domainId: row.domain_id,
    scheduledDate: row.scheduled_date,
    status: row.status as TaskStatus,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  }));
}

export async function getTaskLogForTask(
  db: SQLite.SQLiteDatabase,
  taskId: string,
  date: string
): Promise<TaskLog | null> {
  const row = await db.getFirstAsync<{
    id: string;
    task_id: string;
    domain_id: string;
    scheduled_date: string;
    status: string;
    completed_at: string | null;
    created_at: string;
  }>(
    'SELECT * FROM task_logs WHERE task_id = ? AND scheduled_date = ?',
    [taskId, date]
  );
  
  if (!row) return null;
  
  return {
    id: row.id,
    taskId: row.task_id,
    domainId: row.domain_id,
    scheduledDate: row.scheduled_date,
    status: row.status as TaskStatus,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

export async function createOrGetTaskLog(
  db: SQLite.SQLiteDatabase,
  taskId: string,
  domainId: string,
  date: string
): Promise<TaskLog> {
  const existing = await getTaskLogForTask(db, taskId, date);
  if (existing) return existing;
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO task_logs (id, task_id, domain_id, scheduled_date, status, created_at) 
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [id, taskId, domainId, date, now]
  );
  
  return {
    id,
    taskId,
    domainId,
    scheduledDate: date,
    status: 'pending',
    completedAt: null,
    createdAt: now,
  };
}

export async function updateTaskLogStatus(
  db: SQLite.SQLiteDatabase,
  logId: string,
  status: TaskStatus
): Promise<void> {
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  
  await db.runAsync(
    `UPDATE task_logs SET status = ?, completed_at = ? WHERE id = ?`,
    [status, completedAt, logId]
  );
}

export async function getWeeklyStats(
  db: SQLite.SQLiteDatabase,
  weekStart?: string,
  weekEnd?: string
): Promise<WeeklyStats> {
  const { start, end } = weekStart && weekEnd 
    ? { start: weekStart, end: weekEnd }
    : getWeekRange();
  
  // Get all logs for the week
  const logs = await db.getAllAsync<{
    id: string;
    task_id: string;
    domain_id: string;
    status: string;
    domain_type: string;
  }>(
    `SELECT tl.id, tl.task_id, tl.domain_id, tl.status, d.type as domain_type
     FROM task_logs tl
     JOIN domains d ON d.id = tl.domain_id
     WHERE tl.scheduled_date >= ? AND tl.scheduled_date <= ?`,
    [start, end]
  );
  
  const totalTasks = logs.length;
  const completedTasks = logs.filter(l => l.status === 'completed').length;
  const skippedTasks = logs.filter(l => l.status === 'skipped').length;
  
  // Calculate domain stats
  const domainStatsMap = new Map<DomainType, { total: number; completed: number }>();
  
  for (const log of logs) {
    const domainType = log.domain_type as DomainType;
    const current = domainStatsMap.get(domainType) || { total: 0, completed: 0 };
    current.total++;
    if (log.status === 'completed') {
      current.completed++;
    }
    domainStatsMap.set(domainType, current);
  }
  
  const domainStats: DomainStat[] = Array.from(domainStatsMap.entries()).map(([type, stats]) => ({
    domainType: type,
    totalTasks: stats.total,
    completedTasks: stats.completed,
    completionRate: stats.total > 0 ? stats.completed / stats.total : 0,
  }));
  
  // Find most skipped task
  const skippedTaskCounts = new Map<string, { title: string; count: number }>();
  const skippedLogs = logs.filter(l => l.status === 'skipped');
  
  for (const log of skippedLogs) {
    const task = await getTaskById(db, log.task_id);
    if (task) {
      const current = skippedTaskCounts.get(log.task_id) || { title: task.title, count: 0 };
      current.count++;
      skippedTaskCounts.set(log.task_id, current);
    }
  }
  
  let mostSkippedTask: { title: string; count: number } | null = null;
  let maxSkips = 0;
  for (const [, data] of skippedTaskCounts) {
    if (data.count > maxSkips) {
      maxSkips = data.count;
      mostSkippedTask = data;
    }
  }
  
  // Find most consistent domain
  let mostConsistentDomain: DomainType | null = null;
  let highestRate = 0;
  for (const stat of domainStats) {
    if (stat.completionRate > highestRate && stat.totalTasks >= 3) {
      highestRate = stat.completionRate;
      mostConsistentDomain = stat.domainType;
    }
  }
  
  return {
    weekStart: start,
    weekEnd: end,
    totalTasks,
    completedTasks,
    skippedTasks,
    domainStats,
    mostSkippedTask,
    mostConsistentDomain,
  };
}

// ============================================================
// SETTINGS QUERIES
// ============================================================

export async function getSetting(
  db: SQLite.SQLiteDatabase,
  key: string
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

export async function getSettings(db: SQLite.SQLiteDatabase): Promise<Settings> {
  const hasCompletedOnboarding = (await getSetting(db, 'has_completed_onboarding')) === 'true';
  const quietHoursEnabled = (await getSetting(db, 'quiet_hours_enabled')) === 'true';
  const quietHoursStart = (await getSetting(db, 'quiet_hours_start')) || '22:00';
  const quietHoursEnd = (await getSetting(db, 'quiet_hours_end')) || '07:00';
  const streaksEnabled = (await getSetting(db, 'streaks_enabled')) === 'true';
  
  return {
    hasCompletedOnboarding,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    streaksEnabled,
  };
}

// ============================================================
// HELPER: Create playbook from template
// ============================================================

export async function createPlaybookFromTemplate(
  db: SQLite.SQLiteDatabase,
  domainId: string,
  templateName: string,
  templateTasks: Array<{ title: string; description: string | null; durationMinutes: number }>
): Promise<PlaybookWithTasks> {
  // Create the playbook
  const playbook = await createPlaybook(db, domainId, templateName, false);
  
  // Create the tasks
  const tasks: Task[] = [];
  for (let i = 0; i < templateTasks.length; i++) {
    const t = templateTasks[i];
    const task = await createTask(db, playbook.id, t.title, t.description, t.durationMinutes, i);
    tasks.push(task);
  }
  
  // Set as active playbook for domain
  await updateDomainActivePlaybook(db, domainId, playbook.id);
  
  return {
    ...playbook,
    tasks,
  };
}

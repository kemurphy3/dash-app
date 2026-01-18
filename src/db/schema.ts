// SQL schema for DASH app

export const CREATE_DOMAINS_TABLE = `
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('morning', 'exercise', 'evening')),
  trigger_time TEXT NOT NULL,
  active_playbook_id TEXT,
  notifications_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export const CREATE_PLAYBOOKS_TABLE = `
CREATE TABLE IF NOT EXISTS playbooks (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_template INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id)
);
`;

export const CREATE_TASKS_TABLE = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  playbook_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE
);
`;

export const CREATE_TASK_LOGS_TABLE = `
CREATE TABLE IF NOT EXISTS task_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  domain_id TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'skipped')) DEFAULT 'pending',
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (domain_id) REFERENCES domains(id)
);
`;

export const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

// Indexes for performance
export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_task_logs_date ON task_logs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_task_logs_domain ON task_logs(domain_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_playbook ON tasks(playbook_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_playbooks_domain ON playbooks(domain_id);
`;

// All schema statements in order
export const SCHEMA_STATEMENTS = [
  CREATE_DOMAINS_TABLE,
  CREATE_PLAYBOOKS_TABLE,
  CREATE_TASKS_TABLE,
  CREATE_TASK_LOGS_TABLE,
  CREATE_SETTINGS_TABLE,
  CREATE_INDEXES,
];

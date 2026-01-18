import { DomainType } from '../types';

// ============================================================
// DASH IMPORT FORMAT TYPES (v1)
// ============================================================

export interface DashImportFormat {
  dash_version: number;
  plan: ImportPlan;
  domains: ImportDomain[];
}

export interface ImportPlan {
  name: string;
  description?: string;
  created?: string; // YYYY-MM-DD
  duration_weeks?: number;
}

export interface ImportDomain {
  type: 'morning' | 'exercise' | 'evening';
  trigger_time?: string; // HH:MM
  playbooks: ImportPlaybook[];
}

export interface ImportPlaybook {
  name: string;
  week_start?: number;
  week_end?: number;
  days?: string[]; // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  tasks: ImportTask[];
}

export interface ImportTask {
  title: string;
  description?: string;
  duration?: number; // minutes
}

// ============================================================
// VALIDATION TYPES
// ============================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  message: string;
  autoFixed?: boolean;
  originalValue?: unknown;
  fixedValue?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  data: DashImportFormat | null;
}

// ============================================================
// PARSED & NORMALIZED TYPES (ready for database)
// ============================================================

export interface ParsedPlan {
  name: string;
  description: string | null;
  createdDate: string;
  durationWeeks: number | null;
  domains: ParsedDomain[];
}

export interface ParsedDomain {
  type: DomainType;
  triggerTime: string;
  playbooks: ParsedPlaybook[];
}

export interface ParsedPlaybook {
  name: string;
  weekStart: number | null;
  weekEnd: number | null;
  activeDays: string[] | null; // null means all days
  tasks: ParsedTask[];
}

export interface ParsedTask {
  title: string;
  description: string | null;
  durationMinutes: number;
}

// ============================================================
// CONSTANTS
// ============================================================

export const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const DEFAULT_TRIGGER_TIMES: Record<DomainType, string> = {
  morning: '07:00',
  exercise: '17:00',
  evening: '21:00',
};

export const DEFAULT_TASK_DURATION = 5; // minutes
export const MAX_TASK_DURATION = 120; // minutes
export const MIN_TASK_DURATION = 1; // minute

export const MAX_TASKS_PER_PLAYBOOK_WARNING = 10;
export const MAX_DAILY_MINUTES_WARNING = 120; // 2 hours per domain

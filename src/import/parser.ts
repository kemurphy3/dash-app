import * as yaml from 'yaml';
import {
  DashImportFormat,
  ValidationResult,
  ValidationIssue,
  ParsedPlan,
  ParsedDomain,
  ParsedPlaybook,
  ParsedTask,
  VALID_DAYS,
  DEFAULT_TRIGGER_TIMES,
  DEFAULT_TASK_DURATION,
  MAX_TASK_DURATION,
  MIN_TASK_DURATION,
  MAX_TASKS_PER_PLAYBOOK_WARNING,
  MAX_DAILY_MINUTES_WARNING,
} from './types';
import { DomainType } from '../types';
import { getTodayDateString } from '../utils/date';

// ============================================================
// YAML PARSING
// ============================================================

/**
 * Parse raw YAML string into an object
 */
export function parseYaml(input: string): { data: unknown; error: string | null } {
  try {
    // Clean up common issues
    const cleaned = input
      .trim()
      // Remove markdown code fences if present
      .replace(/^```ya?ml?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();
    
    const data = yaml.parse(cleaned);
    return { data, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Invalid YAML syntax';
    return { data: null, error };
  }
}

// ============================================================
// SCHEMA VALIDATION
// ============================================================

/**
 * Validate and normalize a parsed YAML object into a DashImportFormat
 */
export function validateImport(data: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Must be an object
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      issues: [{
        severity: 'error',
        field: 'root',
        message: 'Import must be a valid YAML object',
      }],
      data: null,
    };
  }
  
  const obj = data as Record<string, unknown>;
  
  // Check dash_version
  if (obj.dash_version === undefined) {
    issues.push({
      severity: 'error',
      field: 'dash_version',
      message: 'Missing dash_version field. Make sure ChatGPT included "dash_version: 1" at the top.',
    });
  } else if (obj.dash_version !== 1) {
    issues.push({
      severity: 'error',
      field: 'dash_version',
      message: `Unsupported version: ${obj.dash_version}. DASH currently supports version 1.`,
    });
  }
  
  // Check plan
  if (!obj.plan || typeof obj.plan !== 'object') {
    issues.push({
      severity: 'error',
      field: 'plan',
      message: 'Missing plan section. The export needs a "plan:" section with name and details.',
    });
  } else {
    const plan = obj.plan as Record<string, unknown>;
    
    if (!plan.name || typeof plan.name !== 'string' || plan.name.trim().length === 0) {
      issues.push({
        severity: 'error',
        field: 'plan.name',
        message: 'Plan must have a name.',
      });
    } else if (plan.name.length > 100) {
      issues.push({
        severity: 'warning',
        field: 'plan.name',
        message: 'Plan name is very long. It will be truncated to 100 characters.',
        autoFixed: true,
        originalValue: plan.name,
        fixedValue: (plan.name as string).substring(0, 100),
      });
    }
    
    if (plan.duration_weeks !== undefined) {
      const weeks = Number(plan.duration_weeks);
      if (isNaN(weeks) || weeks < 1 || weeks > 52) {
        issues.push({
          severity: 'warning',
          field: 'plan.duration_weeks',
          message: 'Duration must be 1-52 weeks. Ignoring invalid value.',
          autoFixed: true,
          originalValue: plan.duration_weeks,
          fixedValue: null,
        });
      }
    }
  }
  
  // Check domains
  if (!obj.domains || !Array.isArray(obj.domains)) {
    issues.push({
      severity: 'error',
      field: 'domains',
      message: 'Missing domains array. The export needs a "domains:" section with at least one domain.',
    });
  } else if (obj.domains.length === 0) {
    issues.push({
      severity: 'error',
      field: 'domains',
      message: 'Domains array is empty. Add at least one domain (morning, exercise, or evening).',
    });
  } else {
    // Validate each domain
    obj.domains.forEach((domain, domainIndex) => {
      const domainIssues = validateDomain(domain, domainIndex);
      issues.push(...domainIssues);
    });
  }
  
  // Check for fatal errors
  const hasErrors = issues.some(i => i.severity === 'error');
  
  if (hasErrors) {
    return {
      isValid: false,
      issues,
      data: null,
    };
  }
  
  // Return validated data
  return {
    isValid: true,
    issues,
    data: obj as unknown as DashImportFormat,
  };
}

/**
 * Validate a single domain
 */
function validateDomain(domain: unknown, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `domains[${index}]`;
  
  if (!domain || typeof domain !== 'object') {
    issues.push({
      severity: 'error',
      field: prefix,
      message: `Domain at index ${index} is not a valid object.`,
    });
    return issues;
  }
  
  const d = domain as Record<string, unknown>;
  
  // Check type
  const validTypes = ['morning', 'exercise', 'evening'];
  if (!d.type || !validTypes.includes(d.type as string)) {
    issues.push({
      severity: 'error',
      field: `${prefix}.type`,
      message: `Invalid domain type: "${d.type}". Must be one of: morning, exercise, evening.`,
    });
  }
  
  // Check trigger_time
  if (d.trigger_time !== undefined) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (typeof d.trigger_time !== 'string' || !timeRegex.test(d.trigger_time)) {
      issues.push({
        severity: 'warning',
        field: `${prefix}.trigger_time`,
        message: `Invalid time format: "${d.trigger_time}". Using default time instead.`,
        autoFixed: true,
        originalValue: d.trigger_time,
        fixedValue: DEFAULT_TRIGGER_TIMES[d.type as DomainType] || '07:00',
      });
    }
  }
  
  // Check playbooks
  if (!d.playbooks || !Array.isArray(d.playbooks)) {
    issues.push({
      severity: 'error',
      field: `${prefix}.playbooks`,
      message: `Domain "${d.type}" is missing playbooks array.`,
    });
  } else if (d.playbooks.length === 0) {
    issues.push({
      severity: 'error',
      field: `${prefix}.playbooks`,
      message: `Domain "${d.type}" has no playbooks. Add at least one playbook with tasks.`,
    });
  } else {
    d.playbooks.forEach((playbook, playbookIndex) => {
      const playbookIssues = validatePlaybook(playbook, d.type as string, index, playbookIndex);
      issues.push(...playbookIssues);
    });
  }
  
  return issues;
}

/**
 * Validate a single playbook
 */
function validatePlaybook(
  playbook: unknown,
  domainType: string,
  domainIndex: number,
  playbookIndex: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `domains[${domainIndex}].playbooks[${playbookIndex}]`;
  
  if (!playbook || typeof playbook !== 'object') {
    issues.push({
      severity: 'error',
      field: prefix,
      message: `Playbook at index ${playbookIndex} in ${domainType} is not valid.`,
    });
    return issues;
  }
  
  const p = playbook as Record<string, unknown>;
  
  // Check name
  if (!p.name || typeof p.name !== 'string' || p.name.trim().length === 0) {
    issues.push({
      severity: 'warning',
      field: `${prefix}.name`,
      message: 'Playbook is missing a name. Using "Untitled Playbook".',
      autoFixed: true,
      originalValue: p.name,
      fixedValue: 'Untitled Playbook',
    });
  }
  
  // Check days if present
  if (p.days !== undefined) {
    if (!Array.isArray(p.days)) {
      issues.push({
        severity: 'warning',
        field: `${prefix}.days`,
        message: 'Invalid days format. Ignoring and using all days.',
        autoFixed: true,
        originalValue: p.days,
        fixedValue: null,
      });
    } else {
      const invalidDays = p.days.filter(d => !VALID_DAYS.includes(d?.toLowerCase?.()));
      if (invalidDays.length > 0) {
        issues.push({
          severity: 'warning',
          field: `${prefix}.days`,
          message: `Invalid day names: ${invalidDays.join(', ')}. Valid values: mon, tue, wed, thu, fri, sat, sun.`,
          autoFixed: true,
        });
      }
    }
  }
  
  // Check tasks
  if (!p.tasks || !Array.isArray(p.tasks)) {
    issues.push({
      severity: 'error',
      field: `${prefix}.tasks`,
      message: `Playbook "${p.name || 'Untitled'}" has no tasks array.`,
    });
  } else if (p.tasks.length === 0) {
    issues.push({
      severity: 'error',
      field: `${prefix}.tasks`,
      message: `Playbook "${p.name || 'Untitled'}" has no tasks. Each playbook needs at least one task.`,
    });
  } else {
    // Warn if too many tasks
    if (p.tasks.length > MAX_TASKS_PER_PLAYBOOK_WARNING) {
      issues.push({
        severity: 'warning',
        field: `${prefix}.tasks`,
        message: `Playbook "${p.name}" has ${p.tasks.length} tasks. Consider breaking it into smaller chunks for better follow-through.`,
      });
    }
    
    // Validate each task
    let totalDuration = 0;
    p.tasks.forEach((task, taskIndex) => {
      const taskIssues = validateTask(task, domainIndex, playbookIndex, taskIndex);
      issues.push(...taskIssues);
      
      // Sum duration for warning
      if (task && typeof task === 'object') {
        const t = task as Record<string, unknown>;
        totalDuration += Number(t.duration) || DEFAULT_TASK_DURATION;
      }
    });
    
    // Warn if total duration is excessive
    if (totalDuration > MAX_DAILY_MINUTES_WARNING) {
      issues.push({
        severity: 'warning',
        field: `${prefix}`,
        message: `Playbook "${p.name}" takes ${totalDuration} minutes (${Math.round(totalDuration / 60 * 10) / 10} hours). That's ambitious! You can always edit it later.`,
      });
    }
  }
  
  return issues;
}

/**
 * Validate a single task
 */
function validateTask(
  task: unknown,
  domainIndex: number,
  playbookIndex: number,
  taskIndex: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `domains[${domainIndex}].playbooks[${playbookIndex}].tasks[${taskIndex}]`;
  
  if (!task || typeof task !== 'object') {
    issues.push({
      severity: 'error',
      field: prefix,
      message: `Task at index ${taskIndex} is not valid.`,
    });
    return issues;
  }
  
  const t = task as Record<string, unknown>;
  
  // Check title (required)
  if (!t.title || typeof t.title !== 'string' || t.title.trim().length === 0) {
    issues.push({
      severity: 'error',
      field: `${prefix}.title`,
      message: 'Task is missing a title. Every task needs a clear instruction.',
    });
  } else if (t.title.length > 200) {
    issues.push({
      severity: 'warning',
      field: `${prefix}.title`,
      message: 'Task title is very long. It will be truncated.',
      autoFixed: true,
      originalValue: t.title,
      fixedValue: (t.title as string).substring(0, 200),
    });
  }
  
  // Check duration
  if (t.duration !== undefined) {
    const duration = Number(t.duration);
    if (isNaN(duration) || duration < MIN_TASK_DURATION) {
      issues.push({
        severity: 'info',
        field: `${prefix}.duration`,
        message: `Invalid duration. Using default of ${DEFAULT_TASK_DURATION} minutes.`,
        autoFixed: true,
        originalValue: t.duration,
        fixedValue: DEFAULT_TASK_DURATION,
      });
    } else if (duration > MAX_TASK_DURATION) {
      issues.push({
        severity: 'warning',
        field: `${prefix}.duration`,
        message: `Duration of ${duration} minutes exceeds maximum. Capping at ${MAX_TASK_DURATION} minutes.`,
        autoFixed: true,
        originalValue: duration,
        fixedValue: MAX_TASK_DURATION,
      });
    }
  }
  
  return issues;
}

// ============================================================
// NORMALIZATION (Apply defaults and fixes)
// ============================================================

/**
 * Normalize validated data into a clean ParsedPlan ready for database
 */
export function normalizePlan(data: DashImportFormat): ParsedPlan {
  const plan = data.plan;
  
  return {
    name: (plan.name || 'Imported Plan').substring(0, 100),
    description: plan.description?.substring(0, 500) || null,
    createdDate: plan.created || getTodayDateString(),
    durationWeeks: normalizeDurationWeeks(plan.duration_weeks),
    domains: data.domains.map(normalizeDomain),
  };
}

function normalizeDurationWeeks(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num) || num < 1 || num > 52) return null;
  return Math.floor(num);
}

function normalizeDomain(domain: unknown): ParsedDomain {
  const d = domain as Record<string, unknown>;
  const type = d.type as DomainType;
  
  return {
    type,
    triggerTime: normalizeTriggerTime(d.trigger_time, type),
    playbooks: (d.playbooks as unknown[]).map((p, i) => normalizePlaybook(p, i)),
  };
}

function normalizeTriggerTime(value: unknown, domainType: DomainType): string {
  if (typeof value !== 'string') {
    return DEFAULT_TRIGGER_TIMES[domainType];
  }
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  const match = value.match(timeRegex);
  
  if (!match) {
    return DEFAULT_TRIGGER_TIMES[domainType];
  }
  
  // Normalize to HH:MM format
  const hours = match[1].padStart(2, '0');
  const minutes = match[2];
  return `${hours}:${minutes}`;
}

function normalizePlaybook(playbook: unknown, index: number): ParsedPlaybook {
  const p = playbook as Record<string, unknown>;
  
  return {
    name: (p.name as string)?.substring(0, 50) || `Playbook ${index + 1}`,
    weekStart: normalizeWeekNumber(p.week_start),
    weekEnd: normalizeWeekNumber(p.week_end),
    activeDays: normalizeDays(p.days),
    tasks: (p.tasks as unknown[]).map(normalizeTask),
  };
}

function normalizeWeekNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num) || num < 1) return null;
  return Math.floor(num);
}

function normalizeDays(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  
  const normalized = value
    .map(d => String(d).toLowerCase().trim())
    .filter(d => VALID_DAYS.includes(d as typeof VALID_DAYS[number]));
  
  if (normalized.length === 0 || normalized.length === 7) {
    return null; // null means all days
  }
  
  return normalized;
}

function normalizeTask(task: unknown): ParsedTask {
  const t = task as Record<string, unknown>;
  
  return {
    title: (t.title as string)?.substring(0, 200) || 'Untitled Task',
    description: t.description ? String(t.description).substring(0, 500) : null,
    durationMinutes: normalizeDuration(t.duration),
  };
}

function normalizeDuration(value: unknown): number {
  if (value === undefined || value === null) return DEFAULT_TASK_DURATION;
  
  const num = Number(value);
  if (isNaN(num)) return DEFAULT_TASK_DURATION;
  if (num < MIN_TASK_DURATION) return MIN_TASK_DURATION;
  if (num > MAX_TASK_DURATION) return MAX_TASK_DURATION;
  
  return Math.round(num);
}

// ============================================================
// MAIN IMPORT FUNCTION
// ============================================================

export interface ImportResult {
  success: boolean;
  plan: ParsedPlan | null;
  issues: ValidationIssue[];
  errorMessage: string | null;
}

/**
 * Parse and validate a YAML string, returning a normalized plan
 */
export function importFromYaml(yamlString: string): ImportResult {
  // Step 1: Parse YAML
  const { data, error } = parseYaml(yamlString);
  
  if (error) {
    return {
      success: false,
      plan: null,
      issues: [],
      errorMessage: `Could not parse YAML: ${error}`,
    };
  }
  
  // Step 2: Validate schema
  const validation = validateImport(data);
  
  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      plan: null,
      issues: validation.issues,
      errorMessage: 'Plan has validation errors. Please check the issues below.',
    };
  }
  
  // Step 3: Normalize
  const plan = normalizePlan(validation.data);
  
  return {
    success: true,
    plan,
    issues: validation.issues,
    errorMessage: null,
  };
}

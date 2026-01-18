// Domain types
export type DomainType = 'morning' | 'exercise' | 'evening';

export interface Domain {
  id: string;
  type: DomainType;
  triggerTime: string; // HH:MM format
  activePlaybookId: string | null;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Playbook types
export interface Playbook {
  id: string;
  domainId: string;
  name: string;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaybookWithTasks extends Playbook {
  tasks: Task[];
}

// Task types
export interface Task {
  id: string;
  playbookId: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Task log types
export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface TaskLog {
  id: string;
  taskId: string;
  domainId: string;
  scheduledDate: string; // YYYY-MM-DD format
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
}

// Settings
export interface Settings {
  hasCompletedOnboarding: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM
  quietHoursEnd: string; // HH:MM
  streaksEnabled: boolean;
}

// Template types for onboarding
export interface PlaybookTemplate {
  id: string;
  domainType: DomainType;
  name: string;
  description: string;
  tasks: TaskTemplate[];
}

export interface TaskTemplate {
  title: string;
  description: string | null;
  durationMinutes: number;
}

// Execution state
export interface ExecutionState {
  currentDomainId: string | null;
  currentTaskIndex: number;
  tasksForToday: TaskWithStatus[];
}

export interface TaskWithStatus extends Task {
  status: TaskStatus;
  logId: string | null;
}

// Weekly stats
export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  domainStats: DomainStat[];
  mostSkippedTask: { title: string; count: number } | null;
  mostConsistentDomain: DomainType | null;
}

export interface DomainStat {
  domainType: DomainType;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

// Navigation params
export type OnboardingStep = 'welcome' | 'domains' | 'playbooks' | 'times' | 'confirm';

// Snooze options
export type SnoozeOption = 10 | 30 | 60 | 'later';

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: string;
}

// Domain display info
export const DOMAIN_INFO: Record<DomainType, { label: string; emoji: string; defaultTime: string }> = {
  morning: { label: 'Morning Routine', emoji: '🌅', defaultTime: '07:00' },
  exercise: { label: 'Exercise', emoji: '💪', defaultTime: '17:00' },
  evening: { label: 'Evening Wind-down', emoji: '🌙', defaultTime: '21:00' },
};

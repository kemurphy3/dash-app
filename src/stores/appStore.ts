import { create } from 'zustand';
import { Domain, Playbook, PlaybookWithTasks, Settings, Task, DomainType } from '../types';
import { 
  getDomains, 
  getPlaybookWithTasks, 
  getSettings,
  setSetting,
  updateDomainTriggerTime,
  updateDomainNotifications,
  updatePlaybookName,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  getTasksForPlaybook,
} from '../db';
import { rescheduleDomainNotifications } from '../notifications';

interface AppState {
  // Data
  domains: Domain[];
  settings: Settings;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  refreshDomains: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  
  // Domain actions
  updateTriggerTime: (domainId: string, time: string) => Promise<void>;
  toggleDomainNotifications: (domainId: string, enabled: boolean) => Promise<void>;
  
  // Settings actions
  setQuietHours: (enabled: boolean, start?: string, end?: string) => Promise<void>;
  setStreaksEnabled: (enabled: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  
  // Playbook actions
  getPlaybookWithTasks: (playbookId: string) => Promise<PlaybookWithTasks | null>;
  renamePlaybook: (playbookId: string, name: string) => Promise<void>;
  
  // Task actions
  addTask: (playbookId: string, title: string, description: string | null, duration: number) => Promise<Task>;
  editTask: (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'durationMinutes'>>) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  reorderPlaybookTasks: (playbookId: string, taskIds: string[]) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  domains: [],
  settings: {
    hasCompletedOnboarding: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    streaksEnabled: false,
  },
  isLoading: true,
  isInitialized: false,
  
  // Initialize app data
  initialize: async () => {
    try {
      set({ isLoading: true });
      
      const [domains, settings] = await Promise.all([
        getDomains(),
        getSettings(),
      ]);
      
      set({ 
        domains, 
        settings, 
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('[AppStore] Failed to initialize:', error);
      set({ isLoading: false });
    }
  },
  
  // Refresh domains from database
  refreshDomains: async () => {
    try {
      const domains = await getDomains();
      set({ domains });
    } catch (error) {
      console.error('[AppStore] Failed to refresh domains:', error);
    }
  },
  
  // Refresh settings from database
  refreshSettings: async () => {
    try {
      const settings = await getSettings();
      set({ settings });
    } catch (error) {
      console.error('[AppStore] Failed to refresh settings:', error);
    }
  },
  
  // Update domain trigger time
  updateTriggerTime: async (domainId: string, time: string) => {
    await updateDomainTriggerTime(domainId, time);
    await get().refreshDomains();
    // Reschedule notifications for this domain
    await rescheduleDomainNotifications(domainId);
  },
  
  // Toggle domain notifications
  toggleDomainNotifications: async (domainId: string, enabled: boolean) => {
    await updateDomainNotifications(domainId, enabled);
    await get().refreshDomains();
  },
  
  // Set quiet hours
  setQuietHours: async (enabled: boolean, start?: string, end?: string) => {
    await setSetting('quiet_hours_enabled', enabled.toString());
    if (start) await setSetting('quiet_hours_start', start);
    if (end) await setSetting('quiet_hours_end', end);
    await get().refreshSettings();
  },
  
  // Set streaks enabled
  setStreaksEnabled: async (enabled: boolean) => {
    await setSetting('streaks_enabled', enabled.toString());
    await get().refreshSettings();
  },
  
  // Complete onboarding
  completeOnboarding: async () => {
    await setSetting('has_completed_onboarding', 'true');
    await get().refreshSettings();
  },
  
  // Get playbook with tasks
  getPlaybookWithTasks: async (playbookId: string) => {
    return getPlaybookWithTasks(playbookId);
  },
  
  // Rename playbook
  renamePlaybook: async (playbookId: string, name: string) => {
    await updatePlaybookName(playbookId, name);
  },
  
  // Add task to playbook
  addTask: async (playbookId: string, title: string, description: string | null, duration: number) => {
    const tasks = await getTasksForPlaybook(playbookId);
    const sortOrder = tasks.length;
    return createTask(playbookId, title, description, duration, sortOrder);
  },
  
  // Edit task
  editTask: async (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'durationMinutes'>>) => {
    await updateTask(taskId, updates);
  },
  
  // Remove task
  removeTask: async (taskId: string) => {
    await deleteTask(taskId);
  },
  
  // Reorder tasks
  reorderPlaybookTasks: async (playbookId: string, taskIds: string[]) => {
    await reorderTasks(taskIds);
  },
}));

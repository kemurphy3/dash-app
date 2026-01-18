import { create } from 'zustand';
import { Domain, Task, TaskLog, TaskStatus, TaskWithStatus, DomainType } from '../types';
import { 
  getDatabase,
  getDomains,
  getPlaybookWithTasks,
  getTaskLogsForDate,
  createOrGetTaskLog,
  updateTaskLogStatus,
} from '../db';
import { getTodayDateString } from '../utils/date';
import { analytics } from '../utils/analytics';

interface DomainExecutionState {
  domain: Domain;
  tasks: TaskWithStatus[];
  currentTaskIndex: number;
  isCompleted: boolean;
}

interface ExecutionState {
  // Current execution state per domain
  domainStates: Map<string, DomainExecutionState>;
  
  // Currently active domain (for TaskCard view)
  activeDomainId: string | null;
  
  // Loading state
  isLoading: boolean;
  
  // Actions
  loadTodayState: () => Promise<void>;
  loadDomainState: (domainId: string) => Promise<void>;
  setActiveDomain: (domainId: string | null) => void;
  
  // Task actions
  completeTask: (domainId: string) => Promise<void>;
  skipTask: (domainId: string) => Promise<void>;
  
  // Computed
  getActiveDomainState: () => DomainExecutionState | null;
  getCurrentTask: (domainId: string) => TaskWithStatus | null;
  getDomainProgress: (domainId: string) => { completed: number; total: number; percentage: number };
  getTodayOverview: () => { 
    totalTasks: number; 
    completedTasks: number; 
    domains: Array<{ domain: Domain; progress: number; isCompleted: boolean }>;
  };
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  domainStates: new Map(),
  activeDomainId: null,
  isLoading: false,
  
  loadTodayState: async () => {
    set({ isLoading: true });
    
    try {
      const db = getDatabase();
      const domains = await getDomains(db);
      const today = getTodayDateString();
      
      const newStates = new Map<string, DomainExecutionState>();
      
      for (const domain of domains) {
        if (!domain.activePlaybookId) continue;
        
        const playbook = await getPlaybookWithTasks(db, domain.activePlaybookId);
        if (!playbook) continue;
        
        // Get or create task logs for today
        const existingLogs = await getTaskLogsForDate(db, domain.id, today);
        const logMap = new Map(existingLogs.map(l => [l.taskId, l]));
        
        // Create TaskWithStatus for each task
        const tasksWithStatus: TaskWithStatus[] = [];
        let currentTaskIndex = 0;
        let foundPending = false;
        
        for (let i = 0; i < playbook.tasks.length; i++) {
          const task = playbook.tasks[i];
          let log = logMap.get(task.id);
          
          // Create log if doesn't exist
          if (!log) {
            log = await createOrGetTaskLog(db, task.id, domain.id, today);
          }
          
          tasksWithStatus.push({
            ...task,
            status: log.status,
            logId: log.id,
          });
          
          // Find the first pending task
          if (!foundPending && log.status === 'pending') {
            currentTaskIndex = i;
            foundPending = true;
          }
        }
        
        // Check if all tasks are completed or skipped
        const isCompleted = tasksWithStatus.every(t => t.status !== 'pending');
        
        newStates.set(domain.id, {
          domain,
          tasks: tasksWithStatus,
          currentTaskIndex: isCompleted ? tasksWithStatus.length : currentTaskIndex,
          isCompleted,
        });
      }
      
      set({ domainStates: newStates, isLoading: false });
    } catch (error) {
      console.error('[ExecutionStore] Failed to load today state:', error);
      set({ isLoading: false });
    }
  },
  
  loadDomainState: async (domainId: string) => {
    const db = getDatabase();
    const domains = await getDomains(db);
    const domain = domains.find(d => d.id === domainId);
    
    if (!domain || !domain.activePlaybookId) return;
    
    const playbook = await getPlaybookWithTasks(db, domain.activePlaybookId);
    if (!playbook) return;
    
    const today = getTodayDateString();
    const existingLogs = await getTaskLogsForDate(db, domain.id, today);
    const logMap = new Map(existingLogs.map(l => [l.taskId, l]));
    
    const tasksWithStatus: TaskWithStatus[] = [];
    let currentTaskIndex = 0;
    let foundPending = false;
    
    for (let i = 0; i < playbook.tasks.length; i++) {
      const task = playbook.tasks[i];
      let log = logMap.get(task.id);
      
      if (!log) {
        log = await createOrGetTaskLog(db, task.id, domain.id, today);
      }
      
      tasksWithStatus.push({
        ...task,
        status: log.status,
        logId: log.id,
      });
      
      if (!foundPending && log.status === 'pending') {
        currentTaskIndex = i;
        foundPending = true;
      }
    }
    
    const isCompleted = tasksWithStatus.every(t => t.status !== 'pending');
    
    set((state) => {
      const newStates = new Map(state.domainStates);
      newStates.set(domainId, {
        domain,
        tasks: tasksWithStatus,
        currentTaskIndex: isCompleted ? tasksWithStatus.length : currentTaskIndex,
        isCompleted,
      });
      return { domainStates: newStates };
    });
  },
  
  setActiveDomain: (domainId: string | null) => {
    set({ activeDomainId: domainId });
  },
  
  completeTask: async (domainId: string) => {
    const state = get().domainStates.get(domainId);
    if (!state || state.isCompleted) return;
    
    const currentTask = state.tasks[state.currentTaskIndex];
    if (!currentTask || !currentTask.logId) return;
    
    const db = getDatabase();
    await updateTaskLogStatus(db, currentTask.logId, 'completed');
    
    // Track analytics
    analytics.taskCompleted(currentTask.id, state.domain.type);
    
    // Update local state
    set((s) => {
      const newStates = new Map(s.domainStates);
      const domainState = newStates.get(domainId);
      
      if (domainState) {
        const newTasks = [...domainState.tasks];
        newTasks[domainState.currentTaskIndex] = {
          ...newTasks[domainState.currentTaskIndex],
          status: 'completed',
        };
        
        // Find next pending task
        let nextIndex = domainState.currentTaskIndex + 1;
        while (nextIndex < newTasks.length && newTasks[nextIndex].status !== 'pending') {
          nextIndex++;
        }
        
        const isCompleted = nextIndex >= newTasks.length;
        
        if (isCompleted) {
          const completed = newTasks.filter(t => t.status === 'completed').length;
          const skipped = newTasks.filter(t => t.status === 'skipped').length;
          analytics.playbookCompleted(domainState.domain.type, completed, skipped);
        }
        
        newStates.set(domainId, {
          ...domainState,
          tasks: newTasks,
          currentTaskIndex: nextIndex,
          isCompleted,
        });
      }
      
      return { domainStates: newStates };
    });
  },
  
  skipTask: async (domainId: string) => {
    const state = get().domainStates.get(domainId);
    if (!state || state.isCompleted) return;
    
    const currentTask = state.tasks[state.currentTaskIndex];
    if (!currentTask || !currentTask.logId) return;
    
    const db = getDatabase();
    await updateTaskLogStatus(db, currentTask.logId, 'skipped');
    
    // Track analytics
    analytics.taskSkipped(currentTask.id, state.domain.type);
    
    // Update local state
    set((s) => {
      const newStates = new Map(s.domainStates);
      const domainState = newStates.get(domainId);
      
      if (domainState) {
        const newTasks = [...domainState.tasks];
        newTasks[domainState.currentTaskIndex] = {
          ...newTasks[domainState.currentTaskIndex],
          status: 'skipped',
        };
        
        // Find next pending task
        let nextIndex = domainState.currentTaskIndex + 1;
        while (nextIndex < newTasks.length && newTasks[nextIndex].status !== 'pending') {
          nextIndex++;
        }
        
        const isCompleted = nextIndex >= newTasks.length;
        
        if (isCompleted) {
          const completed = newTasks.filter(t => t.status === 'completed').length;
          const skipped = newTasks.filter(t => t.status === 'skipped').length;
          analytics.playbookCompleted(domainState.domain.type, completed, skipped);
        }
        
        newStates.set(domainId, {
          ...domainState,
          tasks: newTasks,
          currentTaskIndex: nextIndex,
          isCompleted,
        });
      }
      
      return { domainStates: newStates };
    });
  },
  
  getActiveDomainState: () => {
    const activeId = get().activeDomainId;
    if (!activeId) return null;
    return get().domainStates.get(activeId) || null;
  },
  
  getCurrentTask: (domainId: string) => {
    const state = get().domainStates.get(domainId);
    if (!state || state.isCompleted) return null;
    return state.tasks[state.currentTaskIndex] || null;
  },
  
  getDomainProgress: (domainId: string) => {
    const state = get().domainStates.get(domainId);
    if (!state) return { completed: 0, total: 0, percentage: 0 };
    
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'completed').length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { completed, total, percentage };
  },
  
  getTodayOverview: () => {
    const states = get().domainStates;
    let totalTasks = 0;
    let completedTasks = 0;
    const domains: Array<{ domain: Domain; progress: number; isCompleted: boolean }> = [];
    
    for (const [, state] of states) {
      totalTasks += state.tasks.length;
      const completed = state.tasks.filter(t => t.status === 'completed').length;
      completedTasks += completed;
      
      domains.push({
        domain: state.domain,
        progress: state.tasks.length > 0 ? (completed / state.tasks.length) * 100 : 0,
        isCompleted: state.isCompleted,
      });
    }
    
    // Sort by trigger time
    domains.sort((a, b) => a.domain.triggerTime.localeCompare(b.domain.triggerTime));
    
    return { totalTasks, completedTasks, domains };
  },
}));

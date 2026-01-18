import { create } from 'zustand';
import { 
  importFromYaml, 
  ImportResult, 
  ParsedPlan, 
  ValidationIssue,
  checkImportConflicts,
  saveParsedPlan,
  ConflictInfo,
  ImportSaveResult,
} from '../import';
import { getDatabase } from '../db';
import { analytics } from '../utils/analytics';

type ImportStep = 'input' | 'validating' | 'preview' | 'conflicts' | 'saving' | 'success' | 'error';

interface ImportState {
  // Current step
  step: ImportStep;
  
  // Input
  rawInput: string;
  
  // Validation results
  validationResult: ImportResult | null;
  parsedPlan: ParsedPlan | null;
  issues: ValidationIssue[];
  
  // Conflicts
  conflicts: ConflictInfo[];
  conflictResolutions: Map<string, 'replace' | 'skip'>; // domainType -> action
  
  // Save result
  saveResult: ImportSaveResult | null;
  
  // Error
  errorMessage: string | null;
  
  // Actions
  reset: () => void;
  setInput: (input: string) => void;
  validateInput: () => Promise<void>;
  checkConflicts: () => Promise<void>;
  setConflictResolution: (domainType: string, action: 'replace' | 'skip') => void;
  saveImport: () => Promise<void>;
  
  // Computed
  hasWarnings: () => boolean;
  hasErrors: () => boolean;
  canProceed: () => boolean;
}

export const useImportStore = create<ImportState>((set, get) => ({
  // Initial state
  step: 'input',
  rawInput: '',
  validationResult: null,
  parsedPlan: null,
  issues: [],
  conflicts: [],
  conflictResolutions: new Map(),
  saveResult: null,
  errorMessage: null,
  
  // Reset to initial state
  reset: () => {
    set({
      step: 'input',
      rawInput: '',
      validationResult: null,
      parsedPlan: null,
      issues: [],
      conflicts: [],
      conflictResolutions: new Map(),
      saveResult: null,
      errorMessage: null,
    });
  },
  
  // Set the raw YAML input
  setInput: (input: string) => {
    set({ rawInput: input, errorMessage: null });
  },
  
  // Validate the current input
  validateInput: async () => {
    const { rawInput } = get();
    
    if (!rawInput.trim()) {
      set({ 
        errorMessage: 'Please paste your ChatGPT export',
        step: 'input',
      });
      return;
    }
    
    set({ step: 'validating' });
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const result = importFromYaml(rawInput);
    
    if (!result.success || !result.plan) {
      set({
        step: 'error',
        validationResult: result,
        issues: result.issues,
        errorMessage: result.errorMessage || 'Failed to parse the plan',
        parsedPlan: null,
      });
      return;
    }
    
    // Track successful parse
    analytics.track('import_validated', {
      domain_count: result.plan.domains.length,
      total_playbooks: result.plan.domains.reduce((sum, d) => sum + d.playbooks.length, 0),
      has_warnings: result.issues.some(i => i.severity === 'warning'),
    });
    
    set({
      step: 'preview',
      validationResult: result,
      parsedPlan: result.plan,
      issues: result.issues,
      errorMessage: null,
    });
  },
  
  // Check for conflicts with existing data
  checkConflicts: async () => {
    const { parsedPlan } = get();
    if (!parsedPlan) return;
    
    const db = getDatabase();
    const conflicts = await checkImportConflicts(db, parsedPlan);
    
    if (conflicts.length > 0) {
      // Default all to replace
      const resolutions = new Map<string, 'replace' | 'skip'>();
      conflicts.forEach(c => resolutions.set(c.domainType, 'replace'));
      
      set({
        step: 'conflicts',
        conflicts,
        conflictResolutions: resolutions,
      });
    } else {
      // No conflicts, proceed to save
      await get().saveImport();
    }
  },
  
  // Set resolution for a conflict
  setConflictResolution: (domainType: string, action: 'replace' | 'skip') => {
    set(state => {
      const newResolutions = new Map(state.conflictResolutions);
      newResolutions.set(domainType, action);
      return { conflictResolutions: newResolutions };
    });
  },
  
  // Save the imported plan to the database
  saveImport: async () => {
    const { parsedPlan, conflictResolutions } = get();
    if (!parsedPlan) return;
    
    set({ step: 'saving' });
    
    const db = getDatabase();
    
    // Filter out skipped domains
    const filteredPlan: ParsedPlan = {
      ...parsedPlan,
      domains: parsedPlan.domains.filter(d => 
        conflictResolutions.get(d.type) !== 'skip'
      ),
    };
    
    // If all domains were skipped
    if (filteredPlan.domains.length === 0) {
      set({
        step: 'error',
        errorMessage: 'All domains were skipped. Nothing to import.',
      });
      return;
    }
    
    const result = await saveParsedPlan(db, filteredPlan, true);
    
    if (result.success) {
      // Track successful import
      analytics.track('import_completed', {
        plan_name: parsedPlan.name,
        domains_created: result.domainsCreated,
        playbooks_created: result.playbooksCreated,
        tasks_created: result.tasksCreated,
      });
      
      set({
        step: 'success',
        saveResult: result,
        errorMessage: null,
      });
    } else {
      set({
        step: 'error',
        saveResult: result,
        errorMessage: result.error || 'Failed to save the plan',
      });
    }
  },
  
  // Check if there are any warnings
  hasWarnings: () => {
    return get().issues.some(i => i.severity === 'warning');
  },
  
  // Check if there are any errors
  hasErrors: () => {
    return get().issues.some(i => i.severity === 'error');
  },
  
  // Check if we can proceed from current step
  canProceed: () => {
    const { step, rawInput, parsedPlan } = get();
    
    switch (step) {
      case 'input':
        return rawInput.trim().length > 0;
      case 'preview':
        return parsedPlan !== null;
      case 'conflicts':
        return true; // Can always proceed from conflicts (at least one domain selected)
      default:
        return false;
    }
  },
}));

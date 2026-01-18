import { create } from 'zustand';
import { DomainType, PlaybookTemplate } from '../types';
import { getTemplatesForDomain, getTemplateById } from '../constants/templates';
import { DOMAIN_INFO } from '../types';
import { 
  getDatabase, 
  createDomain, 
  createPlaybookFromTemplate,
  setSetting,
} from '../db';

interface DomainSetup {
  type: DomainType;
  selectedTemplateId: string | null;
  triggerTime: string;
}

interface OnboardingState {
  // Current step (for navigation)
  currentStep: number;
  
  // Selected domains with their configuration
  selectedDomains: Map<DomainType, DomainSetup>;
  
  // Current domain being configured (for playbook selection)
  currentDomainIndex: number;
  
  // Actions
  reset: () => void;
  toggleDomain: (type: DomainType) => void;
  setSelectedTemplate: (domainType: DomainType, templateId: string) => void;
  setTriggerTime: (domainType: DomainType, time: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  
  // Computed
  getSelectedDomainTypes: () => DomainType[];
  getDomainSetup: (type: DomainType) => DomainSetup | undefined;
  getTemplatesForCurrentDomain: () => PlaybookTemplate[];
  getCurrentDomainType: () => DomainType | null;
  isValid: () => boolean;
  
  // Final action
  completeOnboarding: () => Promise<void>;
}

const STEPS = {
  WELCOME: 0,
  DOMAINS: 1,
  PLAYBOOKS: 2,
  TIMES: 3,
  CONFIRM: 4,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: STEPS.WELCOME,
  selectedDomains: new Map(),
  currentDomainIndex: 0,
  
  reset: () => {
    set({
      currentStep: STEPS.WELCOME,
      selectedDomains: new Map(),
      currentDomainIndex: 0,
    });
  },
  
  toggleDomain: (type: DomainType) => {
    set((state) => {
      const newSelected = new Map(state.selectedDomains);
      
      if (newSelected.has(type)) {
        newSelected.delete(type);
      } else {
        newSelected.set(type, {
          type,
          selectedTemplateId: null,
          triggerTime: DOMAIN_INFO[type].defaultTime,
        });
      }
      
      return { selectedDomains: newSelected };
    });
  },
  
  setSelectedTemplate: (domainType: DomainType, templateId: string) => {
    set((state) => {
      const newSelected = new Map(state.selectedDomains);
      const existing = newSelected.get(domainType);
      
      if (existing) {
        newSelected.set(domainType, {
          ...existing,
          selectedTemplateId: templateId,
        });
      }
      
      return { selectedDomains: newSelected };
    });
  },
  
  setTriggerTime: (domainType: DomainType, time: string) => {
    set((state) => {
      const newSelected = new Map(state.selectedDomains);
      const existing = newSelected.get(domainType);
      
      if (existing) {
        newSelected.set(domainType, {
          ...existing,
          triggerTime: time,
        });
      }
      
      return { selectedDomains: newSelected };
    });
  },
  
  nextStep: () => {
    set((state) => {
      // If we're on playbooks step and have more domains to configure
      if (state.currentStep === STEPS.PLAYBOOKS) {
        const domainTypes = get().getSelectedDomainTypes();
        if (state.currentDomainIndex < domainTypes.length - 1) {
          return { currentDomainIndex: state.currentDomainIndex + 1 };
        }
      }
      
      return { 
        currentStep: Math.min(state.currentStep + 1, STEPS.CONFIRM),
        currentDomainIndex: 0, // Reset for next time
      };
    });
  },
  
  prevStep: () => {
    set((state) => {
      // If we're on playbooks step and not on first domain
      if (state.currentStep === STEPS.PLAYBOOKS && state.currentDomainIndex > 0) {
        return { currentDomainIndex: state.currentDomainIndex - 1 };
      }
      
      return { 
        currentStep: Math.max(state.currentStep - 1, STEPS.WELCOME),
        // If going back to playbooks, go to last domain
        currentDomainIndex: state.currentStep === STEPS.TIMES 
          ? get().getSelectedDomainTypes().length - 1 
          : 0,
      };
    });
  },
  
  goToStep: (step: number) => {
    set({ currentStep: step, currentDomainIndex: 0 });
  },
  
  getSelectedDomainTypes: () => {
    const domains = get().selectedDomains;
    // Return in a consistent order: morning, exercise, evening
    const order: DomainType[] = ['morning', 'exercise', 'evening'];
    return order.filter(type => domains.has(type));
  },
  
  getDomainSetup: (type: DomainType) => {
    return get().selectedDomains.get(type);
  },
  
  getTemplatesForCurrentDomain: () => {
    const currentType = get().getCurrentDomainType();
    if (!currentType) return [];
    return getTemplatesForDomain(currentType);
  },
  
  getCurrentDomainType: () => {
    const types = get().getSelectedDomainTypes();
    const index = get().currentDomainIndex;
    return types[index] || null;
  },
  
  isValid: () => {
    const domains = get().selectedDomains;
    
    // Must have at least one domain
    if (domains.size === 0) return false;
    
    // Each domain must have a template selected
    for (const [, setup] of domains) {
      if (!setup.selectedTemplateId) return false;
    }
    
    return true;
  },
  
  completeOnboarding: async () => {
    const db = getDatabase();
    const domains = get().selectedDomains;
    
    // Create domains and playbooks
    for (const [, setup] of domains) {
      // Create the domain
      const domain = await createDomain(db, setup.type, setup.triggerTime);
      
      // Get the template
      const template = getTemplateById(setup.selectedTemplateId!);
      if (template) {
        // Create playbook from template
        await createPlaybookFromTemplate(
          db,
          domain.id,
          template.name,
          template.tasks
        );
      }
    }
    
    // Mark onboarding complete
    await setSetting(db, 'has_completed_onboarding', 'true');
    
    // Reset the store
    get().reset();
  },
}));

export { STEPS };

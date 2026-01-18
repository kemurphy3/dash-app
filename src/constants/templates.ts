import { PlaybookTemplate, DomainType } from '../types';

export const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  // MORNING TEMPLATES
  {
    id: 'morning-energizing',
    domainType: 'morning',
    name: 'Energizing Start',
    description: 'High-energy morning to kickstart your day',
    tasks: [
      { title: 'Drink a full glass of water', description: 'Hydrate first thing', durationMinutes: 1 },
      { title: 'Do 20 jumping jacks', description: 'Get the blood flowing', durationMinutes: 2 },
      { title: 'Make your bed', description: 'First win of the day', durationMinutes: 2 },
      { title: 'Shower (end with 30 seconds cold)', description: 'Wake up your nervous system', durationMinutes: 10 },
      { title: 'Eat a protein-rich breakfast', description: null, durationMinutes: 15 },
    ],
  },
  {
    id: 'morning-gentle',
    domainType: 'morning',
    name: 'Gentle Wake-up',
    description: 'Ease into your day without stress',
    tasks: [
      { title: 'Stay in bed and stretch for 2 minutes', description: 'Gentle movement before standing', durationMinutes: 2 },
      { title: 'Drink warm water with lemon', description: 'Gentle hydration', durationMinutes: 2 },
      { title: 'Sit quietly for 5 minutes', description: 'No phone, just breathe', durationMinutes: 5 },
      { title: 'Make your bed', description: 'Create order', durationMinutes: 2 },
      { title: 'Prepare a simple breakfast', description: null, durationMinutes: 10 },
    ],
  },
  {
    id: 'morning-minimal',
    domainType: 'morning',
    name: 'Minimal Morning',
    description: 'Just the essentials, nothing more',
    tasks: [
      { title: 'Glass of water', description: null, durationMinutes: 1 },
      { title: 'Make your bed', description: null, durationMinutes: 2 },
      { title: 'Get dressed', description: 'Outfit decided the night before', durationMinutes: 5 },
    ],
  },
  {
    id: 'morning-mindful',
    domainType: 'morning',
    name: 'Mindful Morning',
    description: 'Start with intention and clarity',
    tasks: [
      { title: 'Drink water', description: null, durationMinutes: 1 },
      { title: '10-minute meditation', description: 'Use any app or just sit quietly', durationMinutes: 10 },
      { title: 'Write 3 things you\'re grateful for', description: 'In a journal or notes app', durationMinutes: 5 },
      { title: 'Review your one priority for today', description: 'What must happen?', durationMinutes: 2 },
      { title: 'Make your bed', description: null, durationMinutes: 2 },
    ],
  },

  // EXERCISE TEMPLATES
  {
    id: 'exercise-bodyweight',
    domainType: 'exercise',
    name: 'Bodyweight Basics',
    description: 'No equipment needed, full body workout',
    tasks: [
      { title: 'Warm-up: 2 minutes jumping jacks', description: 'Get your heart rate up', durationMinutes: 2 },
      { title: '20 push-ups', description: 'Modify on knees if needed', durationMinutes: 3 },
      { title: '30 squats', description: 'Keep your weight in your heels', durationMinutes: 3 },
      { title: '30-second plank', description: 'Keep your core tight', durationMinutes: 1 },
      { title: '20 lunges (10 each leg)', description: 'Alternate legs', durationMinutes: 3 },
      { title: '2-minute stretching cooldown', description: 'Focus on legs and shoulders', durationMinutes: 2 },
    ],
  },
  {
    id: 'exercise-walking',
    domainType: 'exercise',
    name: '30-Minute Walk',
    description: 'Simple, sustainable movement',
    tasks: [
      { title: 'Put on walking shoes', description: null, durationMinutes: 2 },
      { title: 'Walk for 30 minutes', description: 'Brisk pace, no phone scrolling', durationMinutes: 30 },
      { title: 'Quick calf stretch when you return', description: '30 seconds each leg', durationMinutes: 2 },
    ],
  },
  {
    id: 'exercise-hiit',
    domainType: 'exercise',
    name: '15-Minute HIIT',
    description: 'Short but intense',
    tasks: [
      { title: '1-minute warm-up jog in place', description: null, durationMinutes: 1 },
      { title: '30 seconds burpees, 30 seconds rest', description: 'Repeat 3 times', durationMinutes: 3 },
      { title: '30 seconds mountain climbers, 30 seconds rest', description: 'Repeat 3 times', durationMinutes: 3 },
      { title: '30 seconds high knees, 30 seconds rest', description: 'Repeat 3 times', durationMinutes: 3 },
      { title: '30 seconds jump squats, 30 seconds rest', description: 'Repeat 3 times', durationMinutes: 3 },
      { title: '2-minute cooldown stretching', description: null, durationMinutes: 2 },
    ],
  },
  {
    id: 'exercise-yoga',
    domainType: 'exercise',
    name: '20-Minute Yoga Flow',
    description: 'Flexibility and mindfulness',
    tasks: [
      { title: 'Child\'s pose (1 minute)', description: 'Ground yourself', durationMinutes: 1 },
      { title: 'Cat-cow stretches (2 minutes)', description: 'Warm up your spine', durationMinutes: 2 },
      { title: 'Downward dog (1 minute)', description: 'Pedal your feet', durationMinutes: 1 },
      { title: 'Sun salutation A (3 rounds)', description: null, durationMinutes: 5 },
      { title: 'Warrior I and II (each side)', description: '30 seconds each pose', durationMinutes: 4 },
      { title: 'Seated forward fold (2 minutes)', description: null, durationMinutes: 2 },
      { title: 'Savasana (5 minutes)', description: 'Final rest', durationMinutes: 5 },
    ],
  },
  {
    id: 'exercise-micro',
    domainType: 'exercise',
    name: 'Micro Movement',
    description: 'Better than nothing—just 5 minutes',
    tasks: [
      { title: '10 push-ups', description: 'Any variation', durationMinutes: 1 },
      { title: '10 squats', description: null, durationMinutes: 1 },
      { title: '30-second plank', description: null, durationMinutes: 1 },
      { title: '1-minute stretching', description: 'Whatever feels tight', durationMinutes: 1 },
    ],
  },

  // EVENING TEMPLATES
  {
    id: 'evening-unwind',
    domainType: 'evening',
    name: 'Full Unwind',
    description: 'Complete wind-down routine for better sleep',
    tasks: [
      { title: 'Set phone to Do Not Disturb', description: 'No more notifications tonight', durationMinutes: 1 },
      { title: 'Prepare tomorrow\'s outfit', description: 'One less decision tomorrow', durationMinutes: 5 },
      { title: 'Quick tidy of your space', description: '5 minutes max', durationMinutes: 5 },
      { title: 'Skincare routine', description: 'Whatever your current routine is', durationMinutes: 10 },
      { title: 'Read for 15 minutes', description: 'Physical book preferred', durationMinutes: 15 },
      { title: 'Lights out', description: 'Put phone in another room', durationMinutes: 1 },
    ],
  },
  {
    id: 'evening-simple',
    domainType: 'evening',
    name: 'Simple Wind-down',
    description: 'Quick and easy evening routine',
    tasks: [
      { title: 'Phone on charger, away from bed', description: null, durationMinutes: 1 },
      { title: 'Brush teeth and wash face', description: null, durationMinutes: 5 },
      { title: 'Set one intention for tomorrow', description: 'What\'s the one thing?', durationMinutes: 2 },
    ],
  },
  {
    id: 'evening-skincare',
    domainType: 'evening',
    name: 'Skincare Focus',
    description: 'Detailed skincare routine',
    tasks: [
      { title: 'Remove makeup/sunscreen with oil cleanser', description: 'Massage for 60 seconds', durationMinutes: 2 },
      { title: 'Second cleanse with water-based cleanser', description: null, durationMinutes: 2 },
      { title: 'Apply toner', description: 'Pat into skin', durationMinutes: 1 },
      { title: 'Apply serum', description: 'Let it absorb for 1 minute', durationMinutes: 2 },
      { title: 'Apply moisturizer', description: null, durationMinutes: 1 },
      { title: 'Apply eye cream', description: 'Gentle patting motion', durationMinutes: 1 },
    ],
  },
  {
    id: 'evening-reflection',
    domainType: 'evening',
    name: 'Evening Reflection',
    description: 'End the day with intention',
    tasks: [
      { title: 'Write down 3 wins from today', description: 'Big or small, they count', durationMinutes: 3 },
      { title: 'Write down 1 thing to improve', description: 'No judgment, just awareness', durationMinutes: 2 },
      { title: 'Set tomorrow\'s top priority', description: 'Just one thing', durationMinutes: 2 },
      { title: '5-minute breathing exercise', description: '4-7-8 breathing or box breathing', durationMinutes: 5 },
      { title: 'Get into bed', description: null, durationMinutes: 1 },
    ],
  },
];

// Helper to get templates for a specific domain
export function getTemplatesForDomain(domainType: DomainType): PlaybookTemplate[] {
  return PLAYBOOK_TEMPLATES.filter(t => t.domainType === domainType);
}

// Helper to get a specific template by ID
export function getTemplateById(templateId: string): PlaybookTemplate | undefined {
  return PLAYBOOK_TEMPLATES.find(t => t.id === templateId);
}

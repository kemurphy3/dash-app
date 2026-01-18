/**
 * DASH Copy Constants
 * 
 * All user-facing copy is centralized here to ensure:
 * 1. Consistent tone (supportive, not judgmental)
 * 2. Positive framing (focus on what was done, not what wasn't)
 * 3. Assistant-not-authority voice (DASH helps, doesn't dictate)
 * 
 * COPY RULES:
 * - Never use: "failed", "missed", "forgot", "didn't", "should have"
 * - Prefer: "completed", "done", "ready", "next", "continue"
 * - Frame skips as neutral data, not failures
 * - Celebrate completion without making non-completion feel bad
 */

export const COPY = {
  // ============================================================
  // ONBOARDING
  // ============================================================
  onboarding: {
    welcome: {
      title: "Welcome to DASH",
      subtitle: "Daily Actions, Stop Hesitating",
      description: "DASH helps you execute routines you've already decided on. No planning, no negotiating—just doing.",
      cta: "Get Started",
    },
    domains: {
      title: "Choose your focus areas",
      subtitle: "Pick 1-3 areas where you want consistent daily routines. You can always add more later.",
    },
    playbooks: {
      title: "Select your playbooks",
      subtitle: "Choose a starting routine for each area. You can customize these anytime.",
    },
    times: {
      title: "Set your trigger times",
      subtitle: "When should DASH remind you? Pick times that fit your schedule.",
      tip: "Start with realistic times. It's better to build consistency with achievable times than to set ambitious ones.",
    },
    notifications: {
      title: "Enable Notifications",
      subtitle: "DASH reminds you at your scheduled times. Without notifications, you'll need to remember to open the app yourself.",
      benefits: [
        "Get reminded at the right time",
        "One tap to start your routine",
        "No need to remember anything",
      ],
      enableButton: "Enable Notifications",
      skipButton: "Continue Without Notifications",
      deniedTitle: "Notifications were denied",
      deniedText: "You can enable them later in Settings if you change your mind.",
    },
    confirm: {
      title: "You're all set",
      subtitle: "Here's what you've set up. You can adjust any of this in Settings.",
      startButton: "Start Using DASH",
    },
  },

  // ============================================================
  // TODAY SCREEN
  // ============================================================
  today: {
    greeting: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
    },
    progress: {
      label: "Today's progress",
      allDone: "🎉 All done for today!",
    },
    routines: {
      title: "Your routines",
      empty: "No routines set up yet.",
      startButton: "Start →",
      doneButton: "✓ Done",
      nextUp: "Next up:",
    },
  },

  // ============================================================
  // TASK EXECUTION
  // ============================================================
  task: {
    reminder: "You already decided to do this. Just execute.",
    buttons: {
      done: "Done ✓",
      skip: "Skip",
      snooze: "Snooze 30m",
    },
    completion: {
      title: "Playbook Complete!",
      subtitle: (total: number, domainName: string) => 
        `You finished all ${total} tasks in ${domainName}`,
      stats: {
        completed: "Completed",
        skipped: "Skipped",  // Neutral language
      },
      backButton: "Back to Today",
    },
    snooze: {
      title: "Snoozed for 30 minutes",
      message: "We'll remind you soon.",
    },
  },

  // ============================================================
  // WEEKLY REVIEW
  // ============================================================
  review: {
    title: "Your Week",
    empty: {
      title: "No activity yet this week",
      message: "Complete some tasks and your weekly review will appear here.",
      cta: "Go to Today",
    },
    // Positive framing based on completion rate
    messages: {
      excellent: { emoji: "🌟", text: "Outstanding week!" },      // 90%+
      great: { emoji: "💪", text: "Great progress!" },            // 70-89%
      solid: { emoji: "👍", text: "Solid effort!" },              // 50-69%
      building: { emoji: "🌱", text: "Building momentum" },       // 30-49%
      starting: { emoji: "🚀", text: "Every step counts" },       // 1-29%
      fresh: { emoji: "✨", text: "Ready for a fresh start" },    // 0%
    },
    stats: {
      tasksCompleted: "tasks completed",
      scheduled: "scheduled",
      completion: "completion",
    },
    domains: {
      title: "By Domain",
      completed: "completed",
    },
    insights: {
      title: "Highlights",
      mostConsistent: "Most Consistent",
      mostConsistentDesc: (domainName: string) =>
        `Your ${domainName.toLowerCase()} routine had the highest completion rate this week.`,
    },
    action: {
      title: "Review & Adjust Playbooks",
      subtitle: "Fine-tune your routines based on this week's experience",
    },
  },

  // ============================================================
  // SETTINGS
  // ============================================================
  settings: {
    title: "Settings",
    notifications: {
      title: "NOTIFICATIONS",
    },
    quietHours: {
      title: "QUIET HOURS",
      description: "Notifications won't fire during quiet hours. They'll be delayed until quiet hours end.",
      toggle: "Enable Quiet Hours",
      start: "Start Time",
      end: "End Time",
    },
    display: {
      title: "DISPLAY",
      streaks: {
        label: "Show Streaks",
        hint: "Display consecutive day counts",
      },
    },
    about: {
      title: "ABOUT",
      version: "Version",
      reset: "Reset All Data",
    },
    resetConfirm: {
      title: "Reset All Data",
      message: "This will delete all your playbooks, tasks, and progress. This cannot be undone.",
      cancel: "Cancel",
      confirm: "Reset Everything",
      success: "All data has been reset. Please restart the app.",
      error: "Failed to reset data. Please try again.",
    },
    footer: {
      tagline: "DASH • Daily Actions, Stop Hesitating",
      motto: "You already decided. Just do it.",
    },
  },

  // ============================================================
  // PLAYBOOKS
  // ============================================================
  playbooks: {
    title: "Playbooks",
    subtitle: "Your pre-built routines. Tap to view or edit.",
    empty: "No playbooks yet. Complete onboarding to get started.",
    noPlaybook: "No playbook selected",
    edit: {
      tapToEdit: "Tap to edit",
      tasks: "Tasks",
      addTask: "+ Add Task",
      emptyTasks: {
        title: "No tasks yet",
        subtitle: "Add your first task to get started",
      },
    },
    task: {
      edit: "✏️ Edit",
      moveUp: "↑ Move Up",
      moveDown: "↓ Move Down",
      remove: "🗑️ Remove",
    },
    taskModal: {
      addTitle: "Add Task",
      editTitle: "Edit Task",
      cancel: "Cancel",
      save: "Save",
      titleLabel: "Task Title *",
      titlePlaceholder: "What needs to be done?",
      titleHint: 'Be specific. "Do 20 pushups" is better than "Exercise"',
      descriptionLabel: "Description (optional)",
      descriptionPlaceholder: "Additional details or instructions",
      durationLabel: "Duration (minutes)",
      durationHint: "How long will this typically take? (1-120 minutes)",
    },
    removeConfirm: {
      title: "Remove Task",
      message: (taskTitle: string) => `Remove "${taskTitle}" from this playbook?`,
      cancel: "Cancel",
      confirm: "Remove",
    },
  },

  // ============================================================
  // IMPORT
  // ============================================================
  import: {
    title: "Import from ChatGPT",
    pasteLabel: "Paste your DASH plan",
    pastePlaceholder: "Paste the YAML that ChatGPT generated...",
    pasteButton: "Paste from Clipboard",
    validateButton: "Validate & Preview",
    // ... (import copy continues)
  },

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  notifications: {
    domainTitle: (domainName: string) => `DASH: ${domainName}`,
    taskBody: (taskTitle: string) => `Time for: ${taskTitle}`,
    reminderBody: (taskTitle: string) => `Reminder: ${taskTitle}`,
    permissionDenied: {
      title: "Notifications are off",
      message: "DASH works best with notifications. Without them, you'll need to remember to open the app yourself.",
      enableButton: "Enable Notifications",
      settingsButton: "Open Settings",
    },
  },

  // ============================================================
  // ERRORS
  // ============================================================
  errors: {
    generic: {
      title: "Something went wrong",
      message: "The app ran into an unexpected problem. This has been logged.",
      retry: "Try Again",
    },
    notFound: {
      playbook: "Playbook not found",
      domain: "Domain not found",
    },
    validation: {
      taskTitleRequired: "Task title is required",
      durationRange: "Duration must be between 1 and 120 minutes",
    },
  },
};

/**
 * Get completion message based on rate
 * Always positive framing - focus on what was accomplished
 */
export function getCompletionMessage(rate: number): { emoji: string; text: string } {
  if (rate >= 0.9) return COPY.review.messages.excellent;
  if (rate >= 0.7) return COPY.review.messages.great;
  if (rate >= 0.5) return COPY.review.messages.solid;
  if (rate >= 0.3) return COPY.review.messages.building;
  if (rate > 0) return COPY.review.messages.starting;
  return COPY.review.messages.fresh;
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return COPY.today.greeting.morning;
  if (hour < 17) return COPY.today.greeting.afternoon;
  return COPY.today.greeting.evening;
}

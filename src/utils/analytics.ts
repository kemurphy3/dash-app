/**
 * Analytics stub interface
 * Replace with actual analytics provider (Amplitude, Mixpanel, etc.) when ready
 */

type AnalyticsProperties = Record<string, string | number | boolean | string[] | undefined>;

// Event names enum for type safety
export const ANALYTICS_EVENTS = {
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_DOMAINS_SELECTED: 'onboarding_domains_selected',
  ONBOARDING_PLAYBOOK_SELECTED: 'onboarding_playbook_selected',
  ONBOARDING_TIMES_SET: 'onboarding_times_set',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  
  // Execution
  TASK_VIEWED: 'task_viewed',
  TASK_COMPLETED: 'task_completed',
  TASK_SKIPPED: 'task_skipped',
  TASK_SNOOZED: 'task_snoozed',
  PLAYBOOK_COMPLETED: 'playbook_completed',
  
  // Engagement
  APP_OPENED: 'app_opened',
  NOTIFICATION_RECEIVED: 'notification_received',
  WEEKLY_REVIEW_VIEWED: 'weekly_review_viewed',
  
  // Settings
  QUIET_HOURS_CHANGED: 'quiet_hours_changed',
  STREAKS_TOGGLED: 'streaks_toggled',
  DOMAIN_NOTIFICATIONS_TOGGLED: 'domain_notifications_toggled',
  
  // Editing
  PLAYBOOK_EDITED: 'playbook_edited',
  TASK_EDITED: 'task_edited',
} as const;

// In development, just log to console
const isDev = __DEV__;

/**
 * Track an analytics event
 */
export function trackEvent(eventName: string, properties?: AnalyticsProperties): void {
  if (isDev) {
    console.log(`[Analytics] ${eventName}`, properties || {});
  }
  
  // TODO: Replace with actual analytics call
  // Example with Amplitude:
  // amplitude.track(eventName, properties);
}

/**
 * Identify a user (for when you add accounts later)
 */
export function identifyUser(userId: string, traits?: AnalyticsProperties): void {
  if (isDev) {
    console.log(`[Analytics] Identify user: ${userId}`, traits || {});
  }
  
  // TODO: Replace with actual analytics call
}

/**
 * Track screen view
 */
export function trackScreen(screenName: string, properties?: AnalyticsProperties): void {
  if (isDev) {
    console.log(`[Analytics] Screen: ${screenName}`, properties || {});
  }
  
  // TODO: Replace with actual analytics call
}

/**
 * Set user properties
 */
export function setUserProperties(properties: AnalyticsProperties): void {
  if (isDev) {
    console.log(`[Analytics] User properties:`, properties);
  }
  
  // TODO: Replace with actual analytics call
}

// Convenience functions for common events
export const analytics = {
  track: trackEvent,
  identify: identifyUser,
  screen: trackScreen,
  setUserProperties,
  
  // Typed event helpers
  onboardingStarted: () => trackEvent(ANALYTICS_EVENTS.ONBOARDING_STARTED),
  
  onboardingDomainsSelected: (domains: string[]) => 
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_DOMAINS_SELECTED, { domains }),
  
  onboardingPlaybookSelected: (domain: string, playbookName: string) =>
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_PLAYBOOK_SELECTED, { domain, playbook_name: playbookName }),
  
  onboardingCompleted: (domainCount: number) =>
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, { domain_count: domainCount }),
  
  taskViewed: (taskId: string, domain: string) =>
    trackEvent(ANALYTICS_EVENTS.TASK_VIEWED, { task_id: taskId, domain }),
  
  taskCompleted: (taskId: string, domain: string) =>
    trackEvent(ANALYTICS_EVENTS.TASK_COMPLETED, { task_id: taskId, domain }),
  
  taskSkipped: (taskId: string, domain: string) =>
    trackEvent(ANALYTICS_EVENTS.TASK_SKIPPED, { task_id: taskId, domain }),
  
  taskSnoozed: (taskId: string, domain: string, snoozeMinutes: number) =>
    trackEvent(ANALYTICS_EVENTS.TASK_SNOOZED, { task_id: taskId, domain, snooze_minutes: snoozeMinutes }),
  
  playbookCompleted: (domain: string, completedCount: number, skippedCount: number) =>
    trackEvent(ANALYTICS_EVENTS.PLAYBOOK_COMPLETED, { domain, completed_count: completedCount, skipped_count: skippedCount }),
  
  appOpened: (source: 'notification' | 'direct') =>
    trackEvent(ANALYTICS_EVENTS.APP_OPENED, { source }),
  
  weeklyReviewViewed: () =>
    trackEvent(ANALYTICS_EVENTS.WEEKLY_REVIEW_VIEWED),
};

export default analytics;

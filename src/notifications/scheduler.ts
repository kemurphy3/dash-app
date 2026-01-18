import * as Notifications from 'expo-notifications';
import { Domain, DomainType, Task } from '../types';
import { DOMAIN_INFO } from '../types';
import { parseTimeString, getDateForTimeToday, getDateForTimeTomorrow, hasTimePassed, getNextValidNotificationTime } from '../utils/time';
import { getDatabase, getDomains, getPlaybookWithTasks, getSettings, getTaskLogsForDate } from '../db';
import { getTodayDateString } from '../utils/date';

// Notification identifier prefix
const NOTIFICATION_PREFIX = 'dash_';

/**
 * Get notification identifier for a domain
 */
function getNotificationId(domainId: string, suffix: string = ''): string {
  return `${NOTIFICATION_PREFIX}${domainId}${suffix ? `_${suffix}` : ''}`;
}

/**
 * Cancel all DASH notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    if (notification.identifier.startsWith(NOTIFICATION_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
  
  console.log('[Notifications] Cancelled all DASH notifications');
}

/**
 * Cancel notifications for a specific domain
 */
export async function cancelDomainNotifications(domainId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    if (notification.identifier.startsWith(getNotificationId(domainId))) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
  
  console.log(`[Notifications] Cancelled notifications for domain ${domainId}`);
}

/**
 * Schedule a notification for a domain
 */
export async function scheduleDomainNotification(
  domain: Domain,
  firstTaskTitle: string,
  triggerDate: Date
): Promise<string | null> {
  const db = getDatabase();
  const settings = await getSettings(db);
  
  // Apply quiet hours if enabled
  const adjustedDate = getNextValidNotificationTime(
    triggerDate,
    settings.quietHoursEnabled,
    settings.quietHoursStart,
    settings.quietHoursEnd
  );
  
  // Don't schedule if the time has passed
  if (adjustedDate <= new Date()) {
    console.log(`[Notifications] Skipping past notification for ${domain.type}`);
    return null;
  }
  
  const domainInfo = DOMAIN_INFO[domain.type];
  
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `DASH: ${domainInfo.label}`,
      body: `Time for: ${firstTaskTitle}`,
      data: {
        domainId: domain.id,
        domainType: domain.type,
      },
      sound: true,
    },
    trigger: {
      date: adjustedDate,
    },
    identifier: getNotificationId(domain.id, adjustedDate.toISOString()),
  });
  
  console.log(`[Notifications] Scheduled ${domain.type} for ${adjustedDate.toLocaleString()}`);
  
  return identifier;
}

/**
 * Schedule snooze notification
 */
export async function scheduleSnoozeNotification(
  domain: Domain,
  taskTitle: string,
  snoozeUntil: Date
): Promise<string | null> {
  // Cancel existing notifications for this domain
  await cancelDomainNotifications(domain.id);
  
  const domainInfo = DOMAIN_INFO[domain.type];
  
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `DASH: ${domainInfo.label}`,
      body: `Reminder: ${taskTitle}`,
      data: {
        domainId: domain.id,
        domainType: domain.type,
        isSnooze: true,
      },
      sound: true,
    },
    trigger: {
      date: snoozeUntil,
    },
    identifier: getNotificationId(domain.id, `snooze_${snoozeUntil.toISOString()}`),
  });
  
  console.log(`[Notifications] Scheduled snooze for ${domain.type} at ${snoozeUntil.toLocaleString()}`);
  
  return identifier;
}

/**
 * Schedule all notifications for today and tomorrow
 */
export async function scheduleAllNotifications(): Promise<void> {
  const db = getDatabase();
  const domains = await getDomains(db);
  const today = getTodayDateString();
  
  // Cancel existing notifications first
  await cancelAllNotifications();
  
  for (const domain of domains) {
    // Skip if notifications are disabled for this domain
    if (!domain.notificationsEnabled) {
      continue;
    }
    
    // Skip if no active playbook
    if (!domain.activePlaybookId) {
      continue;
    }
    
    // Check if domain is already completed for today
    const logs = await getTaskLogsForDate(db, domain.id, today);
    const playbook = await getPlaybookWithTasks(db, domain.activePlaybookId);
    
    if (!playbook || playbook.tasks.length === 0) {
      continue;
    }
    
    // Find first incomplete task
    const logMap = new Map(logs.map(l => [l.taskId, l]));
    let firstIncompleteTask: Task | null = null;
    
    for (const task of playbook.tasks) {
      const log = logMap.get(task.id);
      if (!log || log.status === 'pending') {
        firstIncompleteTask = task;
        break;
      }
    }
    
    // If all tasks completed, skip today's notification
    if (!firstIncompleteTask) {
      // But still schedule for tomorrow
      const tomorrowDate = getDateForTimeTomorrow(domain.triggerTime);
      await scheduleDomainNotification(domain, playbook.tasks[0].title, tomorrowDate);
      continue;
    }
    
    // Schedule for today if time hasn't passed
    if (!hasTimePassed(domain.triggerTime)) {
      const todayDate = getDateForTimeToday(domain.triggerTime);
      await scheduleDomainNotification(domain, firstIncompleteTask.title, todayDate);
    }
    
    // Schedule for tomorrow
    const tomorrowDate = getDateForTimeTomorrow(domain.triggerTime);
    await scheduleDomainNotification(domain, playbook.tasks[0].title, tomorrowDate);
  }
}

/**
 * Reschedule notifications after a domain is updated
 */
export async function rescheduleDomainNotifications(domainId: string): Promise<void> {
  const db = getDatabase();
  const domains = await getDomains(db);
  const domain = domains.find(d => d.id === domainId);
  
  if (!domain) return;
  
  // Cancel existing
  await cancelDomainNotifications(domainId);
  
  if (!domain.notificationsEnabled || !domain.activePlaybookId) {
    return;
  }
  
  const playbook = await getPlaybookWithTasks(db, domain.activePlaybookId);
  if (!playbook || playbook.tasks.length === 0) {
    return;
  }
  
  const today = getTodayDateString();
  const logs = await getTaskLogsForDate(db, domain.id, today);
  const logMap = new Map(logs.map(l => [l.taskId, l]));
  
  // Find first incomplete task
  let firstIncompleteTask: Task | null = null;
  for (const task of playbook.tasks) {
    const log = logMap.get(task.id);
    if (!log || log.status === 'pending') {
      firstIncompleteTask = task;
      break;
    }
  }
  
  // Schedule for today if time hasn't passed and there are pending tasks
  if (firstIncompleteTask && !hasTimePassed(domain.triggerTime)) {
    const todayDate = getDateForTimeToday(domain.triggerTime);
    await scheduleDomainNotification(domain, firstIncompleteTask.title, todayDate);
  }
  
  // Schedule for tomorrow
  const tomorrowDate = getDateForTimeTomorrow(domain.triggerTime);
  await scheduleDomainNotification(domain, playbook.tasks[0].title, tomorrowDate);
}

/**
 * Get currently scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.filter(n => n.identifier.startsWith(NOTIFICATION_PREFIX));
}

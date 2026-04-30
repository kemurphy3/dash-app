import { format, parse, isValid } from 'date-fns';

/**
 * Parse a time string (HH:MM) and return hours and minutes
 */
export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

/**
 * Format hours and minutes to a time string (HH:MM)
 */
export function formatTimeString(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format a time string for display (e.g., "7:00 AM")
 */
export function formatTimeForDisplay(timeString: string): string {
  const { hours, minutes } = parseTimeString(timeString);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, 'h:mm a');
}

/**
 * Get a Date object for a specific time today
 */
export function getDateForTimeToday(timeString: string): Date {
  const { hours, minutes } = parseTimeString(timeString);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Get a Date object for a specific time tomorrow
 */
export function getDateForTimeTomorrow(timeString: string): Date {
  const date = getDateForTimeToday(timeString);
  date.setDate(date.getDate() + 1);
  return date;
}

/**
 * Check if a time has passed for today
 */
export function hasTimePassed(timeString: string): boolean {
  const targetTime = getDateForTimeToday(timeString);
  return new Date() > targetTime;
}

/**
 * Format duration in minutes for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Check if current time is within quiet hours
 */
export function isWithinQuietHours(
  quietStart: string,
  quietEnd: string,
  currentTime?: Date
): boolean {
  const now = currentTime || new Date();
  const { hours: startHours, minutes: startMinutes } = parseTimeString(quietStart);
  const { hours: endHours, minutes: endMinutes } = parseTimeString(quietEnd);
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startTotalMinutes > endTotalMinutes) {
    return currentMinutes >= startTotalMinutes || currentMinutes < endTotalMinutes;
  }
  
  // Same-day quiet hours (e.g., 14:00 - 16:00)
  return currentMinutes >= startTotalMinutes && currentMinutes < endTotalMinutes;
}

/**
 * Get the next valid notification time considering quiet hours
 */
export function getNextValidNotificationTime(
  targetTime: Date,
  quietHoursEnabled: boolean,
  quietStart: string,
  quietEnd: string
): Date {
  if (!quietHoursEnabled) {
    return targetTime;
  }
  
  if (!isWithinQuietHours(quietStart, quietEnd, targetTime)) {
    return targetTime;
  }
  
  // If target is within quiet hours, delay to quiet hours end
  const { hours: endHours, minutes: endMinutes } = parseTimeString(quietEnd);
  const adjustedTime = new Date(targetTime);
  adjustedTime.setHours(endHours, endMinutes, 0, 0);
  
  // If quiet end is before current time (overnight), move to next day
  if (adjustedTime <= targetTime) {
    adjustedTime.setDate(adjustedTime.getDate() + 1);
  }
  
  return adjustedTime;
}

/**
 * Calculate skip deferral time
 * Rule: If before 20:00, defer +60 minutes. If after 20:00, defer to next day at trigger_time.
 */
export function calculateSkipDeferralTime(triggerTime: string): Date {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinutes;
  const twentyOClock = 20 * 60; // 20:00 in minutes
  
  if (currentTotalMinutes < twentyOClock) {
    // Before 20:00: defer +60 minutes
    return new Date(now.getTime() + 60 * 60 * 1000);
  } else {
    // After 20:00: defer to next day at trigger_time
    const { hours, minutes } = parseTimeString(triggerTime);
    const deferredDate = new Date(now);
    deferredDate.setDate(deferredDate.getDate() + 1);
    deferredDate.setHours(hours, minutes, 0, 0);
    return deferredDate;
  }
}

/**
 * Calculate snooze time
 * Later Today rule: Defer to 17:00 local. If past 17:00, defer to +60 minutes.
 */
export function calculateSnoozeTime(snoozeMinutes: number | 'later'): Date {
  const now = new Date();
  
  if (snoozeMinutes === 'later') {
    // "Later Today" = 17:00 (5 PM) local. If past 17:00, defer +60 minutes.
    const fivePm = new Date(now);
    fivePm.setHours(17, 0, 0, 0);
    
    // If it's already past 5 PM, use +60 minutes
    if (now >= fivePm) {
      return new Date(now.getTime() + 60 * 60 * 1000);
    }
    
    // Otherwise, defer to 5 PM today
    return fivePm;
  }
  
  return new Date(now.getTime() + snoozeMinutes * 60 * 1000);
}

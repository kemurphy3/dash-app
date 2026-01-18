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
 * Calculate snooze time
 */
export function calculateSnoozeTime(snoozeMinutes: number | 'later'): Date {
  const now = new Date();
  
  if (snoozeMinutes === 'later') {
    // "Later Today" = 2 hours from now, or 8 PM if less than 2 hours until midnight
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const eightPm = new Date(now);
    eightPm.setHours(20, 0, 0, 0);
    
    // If it's already past 8 PM, use 2 hours
    if (now >= eightPm) {
      return twoHoursLater;
    }
    
    // If 2 hours from now is past midnight, use 8 PM
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    
    if (twoHoursLater >= midnight) {
      return eightPm;
    }
    
    return twoHoursLater;
  }
  
  return new Date(now.getTime() + snoozeMinutes * 60 * 1000);
}

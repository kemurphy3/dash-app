import { format, startOfWeek, endOfWeek, startOfDay, addDays, isSameDay, isWithinInterval } from 'date-fns';

/**
 * Get today's date as a string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get a date string for a specific date (YYYY-MM-DD)
 */
export function getDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the start of the current week (Monday)
 */
export function getWeekStart(date?: Date): Date {
  return startOfWeek(date || new Date(), { weekStartsOn: 1 }); // Monday
}

/**
 * Get the end of the current week (Sunday)
 */
export function getWeekEnd(date?: Date): Date {
  return endOfWeek(date || new Date(), { weekStartsOn: 1 }); // Sunday
}

/**
 * Get the week range as strings
 */
export function getWeekRange(date?: Date): { start: string; end: string } {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  return {
    start: getDateString(start),
    end: getDateString(end),
  };
}

/**
 * Format a date for display (e.g., "Mon, Jan 15")
 */
export function formatDateForDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? parseDateString(date) : date;
  return format(d, 'EEE, MMM d');
}

/**
 * Format a date range for display (e.g., "Jan 15 - Jan 21")
 */
export function formatWeekRange(startDate: string, endDate: string): string {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseDateString(date) : date;
  return isSameDay(d, new Date());
}

/**
 * Get an array of dates for the current week
 */
export function getWeekDates(date?: Date): Date[] {
  const start = getWeekStart(date);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(start, i));
  }
  return dates;
}

/**
 * Check if a date is within the current week
 */
export function isCurrentWeek(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseDateString(date) : date;
  const start = startOfDay(getWeekStart());
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  return isWithinInterval(d, { start, end });
}

/**
 * Get relative day label (Today, Tomorrow, or day name)
 */
export function getRelativeDayLabel(date: Date | string): string {
  const d = typeof date === 'string' ? parseDateString(date) : date;
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  
  if (isSameDay(d, today)) {
    return 'Today';
  }
  if (isSameDay(d, tomorrow)) {
    return 'Tomorrow';
  }
  return format(d, 'EEEE'); // Full day name
}

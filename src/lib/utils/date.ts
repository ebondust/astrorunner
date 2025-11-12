import type { ActivityDto, DistanceUnit } from "@/types";
import type { GroupedActivities } from "@/frontend-types";

/**
 * Format a date for display (e.g., "Monday, Nov 4")
 */
export function formatActivityDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a month and year for display (e.g., "November 2025")
 */
export function formatMonthYear(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    year: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Convert ISO-8601 duration (PT45M, PT1H30M) to human-readable format (45m, 1h 30m)
 */
export function formatDuration(isoDuration: string): string {
  // Handle HH:MM:SS format first
  if (isoDuration.match(/^\d{2}:\d{2}:\d{2}$/)) {
    const [hours, minutes] = isoDuration.split(':').map(Number);
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    }
    return '0m';
  }

  // Parse ISO-8601 duration format (PT1H30M or PT45M)
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return isoDuration; // Return as-is if can't parse
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds}s`); // Only show seconds if no hours

  return parts.length > 0 ? parts.join(' ') : '0m';
}

/**
 * Convert meters to kilometers or miles with proper formatting
 */
export function formatDistance(meters: number, unit: DistanceUnit): string {
  if (unit === 'km') {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  } else {
    const miles = meters / 1609.34;
    return `${miles.toFixed(2)} mi`;
  }
}

/**
 * Get the first and last day of a month
 */
export function getMonthRange(month: Date): { start: Date; end: Date } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
}

/**
 * Get the first day of the current month
 */
export function getCurrentMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Group activities by date
 */
export function groupActivitiesByDate(activities: ActivityDto[]): GroupedActivities[] {
  const grouped = new Map<string, ActivityDto[]>();

  // Group activities by date
  for (const activity of activities) {
    const date = new Date(activity.activityDate);
    const dateKey = date.toISOString().split('T')[0];

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(activity);
  }

  // Convert to array and sort by date (descending)
  const result: GroupedActivities[] = [];
  for (const [dateKey, activities] of grouped.entries()) {
    const date = new Date(dateKey);
    result.push({
      date,
      activities,
      isToday: isToday(date)
    });
  }

  // Sort by date descending (most recent first)
  result.sort((a, b) => b.date.getTime() - a.date.getTime());

  return result;
}

/**
 * Convert Date to ISO-8601 date string (YYYY-MM-DD)
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Convert Date to ISO-8601 UTC datetime string
 */
export function toISODateTime(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ISO-8601 date string to Date
 */
export function parseISODate(isoDate: string): Date {
  return new Date(isoDate);
}

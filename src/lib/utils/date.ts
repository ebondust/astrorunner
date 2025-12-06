import type { ActivityDto, DistanceUnit } from "@/types";
import type { GroupedActivities } from "@/frontend-types";

/**
 * Format a date for display (e.g., "Monday, Nov 4")
 */
export function formatActivityDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "short",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

/**
 * Format a month and year for display (e.g., "November 2025")
 */
export function formatMonthYear(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

/**
 * Convert ISO-8601 duration (PT45M, PT1H30M) to human-readable format (45m, 1h 30m)
 */
export function formatDuration(isoDuration: string): string {
  // Handle HH:MM:SS format first
  if (isoDuration.match(/^\d{2}:\d{2}:\d{2}$/)) {
    const [hours, minutes] = isoDuration.split(":").map(Number);
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    }
    return "0m";
  }

  // Parse ISO-8601 duration format (PT1H30M or PT45M)
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return isoDuration; // Return as-is if can't parse
  }

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds}s`); // Only show seconds if no hours

  return parts.length > 0 ? parts.join(" ") : "0m";
}

/**
 * Convert meters to kilometers or miles with proper formatting
 */
export function formatDistance(meters: number, unit: DistanceUnit): string {
  if (unit === "km") {
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
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
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
    const dateKey = date.toISOString().split("T")[0];

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    const group = grouped.get(dateKey);
    if (group) {
      group.push(activity);
    }
  }

  // Convert to array and sort by date (descending)
  const result: GroupedActivities[] = [];
  for (const [dateKey, activities] of grouped.entries()) {
    const date = new Date(dateKey);
    result.push({
      date,
      activities,
      isToday: isToday(date),
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
  return date.toISOString().split("T")[0];
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

/**
 * Convert duration from user input format (HH.MM, HH:MM, or minutes) to ISO-8601
 * - "10.1" or "10:1" → PT10H1M (10 hours 1 minute)
 * - "10.10" or "10:10" → PT10H10M (10 hours 10 minutes)
 * - "10" → PT10M (10 minutes)
 */
export function durationInputToISO8601(input: string): string {
  // Handle HH.MM or HH:MM format
  const timeMatch = input.match(/^(\d{1,2})([:.])(\d{2})$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[3], 10);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}H`);
    if (minutes > 0) parts.push(`${minutes}M`);

    return `PT${parts.join("")}`;
  }

  // Handle single number (minutes)
  const singleMatch = input.match(/^(\d+)$/);
  if (singleMatch) {
    const minutes = parseInt(singleMatch[1], 10);
    return `PT${minutes}M`;
  }

  // Fallback (shouldn't reach here if validation passed)
  return input;
}

/**
 * Convert duration from ISO-8601 to user-friendly input format (HH.MM)
 * - PT10H1M → "10.1"
 * - PT10H10M → "10.10"
 * - PT10M → "10" (or "0.10" depending on preference)
 */
export function iso8601ToDurationInput(iso8601: string): string {
  // Parse ISO-8601 duration
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return iso8601; // Return as-is if can't parse
  }

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);

  // If we have hours, return in HH.MM format
  if (hours > 0) {
    return `${hours}.${String(minutes).padStart(2, "0")}`;
  }

  // If only minutes, return as single number
  return String(minutes);
}

/**
 * Convert distance from km to meters (for storage)
 */
export function kmToMeters(km: number): number {
  return km * 1000;
}

/**
 * Convert distance from meters to km (for display/input)
 */
export function metersToKm(meters: number): number {
  return meters / 1000;
}

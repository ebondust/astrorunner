import type { SupabaseClient } from '../../db/supabase.client';
import type { ActivityStats } from '../services/openrouter.types';
import type { ActivityEntity } from '../../types';

/**
 * Aggregate activity statistics for a given month
 */
export async function aggregateActivityStats(
  supabase: SupabaseClient,
  userId: string,
  date: Date,
  distanceUnit: 'km' | 'mi' = 'km'
): Promise<ActivityStats> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  // Calculate month boundaries
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  const today = new Date();
  const daysElapsed = today.getMonth() === month - 1 && today.getFullYear() === year
    ? today.getDate()
    : totalDays;
  const daysRemaining = totalDays - daysElapsed;

  // Fetch activities for the month
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('activity_date', firstDay.toISOString())
    .lte('activity_date', lastDay.toISOString());

  if (error) {
    throw new Error(`Failed to fetch activities: ${error.message}`);
  }

  // Aggregate statistics
  let runCount = 0;
  let walkCount = 0;
  let mixedCount = 0;
  let totalDistanceMeters = 0;
  let totalSeconds = 0;

  for (const activity of activities || []) {
    // Count by type
    if (activity.activity_type === 'Run') runCount++;
    else if (activity.activity_type === 'Walk') walkCount++;
    else if (activity.activity_type === 'Mixed') mixedCount++;

    // Sum distance
    if (activity.distance != null) {
      totalDistanceMeters += activity.distance;
    }

    // Sum duration (convert interval to seconds)
    if (activity.duration) {
      const seconds = parseIntervalToSeconds(activity.duration);
      totalSeconds += seconds;
    }
  }

  return {
    totalActivities: activities?.length || 0,
    runCount,
    walkCount,
    mixedCount,
    totalDistanceMeters,
    totalDuration: secondsToISODuration(totalSeconds),
    month,
    year,
    daysElapsed,
    daysRemaining,
    totalDays,
    distanceUnit,
  };
}

/**
 * Parse PostgreSQL interval to total seconds
 */
function parseIntervalToSeconds(interval: unknown): number {
  if (typeof interval !== 'string') return 0;

  // Handle HH:MM:SS format
  const timeMatch = interval.match(/^(\d+):(\d+):(\d+)$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Handle ISO-8601 duration (PT1H30M15S)
  const isoMatch = interval.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || '0', 10);
    const minutes = parseInt(isoMatch[2] || '0', 10);
    const seconds = parseInt(isoMatch[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Handle word format (e.g., "1 hour 30 minutes")
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  const hourMatch = interval.match(/(\d+)\s+hour(?:s)?/);
  if (hourMatch) hours = parseInt(hourMatch[1], 10);

  const minuteMatch = interval.match(/(\d+)\s+(?:min(?:ute)?(?:s)?|mins?)/);
  if (minuteMatch) minutes = parseInt(minuteMatch[1], 10);

  const secondMatch = interval.match(/(\d+)\s+(?:sec(?:ond)?(?:s)?|secs?)/);
  if (secondMatch) seconds = parseInt(secondMatch[1], 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Convert total seconds to ISO-8601 duration
 */
function secondsToISODuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let duration = 'PT';
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;
  if (seconds > 0) duration += `${seconds}S`;

  return duration === 'PT' ? 'PT0S' : duration;
}

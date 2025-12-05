import type { ActivityDto, ActivityEntity, ActivityInsertEntity, CreateActivityCommand } from "../../types.ts";
import { parseDuration, validateDistance } from "../validators.ts";
import { logger } from "../utils/logger";

/**
 * Converts PostgreSQL INTERVAL string to ISO-8601 duration format
 * @param interval - PostgreSQL INTERVAL string (e.g., "45 minutes", "1 hour 30 minutes")
 * @returns ISO-8601 duration string (e.g., "PT45M", "PT1H30M")
 */
function intervalToIso8601(interval: unknown): string {
  if (typeof interval !== "string") {
    throw new Error("Invalid interval format. Expected string.");
  }

  // If it's already in ISO-8601 format, return as-is
  if (interval.match(/^PT/)) {
    return interval;
  }

  // Parse PostgreSQL INTERVAL format - supports multiple formats:
  // "45 minutes", "1 hour 30 minutes", "01:30:00", "1:30:00", etc.

  // Try HH:MM:SS format first (e.g., "01:30:00")
  const timeMatch = interval.match(/^(\d+):(\d+):(\d+)$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}H`);
    if (minutes > 0) parts.push(`${minutes}M`);
    if (seconds > 0) parts.push(`${seconds}S`);

    return parts.length > 0 ? `PT${parts.join("")}` : "PT0S";
  }

  // Try word format (e.g., "1 hour 30 minutes")
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  const hourMatch = interval.match(/(\d+)\s+hour(?:s)?/);
  if (hourMatch) hours = parseInt(hourMatch[1], 10);

  const minuteMatch = interval.match(/(\d+)\s+(?:min(?:ute)?(?:s)?|mins?)/);
  if (minuteMatch) minutes = parseInt(minuteMatch[1], 10);

  const secondMatch = interval.match(/(\d+)\s+(?:sec(?:ond)?(?:s)?|secs?)/);
  if (secondMatch) seconds = parseInt(secondMatch[1], 10);

  // Build ISO-8601 duration string
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}H`);
  if (minutes > 0) parts.push(`${minutes}M`);
  if (seconds > 0) parts.push(`${seconds}S`);

  if (parts.length === 0) {
    logger.warn(`Unable to parse interval format: "${interval}", returning PT0S`);
    return "PT0S";
  }

  return `PT${parts.join("")}`;
}

/**
 * Maps CreateActivityCommand to ActivityInsertEntity
 * @param command - Create activity command from API request
 * @param userId - Authenticated user ID (from session, never from client)
 * @returns Activity insert entity for database
 */
export function mapCommandToEntity(command: CreateActivityCommand, userId: string): ActivityInsertEntity {
  // Parse duration to PostgreSQL INTERVAL format
  const durationInterval = parseDuration(command.duration);

  // Validate and normalize distance
  const distance = validateDistance(command.distanceMeters);

  return {
    user_id: userId,
    activity_date: command.activityDate,
    duration: durationInterval as unknown, // PostgreSQL INTERVAL type
    activity_type: command.activityType,
    distance: distance,
  };
}

/**
 * Maps ActivityEntity from database to ActivityDto for API response
 * @param entity - Activity entity from database
 * @returns Activity DTO for API response
 */
export function mapEntityToDto(entity: ActivityEntity): ActivityDto {
  // Convert PostgreSQL INTERVAL to ISO-8601 duration format
  const duration = intervalToIso8601(entity.duration);

  const dto: ActivityDto = {
    activityId: entity.activity_id,
    userId: entity.user_id,
    activityDate: entity.activity_date,
    duration: duration,
    activityType: entity.activity_type,
  };

  // Only include distanceMeters if distance is not null
  if (entity.distance !== null && entity.distance !== undefined) {
    dto.distanceMeters = entity.distance;
  }

  return dto;
}

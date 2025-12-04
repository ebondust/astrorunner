import { z } from "zod";

/**
 * Validates ISO-8601 UTC date-time string
 * @param dateString - ISO-8601 UTC date-time string
 * @returns Date object if valid
 * @throws Error if invalid
 */
export function validateIsoDate(dateString: string): Date {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format. Expected ISO-8601 UTC date-time string.");
  }

  // Check if input matches ISO-8601 format (ends with Z or has timezone offset)
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
  if (!iso8601Regex.test(dateString)) {
    throw new Error('Date must be in ISO-8601 UTC format (e.g., "2025-10-29T12:34:56Z").');
  }

  return date;
}

/**
 * Parses duration from ISO-8601 duration format (PT45M) or HH:MM:SS format
 * and converts to PostgreSQL INTERVAL-compatible string
 * @param duration - Duration string in ISO-8601 or HH:MM:SS format
 * @returns PostgreSQL INTERVAL string (e.g., "45 minutes")
 * @throws Error if duration is invalid or <= 0
 */
export function parseDuration(duration: string): string {
  if (!duration || duration.trim().length === 0) {
    throw new Error("Duration cannot be empty.");
  }

  let totalSeconds = 0;

  // Try ISO-8601 duration format first (PT45M, PT1H30M, etc.)
  const iso8601Match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (iso8601Match) {
    const hours = parseInt(iso8601Match[1] || "0", 10);
    const minutes = parseInt(iso8601Match[2] || "0", 10);
    const seconds = parseInt(iso8601Match[3] || "0", 10);

    totalSeconds = hours * 3600 + minutes * 60 + seconds;
  } else {
    // Try HH:MM:SS format
    const timeMatch = duration.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseInt(timeMatch[3], 10);

      if (minutes > 59 || seconds > 59) {
        throw new Error("Invalid time format. Minutes and seconds must be < 60.");
      }

      totalSeconds = hours * 3600 + minutes * 60 + seconds;
    } else {
      throw new Error("Duration must be in ISO-8601 format (PT45M) or HH:MM:SS format (00:45:00).");
    }
  }

  if (totalSeconds <= 0) {
    throw new Error("Duration must be greater than 0.");
  }

  // Convert to PostgreSQL INTERVAL format
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  }
  if (seconds > 0) {
    parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
  }

  return parts.join(" ") || "0 seconds";
}

/**
 * Validates and rounds distance to 3 decimal places
 * @param distance - Distance in meters (optional)
 * @returns Validated distance rounded to 3 decimals, or null if not provided
 * @throws Error if distance is invalid
 */
export function validateDistance(distance?: number): number | null {
  if (distance === undefined || distance === null) {
    return null;
  }

  if (typeof distance !== "number" || isNaN(distance)) {
    throw new Error("Distance must be a valid number.");
  }

  if (distance < 0) {
    throw new Error("Distance must be greater than or equal to 0.");
  }

  // Round to 3 decimal places
  return Math.round(distance * 1000) / 1000;
}

/**
 * Zod schema for CreateActivityCommand validation
 */
export const createActivityCommandSchema = z.object({
  activityDate: z.string().refine(
    (val) => {
      try {
        validateIsoDate(val);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'activityDate must be a valid ISO-8601 UTC date-time string (e.g., "2025-10-29T12:34:56Z")',
    }
  ),
  duration: z.string().refine(
    (val) => {
      try {
        parseDuration(val);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "duration must be in ISO-8601 format (PT45M) or HH:MM:SS format (00:45:00) and greater than 0",
    }
  ),
  activityType: z.enum(["Run", "Walk", "Mixed"], {
    errorMap: () => ({
      message: "activityType must be one of: Run, Walk, Mixed",
    }),
  }),
  distanceMeters: z
    .number()
    .nonnegative()
    .max(1000000000, "Distance is too large")
    .refine(
      (val) => {
        try {
          validateDistance(val);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: "distanceMeters must be >= 0 and have at most 3 decimal places",
      }
    )
    .optional(),
});

/**
 * Type for validated CreateActivityCommand
 */
export type ValidatedCreateActivityCommand = z.infer<typeof createActivityCommandSchema>;

/**
 * Zod schema for login command validation
 */
export const loginCommandSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Type for validated login command
 */
export type ValidatedLoginCommand = z.infer<typeof loginCommandSchema>;

/**
 * Zod schema for signup command validation
 * Password must be at least 8 characters with uppercase, lowercase, and number
 */
export const signupCommandSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

/**
 * Type for validated signup command
 */
export type ValidatedSignupCommand = z.infer<typeof signupCommandSchema>;

/**
 * Zod schema for password reset command validation
 */
export const passwordResetCommandSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Type for validated password reset command
 */
export type ValidatedPasswordResetCommand = z.infer<typeof passwordResetCommandSchema>;

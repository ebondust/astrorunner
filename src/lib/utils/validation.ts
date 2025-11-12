import type { ActivityFormState, ActivityFormErrors } from "@/frontend-types";

/**
 * Validate ISO-8601 date format (YYYY-MM-DDTHH:MM:SSZ)
 */
export function validateActivityDate(date: string): string | undefined {
  if (!date) {
    return "Date is required";
  }

  // Check if it's a valid ISO-8601 UTC datetime
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (!iso8601Regex.test(date)) {
    return "Date must be in ISO-8601 UTC format (YYYY-MM-DDTHH:MM:SSZ)";
  }

  // Check if it's a valid date
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return undefined;
}

/**
 * Validate duration in ISO-8601 or HH:MM:SS format
 */
export function validateDuration(duration: string): string | undefined {
  if (!duration) {
    return "Duration is required";
  }

  // Check HH:MM:SS format
  const timeRegex = /^(\d{2}):(\d{2}):(\d{2})$/;
  const timeMatch = duration.match(timeRegex);

  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);

    if (minutes >= 60 || seconds >= 60) {
      return "Invalid time format";
    }

    if (hours === 0 && minutes === 0 && seconds === 0) {
      return "Duration must be greater than 0";
    }

    return undefined;
  }

  // Check ISO-8601 duration format (PT1H30M, PT45M, etc.)
  const iso8601Regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
  const iso8601Match = duration.match(iso8601Regex);

  if (iso8601Match) {
    const hours = parseInt(iso8601Match[1] || '0', 10);
    const minutes = parseInt(iso8601Match[2] || '0', 10);
    const seconds = parseInt(iso8601Match[3] || '0', 10);

    if (hours === 0 && minutes === 0 && seconds === 0) {
      return "Duration must be greater than 0";
    }

    return undefined;
  }

  return "Duration must be in ISO-8601 format (PT45M) or HH:MM:SS format (00:45:00)";
}

/**
 * Validate activity type
 */
export function validateActivityType(type: string | undefined): string | undefined {
  if (!type) {
    return "Activity type is required";
  }

  const validTypes = ["Run", "Walk", "Mixed"];
  if (!validTypes.includes(type)) {
    return "Activity type must be one of: Run, Walk, Mixed";
  }

  return undefined;
}

/**
 * Validate distance in meters
 */
export function validateDistance(distance: number | undefined): string | undefined {
  // Distance is optional
  if (distance === undefined || distance === null) {
    return undefined;
  }

  if (typeof distance !== 'number' || isNaN(distance)) {
    return "Distance must be a valid number";
  }

  if (distance < 0) {
    return "Distance must be greater than or equal to 0";
  }

  // Check decimal places (max 3)
  const decimalPlaces = (distance.toString().split('.')[1] || '').length;
  if (decimalPlaces > 3) {
    return "Distance must have at most 3 decimal places";
  }

  // Check maximum value (1 billion meters = 1 million km, reasonable max)
  if (distance > 1000000000) {
    return "Distance is too large";
  }

  return undefined;
}

/**
 * Validate entire activity form
 */
export function validateActivityForm(formState: ActivityFormState): ActivityFormErrors {
  const errors: ActivityFormErrors = {};

  const dateError = validateActivityDate(formState.activityDate);
  if (dateError) errors.activityDate = dateError;

  const durationError = validateDuration(formState.duration);
  if (durationError) errors.duration = durationError;

  const typeError = validateActivityType(formState.activityType);
  if (typeError) errors.activityType = typeError;

  const distanceError = validateDistance(formState.distanceMeters);
  if (distanceError) errors.distanceMeters = distanceError;

  return errors;
}

/**
 * Check if form has any errors
 */
export function hasFormErrors(errors: ActivityFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

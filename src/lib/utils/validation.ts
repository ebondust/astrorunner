import type { ActivityFormState, ActivityFormErrors } from "@/frontend-types";

/**
 * Validate ISO-8601 date format (YYYY-MM-DDTHH:MM:SSZ)
 * Accepts various ISO-8601 formats including dates with timezone offset
 */
export function validateActivityDate(date: string): string | undefined {
  if (!date) {
    return "Date is required";
  }

  // Check if it's a valid ISO-8601 datetime (with or without milliseconds, with Z or timezone offset)
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
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
 * Validate duration in HH.MM, HH:MM, or single number format
 * - HH.MM or HH:MM → Hours and minutes
 * - Single number → Minutes
 */
export function validateDuration(duration: string): string | undefined {
  if (!duration) {
    return "Duration is required";
  }

  // Try HH.MM or HH:MM format
  const timeRegex = /^(\d{1,2})([:.])(\d{2})$/;
  const timeMatch = duration.match(timeRegex);

  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[3], 10);

    if (minutes >= 60) {
      return "Minutes must be less than 60";
    }

    if (hours === 0 && minutes === 0) {
      return "Duration must be greater than 0";
    }

    return undefined;
  }

  // Try single number (minutes)
  const singleNumberRegex = /^(\d+)$/;
  const singleMatch = duration.match(singleNumberRegex);

  if (singleMatch) {
    const minutes = parseInt(singleMatch[1], 10);

    if (minutes === 0) {
      return "Duration must be greater than 0";
    }

    return undefined;
  }

  return "Duration must be in HH.MM (e.g., 1.30), HH:MM (e.g., 1:30), or minutes (e.g., 90) format";
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
 * Validate distance in kilometers
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

  // Check decimal places (max 2 for km)
  const decimalPlaces = (distance.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return "Distance must have at most 2 decimal places";
  }

  // Check maximum value (1 million km, reasonable max)
  if (distance > 1000000) {
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
  return Object.values(errors).some(error => error !== undefined);
}

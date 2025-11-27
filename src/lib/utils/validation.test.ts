import { describe, it, expect } from "vitest";
import type { ActivityFormState, ActivityFormErrors } from "@/frontend-types";
import {
  validateActivityDate,
  validateDuration,
  validateActivityType,
  validateDistance,
  validateActivityForm,
  hasFormErrors,
} from "./validation";

describe("validation.ts - Date Validation", () => {
  describe("validateActivityDate", () => {
    it("should return undefined for valid ISO-8601 UTC datetime", () => {
      // Arrange
      const date = "2025-11-25T10:30:45Z";

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return undefined for valid ISO-8601 UTC datetime with milliseconds", () => {
      // Arrange
      const date = "2025-11-25T10:30:45.123Z";

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return error for empty date", () => {
      // Arrange
      const date = "";

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBe("Date is required");
    });

    it("should return error for non-UTC datetime (missing Z)", () => {
      // Arrange
      const date = "2025-11-25T10:30:45";

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBe("Date must be in ISO-8601 UTC format (YYYY-MM-DDTHH:MM:SSZ)");
    });

    it("should return error for date without time component", () => {
      // Arrange
      const date = "2025-11-25";

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBe("Date must be in ISO-8601 UTC format (YYYY-MM-DDTHH:MM:SSZ)");
    });

    it("should return error for invalid date format", () => {
      // Arrange
      const date = "25-11-2025T10:30:45Z";

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBe("Date must be in ISO-8601 UTC format (YYYY-MM-DDTHH:MM:SSZ)");
    });

    it("should return error for invalid date values", () => {
      // Arrange
      const date = "2025-13-45T10:30:45Z"; // Invalid month and day

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBe("Invalid date");
    });

    it("should return error for February 30th", () => {
      // Arrange
      const date = "2025-02-30T10:30:45Z";

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBe("Invalid date");
    });

    it("should accept leap year February 29th", () => {
      // Arrange
      const date = "2024-02-29T10:30:45Z";

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return error for non-leap year February 29th", () => {
      // Arrange
      const date = "2025-02-29T10:30:45Z";

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBe("Invalid date");
    });

    it("should return error for timezone offset format", () => {
      // Arrange
      const date = "2025-11-25T10:30:45+01:00";

      // Act
      const result = validateActivityDate(date);

      // Assert
      expect(result).toBe("Date must be in ISO-8601 UTC format (YYYY-MM-DDTHH:MM:SSZ)");
    });
  });
});

describe("validation.ts - Duration Validation", () => {
  describe("validateDuration", () => {
    it("should return undefined for valid HH:MM format", () => {
      // Arrange
      const duration = "1:30";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return undefined for valid HH.MM format", () => {
      // Arrange
      const duration = "1.30";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return undefined for valid minutes only format", () => {
      // Arrange
      const duration = "45";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return error for empty duration", () => {
      // Arrange
      const duration = "";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBe("Duration is required");
    });

    it("should return error for minutes >= 60 in HH:MM format", () => {
      // Arrange
      const duration = "1:60";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBe("Minutes must be less than 60");
    });

    it("should return error for minutes >= 60 in HH.MM format", () => {
      // Arrange
      const duration = "2.75";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBe("Minutes must be less than 60");
    });

    it("should return error for zero duration in HH:MM format", () => {
      // Arrange
      const duration = "0:00";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBe("Duration must be greater than 0");
    });

    it("should return error for zero duration in HH.MM format", () => {
      // Arrange
      const duration = "0.00";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBe("Duration must be greater than 0");
    });

    it("should return error for zero duration in minutes format", () => {
      // Arrange
      const duration = "0";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBe("Duration must be greater than 0");
    });

    it("should return error for invalid format", () => {
      // Arrange
      const duration = "abc";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBe(
        "Duration must be in HH.MM (e.g., 1.30), HH:MM (e.g., 1:30), or minutes (e.g., 90) format"
      );
    });

    it("should return error for single digit minutes in HH:MM format", () => {
      // Arrange
      const duration = "1:5"; // Should be 1:05

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBe(
        "Duration must be in HH.MM (e.g., 1.30), HH:MM (e.g., 1:30), or minutes (e.g., 90) format"
      );
    });

    it("should accept valid edge case: 23:59", () => {
      // Arrange
      const duration = "23:59";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept large minute values", () => {
      // Arrange
      const duration = "999";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept hours-only format with zero minutes", () => {
      // Arrange
      const duration = "2:00";

      // Act
      const result = validateDuration(duration);

      // Assert
      expect(result).toBeUndefined();
    });
  });
});

describe("validation.ts - Activity Type Validation", () => {
  describe("validateActivityType", () => {
    it("should return undefined for valid activity type 'Run'", () => {
      // Arrange
      const type = "Run";

      // Act
      const result = validateActivityType(type);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return undefined for valid activity type 'Walk'", () => {
      // Arrange
      const type = "Walk";

      // Act
      const result = validateActivityType(type);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return undefined for valid activity type 'Mixed'", () => {
      // Arrange
      const type = "Mixed";

      // Act
      const result = validateActivityType(type);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return error for undefined type", () => {
      // Arrange
      const type = undefined;

      // Act
      const result = validateActivityType(type);

      // Assert
      expect(result).toBe("Activity type is required");
    });

    it("should return error for empty string", () => {
      // Arrange
      const type = "";

      // Act
      const result = validateActivityType(type);

      // Assert
      expect(result).toBe("Activity type is required");
    });

    it("should return error for invalid activity type", () => {
      // Arrange
      const type = "Swim";

      // Act
      const result = validateActivityType(type);

      // Assert
      expect(result).toBe("Activity type must be one of: Run, Walk, Mixed");
    });

    it("should return error for lowercase activity type", () => {
      // Arrange
      const type = "run";

      // Act
      const result = validateActivityType(type);

      // Assert
      expect(result).toBe("Activity type must be one of: Run, Walk, Mixed");
    });

    it("should return error for uppercase activity type", () => {
      // Arrange
      const type = "RUN";

      // Act
      const result = validateActivityType(type);

      // Assert
      expect(result).toBe("Activity type must be one of: Run, Walk, Mixed");
    });

    it("should return error for null value", () => {
      // Arrange
      const type = null as unknown as string;

      // Act
      const result = validateActivityType(type);

      // Assert
      expect(result).toBe("Activity type is required");
    });
  });
});

describe("validation.ts - Distance Validation", () => {
  describe("validateDistance", () => {
    it("should return undefined for valid distance", () => {
      // Arrange
      const distance = 5.5;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return undefined for zero distance", () => {
      // Arrange
      const distance = 0;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return undefined for undefined distance (optional)", () => {
      // Arrange
      const distance = undefined;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return undefined for null distance (optional)", () => {
      // Arrange
      const distance = null as unknown as number;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return error for negative distance", () => {
      // Arrange
      const distance = -5;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBe("Distance must be greater than or equal to 0");
    });

    it("should return error for NaN", () => {
      // Arrange
      const distance = NaN;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBe("Distance must be a valid number");
    });

    it("should return error for non-number type", () => {
      // Arrange
      const distance = "5.5" as unknown as number;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBe("Distance must be a valid number");
    });

    it("should return error for more than 2 decimal places", () => {
      // Arrange
      const distance = 5.123;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBe("Distance must have at most 2 decimal places");
    });

    it("should accept exactly 2 decimal places", () => {
      // Arrange
      const distance = 5.12;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept 1 decimal place", () => {
      // Arrange
      const distance = 5.1;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return error for distance exceeding 1 million km", () => {
      // Arrange
      const distance = 1000001;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBe("Distance is too large");
    });

    it("should accept distance of exactly 1 million km", () => {
      // Arrange
      const distance = 1000000;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept very small positive distance", () => {
      // Arrange
      const distance = 0.01;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBeUndefined();
    });

    it("should accept integer distance", () => {
      // Arrange
      const distance = 42;

      // Act
      const result = validateDistance(distance);

      // Assert
      expect(result).toBeUndefined();
    });
  });
});

describe("validation.ts - Form Validation", () => {
  describe("validateActivityForm", () => {
    it("should return empty errors object for valid form", () => {
      // Arrange
      const formState: ActivityFormState = {
        activityDate: "2025-11-25T10:30:45Z",
        duration: "1:30",
        activityType: "Run",
        distanceMeters: 5.5,
      };

      // Act
      const result = validateActivityForm(formState);

      // Assert
      expect(result).toEqual({});
    });

    it("should return empty errors for valid form without optional distance", () => {
      // Arrange
      const formState: ActivityFormState = {
        activityDate: "2025-11-25T10:30:45Z",
        duration: "45",
        activityType: "Walk",
      };

      // Act
      const result = validateActivityForm(formState);

      // Assert
      expect(result).toEqual({});
    });

    it("should return date error for invalid date", () => {
      // Arrange
      const formState: ActivityFormState = {
        activityDate: "",
        duration: "1:30",
        activityType: "Run",
      };

      // Act
      const result = validateActivityForm(formState);

      // Assert
      expect(result.activityDate).toBe("Date is required");
      expect(result.duration).toBeUndefined();
      expect(result.activityType).toBeUndefined();
    });

    it("should return duration error for invalid duration", () => {
      // Arrange
      const formState: ActivityFormState = {
        activityDate: "2025-11-25T10:30:45Z",
        duration: "",
        activityType: "Run",
      };

      // Act
      const result = validateActivityForm(formState);

      // Assert
      expect(result.activityDate).toBeUndefined();
      expect(result.duration).toBe("Duration is required");
      expect(result.activityType).toBeUndefined();
    });

    it("should return activity type error for invalid type", () => {
      // Arrange
      const formState: ActivityFormState = {
        activityDate: "2025-11-25T10:30:45Z",
        duration: "1:30",
        activityType: "" as any,
      };

      // Act
      const result = validateActivityForm(formState);

      // Assert
      expect(result.activityDate).toBeUndefined();
      expect(result.duration).toBeUndefined();
      expect(result.activityType).toBe("Activity type is required");
    });

    it("should return distance error for invalid distance", () => {
      // Arrange
      const formState: ActivityFormState = {
        activityDate: "2025-11-25T10:30:45Z",
        duration: "1:30",
        activityType: "Run",
        distanceMeters: -5,
      };

      // Act
      const result = validateActivityForm(formState);

      // Assert
      expect(result.activityDate).toBeUndefined();
      expect(result.duration).toBeUndefined();
      expect(result.activityType).toBeUndefined();
      expect(result.distanceMeters).toBe("Distance must be greater than or equal to 0");
    });

    it("should return multiple errors for multiple invalid fields", () => {
      // Arrange
      const formState: ActivityFormState = {
        activityDate: "",
        duration: "0:00",
        activityType: "" as any,
        distanceMeters: -10,
      };

      // Act
      const result = validateActivityForm(formState);

      // Assert
      expect(result.activityDate).toBe("Date is required");
      expect(result.duration).toBe("Duration must be greater than 0");
      expect(result.activityType).toBe("Activity type is required");
      expect(result.distanceMeters).toBe("Distance must be greater than or equal to 0");
    });

    it("should validate all fields independently", () => {
      // Arrange
      const formState: ActivityFormState = {
        activityDate: "2025-02-30T10:30:45Z", // Invalid date
        duration: "1:60", // Invalid minutes
        activityType: "Swim" as any, // Invalid type
        distanceMeters: 5.123, // Too many decimals
      };

      // Act
      const result = validateActivityForm(formState);

      // Assert
      expect(result.activityDate).toBe("Invalid date");
      expect(result.duration).toBe("Minutes must be less than 60");
      expect(result.activityType).toBe("Activity type must be one of: Run, Walk, Mixed");
      expect(result.distanceMeters).toBe("Distance must have at most 2 decimal places");
    });
  });

  describe("hasFormErrors", () => {
    it("should return false for empty errors object", () => {
      // Arrange
      const errors: ActivityFormErrors = {};

      // Act
      const result = hasFormErrors(errors);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for errors object with one error", () => {
      // Arrange
      const errors: ActivityFormErrors = {
        activityDate: "Date is required",
      };

      // Act
      const result = hasFormErrors(errors);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for errors object with multiple errors", () => {
      // Arrange
      const errors: ActivityFormErrors = {
        activityDate: "Date is required",
        duration: "Duration is required",
        activityType: "Activity type is required",
      };

      // Act
      const result = hasFormErrors(errors);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for errors object with undefined values", () => {
      // Arrange
      const errors: ActivityFormErrors = {
        activityDate: undefined,
        duration: undefined,
        activityType: undefined,
        distanceMeters: undefined,
      };

      // Act
      const result = hasFormErrors(errors);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true if at least one field has an error", () => {
      // Arrange
      const errors: ActivityFormErrors = {
        activityDate: undefined,
        duration: "Duration is required",
        activityType: undefined,
      };

      // Act
      const result = hasFormErrors(errors);

      // Assert
      expect(result).toBe(true);
    });
  });
});

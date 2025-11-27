import { describe, it, expect } from "vitest";
import {
  validateIsoDate,
  parseDuration,
  validateDistance,
  createActivityCommandSchema,
  loginCommandSchema,
  signupCommandSchema,
  passwordResetCommandSchema,
} from "./validators";

describe("validators.ts", () => {
  describe("validateIsoDate", () => {
    describe("Valid inputs", () => {
      it("should accept valid ISO-8601 UTC date with Z suffix", () => {
        // Arrange
        const dateString = "2025-11-26T10:30:00Z";

        // Act
        const result = validateIsoDate(dateString);

        // Assert
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe("2025-11-26T10:30:00.000Z");
      });

      it("should accept valid ISO-8601 date with timezone offset", () => {
        // Arrange
        const dateString = "2025-11-26T10:30:00+02:00";

        // Act
        const result = validateIsoDate(dateString);

        // Assert
        expect(result).toBeInstanceOf(Date);
      });

      it("should accept ISO-8601 date with milliseconds", () => {
        // Arrange
        const dateString = "2025-11-26T10:30:00.123Z";

        // Act
        const result = validateIsoDate(dateString);

        // Assert
        expect(result).toBeInstanceOf(Date);
      });

      it("should accept leap year date", () => {
        // Arrange
        const dateString = "2024-02-29T12:00:00Z";

        // Act
        const result = validateIsoDate(dateString);

        // Assert
        expect(result).toBeInstanceOf(Date);
      });
    });

    describe("Invalid inputs", () => {
      it("should throw error for invalid date format (missing T)", () => {
        // Arrange
        const dateString = "2025-11-26 10:30:00Z";

        // Act & Assert
        expect(() => validateIsoDate(dateString)).toThrow(
          'Date must be in ISO-8601 UTC format (e.g., "2025-10-29T12:34:56Z").'
        );
      });

      it("should throw error for invalid date format (missing Z)", () => {
        // Arrange
        const dateString = "2025-11-26T10:30:00";

        // Act & Assert
        expect(() => validateIsoDate(dateString)).toThrow(
          'Date must be in ISO-8601 UTC format (e.g., "2025-10-29T12:34:56Z").'
        );
      });

      it("should throw error for non-date string", () => {
        // Arrange
        const dateString = "not a date";

        // Act & Assert
        expect(() => validateIsoDate(dateString)).toThrow("Invalid date format");
      });

      it("should throw error for empty string", () => {
        // Arrange
        const dateString = "";

        // Act & Assert
        expect(() => validateIsoDate(dateString)).toThrow("Invalid date format");
      });

      it("should throw error for invalid month", () => {
        // Arrange
        const dateString = "2025-13-26T10:30:00Z";

        // Act & Assert
        expect(() => validateIsoDate(dateString)).toThrow("Invalid date format");
      });

      it("should throw error for invalid day", () => {
        // Arrange
        const dateString = "2025-11-32T10:30:00Z";

        // Act & Assert
        expect(() => validateIsoDate(dateString)).toThrow("Invalid date format");
      });
    });
  });

  describe("parseDuration", () => {
    describe("Valid ISO-8601 format", () => {
      it("should parse PT45M to PostgreSQL INTERVAL", () => {
        // Arrange
        const duration = "PT45M";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("45 minutes");
      });

      it("should parse PT1H to PostgreSQL INTERVAL", () => {
        // Arrange
        const duration = "PT1H";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("1 hour");
      });

      it("should parse PT1H30M to PostgreSQL INTERVAL", () => {
        // Arrange
        const duration = "PT1H30M";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("1 hour 30 minutes");
      });

      it("should parse PT2H15M30S to PostgreSQL INTERVAL", () => {
        // Arrange
        const duration = "PT2H15M30S";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("2 hours 15 minutes 30 seconds");
      });

      it("should parse PT30S to PostgreSQL INTERVAL", () => {
        // Arrange
        const duration = "PT30S";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("30 seconds");
      });

      it("should parse PT1S (single second)", () => {
        // Arrange
        const duration = "PT1S";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("1 second");
      });

      it("should handle plural forms correctly", () => {
        // Arrange
        const duration1 = "PT2H";
        const duration2 = "PT2M";
        const duration3 = "PT2S";

        // Act
        const result1 = parseDuration(duration1);
        const result2 = parseDuration(duration2);
        const result3 = parseDuration(duration3);

        // Assert
        expect(result1).toBe("2 hours");
        expect(result2).toBe("2 minutes");
        expect(result3).toBe("2 seconds");
      });
    });

    describe("Valid HH:MM:SS format", () => {
      it("should parse 00:45:00 to PostgreSQL INTERVAL", () => {
        // Arrange
        const duration = "00:45:00";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("45 minutes");
      });

      it("should parse 01:30:00 to PostgreSQL INTERVAL", () => {
        // Arrange
        const duration = "01:30:00";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("1 hour 30 minutes");
      });

      it("should parse 02:15:30 to PostgreSQL INTERVAL", () => {
        // Arrange
        const duration = "02:15:30";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("2 hours 15 minutes 30 seconds");
      });

      it("should parse 00:00:30 to PostgreSQL INTERVAL", () => {
        // Arrange
        const duration = "00:00:30";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("30 seconds");
      });

      it("should parse single digit hours", () => {
        // Arrange
        const duration = "1:30:00";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("1 hour 30 minutes");
      });

      it("should parse 10+ hours", () => {
        // Arrange
        const duration = "10:00:00";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("10 hours");
      });
    });

    describe("Invalid inputs", () => {
      it("should throw error for empty string", () => {
        // Arrange
        const duration = "";

        // Act & Assert
        expect(() => parseDuration(duration)).toThrow("Duration cannot be empty");
      });

      it("should throw error for whitespace string", () => {
        // Arrange
        const duration = "   ";

        // Act & Assert
        expect(() => parseDuration(duration)).toThrow("Duration cannot be empty");
      });

      it("should throw error for invalid format", () => {
        // Arrange
        const duration = "invalid";

        // Act & Assert
        expect(() => parseDuration(duration)).toThrow(
          "Duration must be in ISO-8601 format (PT45M) or HH:MM:SS format (00:45:00)"
        );
      });

      it("should throw error for PT0S (zero duration)", () => {
        // Arrange
        const duration = "PT0S";

        // Act & Assert
        expect(() => parseDuration(duration)).toThrow("Duration must be greater than 0");
      });

      it("should throw error for 00:00:00 (zero duration)", () => {
        // Arrange
        const duration = "00:00:00";

        // Act & Assert
        expect(() => parseDuration(duration)).toThrow("Duration must be greater than 0");
      });

      it("should throw error for invalid minutes (>59)", () => {
        // Arrange
        const duration = "01:60:00";

        // Act & Assert
        expect(() => parseDuration(duration)).toThrow("Invalid time format. Minutes and seconds must be < 60");
      });

      it("should throw error for invalid seconds (>59)", () => {
        // Arrange
        const duration = "01:30:60";

        // Act & Assert
        expect(() => parseDuration(duration)).toThrow("Invalid time format. Minutes and seconds must be < 60");
      });
    });

    describe("Edge cases", () => {
      it("should handle very long duration (24 hours)", () => {
        // Arrange
        const duration = "PT24H";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("24 hours");
      });

      it("should handle only minutes (no hours or seconds)", () => {
        // Arrange
        const duration = "PT90M";

        // Act
        const result = parseDuration(duration);

        // Assert
        // parseDuration converts total seconds, so 90 minutes = 1 hour 30 minutes
        expect(result).toBe("1 hour 30 minutes");
      });

      it("should handle only seconds (no hours or minutes)", () => {
        // Arrange
        const duration = "PT120S";

        // Act
        const result = parseDuration(duration);

        // Assert
        expect(result).toBe("2 minutes");
      });
    });
  });

  describe("validateDistance", () => {
    describe("Valid inputs", () => {
      it("should return null for undefined", () => {
        // Arrange
        const distance = undefined;

        // Act
        const result = validateDistance(distance);

        // Assert
        expect(result).toBeNull();
      });

      it("should return null for null", () => {
        // Arrange
        const distance = null;

        // Act
        const result = validateDistance(distance);

        // Assert
        expect(result).toBeNull();
      });

      it("should return valid distance for positive number", () => {
        // Arrange
        const distance = 5000;

        // Act
        const result = validateDistance(distance);

        // Assert
        expect(result).toBe(5000);
      });

      it("should return zero for zero distance", () => {
        // Arrange
        const distance = 0;

        // Act
        const result = validateDistance(distance);

        // Assert
        expect(result).toBe(0);
      });

      it("should round to 3 decimal places", () => {
        // Arrange
        const distance = 5000.12345;

        // Act
        const result = validateDistance(distance);

        // Assert
        expect(result).toBe(5000.123);
      });

      it("should handle exactly 3 decimal places", () => {
        // Arrange
        const distance = 5000.125;

        // Act
        const result = validateDistance(distance);

        // Assert
        expect(result).toBe(5000.125);
      });

      it("should handle very small distances", () => {
        // Arrange
        const distance = 0.001;

        // Act
        const result = validateDistance(distance);

        // Assert
        expect(result).toBe(0.001);
      });

      it("should handle very large distances", () => {
        // Arrange
        const distance = 999999999;

        // Act
        const result = validateDistance(distance);

        // Assert
        expect(result).toBe(999999999);
      });
    });

    describe("Invalid inputs", () => {
      it("should throw error for negative distance", () => {
        // Arrange
        const distance = -100;

        // Act & Assert
        expect(() => validateDistance(distance)).toThrow(
          "Distance must be greater than or equal to 0"
        );
      });

      it("should throw error for NaN", () => {
        // Arrange
        const distance = NaN;

        // Act & Assert
        expect(() => validateDistance(distance)).toThrow("Distance must be a valid number");
      });

      it("should throw error for string", () => {
        // Arrange
        const distance = "5000" as unknown as number;

        // Act & Assert
        expect(() => validateDistance(distance)).toThrow("Distance must be a valid number");
      });
    });

    describe("Edge cases", () => {
      it("should round up correctly", () => {
        // Arrange
        const distance = 5000.1235;

        // Act
        const result = validateDistance(distance);

        // Assert
        expect(result).toBe(5000.124);
      });

      it("should round down correctly", () => {
        // Arrange
        const distance = 5000.1234;

        // Act
        const result = validateDistance(distance);

        // Assert
        expect(result).toBe(5000.123);
      });
    });
  });

  describe("createActivityCommandSchema", () => {
    describe("Valid inputs", () => {
      it("should validate complete activity command", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run" as const,
          distanceMeters: 5000,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(command);
        }
      });

      it("should validate activity without distance", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT1H",
          activityType: "Walk" as const,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should validate with HH:MM:SS duration", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "01:30:00",
          activityType: "Mixed" as const,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should validate zero distance", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run" as const,
          distanceMeters: 0,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should validate all activity types", () => {
        // Arrange
        const runCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run" as const,
        };
        const walkCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Walk" as const,
        };
        const mixedCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Mixed" as const,
        };

        // Act
        const runResult = createActivityCommandSchema.safeParse(runCommand);
        const walkResult = createActivityCommandSchema.safeParse(walkCommand);
        const mixedResult = createActivityCommandSchema.safeParse(mixedCommand);

        // Assert
        expect(runResult.success).toBe(true);
        expect(walkResult.success).toBe(true);
        expect(mixedResult.success).toBe(true);
      });
    });

    describe("Invalid inputs", () => {
      it("should reject invalid activityDate", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26 10:30:00",
          duration: "PT45M",
          activityType: "Run" as const,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain("ISO-8601 UTC");
        }
      });

      it("should reject invalid duration", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "invalid",
          activityType: "Run" as const,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain("ISO-8601 format");
        }
      });

      it("should reject zero duration", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT0S",
          activityType: "Run" as const,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain("greater than 0");
        }
      });

      it("should reject invalid activityType", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Invalid" as const,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain("Run, Walk, Mixed");
        }
      });

      it("should reject negative distance", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run" as const,
          distanceMeters: -100,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject very large distance", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run" as const,
          distanceMeters: 1000000001,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain("too large");
        }
      });

      it("should reject missing required fields", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("Boundary cases", () => {
      it("should accept maximum valid distance", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run" as const,
          distanceMeters: 1000000000,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept very short duration (1 second)", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT1S",
          activityType: "Run" as const,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept very long duration", () => {
        // Arrange
        const command = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT24H",
          activityType: "Walk" as const,
        };

        // Act
        const result = createActivityCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });
    });
  });

  describe("loginCommandSchema", () => {
    describe("Valid inputs", () => {
      it("should validate correct email and password", () => {
        // Arrange
        const command = {
          email: "test@example.com",
          password: "password123",
        };

        // Act
        const result = loginCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    describe("Invalid inputs", () => {
      it("should reject invalid email", () => {
        // Arrange
        const command = {
          email: "invalid-email",
          password: "password123",
        };

        // Act
        const result = loginCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe("Invalid email address");
        }
      });

      it("should reject empty password", () => {
        // Arrange
        const command = {
          email: "test@example.com",
          password: "",
        };

        // Act
        const result = loginCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe("Password is required");
        }
      });

      it("should reject missing fields", () => {
        // Arrange
        const command = {
          email: "test@example.com",
        };

        // Act
        const result = loginCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
      });
    });
  });

  describe("signupCommandSchema", () => {
    describe("Valid inputs", () => {
      it("should validate strong password", () => {
        // Arrange
        const command = {
          email: "test@example.com",
          password: "Password123",
        };

        // Act
        const result = signupCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should validate password with special characters", () => {
        // Arrange
        const command = {
          email: "test@example.com",
          password: "Password123!@#",
        };

        // Act
        const result = signupCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    describe("Invalid inputs", () => {
      it("should reject password less than 8 characters", () => {
        // Arrange
        const command = {
          email: "test@example.com",
          password: "Pass1",
        };

        // Act
        const result = signupCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain("at least 8 characters");
        }
      });

      it("should reject password without uppercase letter", () => {
        // Arrange
        const command = {
          email: "test@example.com",
          password: "password123",
        };

        // Act
        const result = signupCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.some((e) => e.message.includes("uppercase"))).toBe(true);
        }
      });

      it("should reject password without lowercase letter", () => {
        // Arrange
        const command = {
          email: "test@example.com",
          password: "PASSWORD123",
        };

        // Act
        const result = signupCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.some((e) => e.message.includes("lowercase"))).toBe(true);
        }
      });

      it("should reject password without number", () => {
        // Arrange
        const command = {
          email: "test@example.com",
          password: "Password",
        };

        // Act
        const result = signupCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.some((e) => e.message.includes("number"))).toBe(true);
        }
      });

      it("should reject invalid email", () => {
        // Arrange
        const command = {
          email: "invalid-email",
          password: "Password123",
        };

        // Act
        const result = signupCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe("Invalid email address");
        }
      });
    });

    describe("Boundary cases", () => {
      it("should accept exactly 8 character password with requirements", () => {
        // Arrange
        const command = {
          email: "test@example.com",
          password: "Pass123a",
        };

        // Act
        const result = signupCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });
    });
  });

  describe("passwordResetCommandSchema", () => {
    describe("Valid inputs", () => {
      it("should validate correct email", () => {
        // Arrange
        const command = {
          email: "test@example.com",
        };

        // Act
        const result = passwordResetCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    describe("Invalid inputs", () => {
      it("should reject invalid email", () => {
        // Arrange
        const command = {
          email: "invalid-email",
        };

        // Act
        const result = passwordResetCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe("Invalid email address");
        }
      });

      it("should reject empty email", () => {
        // Arrange
        const command = {
          email: "",
        };

        // Act
        const result = passwordResetCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject missing email field", () => {
        // Arrange
        const command = {};

        // Act
        const result = passwordResetCommandSchema.safeParse(command);

        // Assert
        expect(result.success).toBe(false);
      });
    });
  });
});

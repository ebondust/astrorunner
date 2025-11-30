import { describe, it, expect } from "vitest";
import { mapCommandToEntity, mapEntityToDto } from "./activity.mapper";
import type { ActivityEntity, CreateActivityCommand } from "../../types";

describe("activity.mapper", () => {
  describe("mapCommandToEntity", () => {
    describe("Valid inputs", () => {
      it("should map command to entity with all fields (ISO-8601 duration)", () => {
        // Arrange
        const userId = "test-user-123";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result).toEqual({
          user_id: userId,
          activity_date: "2025-11-26T10:30:00Z",
          duration: "45 minutes",
          activity_type: "Run",
          distance: 5000,
        });
      });

      it("should map command to entity with HH:MM:SS duration format", () => {
        // Arrange
        const userId = "user-456";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T08:00:00Z",
          duration: "01:30:00",
          activityType: "Walk",
          distanceMeters: 3500.5,
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result).toEqual({
          user_id: userId,
          activity_date: "2025-11-26T08:00:00Z",
          duration: "1 hour 30 minutes",
          activity_type: "Walk",
          distance: 3500.5,
        });
      });

      it("should map command without distance (optional field)", () => {
        // Arrange
        const userId = "user-789";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-25T14:20:00Z",
          duration: "PT1H",
          activityType: "Mixed",
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result).toEqual({
          user_id: userId,
          activity_date: "2025-11-25T14:20:00Z",
          duration: "1 hour",
          activity_type: "Mixed",
          distance: null,
        });
      });

      it("should handle complex ISO-8601 duration (hours, minutes, seconds)", () => {
        // Arrange
        const userId = "user-complex";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T12:00:00Z",
          duration: "PT2H15M30S",
          activityType: "Run",
          distanceMeters: 15000,
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result).toEqual({
          user_id: userId,
          activity_date: "2025-11-26T12:00:00Z",
          duration: "2 hours 15 minutes 30 seconds",
          activity_type: "Run",
          distance: 15000,
        });
      });

      it("should handle zero distance", () => {
        // Arrange
        const userId = "user-zero";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T06:00:00Z",
          duration: "PT30M",
          activityType: "Walk",
          distanceMeters: 0,
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result).toEqual({
          user_id: userId,
          activity_date: "2025-11-26T06:00:00Z",
          duration: "30 minutes",
          activity_type: "Walk",
          distance: 0,
        });
      });

      it("should handle decimal distance values with 3 decimal places", () => {
        // Arrange
        const userId = "user-decimal";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T09:00:00Z",
          duration: "PT1H15M",
          activityType: "Run",
          distanceMeters: 7250.125,
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result).toEqual({
          user_id: userId,
          activity_date: "2025-11-26T09:00:00Z",
          duration: "1 hour 15 minutes",
          activity_type: "Run",
          distance: 7250.125,
        });
      });
    });

    describe("Edge cases", () => {
      it("should handle very short duration (1 second)", () => {
        // Arrange
        const userId = "user-short";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:00:00Z",
          duration: "PT1S",
          activityType: "Run",
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result.duration).toBe("1 second");
      });

      it("should handle very long duration (10 hours)", () => {
        // Arrange
        const userId = "user-long";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T05:00:00Z",
          duration: "PT10H",
          activityType: "Walk",
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result.duration).toBe("10 hours");
      });

      it("should handle very large distance values", () => {
        // Arrange
        const userId = "user-marathon";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T06:00:00Z",
          duration: "PT4H30M",
          activityType: "Run",
          distanceMeters: 42195, // Marathon distance
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result.distance).toBe(42195);
      });

      it("should convert camelCase to snake_case for database fields", () => {
        // Arrange
        const userId = "user-case-test";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T12:00:00Z",
          duration: "PT1H",
          activityType: "Run",
          distanceMeters: 10000,
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result).toHaveProperty("user_id");
        expect(result).toHaveProperty("activity_date");
        expect(result).toHaveProperty("activity_type");
        expect(result).not.toHaveProperty("userId");
        expect(result).not.toHaveProperty("activityDate");
        expect(result).not.toHaveProperty("activityType");
      });

      it("should handle different activity types", () => {
        // Arrange
        const userId = "user-types";
        const runCommand: CreateActivityCommand = {
          activityDate: "2025-11-26T10:00:00Z",
          duration: "PT45M",
          activityType: "Run",
        };
        const walkCommand: CreateActivityCommand = {
          activityDate: "2025-11-26T11:00:00Z",
          duration: "PT30M",
          activityType: "Walk",
        };
        const mixedCommand: CreateActivityCommand = {
          activityDate: "2025-11-26T12:00:00Z",
          duration: "PT1H",
          activityType: "Mixed",
        };

        // Act
        const runResult = mapCommandToEntity(runCommand, userId);
        const walkResult = mapCommandToEntity(walkCommand, userId);
        const mixedResult = mapCommandToEntity(mixedCommand, userId);

        // Assert
        expect(runResult.activity_type).toBe("Run");
        expect(walkResult.activity_type).toBe("Walk");
        expect(mixedResult.activity_type).toBe("Mixed");
      });
    });

    describe("Date/time conversion accuracy", () => {
      it("should preserve ISO-8601 UTC datetime format", () => {
        // Arrange
        const userId = "user-datetime";
        const command: CreateActivityCommand = {
          activityDate: "2025-12-31T23:59:59Z",
          duration: "PT1H",
          activityType: "Run",
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result.activity_date).toBe("2025-12-31T23:59:59Z");
      });

      it("should handle leap year dates", () => {
        // Arrange
        const userId = "user-leap";
        const command: CreateActivityCommand = {
          activityDate: "2024-02-29T12:00:00Z",
          duration: "PT45M",
          activityType: "Run",
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result.activity_date).toBe("2024-02-29T12:00:00Z");
      });

      it("should handle year boundary dates", () => {
        // Arrange
        const userId = "user-boundary";
        const command: CreateActivityCommand = {
          activityDate: "2025-01-01T00:00:00Z",
          duration: "PT1H",
          activityType: "Walk",
        };

        // Act
        const result = mapCommandToEntity(command, userId);

        // Assert
        expect(result.activity_date).toBe("2025-01-01T00:00:00Z");
      });
    });
  });

  describe("mapEntityToDto", () => {
    describe("Valid inputs", () => {
      it("should map entity to DTO with all fields (HH:MM:SS duration)", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-123",
          user_id: "user-456",
          activity_date: "2025-11-26T10:30:00Z",
          duration: "00:45:00",
          activity_type: "Run",
          distance: 5000,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result).toEqual({
          activityId: "activity-123",
          userId: "user-456",
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        });
      });

      it("should map entity to DTO with word format duration", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-789",
          user_id: "user-abc",
          activity_date: "2025-11-25T14:00:00Z",
          duration: "1 hour 30 minutes",
          activity_type: "Walk",
          distance: 7500,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result).toEqual({
          activityId: "activity-789",
          userId: "user-abc",
          activityDate: "2025-11-25T14:00:00Z",
          duration: "PT1H30M",
          activityType: "Walk",
          distanceMeters: 7500,
        });
      });

      it("should map entity to DTO without distance (null)", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-no-dist",
          user_id: "user-xyz",
          activity_date: "2025-11-26T08:00:00Z",
          duration: "01:00:00",
          activity_type: "Mixed",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result).toEqual({
          activityId: "activity-no-dist",
          userId: "user-xyz",
          activityDate: "2025-11-26T08:00:00Z",
          duration: "PT1H",
          activityType: "Mixed",
        });
        expect(result).not.toHaveProperty("distanceMeters");
      });

      it("should handle already ISO-8601 formatted duration", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-iso",
          user_id: "user-iso",
          activity_date: "2025-11-26T12:00:00Z",
          duration: "PT2H15M30S",
          activity_type: "Run",
          distance: 15000,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.duration).toBe("PT2H15M30S");
      });

      it("should handle zero distance", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-zero",
          user_id: "user-zero",
          activity_date: "2025-11-26T06:00:00Z",
          duration: "00:30:00",
          activity_type: "Walk",
          distance: 0,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.distanceMeters).toBe(0);
      });

      it("should handle decimal distance values", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-decimal",
          user_id: "user-decimal",
          activity_date: "2025-11-26T09:00:00Z",
          duration: "01:15:00",
          activity_type: "Run",
          distance: 7250.125,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.distanceMeters).toBe(7250.125);
      });
    });

    describe("Edge cases", () => {
      it("should omit distanceMeters when distance is undefined", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-undef",
          user_id: "user-undef",
          activity_date: "2025-11-26T10:00:00Z",
          duration: "00:45:00",
          activity_type: "Run",
          distance: undefined,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result).not.toHaveProperty("distanceMeters");
      });

      it("should handle duration with only hours", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-hours",
          user_id: "user-hours",
          activity_date: "2025-11-26T05:00:00Z",
          duration: "02:00:00",
          activity_type: "Walk",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.duration).toBe("PT2H");
      });

      it("should handle duration with only minutes", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-mins",
          user_id: "user-mins",
          activity_date: "2025-11-26T06:00:00Z",
          duration: "00:45:00",
          activity_type: "Run",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.duration).toBe("PT45M");
      });

      it("should handle duration with only seconds", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-secs",
          user_id: "user-secs",
          activity_date: "2025-11-26T07:00:00Z",
          duration: "00:00:30",
          activity_type: "Run",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.duration).toBe("PT30S");
      });

      it("should handle word format with 'min' abbreviation", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-abbr",
          user_id: "user-abbr",
          activity_date: "2025-11-26T08:00:00Z",
          duration: "45 min",
          activity_type: "Walk",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.duration).toBe("PT45M");
      });

      it("should convert snake_case to camelCase for DTO fields", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-case",
          user_id: "user-case",
          activity_date: "2025-11-26T12:00:00Z",
          duration: "01:00:00",
          activity_type: "Run",
          distance: 10000,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result).toHaveProperty("activityId");
        expect(result).toHaveProperty("userId");
        expect(result).toHaveProperty("activityDate");
        expect(result).toHaveProperty("activityType");
        expect(result).toHaveProperty("distanceMeters");
        expect(result).not.toHaveProperty("activity_id");
        expect(result).not.toHaveProperty("user_id");
        expect(result).not.toHaveProperty("activity_date");
        expect(result).not.toHaveProperty("activity_type");
        expect(result).not.toHaveProperty("distance");
      });

      it("should handle different activity types", () => {
        // Arrange
        const runEntity: ActivityEntity = {
          activity_id: "run-1",
          user_id: "user-1",
          activity_date: "2025-11-26T10:00:00Z",
          duration: "00:45:00",
          activity_type: "Run",
          distance: null,
        };
        const walkEntity: ActivityEntity = {
          activity_id: "walk-1",
          user_id: "user-1",
          activity_date: "2025-11-26T11:00:00Z",
          duration: "00:30:00",
          activity_type: "Walk",
          distance: null,
        };
        const mixedEntity: ActivityEntity = {
          activity_id: "mixed-1",
          user_id: "user-1",
          activity_date: "2025-11-26T12:00:00Z",
          duration: "01:00:00",
          activity_type: "Mixed",
          distance: null,
        };

        // Act
        const runResult = mapEntityToDto(runEntity);
        const walkResult = mapEntityToDto(walkEntity);
        const mixedResult = mapEntityToDto(mixedEntity);

        // Assert
        expect(runResult.activityType).toBe("Run");
        expect(walkResult.activityType).toBe("Walk");
        expect(mixedResult.activityType).toBe("Mixed");
      });
    });

    describe("Date/time conversion accuracy", () => {
      it("should preserve ISO-8601 UTC datetime format", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-datetime",
          user_id: "user-datetime",
          activity_date: "2025-12-31T23:59:59Z",
          duration: "01:00:00",
          activity_type: "Run",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.activityDate).toBe("2025-12-31T23:59:59Z");
      });

      it("should handle leap year dates", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-leap",
          user_id: "user-leap",
          activity_date: "2024-02-29T12:00:00Z",
          duration: "00:45:00",
          activity_type: "Run",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.activityDate).toBe("2024-02-29T12:00:00Z");
      });

      it("should handle year boundary dates", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-boundary",
          user_id: "user-boundary",
          activity_date: "2025-01-01T00:00:00Z",
          duration: "01:00:00",
          activity_type: "Walk",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.activityDate).toBe("2025-01-01T00:00:00Z");
      });
    });

    describe("Duration conversion formats", () => {
      it("should convert complex HH:MM:SS to ISO-8601", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-complex",
          user_id: "user-complex",
          activity_date: "2025-11-26T10:00:00Z",
          duration: "02:15:30",
          activity_type: "Run",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.duration).toBe("PT2H15M30S");
      });

      it("should convert word format '45 minutes' to ISO-8601", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-word",
          user_id: "user-word",
          activity_date: "2025-11-26T11:00:00Z",
          duration: "45 minutes",
          activity_type: "Walk",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.duration).toBe("PT45M");
      });

      it("should handle word format '1 hour 30 minutes 45 seconds'", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-long-word",
          user_id: "user-long",
          activity_date: "2025-11-26T12:00:00Z",
          duration: "1 hour 30 minutes 45 seconds",
          activity_type: "Run",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.duration).toBe("PT1H30M45S");
      });

      it("should handle plural forms in word format", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-plural",
          user_id: "user-plural",
          activity_date: "2025-11-26T13:00:00Z",
          duration: "2 hours 15 mins",
          activity_type: "Walk",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.duration).toBe("PT2H15M");
      });

      it("should return PT0S for unparseable duration format", () => {
        // Arrange
        const entity: ActivityEntity = {
          activity_id: "activity-invalid",
          user_id: "user-invalid",
          activity_date: "2025-11-26T14:00:00Z",
          duration: "invalid format",
          activity_type: "Run",
          distance: null,
        };

        // Act
        const result = mapEntityToDto(entity);

        // Assert
        expect(result.duration).toBe("PT0S");
      });
    });
  });
});

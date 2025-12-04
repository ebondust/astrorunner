import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActivityForm } from "./useActivityForm";
import type { ActivityDto } from "@/types";

describe("useActivityForm", () => {
  beforeEach(() => {
    // Reset to known date
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-26T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initialization", () => {
    it("should initialize with default form state", () => {
      // Act
      const { result } = renderHook(() => useActivityForm());

      // Assert
      expect(result.current.formState).toEqual({
        activityDate: "2025-11-26T12:00:00.000Z",
        duration: "",
        activityType: "Run",
        distanceMeters: undefined,
      });
      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });
  });

  describe("setField", () => {
    it("should update single field value", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Act
      act(() => {
        result.current.setField("duration", "1.30");
      });

      // Assert
      expect(result.current.formState.duration).toBe("1.30");
    });

    it("should update activityType field", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Act
      act(() => {
        result.current.setField("activityType", "Walk");
      });

      // Assert
      expect(result.current.formState.activityType).toBe("Walk");
    });

    it("should update distanceMeters field", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Act
      act(() => {
        result.current.setField("distanceMeters", 5.5);
      });

      // Assert
      expect(result.current.formState.distanceMeters).toBe(5.5);
    });

    it("should clear error for field when value changes", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // First, trigger validation to create errors
      act(() => {
        result.current.setField("duration", "");
        result.current.validate();
      });

      expect(result.current.errors.duration).toBeDefined();

      // Act - Update field value
      act(() => {
        result.current.setField("duration", "1.00");
      });

      // Assert - Error should be cleared
      expect(result.current.errors.duration).toBeUndefined();
    });

    it("should not affect other fields when updating one field", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      act(() => {
        result.current.setField("duration", "1.30");
        result.current.setField("distanceMeters", 5.0);
      });

      // Act
      act(() => {
        result.current.setField("activityType", "Walk");
      });

      // Assert
      expect(result.current.formState.duration).toBe("1.30");
      expect(result.current.formState.distanceMeters).toBe(5.0);
      expect(result.current.formState.activityType).toBe("Walk");
    });
  });

  describe("validate", () => {
    it("should return true when form is valid", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      act(() => {
        result.current.setField("activityDate", "2025-11-26T10:00:00Z");
        result.current.setField("duration", "1.30");
        result.current.setField("activityType", "Run");
        result.current.setField("distanceMeters", 5.0);
      });

      // Act
      let isValid = false;
      act(() => {
        isValid = result.current.validate();
      });

      // Assert
      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it("should return false and set errors when duration is empty", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      act(() => {
        result.current.setField("duration", "");
      });

      // Act
      let isValid = true;
      act(() => {
        isValid = result.current.validate();
      });

      // Assert
      expect(isValid).toBe(false);
      expect(result.current.errors.duration).toBeDefined();
    });

    it("should return false and set errors when duration format is invalid", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      act(() => {
        result.current.setField("duration", "invalid");
      });

      // Act
      let isValid = true;
      act(() => {
        isValid = result.current.validate();
      });

      // Assert
      expect(isValid).toBe(false);
      expect(result.current.errors.duration).toBeDefined();
    });

    it("should return false and set errors when activityDate is invalid", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      act(() => {
        result.current.setField("activityDate", "not-a-date");
        result.current.setField("duration", "1.00");
      });

      // Act
      let isValid = true;
      act(() => {
        isValid = result.current.validate();
      });

      // Assert
      expect(isValid).toBe(false);
      expect(result.current.errors.activityDate).toBeDefined();
    });

    it("should return false when distance is negative", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      act(() => {
        result.current.setField("activityDate", "2025-11-26T10:00:00Z");
        result.current.setField("duration", "1.00");
        result.current.setField("distanceMeters", -5);
      });

      // Act
      let isValid = true;
      act(() => {
        isValid = result.current.validate();
      });

      // Assert
      expect(isValid).toBe(false);
      expect(result.current.errors.distanceMeters).toBeDefined();
    });

    it("should validate successfully with undefined distance (optional)", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      act(() => {
        result.current.setField("activityDate", "2025-11-26T10:00:00Z");
        result.current.setField("duration", "1.00");
        result.current.setField("distanceMeters", undefined);
      });

      // Act
      let isValid = false;
      act(() => {
        isValid = result.current.validate();
      });

      // Assert
      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });
  });

  describe("reset", () => {
    it("should reset form to initial state", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Modify form
      act(() => {
        result.current.setField("duration", "2.00");
        result.current.setField("activityType", "Walk");
        result.current.setField("distanceMeters", 10.5);
      });

      // Act
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(result.current.formState.duration).toBe("");
      expect(result.current.formState.activityType).toBe("Run");
      expect(result.current.formState.distanceMeters).toBeUndefined();
    });

    it("should clear all errors", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Create errors
      act(() => {
        result.current.setField("duration", "");
        result.current.validate();
      });

      expect(result.current.errors.duration).toBeDefined();

      // Act
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(result.current.errors).toEqual({});
    });

    it("should reset to current timestamp", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Modify date
      act(() => {
        result.current.setField("activityDate", "2025-01-01T00:00:00Z");
      });

      // Act
      act(() => {
        result.current.reset();
      });

      // Assert - Should be back to system time
      expect(result.current.formState.activityDate).toBe("2025-11-26T12:00:00.000Z");
    });
  });

  describe("initializeFromActivity", () => {
    it("should populate form from existing activity", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      const activity: ActivityDto = {
        activityId: "act-123",
        userId: "user-1",
        activityDate: "2025-11-20T14:30:00Z",
        duration: "PT1H30M",
        activityType: "Walk",
        distanceMeters: 7500,
      };

      // Act
      act(() => {
        result.current.initializeFromActivity(activity);
      });

      // Assert
      expect(result.current.formState.activityDate).toBe("2025-11-20T14:30:00Z");
      expect(result.current.formState.duration).toBe("1.30"); // Converted from PT1H30M
      expect(result.current.formState.activityType).toBe("Walk");
      expect(result.current.formState.distanceMeters).toBe(7.5); // Converted from meters to km
    });

    it("should handle activity without distance", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      const activity: ActivityDto = {
        activityId: "act-123",
        userId: "user-1",
        activityDate: "2025-11-20T14:30:00Z",
        duration: "PT45M",
        activityType: "Run",
        distanceMeters: null,
      };

      // Act
      act(() => {
        result.current.initializeFromActivity(activity);
      });

      // Assert
      expect(result.current.formState.distanceMeters).toBeUndefined();
    });

    it("should clear existing errors", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Create errors
      act(() => {
        result.current.setField("duration", "");
        result.current.validate();
      });

      expect(result.current.errors.duration).toBeDefined();

      const activity: ActivityDto = {
        activityId: "act-123",
        userId: "user-1",
        activityDate: "2025-11-20T14:30:00Z",
        duration: "PT1H",
        activityType: "Run",
        distanceMeters: 5000,
      };

      // Act
      act(() => {
        result.current.initializeFromActivity(activity);
      });

      // Assert
      expect(result.current.errors).toEqual({});
    });

    it("should convert various duration formats correctly", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      const activity: ActivityDto = {
        activityId: "act-123",
        userId: "user-1",
        activityDate: "2025-11-20T14:30:00Z",
        duration: "PT2H15M",
        activityType: "Run",
        distanceMeters: 15000,
      };

      // Act
      act(() => {
        result.current.initializeFromActivity(activity);
      });

      // Assert
      expect(result.current.formState.duration).toBe("2.15");
    });

    it("should convert distance from meters to kilometers", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      const activity: ActivityDto = {
        activityId: "act-123",
        userId: "user-1",
        activityDate: "2025-11-20T14:30:00Z",
        duration: "PT1H",
        activityType: "Run",
        distanceMeters: 12500, // 12.5 km
      };

      // Act
      act(() => {
        result.current.initializeFromActivity(activity);
      });

      // Assert
      expect(result.current.formState.distanceMeters).toBe(12.5);
    });
  });

  describe("isValid", () => {
    it("should be true when no errors exist", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Assert
      expect(result.current.isValid).toBe(true);
    });

    it("should be false when errors exist", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Act
      act(() => {
        result.current.setField("duration", "");
        result.current.validate();
      });

      // Assert
      expect(result.current.isValid).toBe(false);
    });

    it("should update when errors are cleared", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Create errors
      act(() => {
        result.current.setField("duration", "");
        result.current.validate();
      });

      expect(result.current.isValid).toBe(false);

      // Act - Fix the error
      act(() => {
        result.current.setField("duration", "1.00");
      });

      // Assert
      expect(result.current.isValid).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle rapid field updates", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Act - Multiple rapid updates
      act(() => {
        result.current.setField("duration", "1.00");
        result.current.setField("duration", "1.30");
        result.current.setField("duration", "2.00");
      });

      // Assert - Should have latest value
      expect(result.current.formState.duration).toBe("2.00");
    });

    it("should handle zero distance", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      act(() => {
        result.current.setField("activityDate", "2025-11-26T10:00:00Z");
        result.current.setField("duration", "1.00");
        result.current.setField("distanceMeters", 0);
      });

      // Act
      let isValid = false;
      act(() => {
        isValid = result.current.validate();
      });

      // Assert
      expect(isValid).toBe(true);
      expect(result.current.formState.distanceMeters).toBe(0);
    });

    it("should handle all activity types", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      const types: ("Run" | "Walk" | "Mixed")[] = ["Run", "Walk", "Mixed"];

      types.forEach((type) => {
        // Act
        act(() => {
          result.current.setField("activityType", type);
        });

        // Assert
        expect(result.current.formState.activityType).toBe(type);
      });
    });

    it("should preserve validation state across field updates", () => {
      // Arrange
      const { result } = renderHook(() => useActivityForm());

      // Set invalid values for multiple fields
      act(() => {
        result.current.setField("duration", "");
        result.current.setField("distanceMeters", -5);
      });

      // Validate to create errors
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.duration).toBeDefined();
      expect(result.current.errors.distanceMeters).toBeDefined();

      // Act - Fix one error (this clears its error immediately via setField)
      act(() => {
        result.current.setField("duration", "1.00");
      });

      // Assert - Duration error should be cleared, but distanceMeters error still exists
      expect(result.current.errors.duration).toBeUndefined();
      expect(result.current.errors.distanceMeters).toBeDefined();
      expect(result.current.isValid).toBe(false);
    });
  });
});

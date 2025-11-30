import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "../../db/supabase.client";
import type { ActivityEntity } from "../../types";
import { aggregateActivityStats } from "./activity-stats";

// Mock Supabase client
const createMockSupabaseClient = () => {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
  } as unknown as SupabaseClient;
};

describe("activity-stats.ts - Activity Statistics Aggregation", () => {
  describe("aggregateActivityStats", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should aggregate activities for a month with all activity types", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "01:30:00",
          activity_type: "Run",
          distance: 10000,
        },
        {
          activity_id: "2",
          user_id: userId,
          activity_date: "2025-11-10T10:00:00Z",
          duration: "00:45:00",
          activity_type: "Walk",
          distance: 5000,
        },
        {
          activity_id: "3",
          user_id: userId,
          activity_date: "2025-11-15T10:00:00Z",
          duration: "01:00:00",
          activity_type: "Mixed",
          distance: 8000,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalActivities).toBe(3);
      expect(result.runCount).toBe(1);
      expect(result.walkCount).toBe(1);
      expect(result.mixedCount).toBe(1);
      expect(result.totalDistanceMeters).toBe(23000);
      expect(result.totalDuration).toBe("PT3H15M");
      expect(result.month).toBe(11);
      expect(result.year).toBe(2025);
      expect(result.daysElapsed).toBe(25);
      expect(result.daysRemaining).toBe(5);
      expect(result.totalDays).toBe(30);
      expect(result.distanceUnit).toBe("km");
    });

    it("should handle empty activity list", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      (mockSupabase.lte as any).mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalActivities).toBe(0);
      expect(result.runCount).toBe(0);
      expect(result.walkCount).toBe(0);
      expect(result.mixedCount).toBe(0);
      expect(result.totalDistanceMeters).toBe(0);
      expect(result.totalDuration).toBe("PT0S");
    });

    it("should handle null activity list", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      (mockSupabase.lte as any).mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalActivities).toBe(0);
      expect(result.runCount).toBe(0);
      expect(result.walkCount).toBe(0);
      expect(result.mixedCount).toBe(0);
      expect(result.totalDistanceMeters).toBe(0);
      expect(result.totalDuration).toBe("PT0S");
    });

    it("should handle activities without distance", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "01:30:00",
          activity_type: "Run",
          distance: null,
        },
        {
          activity_id: "2",
          user_id: userId,
          activity_date: "2025-11-10T10:00:00Z",
          duration: "00:45:00",
          activity_type: "Walk",
          distance: null,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalActivities).toBe(2);
      expect(result.totalDistanceMeters).toBe(0);
      expect(result.totalDuration).toBe("PT2H15M");
    });

    it("should parse HH:MM:SS duration format", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "02:30:45",
          activity_type: "Run",
          distance: null,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalDuration).toBe("PT2H30M45S");
    });

    it("should parse ISO-8601 duration format", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "PT1H30M",
          activity_type: "Run",
          distance: null,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalDuration).toBe("PT1H30M");
    });

    it("should parse word format duration", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "1 hour 30 minutes",
          activity_type: "Run",
          distance: null,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalDuration).toBe("PT1H30M");
    });

    it("should handle activities with zero distance", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "01:30:00",
          activity_type: "Run",
          distance: 0,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalDistanceMeters).toBe(0);
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      (mockSupabase.lte as any).mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      // Act & Assert
      await expect(
        aggregateActivityStats(mockSupabase, userId, date, "km")
      ).rejects.toThrow("Failed to fetch activities: Database connection failed");
    });

    it("should handle February in non-leap year", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-02-15T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-02-15T10:00:00Z");

      (mockSupabase.lte as any).mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.month).toBe(2);
      expect(result.totalDays).toBe(28);
      expect(result.daysElapsed).toBe(15);
      expect(result.daysRemaining).toBe(13);
    });

    it("should handle February in leap year", async () => {
      // Arrange
      vi.setSystemTime(new Date("2024-02-15T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2024-02-15T10:00:00Z");

      (mockSupabase.lte as any).mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.month).toBe(2);
      expect(result.totalDays).toBe(29);
      expect(result.daysElapsed).toBe(15);
      expect(result.daysRemaining).toBe(14);
    });

    it("should calculate days elapsed correctly when current date is in queried month", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      (mockSupabase.lte as any).mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.daysElapsed).toBe(25);
      expect(result.daysRemaining).toBe(5);
    });

    it("should use total days when querying past months", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-10-15T10:00:00Z"); // October

      (mockSupabase.lte as any).mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.daysElapsed).toBe(31); // Full month
      expect(result.daysRemaining).toBe(0);
      expect(result.totalDays).toBe(31);
    });

    it("should support miles as distance unit", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "01:30:00",
          activity_type: "Run",
          distance: 10000,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "mi");

      // Assert
      expect(result.distanceUnit).toBe("mi");
      expect(result.totalDistanceMeters).toBe(10000); // Still in meters
    });

    it("should handle very large distance values", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "01:30:00",
          activity_type: "Run",
          distance: 999999999,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalDistanceMeters).toBe(999999999);
    });

    it("should handle very long durations", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "100:30:45", // 100 hours
          activity_type: "Run",
          distance: null,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalDuration).toBe("PT100H30M45S");
    });

    it("should count only runs correctly", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "01:30:00",
          activity_type: "Run",
          distance: null,
        },
        {
          activity_id: "2",
          user_id: userId,
          activity_date: "2025-11-10T10:00:00Z",
          duration: "01:00:00",
          activity_type: "Run",
          distance: null,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.runCount).toBe(2);
      expect(result.walkCount).toBe(0);
      expect(result.mixedCount).toBe(0);
    });

    it("should handle invalid duration format gracefully", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: "invalid",
          activity_type: "Run",
          distance: null,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalDuration).toBe("PT0S"); // Unparseable duration results in 0
    });

    it("should handle non-string duration type", async () => {
      // Arrange
      vi.setSystemTime(new Date("2025-11-25T12:00:00Z"));
      const userId = "user1";
      const date = new Date("2025-11-15T10:00:00Z");

      const mockActivities: Partial<ActivityEntity>[] = [
        {
          activity_id: "1",
          user_id: userId,
          activity_date: "2025-11-05T10:00:00Z",
          duration: null as any,
          activity_type: "Run",
          distance: null,
        },
      ];

      (mockSupabase.lte as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });

      // Act
      const result = await aggregateActivityStats(mockSupabase, userId, date, "km");

      // Assert
      expect(result.totalDuration).toBe("PT0S");
    });
  });
});

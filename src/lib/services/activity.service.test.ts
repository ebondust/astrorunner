import { describe, it, expect, vi, beforeEach } from "vitest";
import { createActivity } from "./activity.service";
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateActivityCommand, ActivityEntity } from "../../types";
import type { Mock } from "vitest";

// Type for the mocked Supabase client's from method
type MockFromMethod = Mock<
  Parameters<SupabaseClient["from"]>,
  {
    insert: Mock<
      [unknown],
      {
        select: Mock<
          [],
          {
            single: Mock<[], Promise<{ data: ActivityEntity | null; error: unknown | null }>>;
          }
        >;
      }
    >;
  }
>;

describe("activity.service.ts", () => {
  describe("createActivity", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      // Reset mocks before each test
      vi.clearAllMocks();

      // Create a fresh mock Supabase client for each test
      mockSupabase = {
        from: vi.fn(),
      } as unknown as SupabaseClient;
    });

    describe("Success paths", () => {
      it("should create activity with all fields", async () => {
        // Arrange
        const userId = "user-123";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        };

        const expectedEntity: ActivityEntity = {
          activity_id: "activity-abc",
          user_id: userId,
          activity_date: "2025-11-26T10:30:00Z",
          duration: "45 minutes",
          activity_type: "Run",
          distance: 5000,
        };

        // Mock the Supabase chain
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: expectedEntity,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createActivity(mockSupabase, userId, command);

        // Assert
        expect(result).toEqual(expectedEntity);
        expect(mockSupabase.from).toHaveBeenCalledWith("activities");
        expect(mockInsert).toHaveBeenCalledWith({
          user_id: userId,
          activity_date: "2025-11-26T10:30:00Z",
          duration: "45 minutes",
          activity_type: "Run",
          distance: 5000,
        });
        expect(mockSelect).toHaveBeenCalled();
      });

      it("should create activity without distance (optional field)", async () => {
        // Arrange
        const userId = "user-456";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT1H",
          activityType: "Walk",
        };

        const expectedEntity: ActivityEntity = {
          activity_id: "activity-xyz",
          user_id: userId,
          activity_date: "2025-11-26T10:30:00Z",
          duration: "1 hour",
          activity_type: "Walk",
          distance: null,
        };

        // Mock the Supabase chain
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: expectedEntity,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createActivity(mockSupabase, userId, command);

        // Assert
        expect(result).toEqual(expectedEntity);
        expect(mockInsert).toHaveBeenCalledWith({
          user_id: userId,
          activity_date: "2025-11-26T10:30:00Z",
          duration: "1 hour",
          activity_type: "Walk",
          distance: null,
        });
      });

      it("should create activity with HH:MM:SS duration format", async () => {
        // Arrange
        const userId = "user-789";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T08:00:00Z",
          duration: "01:30:00",
          activityType: "Mixed",
          distanceMeters: 3500,
        };

        const expectedEntity: ActivityEntity = {
          activity_id: "activity-mixed",
          user_id: userId,
          activity_date: "2025-11-26T08:00:00Z",
          duration: "1 hour 30 minutes",
          activity_type: "Mixed",
          distance: 3500,
        };

        // Mock the Supabase chain
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: expectedEntity,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createActivity(mockSupabase, userId, command);

        // Assert
        expect(result).toEqual(expectedEntity);
      });

      it("should create activity with zero distance", async () => {
        // Arrange
        const userId = "user-zero";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T06:00:00Z",
          duration: "PT30M",
          activityType: "Walk",
          distanceMeters: 0,
        };

        const expectedEntity: ActivityEntity = {
          activity_id: "activity-zero",
          user_id: userId,
          activity_date: "2025-11-26T06:00:00Z",
          duration: "30 minutes",
          activity_type: "Walk",
          distance: 0,
        };

        // Mock the Supabase chain
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: expectedEntity,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createActivity(mockSupabase, userId, command);

        // Assert
        expect(result.distance).toBe(0);
      });
    });

    describe("Error handling", () => {
      it("should throw error when userId is empty string", async () => {
        // Arrange
        const userId = "";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run",
        };

        // Act & Assert
        await expect(createActivity(mockSupabase, userId, command)).rejects.toThrow("User ID is required");
      });

      it("should throw error when userId is whitespace only", async () => {
        // Arrange
        const userId = "   ";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run",
        };

        // Act & Assert
        await expect(createActivity(mockSupabase, userId, command)).rejects.toThrow("User ID is required");
      });

      it("should throw error when database insert fails", async () => {
        // Arrange
        const userId = "user-123";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        };

        const dbError = {
          message: "Database connection error",
          code: "PGRST301",
        };

        // Mock the Supabase chain with error
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: dbError,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createActivity(mockSupabase, userId, command)).rejects.toThrow(
          "Failed to create activity: Database connection error"
        );
      });

      it("should throw error when database returns no data", async () => {
        // Arrange
        const userId = "user-123";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run",
        };

        // Mock the Supabase chain returning no data
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createActivity(mockSupabase, userId, command)).rejects.toThrow(
          "Activity was not created. No data returned from database."
        );
      });

      it("should throw error when RLS policy blocks insert", async () => {
        // Arrange
        const userId = "user-blocked";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:30:00Z",
          duration: "PT45M",
          activityType: "Run",
        };

        const rlsError = {
          message: "new row violates row-level security policy",
          code: "42501",
        };

        // Mock the Supabase chain with RLS error
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: rlsError,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act & Assert
        await expect(createActivity(mockSupabase, userId, command)).rejects.toThrow(
          "Failed to create activity: new row violates row-level security policy"
        );
      });
    });

    describe("Data transformation", () => {
      it("should correctly transform command to entity via mapper", async () => {
        // Arrange
        const userId = "user-transform";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T12:00:00Z",
          duration: "PT2H15M30S",
          activityType: "Run",
          distanceMeters: 15000,
        };

        const expectedEntity: ActivityEntity = {
          activity_id: "activity-transform",
          user_id: userId,
          activity_date: "2025-11-26T12:00:00Z",
          duration: "2 hours 15 minutes 30 seconds",
          activity_type: "Run",
          distance: 15000,
        };

        // Mock the Supabase chain
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: expectedEntity,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createActivity(mockSupabase, userId, command);

        // Assert
        expect(mockInsert).toHaveBeenCalledWith({
          user_id: userId,
          activity_date: "2025-11-26T12:00:00Z",
          duration: "2 hours 15 minutes 30 seconds",
          activity_type: "Run",
          distance: 15000,
        });
        expect(result).toEqual(expectedEntity);
      });

      it("should handle camelCase to snake_case conversion", async () => {
        // Arrange
        const userId = "user-case";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:00:00Z",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        };

        const expectedEntity: ActivityEntity = {
          activity_id: "activity-case",
          user_id: userId,
          activity_date: "2025-11-26T10:00:00Z",
          duration: "45 minutes",
          activity_type: "Run",
          distance: 5000,
        };

        // Mock the Supabase chain
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: expectedEntity,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        await createActivity(mockSupabase, userId, command);

        // Assert - Verify snake_case fields in insert call
        const insertCall = mockInsert.mock.calls[0][0];
        expect(insertCall).toHaveProperty("user_id");
        expect(insertCall).toHaveProperty("activity_date");
        expect(insertCall).toHaveProperty("activity_type");
        expect(insertCall).not.toHaveProperty("userId");
        expect(insertCall).not.toHaveProperty("activityDate");
        expect(insertCall).not.toHaveProperty("activityType");
      });
    });

    describe("Edge cases", () => {
      it("should handle very long duration", async () => {
        // Arrange
        const userId = "user-marathon";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T06:00:00Z",
          duration: "PT10H",
          activityType: "Run",
          distanceMeters: 42195,
        };

        const expectedEntity: ActivityEntity = {
          activity_id: "activity-marathon",
          user_id: userId,
          activity_date: "2025-11-26T06:00:00Z",
          duration: "10 hours",
          activity_type: "Run",
          distance: 42195,
        };

        // Mock the Supabase chain
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: expectedEntity,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createActivity(mockSupabase, userId, command);

        // Assert
        expect(result.duration).toBe("10 hours");
      });

      it("should handle decimal distance values", async () => {
        // Arrange
        const userId = "user-decimal";
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T09:00:00Z",
          duration: "PT1H15M",
          activityType: "Run",
          distanceMeters: 7250.125,
        };

        const expectedEntity: ActivityEntity = {
          activity_id: "activity-decimal",
          user_id: userId,
          activity_date: "2025-11-26T09:00:00Z",
          duration: "1 hour 15 minutes",
          activity_type: "Run",
          distance: 7250.125,
        };

        // Mock the Supabase chain
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: expectedEntity,
            error: null,
          }),
        });

        const mockInsert = vi.fn().mockReturnValue({
          select: mockSelect,
        });

        (mockSupabase.from as MockFromMethod).mockReturnValue({
          insert: mockInsert,
        });

        // Act
        const result = await createActivity(mockSupabase, userId, command);

        // Assert
        expect(result.distance).toBe(7250.125);
      });

      it("should handle all activity types", async () => {
        // Arrange
        const userId = "user-types";

        const testCases = [
          { type: "Run" as const, duration: "PT45M" },
          { type: "Walk" as const, duration: "PT30M" },
          { type: "Mixed" as const, duration: "PT1H" },
        ];

        for (const testCase of testCases) {
          const command: CreateActivityCommand = {
            activityDate: "2025-11-26T10:00:00Z",
            duration: testCase.duration,
            activityType: testCase.type,
          };

          const expectedEntity: ActivityEntity = {
            activity_id: `activity-${testCase.type.toLowerCase()}`,
            user_id: userId,
            activity_date: "2025-11-26T10:00:00Z",
            duration:
              testCase.duration === "PT45M" ? "45 minutes" : testCase.duration === "PT30M" ? "30 minutes" : "1 hour",
            activity_type: testCase.type,
            distance: null,
          };

          // Mock the Supabase chain
          const mockSelect = vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: expectedEntity,
              error: null,
            }),
          });

          const mockInsert = vi.fn().mockReturnValue({
            select: mockSelect,
          });

          (mockSupabase.from as MockFromMethod).mockReturnValue({
            insert: mockInsert,
          });

          // Act
          const result = await createActivity(mockSupabase, userId, command);

          // Assert
          expect(result.activity_type).toBe(testCase.type);
        }
      });
    });
  });
});

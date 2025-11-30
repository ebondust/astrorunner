import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchActivities,
  getActivity,
  createActivity,
  replaceActivity,
  patchActivity,
  deleteActivity,
} from "./activities.client";
import type {
  ActivitiesListQuery,
  ActivitiesListDto,
  ActivityDto,
  CreateActivityCommand,
  ReplaceActivityCommand,
  PatchActivityCommand,
} from "@/types";

describe("activities.client.ts", () => {
  // Mock global fetch
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchActivities", () => {
    describe("Success paths", () => {
      it("should fetch activities with query parameters", async () => {
        // Arrange
        const query: ActivitiesListQuery = {
          limit: 10,
          from: "2025-11-01T00:00:00Z",
          to: "2025-11-30T23:59:59Z",
          type: "Run",
          sort: "activityDate",
          order: "desc",
        };

        const mockResponse: ActivitiesListDto = {
          items: [
            {
              activityId: "act-1",
              userId: "user-1",
              activityDate: "2025-11-26T10:00:00Z",
              duration: "PT45M",
              activityType: "Run",
              distanceMeters: 5000,
            },
          ],
          totalCount: 1,
          nextCursor: null,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const result = await fetchActivities(query);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledOnce();
        const fetchUrl = mockFetch.mock.calls[0][0];
        expect(fetchUrl).toContain("/api/activities?");
        expect(fetchUrl).toContain("limit=10");
        expect(fetchUrl).toContain("from=2025-11-01T00%3A00%3A00Z");
        expect(fetchUrl).toContain("to=2025-11-30T23%3A59%3A59Z");
        expect(fetchUrl).toContain("type=Run");
        expect(fetchUrl).toContain("sort=activityDate");
        expect(fetchUrl).toContain("order=desc");
      });

      it("should fetch activities with minimal query parameters", async () => {
        // Arrange
        const query: ActivitiesListQuery = {};

        const mockResponse: ActivitiesListDto = {
          items: [],
          totalCount: 0,
          nextCursor: null,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const result = await fetchActivities(query);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith("/api/activities?");
      });

      it("should handle pagination parameters (cursor)", async () => {
        // Arrange
        const query: ActivitiesListQuery = {
          cursor: "next-page-token",
          limit: 20,
        };

        const mockResponse: ActivitiesListDto = {
          items: [],
          totalCount: 50,
          nextCursor: "another-token",
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const result = await fetchActivities(query);

        // Assert
        expect(result.nextCursor).toBe("another-token");
        const fetchUrl = mockFetch.mock.calls[0][0];
        expect(fetchUrl).toContain("cursor=next-page-token");
      });

      it("should handle pagination parameters (page-based)", async () => {
        // Arrange
        const query: ActivitiesListQuery = {
          page: 2,
          pageSize: 15,
        };

        const mockResponse: ActivitiesListDto = {
          items: [],
          totalCount: 100,
          nextCursor: null,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        await fetchActivities(query);

        // Assert
        const fetchUrl = mockFetch.mock.calls[0][0];
        expect(fetchUrl).toContain("page=2");
        expect(fetchUrl).toContain("pageSize=15");
      });

      it("should handle hasDistance filter", async () => {
        // Arrange
        const query: ActivitiesListQuery = {
          hasDistance: true,
        };

        const mockResponse: ActivitiesListDto = {
          items: [],
          totalCount: 0,
          nextCursor: null,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        await fetchActivities(query);

        // Assert
        const fetchUrl = mockFetch.mock.calls[0][0];
        expect(fetchUrl).toContain("hasDistance=true");
      });
    });

    describe("Error handling", () => {
      it("should throw error when fetch fails with error message", async () => {
        // Arrange
        const query: ActivitiesListQuery = {};

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: async () => ({ message: "Database error" }),
        });

        // Act & Assert
        await expect(fetchActivities(query)).rejects.toThrow("Database error");
      });

      it("should throw error when fetch fails without JSON response", async () => {
        // Arrange
        const query: ActivitiesListQuery = {};

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: async () => {
            throw new Error("Invalid JSON");
          },
        });

        // Act & Assert
        // When JSON parsing fails, errorData.message becomes response.statusText
        await expect(fetchActivities(query)).rejects.toThrow("Internal Server Error");
      });

      it("should throw error on network failure", async () => {
        // Arrange
        const query: ActivitiesListQuery = {};

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // Act & Assert
        await expect(fetchActivities(query)).rejects.toThrow("Network error");
      });
    });
  });

  describe("getActivity", () => {
    describe("Success paths", () => {
      it("should get a single activity by ID", async () => {
        // Arrange
        const activityId = "act-123";
        const mockActivity: ActivityDto = {
          activityId: "act-123",
          userId: "user-1",
          activityDate: "2025-11-26T10:00:00Z",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockActivity,
        });

        // Act
        const result = await getActivity(activityId);

        // Assert
        expect(result).toEqual(mockActivity);
        expect(mockFetch).toHaveBeenCalledWith("/api/activities/act-123");
      });
    });

    describe("Error handling", () => {
      it("should throw 'Activity not found' when status is 404", async () => {
        // Arrange
        const activityId = "non-existent";

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: async () => ({ message: "Not found" }),
        });

        // Act & Assert
        await expect(getActivity(activityId)).rejects.toThrow("Activity not found");
      });

      it("should throw error for other HTTP errors", async () => {
        // Arrange
        const activityId = "act-123";

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: async () => ({ message: "Server error" }),
        });

        // Act & Assert
        await expect(getActivity(activityId)).rejects.toThrow("Server error");
      });
    });
  });

  describe("createActivity", () => {
    describe("Success paths", () => {
      it("should create a new activity", async () => {
        // Arrange
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:00:00Z",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        };

        const mockResponse: ActivityDto = {
          activityId: "act-new",
          userId: "user-1",
          activityDate: "2025-11-26T10:00:00Z",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockResponse,
        });

        // Act
        const result = await createActivity(command);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith("/api/activities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });
      });
    });

    describe("Error handling", () => {
      it("should throw validation error (400) with errors array", async () => {
        // Arrange
        const command: CreateActivityCommand = {
          activityDate: "invalid-date",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: async () => ({
            errors: [{ message: "Invalid date format" }],
          }),
        });

        // Act & Assert
        await expect(createActivity(command)).rejects.toThrow("Invalid date format");
      });

      it("should throw generic error for 400 without errors array", async () => {
        // Arrange
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:00:00Z",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: async () => ({ message: "Bad input" }),
        });

        // Act & Assert
        await expect(createActivity(command)).rejects.toThrow("Bad input");
      });

      it("should throw error for other HTTP errors", async () => {
        // Arrange
        const command: CreateActivityCommand = {
          activityDate: "2025-11-26T10:00:00Z",
          duration: "PT45M",
          activityType: "Run",
          distanceMeters: 5000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: async () => ({ message: "Database failure" }),
        });

        // Act & Assert
        await expect(createActivity(command)).rejects.toThrow("Database failure");
      });
    });
  });

  describe("replaceActivity", () => {
    describe("Success paths", () => {
      it("should replace an activity with PUT", async () => {
        // Arrange
        const activityId = "act-123";
        const command: ReplaceActivityCommand = {
          activityDate: "2025-11-26T12:00:00Z",
          duration: "PT1H",
          activityType: "Walk",
          distanceMeters: 3000,
        };

        const mockResponse: ActivityDto = {
          activityId: "act-123",
          userId: "user-1",
          activityDate: "2025-11-26T12:00:00Z",
          duration: "PT1H",
          activityType: "Walk",
          distanceMeters: 3000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const result = await replaceActivity(activityId, command);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith("/api/activities/act-123", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });
      });
    });

    describe("Error handling", () => {
      it("should throw 'Activity not found' when status is 404", async () => {
        // Arrange
        const activityId = "non-existent";
        const command: ReplaceActivityCommand = {
          activityDate: "2025-11-26T12:00:00Z",
          duration: "PT1H",
          activityType: "Walk",
          distanceMeters: 3000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: async () => ({ message: "Not found" }),
        });

        // Act & Assert
        await expect(replaceActivity(activityId, command)).rejects.toThrow("Activity not found");
      });

      it("should throw permission error when status is 403", async () => {
        // Arrange
        const activityId = "act-123";
        const command: ReplaceActivityCommand = {
          activityDate: "2025-11-26T12:00:00Z",
          duration: "PT1H",
          activityType: "Walk",
          distanceMeters: 3000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          json: async () => ({ message: "Forbidden" }),
        });

        // Act & Assert
        await expect(replaceActivity(activityId, command)).rejects.toThrow(
          "You do not have permission to update this activity"
        );
      });

      it("should throw validation error (400)", async () => {
        // Arrange
        const activityId = "act-123";
        const command: ReplaceActivityCommand = {
          activityDate: "invalid",
          duration: "PT1H",
          activityType: "Walk",
          distanceMeters: 3000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: async () => ({
            errors: [{ message: "Invalid date" }],
          }),
        });

        // Act & Assert
        await expect(replaceActivity(activityId, command)).rejects.toThrow("Invalid date");
      });
    });
  });

  describe("patchActivity", () => {
    describe("Success paths", () => {
      it("should partially update an activity with PATCH", async () => {
        // Arrange
        const activityId = "act-123";
        const command: PatchActivityCommand = {
          duration: "PT2H",
        };

        const mockResponse: ActivityDto = {
          activityId: "act-123",
          userId: "user-1",
          activityDate: "2025-11-26T10:00:00Z",
          duration: "PT2H",
          activityType: "Run",
          distanceMeters: 5000,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const result = await patchActivity(activityId, command);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith("/api/activities/act-123", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });
      });
    });

    describe("Error handling", () => {
      it("should throw 'Activity not found' when status is 404", async () => {
        // Arrange
        const activityId = "non-existent";
        const command: PatchActivityCommand = {
          duration: "PT2H",
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: async () => ({ message: "Not found" }),
        });

        // Act & Assert
        await expect(patchActivity(activityId, command)).rejects.toThrow("Activity not found");
      });

      it("should throw permission error when status is 403", async () => {
        // Arrange
        const activityId = "act-123";
        const command: PatchActivityCommand = {
          duration: "PT2H",
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          json: async () => ({ message: "Forbidden" }),
        });

        // Act & Assert
        await expect(patchActivity(activityId, command)).rejects.toThrow(
          "You do not have permission to update this activity"
        );
      });
    });
  });

  describe("deleteActivity", () => {
    describe("Success paths", () => {
      it("should delete an activity", async () => {
        // Arrange
        const activityId = "act-123";

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          json: async () => ({}),
        });

        // Act
        await deleteActivity(activityId);

        // Assert
        expect(mockFetch).toHaveBeenCalledWith("/api/activities/act-123", {
          method: "DELETE",
        });
      });

      it("should consider 404 as success (already deleted)", async () => {
        // Arrange
        const activityId = "act-123";

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: async () => ({ message: "Not found" }),
        });

        // Act & Assert - Should not throw
        await expect(deleteActivity(activityId)).resolves.toBeUndefined();
      });
    });

    describe("Error handling", () => {
      it("should throw permission error when status is 403", async () => {
        // Arrange
        const activityId = "act-123";

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          json: async () => ({ message: "Forbidden" }),
        });

        // Act & Assert
        await expect(deleteActivity(activityId)).rejects.toThrow(
          "You do not have permission to delete this activity"
        );
      });

      it("should throw error for other HTTP errors", async () => {
        // Arrange
        const activityId = "act-123";

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: async () => ({ message: "Server error" }),
        });

        // Act & Assert
        await expect(deleteActivity(activityId)).rejects.toThrow("Server error");
      });
    });
  });
});

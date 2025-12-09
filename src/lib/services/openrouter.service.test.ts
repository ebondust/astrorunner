import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterService } from "./openrouter.service";
import { OpenRouterAPIError, OpenRouterValidationError } from "./openrouter.errors";
import type { ActivityStats, OpenRouterResponse } from "./openrouter.types";
import type { Mock } from "vitest";

// Type for mocked fetch function
type MockFetch = Mock<Parameters<typeof fetch>, Promise<Response>>;

describe("OpenRouterService", () => {
  let service: OpenRouterService;
  const mockApiKey = "test-api-key-123";

  beforeEach(() => {
    // Mock global fetch before each test
    global.fetch = vi.fn();
    vi.clearAllMocks();
    vi.useFakeTimers();

    service = new OpenRouterService({
      apiKey: mockApiKey,
      timeout: 5000,
      maxRetries: 3,
      cacheTTL: 15 * 60 * 1000, // 15 minutes
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("should create service with valid API key", () => {
      // Arrange & Act
      const service = new OpenRouterService({
        apiKey: "valid-key",
      });

      // Assert
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("should throw error when API key is empty", () => {
      // Arrange & Act & Assert
      expect(() => new OpenRouterService({ apiKey: "" })).toThrow("OpenRouter API key is required");
    });

    it("should throw error when API key is whitespace", () => {
      // Arrange & Act & Assert
      expect(() => new OpenRouterService({ apiKey: "   " })).toThrow("OpenRouter API key is required");
    });

    it("should use default values when optional config not provided", () => {
      // Arrange & Act
      const service = new OpenRouterService({
        apiKey: "test-key",
      });

      // Assert - service should be created successfully with defaults
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("should use custom values when provided", () => {
      // Arrange & Act
      const service = new OpenRouterService({
        apiKey: "test-key",
        baseUrl: "https://custom.api.com",
        model: "custom-model",
        timeout: 10000,
        maxRetries: 5,
        cacheTTL: 30000,
      });

      // Assert - service should be created successfully
      expect(service).toBeInstanceOf(OpenRouterService);
    });
  });

  describe("generateMotivationalMessage", () => {
    const mockStats: ActivityStats = {
      totalActivities: 10,
      runCount: 6,
      walkCount: 3,
      mixedCount: 1,
      totalDistanceMeters: 50000,
      totalDuration: "PT5H30M",
      month: 11,
      year: 2025,
      daysElapsed: 15,
      daysRemaining: 15,
      totalDays: 30,
      distanceUnit: "km",
    };

    const mockApiResponse: OpenRouterResponse = {
      id: "response-123",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              message: "Great progress this month! Keep up the excellent work.",
              tone: "encouraging",
            }),
          },
          finish_reason: "stop",
        },
      ],
    };

    describe("Success paths", () => {
      it("should generate motivational message successfully", async () => {
        // Arrange
        const userId = "user-123";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockApiResponse,
        });

        // Act
        const result = await service.generateMotivationalMessage(userId, mockStats);

        // Assert
        expect(result).toMatchObject({
          message: "Great progress this month! Keep up the excellent work.",
          tone: "encouraging",
          cached: false,
        });
        expect(result.generatedAt).toBeDefined();
        expect(result.model).toBe("meta-llama/llama-3.3-70b-instruct:free");
      });

      it("should return cached message on second call with same stats", async () => {
        // Arrange
        const userId = "user-cache";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockApiResponse,
        });

        // Act - First call (should fetch)
        const result1 = await service.generateMotivationalMessage(userId, mockStats);

        // Act - Second call (should use cache)
        const result2 = await service.generateMotivationalMessage(userId, mockStats);

        // Assert
        expect(result1.cached).toBe(false);
        expect(result2.cached).toBe(true);
        expect(result1.message).toBe(result2.message);
        expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once
      });

      it("should bypass cache when bypassCache option is true", async () => {
        // Arrange
        const userId = "user-bypass";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockApiResponse,
        });

        // Act - First call
        await service.generateMotivationalMessage(userId, mockStats);

        // Act - Second call with bypassCache
        const result = await service.generateMotivationalMessage(userId, mockStats, { bypassCache: true });

        // Assert
        expect(result.cached).toBe(false);
        expect(global.fetch).toHaveBeenCalledTimes(2); // Called twice
      });

      it("should handle custom temperature option", async () => {
        // Arrange
        const userId = "user-temp";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockApiResponse,
        });

        // Act
        await service.generateMotivationalMessage(userId, mockStats, { temperature: 0.5 });

        // Assert
        const fetchCall = (global.fetch as MockFetch).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1].body as string);
        expect(requestBody.temperature).toBe(0.5);
      });

      it("should handle custom model option", async () => {
        // Arrange
        const userId = "user-model";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockApiResponse,
        });

        // Act
        await service.generateMotivationalMessage(userId, mockStats, { model: "custom-model" });

        // Assert
        const fetchCall = (global.fetch as MockFetch).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1].body as string);
        expect(requestBody.model).toBe("custom-model");
      });

      it("should parse JSON response from markdown code block", async () => {
        // Arrange
        const userId = "user-markdown";
        const responseWithMarkdown: OpenRouterResponse = {
          id: "response-markdown",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: '```json\n{"message": "Keep running!", "tone": "encouraging"}\n```',
              },
              finish_reason: "stop",
            },
          ],
        };
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => responseWithMarkdown,
        });

        // Act
        const result = await service.generateMotivationalMessage(userId, mockStats);

        // Assert
        expect(result.message).toBe("Keep running!");
        expect(result.tone).toBe("encouraging");
      });

      it("should apply smart default tone when tone is missing", async () => {
        // Arrange
        const userId = "user-no-tone";
        const responseWithoutTone: OpenRouterResponse = {
          id: "response-no-tone",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify({
                  message: "Amazing work this month!",
                }),
              },
              finish_reason: "stop",
            },
          ],
        };
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => responseWithoutTone,
        });

        // Act
        const result = await service.generateMotivationalMessage(userId, mockStats);

        // Assert
        expect(result.tone).toBe("celebratory"); // Smart default based on "amazing"
      });
    });

    describe("Cache behavior", () => {
      it("should invalidate cache when stats change", async () => {
        // Arrange
        const userId = "user-stats-change";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockApiResponse,
        });

        // Act - First call
        await service.generateMotivationalMessage(userId, mockStats);

        // Act - Second call with different stats
        const newStats = { ...mockStats, totalActivities: 20 };
        await service.generateMotivationalMessage(userId, newStats);

        // Assert
        expect(global.fetch).toHaveBeenCalledTimes(2); // Called twice due to stat change
      });

      it("should invalidate cache after TTL expires", async () => {
        // Arrange
        const userId = "user-ttl";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockApiResponse,
        });

        // Act - First call
        await service.generateMotivationalMessage(userId, mockStats);

        // Advance time past TTL (15 minutes + 1ms)
        vi.advanceTimersByTime(15 * 60 * 1000 + 1);

        // Act - Second call after TTL
        await service.generateMotivationalMessage(userId, mockStats);

        // Assert
        expect(global.fetch).toHaveBeenCalledTimes(2); // Called twice due to TTL expiry
      });

      it("should clear cache for specific user", async () => {
        // Arrange
        const userId = "user-clear";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockApiResponse,
        });

        // Act - First call
        await service.generateMotivationalMessage(userId, mockStats);

        // Clear cache
        service.clearCache(userId);

        // Act - Second call after cache clear
        await service.generateMotivationalMessage(userId, mockStats);

        // Assert
        expect(global.fetch).toHaveBeenCalledTimes(2); // Called twice due to cache clear
      });
    });

    describe("Validation errors", () => {
      it("should throw error for invalid month (< 1)", async () => {
        // Arrange
        const userId = "user-invalid-month";
        const invalidStats = { ...mockStats, month: 0 };

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, invalidStats)).rejects.toThrow(
          OpenRouterValidationError
        );
        await expect(service.generateMotivationalMessage(userId, invalidStats)).rejects.toThrow(
          "Invalid month: must be 1-12"
        );
      });

      it("should throw error for invalid month (> 12)", async () => {
        // Arrange
        const userId = "user-invalid-month";
        const invalidStats = { ...mockStats, month: 13 };

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, invalidStats)).rejects.toThrow(
          "Invalid month: must be 1-12"
        );
      });

      it("should throw error for invalid year (< 2000)", async () => {
        // Arrange
        const userId = "user-invalid-year";
        const invalidStats = { ...mockStats, year: 1999 };

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, invalidStats)).rejects.toThrow(
          "Invalid year: must be 2000-2100"
        );
      });

      it("should throw error for invalid year (> 2100)", async () => {
        // Arrange
        const userId = "user-invalid-year";
        const invalidStats = { ...mockStats, year: 2101 };

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, invalidStats)).rejects.toThrow(
          "Invalid year: must be 2000-2100"
        );
      });

      it("should throw error for negative total activities", async () => {
        // Arrange
        const userId = "user-negative";
        const invalidStats = { ...mockStats, totalActivities: -5 };

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, invalidStats)).rejects.toThrow(
          "Total activities cannot be negative"
        );
      });

      it("should throw error for negative total distance", async () => {
        // Arrange
        const userId = "user-negative-dist";
        const invalidStats = { ...mockStats, totalDistanceMeters: -1000 };

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, invalidStats)).rejects.toThrow(
          "Total distance cannot be negative"
        );
      });

      it("should throw error for negative days elapsed", async () => {
        // Arrange
        const userId = "user-negative-days";
        const invalidStats = { ...mockStats, daysElapsed: -1 };

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, invalidStats)).rejects.toThrow("Invalid day counts");
      });

      it("should throw error for invalid response structure", async () => {
        // Arrange
        const userId = "user-invalid-response";
        const invalidResponse: OpenRouterResponse = {
          id: "response-invalid",
          model: "test-model",
          choices: [],
        };
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => invalidResponse,
        });

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, mockStats)).rejects.toThrow(
          "Invalid response structure from API"
        );
      });

      it("should throw error when response missing message field", async () => {
        // Arrange
        const userId = "user-no-message";
        const responseWithoutMessage: OpenRouterResponse = {
          id: "response-no-msg",
          model: "test-model",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: JSON.stringify({ tone: "encouraging" }),
              },
              finish_reason: "stop",
            },
          ],
        };
        (global.fetch as MockFetch).mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => responseWithoutMessage,
        });

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, mockStats)).rejects.toThrow(
          "Response missing required field: message"
        );
      });
    });

    describe("API error handling", () => {
      it("should throw OpenRouterAPIError on 400 Bad Request", async () => {
        // Arrange
        const userId = "user-400";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: async () => ({ error: { message: "Invalid request" } }),
        });

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, mockStats)).rejects.toThrow(OpenRouterAPIError);
        await expect(service.generateMotivationalMessage(userId, mockStats)).rejects.toThrow("Invalid request");
      });

      it("should throw OpenRouterAPIError on 401 Unauthorized", async () => {
        // Arrange
        const userId = "user-401";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: async () => ({ error: { message: "Invalid API key" } }),
        });

        // Act & Assert
        await expect(service.generateMotivationalMessage(userId, mockStats)).rejects.toThrow("Invalid API key");
      });

      it("should fail fast on 429 rate limit and try fallback model", async () => {
        // Arrange
        const userId = "user-429";
        (global.fetch as MockFetch)
          .mockResolvedValueOnce({
            ok: false,
            status: 429,
            statusText: "Too Many Requests",
            json: async () => ({ error: { message: "Rate limit exceeded" } }),
          })
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockApiResponse,
          });

        // Act - 429 errors fail fast (no retry) to allow model fallback
        const result = await service.generateMotivationalMessage(userId, mockStats);

        // Assert
        expect(result.message).toBe("Great progress this month! Keep up the excellent work.");
        // Primary model fails with 429 (no retry), fallback model succeeds
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it("should retry on 500 server error and eventually succeed", async () => {
        // Arrange
        const userId = "user-500";
        (global.fetch as MockFetch)
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            json: async () => ({ error: { message: "Server error" } }),
          })
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockApiResponse,
          });

        // Act
        const promise = service.generateMotivationalMessage(userId, mockStats);
        await vi.runAllTimersAsync();
        const result = await promise;

        // Assert
        expect(result.message).toBeDefined();
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it("should throw error after max retries on persistent 500 error", async () => {
        // Arrange
        const userId = "user-max-retries";
        (global.fetch as MockFetch).mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: async () => ({ error: { message: "Persistent server error" } }),
        });

        // Act & Assert - Handle promise and timers together
        let error: Error | null = null;
        const promise = service.generateMotivationalMessage(userId, mockStats).catch((e: Error) => {
          error = e;
        });

        // Advance timers and wait for promise to settle
        await vi.runAllTimersAsync();
        await promise;

        // Assert
        expect(error).toBeDefined();
        expect(error.message).toBe("Persistent server error");
        // With model fallback: primary model tries then fallback model tries
        // Each model: 1 initial + (maxRetries-1) retries = 3 attempts (maxRetries=3 in test setup)
        // Total: 3 attempts × 2 models = 6 calls
        expect(global.fetch).toHaveBeenCalledTimes(6);
      });

      it("should handle timeout and retry", async () => {
        // Arrange
        const userId = "user-timeout";

        // Simulate AbortError (what happens when AbortController.abort() is called)
        const abortError = new DOMException("The operation was aborted", "AbortError");

        (global.fetch as MockFetch)
          .mockRejectedValueOnce(abortError) // First attempt: timeout (AbortError)
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockApiResponse,
          }); // Second attempt: success

        // Act
        const promise = service.generateMotivationalMessage(userId, mockStats);

        // Advance timers for timeout + retry delay
        await vi.advanceTimersByTimeAsync(31000); // Past 30000ms timeout
        await vi.advanceTimersByTimeAsync(2000); // Retry delay (2^1 * 1000 = 2000ms)
        await vi.runAllTimersAsync();

        const result = await promise;

        // Assert
        expect(result.message).toBeDefined();
        expect(typeof result.message).toBe("string");
        expect(result.tone).toBe("encouraging");
        expect(result.cached).toBe(false);
        expect(global.fetch).toHaveBeenCalledTimes(2); // Initial attempt + 1 retry
      });
    });
  });

  describe("testConnection", () => {
    it("should return true when connection successful", async () => {
      // Arrange
      const mockResponse: OpenRouterResponse = {
        id: "test-response",
        model: "test-model",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hi" },
            finish_reason: "stop",
          },
        ],
      };
      (global.fetch as MockFetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      // Act
      const result = await service.testConnection();

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when connection fails", async () => {
      // Arrange
      (global.fetch as MockFetch).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: { message: "Invalid API key" } }),
      });

      // Act
      const result = await service.testConnection();

      // Assert
      expect(result).toBe(false);
    });

    it("should return false on network error", async () => {
      // Arrange
      (global.fetch as MockFetch).mockRejectedValue(new Error("Network error"));

      // Act
      const result = await service.testConnection();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("clearCache", () => {
    it("should clear cache for specific user only", async () => {
      // Arrange
      const user1 = "user-1";
      const user2 = "user-2";
      const mockStats: ActivityStats = {
        totalActivities: 10,
        runCount: 6,
        walkCount: 3,
        mixedCount: 1,
        totalDistanceMeters: 50000,
        totalDuration: "PT5H30M",
        month: 11,
        year: 2025,
        daysElapsed: 15,
        daysRemaining: 15,
        totalDays: 30,
        distanceUnit: "km",
      };
      const mockResponse: OpenRouterResponse = {
        id: "response-123",
        model: "test-model",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({ message: "Great work!", tone: "encouraging" }),
            },
            finish_reason: "stop",
          },
        ],
      };
      (global.fetch as MockFetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      // Act - Generate messages for both users
      await service.generateMotivationalMessage(user1, mockStats);
      await service.generateMotivationalMessage(user2, mockStats);

      // Clear cache for user1 only
      service.clearCache(user1);

      // Generate again for both
      const result1 = await service.generateMotivationalMessage(user1, mockStats);
      const result2 = await service.generateMotivationalMessage(user2, mockStats);

      // Assert
      expect(result1.cached).toBe(false); // Cache was cleared
      expect(result2.cached).toBe(true); // Cache still exists
      expect(global.fetch).toHaveBeenCalledTimes(3); // 2 initial + 1 for user1 after clear
    });
  });
});

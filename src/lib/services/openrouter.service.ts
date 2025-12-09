import type {
  OpenRouterConfig,
  OpenRouterRequest,
  OpenRouterResponse,
  ActivityStats,
  GenerationOptions,
  MotivationalMessage,
  CachedMotivation,
  ResponseFormat,
} from "./openrouter.types";
import { OpenRouterAPIError, OpenRouterValidationError, OpenRouterTimeoutError } from "./openrouter.errors";
import { logger } from "../utils/logger";

// Type guard for AbortError
function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === "AbortError";
}

// Interface for parsed motivational message from API
interface ParsedMotivationalMessage {
  message: string;
  tone?: string;
}

// Model configuration with primary and fallback options
const PRIMARY_MODEL = "tngtech/deepseek-r1t2-chimera:free";
const FALLBACK_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly fallbackModel: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly cacheTTL: number;
  private cache = new Map<string, CachedMotivation>();

  constructor(config: OpenRouterConfig) {
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new Error("OpenRouter API key is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://openrouter.ai/api/v1";
    this.defaultModel = config.model ?? PRIMARY_MODEL;
    this.fallbackModel = FALLBACK_MODEL;
    this.timeout = config.timeout ?? 30000;
    this.maxRetries = config.maxRetries ?? 2; // Reduced from 3 to fail faster
    this.cacheTTL = config.cacheTTL ?? 15 * 60 * 1000; // 15 minutes default
  }

  /**
   * Generate motivational message based on activity stats
   */
  async generateMotivationalMessage(
    userId: string,
    stats: ActivityStats,
    options?: GenerationOptions
  ): Promise<MotivationalMessage> {
    logger.debug("[OpenRouter] Generating motivational message for user:", { userId });
    logger.debug("[OpenRouter] Activity stats:", { stats });
    logger.debug("[OpenRouter] Options:", { options });

    // Validate input
    this.validateStats(stats);

    // Check cache first
    if (!options?.bypassCache) {
      const cached = this.getFromCache(userId, stats);
      if (cached) {
        logger.debug("[OpenRouter] Returning cached motivation");
        return cached;
      }
      logger.debug("[OpenRouter] No cache found, will call API");
    } else {
      logger.debug("[OpenRouter] Bypassing cache");
    }

    // Build request
    const systemMessage = this.buildSystemMessage();
    const userMessage = this.buildUserMessage(stats, options?.bypassCache);
    const responseFormat = this.buildResponseSchema();

    // Use higher temperature when user explicitly wants a new message (bypass cache)
    // This creates more variation in the responses
    const temperature = options?.temperature ?? (options?.bypassCache ? 0.9 : 0.7);

    if (options?.bypassCache) {
      logger.debug("[OpenRouter] Using increased temperature (0.9) and prompt variation for regeneration");
    }

    const primaryModel = options?.model ?? this.defaultModel;
    const modelsToTry = [primaryModel];

    // Add fallback model if not already using it
    if (primaryModel !== this.fallbackModel) {
      modelsToTry.push(this.fallbackModel);
    }

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      const requestBody: OpenRouterRequest = {
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        response_format: responseFormat,
        max_tokens: options?.maxTokens ?? 100,
        temperature,
        top_p: 0.9,
      };

      logger.debug("[OpenRouter] Trying model:", { model });
      logger.debug("[OpenRouter] Request built successfully with temperature:", { temperature });

      try {
        // Make request
        const response = await this.makeRequest("/chat/completions", requestBody);

        // Parse response
        const message = this.parseResponse(response);

        logger.debug("[OpenRouter] Final parsed message:", { message });

        // Cache result
        this.saveToCache(userId, stats, message);

        return message;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn("[OpenRouter] Model failed, trying next:", { model, error: lastError.message });

        // Continue to next model
      }
    }

    // All models failed
    throw lastError ?? new Error("All models failed");
  }

  /**
   * Test OpenRouter API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testRequest: OpenRouterRequest = {
        model: this.defaultModel,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      };

      await this.makeRequest("/chat/completions", testRequest);
      return true;
    } catch (error) {
      logger.error("OpenRouter connection test failed:", { error });
      return false;
    }
  }

  /**
   * Clear cached messages for a user
   */
  clearCache(userId: string): void {
    const keysToDelete: string[] = [];

    for (const [key] of this.cache) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async makeRequest(endpoint: string, body: OpenRouterRequest, attempt = 1): Promise<OpenRouterResponse> {
    logger.debug("[OpenRouter] Making request (attempt:", { attempt });
    logger.debug("[OpenRouter] Endpoint:", { endpoint: `${this.baseUrl}${endpoint}` });
    logger.debug("[OpenRouter] Model:", { model: body.model });
    logger.debug("[OpenRouter] Request body:", { body: JSON.stringify(body, null, 2) });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://astrorunner.app",
          "X-Title": "AstroRunner Activity Logger",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      logger.debug("[OpenRouter] Response status:", { status: response.status, statusText: response.statusText });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { message: response.statusText },
        }));

        logger.debug("[OpenRouter] Error response:", { errorData });

        // Retry on server errors (not rate limits - let model fallback handle those)
        if (response.status >= 500 && attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.debug("[OpenRouter] Retrying after:", { delay: `${delay}ms` });
          await this.delay(delay);
          return this.makeRequest(endpoint, body, attempt + 1);
        }

        // For rate limits (429), fail fast and let model fallback handle it
        if (response.status === 429) {
          logger.warn("[OpenRouter] Rate limited, failing fast to try fallback model");
        }

        throw new OpenRouterAPIError(errorData.error?.message || response.statusText, response.status);
      }

      const responseData = await response.json();
      logger.debug("[OpenRouter] Success response:", { responseData: JSON.stringify(responseData, null, 2) });
      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry on network errors or timeouts
      if ((error instanceof TypeError || isAbortError(error)) && attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await this.delay(delay);
        return this.makeRequest(endpoint, body, attempt + 1);
      }

      if (isAbortError(error)) {
        throw new OpenRouterTimeoutError("Request timeout");
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildSystemMessage(): string {
    return `You are a fitness motivation expert. Generate short, encouraging messages (1-2 sentences) based on user's running and walking activity for the current month.

Focus on:
- Acknowledging their progress and achievements
- Encouraging continued effort
- Using the time remaining in the month as context
- Being positive, specific, and actionable

Tone options:
- "encouraging" - For steady progress, keep it up
- "celebratory" - For impressive achievements, celebrate them
- "challenging" - For minimal activity, gentle push to do more

Keep messages concise, personal, and motivating.`;
  }

  private buildUserMessage(stats: ActivityStats, addVariation = false): string {
    const monthName = new Date(stats.year, stats.month - 1).toLocaleString("en-US", {
      month: "long",
    });
    const distance = this.formatDistance(stats.totalDistanceMeters, stats.distanceUnit);
    const duration = this.formatDuration(stats.totalDuration);

    // Add prompt variations when user explicitly requests new message
    // This encourages the LLM to take different perspectives
    const perspectives = [
      "Focus on the progress made so far.",
      "Focus on the time remaining in the month.",
      "Focus on the consistency of their effort.",
      "Focus on specific achievements (distance or count).",
      "Focus on maintaining momentum.",
    ];

    const perspectiveHint = addVariation ? `\n${perspectives[Math.floor(Math.random() * perspectives.length)]}\n` : "";

    return `Generate a motivational message for ${monthName} ${stats.year}:

Activity Summary:
- Total activities: ${stats.totalActivities} (${stats.runCount} runs, ${stats.walkCount} walks, ${stats.mixedCount} mixed)
- Total distance: ${distance}
- Total time: ${duration}
- Month progress: Day ${stats.daysElapsed} of ${stats.totalDays} (${stats.daysRemaining} days remaining)
${perspectiveHint}
Respond with ONLY a JSON object in this exact format:
{
  "message": "your motivational message here (1-2 sentences)",
  "tone": "encouraging" OR "celebratory" OR "challenging"
}

Choose tone based on activity level:
- "encouraging" if steady progress (5-15 activities)
- "celebratory" if impressive (15+ activities)
- "challenging" if minimal (< 5 activities)`;
  }

  private buildResponseSchema(): ResponseFormat {
    return {
      type: "json_schema",
      json_schema: {
        name: "motivation_message",
        strict: false, // Changed to false for better compatibility with free models
        schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The motivational message (1-2 sentences, max 150 characters)",
            },
            tone: {
              type: "string",
              enum: ["encouraging", "celebratory", "challenging"],
              description: "The tone of the message based on activity level",
            },
          },
          required: ["message", "tone"],
          additionalProperties: false,
        },
      },
    };
  }

  private formatDistance(meters: number, unit: "km" | "mi"): string {
    if (meters === 0) return `0 ${unit}`;

    if (unit === "km") {
      const km = meters / 1000;
      return `${km.toFixed(2)} km`;
    } else {
      const miles = meters / 1609.34;
      return `${miles.toFixed(2)} mi`;
    }
  }

  private formatDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) return "0m";

    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);

    return parts.join(" ") || "0m";
  }

  private getCacheKey(userId: string, month: number, year: number): string {
    return `${userId}:${year}-${month.toString().padStart(2, "0")}`;
  }

  private getFromCache(userId: string, stats: ActivityStats): MotivationalMessage | null {
    const key = this.getCacheKey(userId, stats.month, stats.year);
    const cached = this.cache.get(key);

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    if (!this.statsMatch(cached.stats, stats)) {
      this.cache.delete(key);
      return null;
    }

    return {
      ...cached.message,
      cached: true,
    };
  }

  private saveToCache(userId: string, stats: ActivityStats, message: MotivationalMessage): void {
    const key = this.getCacheKey(userId, stats.month, stats.year);
    this.cache.set(key, {
      message,
      stats: { ...stats },
      timestamp: Date.now(),
    });
  }

  private statsMatch(cached: ActivityStats, current: ActivityStats): boolean {
    return (
      cached.totalActivities === current.totalActivities && cached.totalDistanceMeters === current.totalDistanceMeters
    );
  }

  private validateStats(stats: ActivityStats): void {
    if (stats.month < 1 || stats.month > 12) {
      throw new OpenRouterValidationError("Invalid month: must be 1-12");
    }

    if (stats.year < 2000 || stats.year > 2100) {
      throw new OpenRouterValidationError("Invalid year: must be 2000-2100");
    }

    if (stats.totalActivities < 0) {
      throw new OpenRouterValidationError("Total activities cannot be negative");
    }

    if (stats.totalDistanceMeters < 0) {
      throw new OpenRouterValidationError("Total distance cannot be negative");
    }

    if (stats.daysElapsed < 0 || stats.daysRemaining < 0) {
      throw new OpenRouterValidationError("Invalid day counts");
    }
  }

  private parseResponse(response: OpenRouterResponse): MotivationalMessage {
    logger.debug("[OpenRouter] Parsing response...");
    const choice = response.choices?.[0];

    if (!choice || !choice.message || !choice.message.content) {
      logger.error("[OpenRouter] Invalid response structure:", { response });
      throw new OpenRouterValidationError("Invalid response structure from API");
    }

    logger.debug("[OpenRouter] Raw content from API:", { content: choice.message.content });

    let parsed: ParsedMotivationalMessage;
    const content = choice.message.content;

    try {
      parsed = JSON.parse(content) as ParsedMotivationalMessage;
      logger.debug("[OpenRouter] Parsed JSON:", { parsed });
    } catch (error) {
      logger.error("[OpenRouter] Failed to parse JSON directly:", { error });

      // Try to extract JSON from markdown code blocks or surrounding text
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || content.match(/(\{[\s\S]*?\})/);

      if (jsonMatch && jsonMatch[1]) {
        logger.debug("[OpenRouter] Attempting to extract JSON from text:", { extractedJson: jsonMatch[1] });
        try {
          parsed = JSON.parse(jsonMatch[1]) as ParsedMotivationalMessage;
          logger.debug("[OpenRouter] Successfully extracted JSON:", { parsed });
        } catch (extractError) {
          logger.error("[OpenRouter] Failed to extract JSON:", { extractError });
          logger.error("[OpenRouter] Original content was:", { content });
          throw new OpenRouterValidationError("Failed to parse JSON response from API");
        }
      } else {
        logger.error("[OpenRouter] No JSON found in content:", { content });
        throw new OpenRouterValidationError("Failed to parse JSON response from API");
      }
    }

    if (!parsed.message || typeof parsed.message !== "string") {
      logger.error("[OpenRouter] Missing or invalid message field:", { parsed });
      throw new OpenRouterValidationError("Response missing required field: message");
    }

    // Validate tone, but provide smart fallback if missing
    let tone: "encouraging" | "celebratory" | "challenging" = "encouraging";

    if (parsed.tone && ["encouraging", "celebratory", "challenging"].includes(parsed.tone)) {
      tone = parsed.tone;
    } else {
      logger.warn("[OpenRouter] Missing or invalid tone field, using default:", { tone: parsed.tone });
      // Smart default based on message content
      const msg = parsed.message.toLowerCase();
      if (msg.includes("amazing") || msg.includes("incredible") || msg.includes("crushing")) {
        tone = "celebratory";
      } else if (msg.includes("let's") || msg.includes("aim") || msg.includes("try")) {
        tone = "challenging";
      }
      logger.debug("[OpenRouter] Applied smart default tone:", { tone });
    }

    const result = {
      message: parsed.message,
      tone,
      generatedAt: new Date().toISOString(),
      model: response.model || this.defaultModel,
      cached: false,
    };

    logger.debug("[OpenRouter] Successfully parsed message:", { result });
    return result;
  }
}

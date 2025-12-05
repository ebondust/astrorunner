import { OpenRouterService } from "./openrouter.service";
import { logger } from "../utils/logger";

/**
 * Singleton instance of OpenRouter service
 * Initialized with environment variables
 */
let openRouterServiceInstance: OpenRouterService | null = null;

/**
 * Get or create OpenRouter service instance
 * Returns null if API key is not configured
 */
export function getOpenRouterService(): OpenRouterService | null {
  // Return existing instance if already created
  if (openRouterServiceInstance) {
    logger.debug("[OpenRouter Init] Returning existing service instance");
    return openRouterServiceInstance;
  }

  logger.debug("[OpenRouter Init] Initializing new service instance");

  // Check if API key is configured
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const hasApiKey = apiKey && apiKey.trim().length > 0;
  logger.debug("[OpenRouter Init] API key configured:", { hasApiKey });

  if (!hasApiKey) {
    logger.warn("[OpenRouter Init] OpenRouter API key not configured. AI motivation feature will be disabled.");
    return null;
  }

  logger.debug("[OpenRouter Init] API key prefix:", { prefix: apiKey.substring(0, 10) + "..." });

  // Create new instance
  try {
    const model = import.meta.env.OPENROUTER_MODEL;
    const cacheTTL = import.meta.env.OPENROUTER_CACHE_TTL ? parseInt(import.meta.env.OPENROUTER_CACHE_TTL) : undefined;

    logger.debug("[OpenRouter Init] Model:", { model: model || "default (meta-llama/llama-3.3-70b-instruct:free)" });
    logger.debug("[OpenRouter Init] Cache TTL:", { cacheTTL: cacheTTL || "900000 (15 min)" });

    openRouterServiceInstance = new OpenRouterService({
      apiKey: apiKey,
      model: model,
      cacheTTL: cacheTTL,
    });

    logger.debug("[OpenRouter Init] Service initialized successfully");
    return openRouterServiceInstance;
  } catch (error) {
    logger.error("[OpenRouter Init] Failed to initialize OpenRouter service:", { error });
    return null;
  }
}

/**
 * Check if AI motivation feature is enabled
 */
export function isAIMotivationEnabled(): boolean {
  // Check feature flag (defaults to true if not set)
  if (import.meta.env.ENABLE_AI_MOTIVATION === "false") {
    return false;
  }

  // Check if service can be initialized
  return getOpenRouterService() !== null;
}

// Re-export types and errors for convenience
export type { ActivityStats, GenerationOptions, MotivationalMessage, OpenRouterConfig } from "./openrouter.types";

export {
  OpenRouterError,
  OpenRouterAPIError,
  OpenRouterValidationError,
  OpenRouterTimeoutError,
} from "./openrouter.errors";

export { getFallbackMotivation } from "./openrouter.fallback";

export { aggregateActivityStats } from "../utils/activity-stats";

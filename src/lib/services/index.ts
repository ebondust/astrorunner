import { OpenRouterService } from "./openrouter.service";
import { logger } from "../utils/logger";
import type { RuntimeEnv } from "../../env";
import { getEnv } from "../../db/supabase.client";

/**
 * Singleton instance of OpenRouter service
 * Initialized with environment variables
 */
let openRouterServiceInstance: OpenRouterService | null = null;
let lastEnvKey: string | null = null;

/**
 * Get or create OpenRouter service instance
 * Returns null if API key is not configured
 * @param runtimeEnv - Optional runtime environment (from Cloudflare)
 */
export function getOpenRouterService(runtimeEnv?: RuntimeEnv): OpenRouterService | null {
  const env = getEnv(runtimeEnv);
  const apiKey = env.OPENROUTER_API_KEY;
  const hasApiKey = apiKey && apiKey.trim().length > 0;

  // Create a cache key based on API key to handle env changes
  const envKey = apiKey ? apiKey.substring(0, 10) : "none";

  // Return existing instance if already created with same config
  if (openRouterServiceInstance && lastEnvKey === envKey) {
    logger.debug("[OpenRouter Init] Returning existing service instance");
    return openRouterServiceInstance;
  }

  logger.debug("[OpenRouter Init] Initializing new service instance");
  logger.debug("[OpenRouter Init] API key configured:", { hasApiKey });

  if (!hasApiKey) {
    logger.warn("[OpenRouter Init] OpenRouter API key not configured. AI motivation feature will be disabled.");
    return null;
  }

  logger.debug("[OpenRouter Init] API key prefix:", { prefix: apiKey.substring(0, 10) + "..." });

  // Create new instance
  try {
    const model = env.OPENROUTER_MODEL;
    const cacheTTL = env.OPENROUTER_CACHE_TTL ? parseInt(env.OPENROUTER_CACHE_TTL) : undefined;

    logger.debug("[OpenRouter Init] Model:", { model: model || "default (meta-llama/llama-3.3-70b-instruct:free)" });
    logger.debug("[OpenRouter Init] Cache TTL:", { cacheTTL: cacheTTL || "900000 (15 min)" });

    openRouterServiceInstance = new OpenRouterService({
      apiKey: apiKey,
      model: model,
      cacheTTL: cacheTTL,
    });

    lastEnvKey = envKey;
    logger.debug("[OpenRouter Init] Service initialized successfully");
    return openRouterServiceInstance;
  } catch (error) {
    logger.error("[OpenRouter Init] Failed to initialize OpenRouter service:", { error });
    return null;
  }
}

/**
 * Check if AI motivation feature is enabled
 * @param runtimeEnv - Optional runtime environment (from Cloudflare)
 */
export function isAIMotivationEnabled(runtimeEnv?: RuntimeEnv): boolean {
  const env = getEnv(runtimeEnv);

  // Check feature flag (defaults to true if not set)
  if (env.ENABLE_AI_MOTIVATION === "false") {
    return false;
  }

  // Check if service can be initialized
  return getOpenRouterService(runtimeEnv) !== null;
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

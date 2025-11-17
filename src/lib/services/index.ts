import { OpenRouterService } from './openrouter.service';

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
    return openRouterServiceInstance;
  }

  // Check if API key is configured
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    console.warn('OpenRouter API key not configured. AI motivation feature will be disabled.');
    return null;
  }

  // Create new instance
  try {
    openRouterServiceInstance = new OpenRouterService({
      apiKey: apiKey,
      model: import.meta.env.OPENROUTER_MODEL, // Optional override
      cacheTTL: import.meta.env.OPENROUTER_CACHE_TTL
        ? parseInt(import.meta.env.OPENROUTER_CACHE_TTL)
        : undefined, // Falls back to 15 minutes
    });
    return openRouterServiceInstance;
  } catch (error) {
    console.error('Failed to initialize OpenRouter service:', error);
    return null;
  }
}

/**
 * Check if AI motivation feature is enabled
 */
export function isAIMotivationEnabled(): boolean {
  // Check feature flag (defaults to true if not set)
  if (import.meta.env.ENABLE_AI_MOTIVATION === 'false') {
    return false;
  }

  // Check if service can be initialized
  return getOpenRouterService() !== null;
}

// Re-export types and errors for convenience
export type {
  ActivityStats,
  GenerationOptions,
  MotivationalMessage,
  OpenRouterConfig,
} from './openrouter.types';

export {
  OpenRouterError,
  OpenRouterAPIError,
  OpenRouterValidationError,
  OpenRouterTimeoutError,
} from './openrouter.errors';

export { getFallbackMotivation } from './openrouter.fallback';

export { aggregateActivityStats } from '../utils/activity-stats';

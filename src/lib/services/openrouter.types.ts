// OpenRouter API request/response types
export interface OpenRouterRequest {
  model: string;
  messages: Message[];
  response_format?: ResponseFormat;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JSONSchema;
  };
}

export interface JSONSchema {
  type: "object";
  properties: Record<string, any>;
  required: string[];
  additionalProperties: boolean;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Choice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Choice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

// Service-specific types
export interface OpenRouterConfig {
  /**
   * OpenRouter API key from environment variable
   * @required
   */
  apiKey: string;

  /**
   * Base URL for OpenRouter API
   * @default 'https://openrouter.ai/api/v1'
   */
  baseUrl?: string;

  /**
   * Default model to use for generation
   * @default 'meta-llama/llama-3.1-8b-instruct:free'
   */
  model?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Cache time-to-live in milliseconds
   * @default 900000 (15 minutes)
   */
  cacheTTL?: number;
}

export interface ActivityStats {
  /** Total number of activities this month */
  totalActivities: number;
  /** Number of runs */
  runCount: number;
  /** Number of walks */
  walkCount: number;
  /** Number of mixed activities */
  mixedCount: number;
  /** Total distance in meters */
  totalDistanceMeters: number;
  /** Total duration as ISO-8601 duration string (e.g., "PT5H30M") */
  totalDuration: string;
  /** Current month (1-12) */
  month: number;
  /** Current year */
  year: number;
  /** Days elapsed in month */
  daysElapsed: number;
  /** Days remaining in month */
  daysRemaining: number;
  /** Total days in month */
  totalDays: number;
  /** User's preferred distance unit */
  distanceUnit: "km" | "mi";
}

export interface GenerationOptions {
  /** Override default model */
  model?: string;
  /** Override temperature (0-1) */
  temperature?: number;
  /** Maximum tokens for response */
  maxTokens?: number;
  /** Force regeneration (bypass cache) */
  bypassCache?: boolean;
}

export interface MotivationalMessage {
  /** The generated motivational text (1-2 sentences) */
  message: string;
  /** Tone of the message */
  tone: "encouraging" | "celebratory" | "challenging";
  /** Timestamp when generated */
  generatedAt: string; // ISO-8601
  /** Model used for generation */
  model: string;
  /** Indicates if from cache */
  cached: boolean;
}

// Internal cache type
export interface CachedMotivation {
  message: MotivationalMessage;
  stats: ActivityStats;
  timestamp: number;
}

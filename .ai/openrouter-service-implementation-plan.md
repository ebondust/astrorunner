# OpenRouter Service Implementation Plan

**Date:** 2025-11-17
**Purpose:** AI-powered motivational message generation for activity tracking
**Target Location:** Activities list page, below date pagination component

---

## 1. Service Description

The OpenRouter Service is a server-side service that generates short, contextual motivational messages for users based on their running and walking activities for the current month. The service integrates with the OpenRouter API to leverage various AI models for natural language generation.

**Key Responsibilities:**
- Aggregate user activity data for the current month
- Calculate time context (days remaining, month progress)
- Construct contextual prompts for AI model
- Make authenticated requests to OpenRouter API
- Parse and validate structured JSON responses
- Handle errors gracefully with fallback messages
- Cache responses to minimize API costs

**Integration Points:**
- Called from Activities page server-side rendering (SSR)
- Displays output below MonthNavigation component
- Updates when month changes or on manual refresh
- Only shows for current month view

**Design Principles:**
- Server-side only (never expose API key to client)
- Cost-conscious (caching, token limits, free tier model)
- Fail gracefully (fallback messages on error)
- Type-safe (strict TypeScript)
- Testable (dependency injection)
- Feature-flagged (can be easily disabled)
- User-controlled (click to regenerate)

---

## 2. Constructor Description

The service will be implemented as a **class** following the existing service pattern in the codebase.

### Class: `OpenRouterService`

**Location:** `src/lib/services/openrouter.service.ts`

### Constructor Signature

```typescript
class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly cacheTTL: number;

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://openrouter.ai/api/v1';
    this.defaultModel = config.model ?? 'meta-llama/llama-3.1-8b-instruct:free';
    this.timeout = config.timeout ?? 30000; // 30 seconds
    this.maxRetries = config.maxRetries ?? 3;
    this.cacheTTL = config.cacheTTL ?? 15 * 60 * 1000; // 15 minutes

    // Validation
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new Error('OpenRouter API key is required');
    }
  }
}
```

### Constructor Parameters

```typescript
interface OpenRouterConfig {
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
```

### Instantiation Example

```typescript
// In src/lib/services/index.ts or similar
import { OpenRouterService } from './openrouter.service';

export const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  model: import.meta.env.OPENROUTER_MODEL, // Optional override
  cacheTTL: import.meta.env.OPENROUTER_CACHE_TTL
    ? parseInt(import.meta.env.OPENROUTER_CACHE_TTL)
    : undefined, // Falls back to 15 minutes
});

/**
 * Check if AI motivation feature is enabled
 */
export const isAIMotivationEnabled = (): boolean => {
  return import.meta.env.ENABLE_AI_MOTIVATION !== 'false';
};
```

---

## 3. Public Methods and Fields

### 3.1 Primary Method: `generateMotivationalMessage`

**Purpose:** Generate a motivational message based on user's current month activities.

**Signature:**

```typescript
async generateMotivationalMessage(
  userId: string,
  activityStats: ActivityStats,
  options?: GenerationOptions
): Promise<MotivationalMessage>
```

**Parameters:**

```typescript
interface ActivityStats {
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
  distanceUnit: 'km' | 'mi';
}

interface GenerationOptions {
  /** Override default model */
  model?: string;
  /** Override temperature (0-1) */
  temperature?: number;
  /** Maximum tokens for response */
  maxTokens?: number;
  /** Force regeneration (bypass cache) */
  bypassCache?: boolean;
}
```

**Return Type:**

```typescript
interface MotivationalMessage {
  /** The generated motivational text (1-2 sentences) */
  message: string;
  /** Tone of the message */
  tone: 'encouraging' | 'celebratory' | 'challenging';
  /** Timestamp when generated */
  generatedAt: string; // ISO-8601
  /** Model used for generation */
  model: string;
  /** Indicates if from cache */
  cached: boolean;
}
```

**Usage Example:**

```typescript
import { openRouterService } from '@/lib/services';
import { aggregateActivityStats } from '@/lib/utils/activity-stats';

// In activities.astro or API endpoint
const stats = await aggregateActivityStats(supabase, userId, new Date());
const motivation = await openRouterService.generateMotivationalMessage(userId, stats);

// motivation.message => "Great progress! You've completed 12 activities this month..."
```

**Error Handling:**

```typescript
try {
  const motivation = await openRouterService.generateMotivationalMessage(userId, stats);
  return motivation;
} catch (error) {
  if (error instanceof OpenRouterAPIError) {
    // API-specific error with status code
    console.error('OpenRouter API error:', error.statusCode, error.message);
  } else if (error instanceof OpenRouterValidationError) {
    // Invalid input
    console.error('Validation error:', error.message);
  } else if (error instanceof OpenRouterTimeoutError) {
    // Request timeout
    console.error('Request timeout:', error.message);
  }

  // Return fallback message
  return {
    message: "Keep up the great work with your activities!",
    tone: 'encouraging',
    generatedAt: new Date().toISOString(),
    model: 'fallback',
    cached: false,
  };
}
```

### 3.2 Utility Method: `testConnection`

**Purpose:** Verify OpenRouter API connectivity and authentication.

**Signature:**

```typescript
async testConnection(): Promise<boolean>
```

**Usage Example:**

```typescript
const isConnected = await openRouterService.testConnection();
if (!isConnected) {
  console.error('Failed to connect to OpenRouter API');
}
```

### 3.3 Utility Method: `clearCache`

**Purpose:** Clear cached motivational messages for a user.

**Signature:**

```typescript
clearCache(userId: string): void
```

**Usage Example:**

```typescript
// Clear cache when user explicitly requests refresh
openRouterService.clearCache(userId);
const freshMotivation = await openRouterService.generateMotivationalMessage(userId, stats);
```

---

## 4. Private Methods and Fields

### 4.1 Private Fields

```typescript
private readonly apiKey: string;
private readonly baseUrl: string;
private readonly defaultModel: string;
private readonly timeout: number;
private readonly maxRetries: number;
private readonly cacheTTL: number;

/** In-memory cache for motivation messages */
private cache: Map<string, CachedMotivation> = new Map();
```

### 4.2 Private Method: `makeRequest`

**Purpose:** Core HTTP request handler with retry logic and timeout.

**Signature:**

```typescript
private async makeRequest(
  endpoint: string,
  body: OpenRouterRequest,
  attempt: number = 1
): Promise<OpenRouterResponse>
```

**Implementation Details:**

1. Construct full URL from baseUrl and endpoint
2. Set headers: `Authorization`, `Content-Type`, `HTTP-Referer`, `X-Title`
3. Implement AbortController for timeout
4. Make fetch request
5. Handle response status codes:
   - 200-299: Parse and return JSON
   - 401: Throw authentication error
   - 429: Retry with exponential backoff
   - 500-599: Retry with exponential backoff
   - Other: Throw API error
6. On timeout or network error: Retry with exponential backoff
7. After max retries: Throw timeout/network error

**Retry Logic:**

```typescript
private async makeRequest(
  endpoint: string,
  body: OpenRouterRequest,
  attempt: number = 1
): Promise<OpenRouterResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.timeout);

  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://astrorunner.app', // Optional: Your app URL
        'X-Title': 'AstroRunner Activity Logger', // Optional: Your app name
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));

      // Retry on rate limit or server error
      if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        await this.delay(delay);
        return this.makeRequest(endpoint, body, attempt + 1);
      }

      throw new OpenRouterAPIError(
        errorData.error?.message || response.statusText,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry on network errors or timeouts
    if (
      (error instanceof TypeError || error.name === 'AbortError') &&
      attempt < this.maxRetries
    ) {
      const delay = Math.pow(2, attempt) * 1000;
      await this.delay(delay);
      return this.makeRequest(endpoint, body, attempt + 1);
    }

    if (error.name === 'AbortError') {
      throw new OpenRouterTimeoutError('Request timeout');
    }

    throw error;
  }
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 4.3 Private Method: `buildSystemMessage`

**Purpose:** Construct system message for AI model.

**Signature:**

```typescript
private buildSystemMessage(): string
```

**Implementation:**

```typescript
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
```

### 4.4 Private Method: `buildUserMessage`

**Purpose:** Construct user message with activity statistics.

**Signature:**

```typescript
private buildUserMessage(stats: ActivityStats): string
```

**Implementation:**

```typescript
private buildUserMessage(stats: ActivityStats): string {
  const monthName = new Date(stats.year, stats.month - 1).toLocaleString('en-US', { month: 'long' });
  const distance = this.formatDistance(stats.totalDistanceMeters, stats.distanceUnit);
  const duration = this.formatDuration(stats.totalDuration);

  return `Generate a motivational message for ${monthName} ${stats.year}:

Activity Summary:
- Total activities: ${stats.totalActivities} (${stats.runCount} runs, ${stats.walkCount} walks, ${stats.mixedCount} mixed)
- Total distance: ${distance}
- Total time: ${duration}
- Month progress: Day ${stats.daysElapsed} of ${stats.totalDays} (${stats.daysRemaining} days remaining)

Create an encouraging message that:
1. Acknowledges their current progress
2. Motivates them for the remaining days
3. Is specific to their activity level
4. Is 1-2 sentences maximum`;
}
```

### 4.5 Private Method: `buildResponseSchema`

**Purpose:** Construct JSON schema for structured response.

**Signature:**

```typescript
private buildResponseSchema(): ResponseFormat
```

**Implementation:**

```typescript
private buildResponseSchema(): ResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'motivation_message',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The motivational message (1-2 sentences, max 150 characters)',
          },
          tone: {
            type: 'string',
            enum: ['encouraging', 'celebratory', 'challenging'],
            description: 'The tone of the message based on activity level',
          },
        },
        required: ['message', 'tone'],
        additionalProperties: false,
      },
    },
  };
}
```

### 4.6 Private Method: `formatDistance`

**Purpose:** Convert meters to user's preferred unit with proper formatting.

**Signature:**

```typescript
private formatDistance(meters: number, unit: 'km' | 'mi'): string
```

**Implementation:**

```typescript
private formatDistance(meters: number, unit: 'km' | 'mi'): string {
  if (meters === 0) return `0 ${unit}`;

  if (unit === 'km') {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  } else {
    const miles = meters / 1609.34;
    return `${miles.toFixed(2)} mi`;
  }
}
```

### 4.7 Private Method: `formatDuration`

**Purpose:** Convert ISO-8601 duration to human-readable format.

**Signature:**

```typescript
private formatDuration(isoDuration: string): string
```

**Implementation:**

```typescript
private formatDuration(isoDuration: string): string {
  // Parse ISO-8601 duration (e.g., "PT5H30M15S")
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return '0m';

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0m';
}
```

### 4.8 Private Method: `getCacheKey`

**Purpose:** Generate cache key for user and month.

**Signature:**

```typescript
private getCacheKey(userId: string, month: number, year: number): string
```

**Implementation:**

```typescript
private getCacheKey(userId: string, month: number, year: number): string {
  return `${userId}:${year}-${month.toString().padStart(2, '0')}`;
}
```

### 4.9 Private Method: `getFromCache`

**Purpose:** Retrieve cached motivation if valid.

**Signature:**

```typescript
private getFromCache(userId: string, stats: ActivityStats): MotivationalMessage | null
```

**Implementation:**

```typescript
private getFromCache(userId: string, stats: ActivityStats): MotivationalMessage | null {
  const key = this.getCacheKey(userId, stats.month, stats.year);
  const cached = this.cache.get(key);

  if (!cached) return null;

  // Check if cache is expired
  const now = Date.now();
  if (now - cached.timestamp > this.cacheTTL) {
    this.cache.delete(key);
    return null;
  }

  // Check if stats have changed significantly
  if (!this.statsMatch(cached.stats, stats)) {
    this.cache.delete(key);
    return null;
  }

  return {
    ...cached.message,
    cached: true,
  };
}
```

### 4.10 Private Method: `saveToCache`

**Purpose:** Store motivation in cache.

**Signature:**

```typescript
private saveToCache(
  userId: string,
  stats: ActivityStats,
  message: MotivationalMessage
): void
```

**Implementation:**

```typescript
private saveToCache(
  userId: string,
  stats: ActivityStats,
  message: MotivationalMessage
): void {
  const key = this.getCacheKey(userId, stats.month, stats.year);
  this.cache.set(key, {
    message,
    stats: { ...stats },
    timestamp: Date.now(),
  });
}
```

### 4.11 Private Method: `statsMatch`

**Purpose:** Check if cached stats match current stats.

**Signature:**

```typescript
private statsMatch(cached: ActivityStats, current: ActivityStats): boolean
```

**Implementation:**

```typescript
private statsMatch(cached: ActivityStats, current: ActivityStats): boolean {
  // Consider stats matching if activity count and total distance are same
  return (
    cached.totalActivities === current.totalActivities &&
    cached.totalDistanceMeters === current.totalDistanceMeters
  );
}
```

### 4.12 Private Method: `validateStats`

**Purpose:** Validate activity stats before processing.

**Signature:**

```typescript
private validateStats(stats: ActivityStats): void
```

**Implementation:**

```typescript
private validateStats(stats: ActivityStats): void {
  if (stats.month < 1 || stats.month > 12) {
    throw new OpenRouterValidationError('Invalid month: must be 1-12');
  }

  if (stats.year < 2000 || stats.year > 2100) {
    throw new OpenRouterValidationError('Invalid year: must be 2000-2100');
  }

  if (stats.totalActivities < 0) {
    throw new OpenRouterValidationError('Total activities cannot be negative');
  }

  if (stats.totalDistanceMeters < 0) {
    throw new OpenRouterValidationError('Total distance cannot be negative');
  }

  if (stats.daysElapsed < 0 || stats.daysRemaining < 0) {
    throw new OpenRouterValidationError('Invalid day counts');
  }
}
```

### 4.13 Private Method: `parseResponse`

**Purpose:** Parse and validate OpenRouter API response.

**Signature:**

```typescript
private parseResponse(response: OpenRouterResponse): MotivationalMessage
```

**Implementation:**

```typescript
private parseResponse(response: OpenRouterResponse): MotivationalMessage {
  // Extract content from response
  const choice = response.choices?.[0];

  if (!choice || !choice.message || !choice.message.content) {
    throw new OpenRouterValidationError('Invalid response structure from API');
  }

  // Parse JSON content
  let parsed: any;
  try {
    parsed = JSON.parse(choice.message.content);
  } catch (error) {
    throw new OpenRouterValidationError('Failed to parse JSON response from API');
  }

  // Validate schema
  if (!parsed.message || typeof parsed.message !== 'string') {
    throw new OpenRouterValidationError('Response missing required field: message');
  }

  if (!parsed.tone || !['encouraging', 'celebratory', 'challenging'].includes(parsed.tone)) {
    throw new OpenRouterValidationError('Response missing or invalid field: tone');
  }

  return {
    message: parsed.message,
    tone: parsed.tone,
    generatedAt: new Date().toISOString(),
    model: response.model || this.defaultModel,
    cached: false,
  };
}
```

---

## 5. Error Handling

### 5.1 Custom Error Classes

**Location:** `src/lib/services/openrouter.errors.ts`

```typescript
/**
 * Base error for OpenRouter service
 */
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

/**
 * API-related errors (HTTP errors)
 */
export class OpenRouterAPIError extends OpenRouterError {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'OpenRouterAPIError';
  }
}

/**
 * Validation errors (invalid input or response)
 */
export class OpenRouterValidationError extends OpenRouterError {
  constructor(message: string) {
    super(message);
    this.name = 'OpenRouterValidationError';
  }
}

/**
 * Timeout errors
 */
export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'OpenRouterTimeoutError';
  }
}
```

### 5.2 Error Scenarios and Handling

#### Scenario 1: Missing API Key

**When:** Service instantiation without valid API key
**Error:** Constructor throws Error
**Solution:**

```typescript
// In service initialization
try {
  const service = new OpenRouterService({ apiKey: process.env.OPENROUTER_API_KEY });
} catch (error) {
  console.error('Failed to initialize OpenRouter service:', error.message);
  // Use fallback service or disable feature
}
```

#### Scenario 2: Authentication Failure (401)

**When:** API key is invalid or expired
**Error:** `OpenRouterAPIError` with statusCode 401
**Solution:**

```typescript
try {
  const motivation = await service.generateMotivationalMessage(userId, stats);
} catch (error) {
  if (error instanceof OpenRouterAPIError && error.statusCode === 401) {
    console.error('OpenRouter API authentication failed. Check API key.');
    // Log for admin notification
    // Return fallback message
  }
}
```

#### Scenario 3: Rate Limit Exceeded (429)

**When:** Too many requests to API
**Error:** `OpenRouterAPIError` with statusCode 429
**Solution:** Service automatically retries with exponential backoff (2s, 4s, 8s)

```typescript
// Handled internally by makeRequest method
// After max retries, throws OpenRouterAPIError
// Caller should use cached or fallback message
```

#### Scenario 4: Network Timeout

**When:** API doesn't respond within timeout period
**Error:** `OpenRouterTimeoutError`
**Solution:**

```typescript
try {
  const motivation = await service.generateMotivationalMessage(userId, stats);
} catch (error) {
  if (error instanceof OpenRouterTimeoutError) {
    console.error('OpenRouter API timeout. Using fallback.');
    // Return cached message if available, otherwise fallback
  }
}
```

#### Scenario 5: Invalid Response Format

**When:** API returns malformed JSON or wrong schema
**Error:** `OpenRouterValidationError`
**Solution:**

```typescript
try {
  const motivation = await service.generateMotivationalMessage(userId, stats);
} catch (error) {
  if (error instanceof OpenRouterValidationError) {
    console.error('Invalid response from OpenRouter:', error.message);
    // Return fallback message
  }
}
```

#### Scenario 6: No Activity Data

**When:** User has zero activities for the month
**Error:** None (valid scenario)
**Solution:**

```typescript
// Service handles gracefully by adjusting prompt
if (stats.totalActivities === 0) {
  // Prompt focuses on "getting started" rather than "keep going"
  // Example: "Ready to start tracking? Add your first activity this month!"
}
```

#### Scenario 7: Model Unavailable

**When:** Selected model is down or unavailable
**Error:** `OpenRouterAPIError` with statusCode 503
**Solution:**

```typescript
// Service retries automatically
// After max retries, consider fallback model in future enhancement
```

#### Scenario 8: Server Error (500)

**When:** OpenRouter internal server error
**Error:** `OpenRouterAPIError` with statusCode 500
**Solution:** Service automatically retries with exponential backoff

### 5.3 Fallback Message Strategy

**Location:** `src/lib/services/openrouter.fallback.ts`

```typescript
/**
 * Get fallback motivational message based on activity stats
 */
export function getFallbackMotivation(stats: ActivityStats): MotivationalMessage {
  let message: string;
  let tone: 'encouraging' | 'celebratory' | 'challenging';

  if (stats.totalActivities === 0) {
    message = "Ready to start? Add your first activity and begin your journey!";
    tone = 'encouraging';
  } else if (stats.totalActivities >= 20) {
    message = "Incredible consistency! You're crushing your fitness goals this month.";
    tone = 'celebratory';
  } else if (stats.totalActivities >= 10) {
    message = `Great progress with ${stats.totalActivities} activities! Keep the momentum going.`;
    tone = 'encouraging';
  } else if (stats.daysRemaining > 7) {
    message = `${stats.totalActivities} activities so far. Plenty of time to add more!`;
    tone = 'challenging';
  } else {
    message = "Every step counts! Keep moving and finish the month strong.";
    tone = 'encouraging';
  }

  return {
    message,
    tone,
    generatedAt: new Date().toISOString(),
    model: 'fallback',
    cached: false,
  };
}
```

### 5.4 Usage Example with Full Error Handling

```typescript
import { openRouterService } from '@/lib/services';
import { getFallbackMotivation } from '@/lib/services/openrouter.fallback';
import {
  OpenRouterAPIError,
  OpenRouterTimeoutError,
  OpenRouterValidationError
} from '@/lib/services/openrouter.errors';

async function getMotivation(userId: string, stats: ActivityStats): Promise<MotivationalMessage> {
  try {
    return await openRouterService.generateMotivationalMessage(userId, stats);
  } catch (error) {
    // Log error for monitoring
    console.error('Failed to generate AI motivation:', error);

    // Check if we have cached version
    const cached = openRouterService.getFromCache(userId, stats);
    if (cached) {
      console.log('Using cached motivation due to error');
      return cached;
    }

    // Use fallback message
    console.log('Using fallback motivation');
    return getFallbackMotivation(stats);
  }
}
```

---

## 6. Security Considerations

### 6.1 API Key Protection

**Issue:** API key must never be exposed to client-side code
**Solution:**

1. Store API key in environment variable (`OPENROUTER_API_KEY`)
2. Only import and use in server-side code (`src/lib/services/`, `src/pages/api/`)
3. Never pass API key to client components
4. Use Astro's `import.meta.env` which is server-side only

**Example:**

```typescript
// ✅ CORRECT - Server-side service file
import { OpenRouterService } from './openrouter.service';

export const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});

// ❌ WRONG - Client-side component
// Never import or use service in React components with client: directive
```

### 6.2 Input Validation

**Issue:** Prevent injection attacks through user data
**Solution:**

1. Validate all stats before including in prompts
2. Sanitize user-provided data (userId, activity data)
3. Use TypeScript strict types
4. Validate month/year ranges
5. Escape special characters if needed

**Implementation:**

```typescript
private validateStats(stats: ActivityStats): void {
  // Range validation
  if (stats.month < 1 || stats.month > 12) {
    throw new OpenRouterValidationError('Invalid month');
  }

  // Type validation
  if (typeof stats.totalActivities !== 'number' || stats.totalActivities < 0) {
    throw new OpenRouterValidationError('Invalid activity count');
  }

  // No user-generated text should be included in prompts
  // Only numeric stats from database
}
```

### 6.3 Rate Limiting

**Issue:** Prevent abuse and manage API costs
**Solution:**

1. Implement caching with 1-hour TTL
2. Only generate when month changes or explicit refresh
3. Consider implementing per-user rate limit if needed
4. Monitor API usage via OpenRouter dashboard

**Caching Strategy:**

```typescript
// Cache key: userId:YYYY-MM
// TTL: 1 hour
// Invalidation: When stats change significantly (new activity added)

private readonly cacheTTL = 60 * 60 * 1000; // 1 hour

async generateMotivationalMessage(
  userId: string,
  stats: ActivityStats,
  options?: GenerationOptions
): Promise<MotivationalMessage> {
  // Check cache first
  if (!options?.bypassCache) {
    const cached = this.getFromCache(userId, stats);
    if (cached) return cached;
  }

  // Generate new message
  const message = await this.generate(stats, options);

  // Save to cache
  this.saveToCache(userId, stats, message);

  return message;
}
```

### 6.4 HTTPS Enforcement

**Issue:** API communications must be encrypted
**Solution:**

1. Always use HTTPS for OpenRouter API (`https://openrouter.ai`)
2. Enforce HTTPS in production environment
3. OpenRouter API only accepts HTTPS requests

### 6.5 Error Message Sanitization

**Issue:** Don't leak sensitive information in error messages
**Solution:**

1. Never include API keys in error messages
2. Sanitize error messages before logging
3. Use generic messages for users
4. Log detailed errors server-side only

**Implementation:**

```typescript
catch (error) {
  // Log full error server-side (includes stack trace)
  console.error('OpenRouter error:', error);

  // Return sanitized error to client
  throw new Error('Failed to generate motivation. Please try again.');
}
```

### 6.6 Token Limits

**Issue:** Prevent excessive token usage costs
**Solution:**

1. Set `max_tokens` to reasonable limit (100 tokens for 1-2 sentences)
2. Use `stop` sequences if needed
3. Monitor token usage via API responses
4. Alert if usage exceeds threshold

**Configuration:**

```typescript
const requestBody = {
  model: this.defaultModel,
  messages: [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage },
  ],
  response_format: this.buildResponseSchema(),
  max_tokens: 100,        // Limit response length
  temperature: 0.7,       // Balanced creativity
  top_p: 0.9,            // Slight diversity
};
```

### 6.7 Dependency Security

**Issue:** Ensure no vulnerable dependencies
**Solution:**

1. Service uses only standard `fetch` API (built-in)
2. No external dependencies beyond TypeScript types
3. Regular security audits of npm packages

---

## 7. Step-by-Step Implementation Plan

### Phase 1: Type Definitions and Errors

**Files to Create:**
- `src/lib/services/openrouter.types.ts`
- `src/lib/services/openrouter.errors.ts`

**Steps:**

1.1. Create `openrouter.types.ts`:
```typescript
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
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JSONSchema;
  };
}

export interface JSONSchema {
  type: 'object';
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
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface ActivityStats {
  totalActivities: number;
  runCount: number;
  walkCount: number;
  mixedCount: number;
  totalDistanceMeters: number;
  totalDuration: string;
  month: number;
  year: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  distanceUnit: 'km' | 'mi';
}

export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  bypassCache?: boolean;
}

export interface MotivationalMessage {
  message: string;
  tone: 'encouraging' | 'celebratory' | 'challenging';
  generatedAt: string;
  model: string;
  cached: boolean;
}

// Internal cache type
export interface CachedMotivation {
  message: MotivationalMessage;
  stats: ActivityStats;
  timestamp: number;
}
```

1.2. Create `openrouter.errors.ts` (as shown in section 5.1)

**Testing:**
- Verify TypeScript compilation: `npm run build`
- Ensure no type errors

---

### Phase 2: Utility Functions

**Files to Create:**
- `src/lib/services/openrouter.fallback.ts`
- `src/lib/utils/activity-stats.ts`

**Steps:**

2.1. Create `openrouter.fallback.ts` (as shown in section 5.3)

2.2. Create `activity-stats.ts`:
```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { ActivityStats } from '@/lib/services/openrouter.types';
import type { ActivityEntity } from '@/types';

/**
 * Aggregate activity statistics for a given month
 */
export async function aggregateActivityStats(
  supabase: SupabaseClient,
  userId: string,
  date: Date,
  distanceUnit: 'km' | 'mi' = 'km'
): Promise<ActivityStats> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  // Calculate month boundaries
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  const today = new Date();
  const daysElapsed = today.getMonth() === month - 1 && today.getFullYear() === year
    ? today.getDate()
    : totalDays;
  const daysRemaining = totalDays - daysElapsed;

  // Fetch activities for the month
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('activity_date', firstDay.toISOString())
    .lte('activity_date', lastDay.toISOString());

  if (error) {
    throw new Error(`Failed to fetch activities: ${error.message}`);
  }

  // Aggregate statistics
  let runCount = 0;
  let walkCount = 0;
  let mixedCount = 0;
  let totalDistanceMeters = 0;
  let totalSeconds = 0;

  for (const activity of activities || []) {
    // Count by type
    if (activity.activity_type === 'Run') runCount++;
    else if (activity.activity_type === 'Walk') walkCount++;
    else if (activity.activity_type === 'Mixed') mixedCount++;

    // Sum distance
    if (activity.distance != null) {
      totalDistanceMeters += activity.distance;
    }

    // Sum duration (convert interval to seconds)
    if (activity.duration) {
      const seconds = parseIntervalToSeconds(activity.duration);
      totalSeconds += seconds;
    }
  }

  return {
    totalActivities: activities?.length || 0,
    runCount,
    walkCount,
    mixedCount,
    totalDistanceMeters,
    totalDuration: secondsToISODuration(totalSeconds),
    month,
    year,
    daysElapsed,
    daysRemaining,
    totalDays,
    distanceUnit,
  };
}

/**
 * Parse PostgreSQL interval to total seconds
 */
function parseIntervalToSeconds(interval: unknown): number {
  if (typeof interval !== 'string') return 0;

  // Handle HH:MM:SS format
  const timeMatch = interval.match(/^(\d+):(\d+):(\d+)$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Handle ISO-8601 duration (PT1H30M15S)
  const isoMatch = interval.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || '0', 10);
    const minutes = parseInt(isoMatch[2] || '0', 10);
    const seconds = parseInt(isoMatch[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
}

/**
 * Convert total seconds to ISO-8601 duration
 */
function secondsToISODuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let duration = 'PT';
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;
  if (seconds > 0) duration += `${seconds}S`;

  return duration === 'PT' ? 'PT0S' : duration;
}
```

**Testing:**
- Test aggregateActivityStats with sample data
- Verify duration parsing and formatting

---

### Phase 3: Core Service Implementation

**Files to Create:**
- `src/lib/services/openrouter.service.ts`

**Steps:**

3.1. Create service class with constructor and private fields

3.2. Implement private utility methods:
- `buildSystemMessage()`
- `buildUserMessage()`
- `buildResponseSchema()`
- `formatDistance()`
- `formatDuration()`
- `getCacheKey()`
- `delay()`

3.3. Implement cache methods:
- `getFromCache()`
- `saveToCache()`
- `statsMatch()`
- `clearCache()`

3.4. Implement validation:
- `validateStats()`
- `parseResponse()`

3.5. Implement HTTP request handler:
- `makeRequest()` with retry logic and timeout

3.6. Implement public methods:
- `generateMotivationalMessage()`
- `testConnection()`

**Full Service Code:**

```typescript
import type {
  OpenRouterConfig,
  OpenRouterRequest,
  OpenRouterResponse,
  ActivityStats,
  GenerationOptions,
  MotivationalMessage,
  CachedMotivation,
  ResponseFormat,
} from './openrouter.types';
import {
  OpenRouterError,
  OpenRouterAPIError,
  OpenRouterValidationError,
  OpenRouterTimeoutError,
} from './openrouter.errors';

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private cache: Map<string, CachedMotivation> = new Map();
  private readonly cacheTTL: number = 60 * 60 * 1000; // 1 hour

  constructor(config: OpenRouterConfig) {
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new Error('OpenRouter API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://openrouter.ai/api/v1';
    this.defaultModel = config.model ?? 'openai/gpt-4o-mini';
    this.timeout = config.timeout ?? 30000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  /**
   * Generate motivational message based on activity stats
   */
  async generateMotivationalMessage(
    userId: string,
    stats: ActivityStats,
    options?: GenerationOptions
  ): Promise<MotivationalMessage> {
    // Validate input
    this.validateStats(stats);

    // Check cache first
    if (!options?.bypassCache) {
      const cached = this.getFromCache(userId, stats);
      if (cached) return cached;
    }

    // Build request
    const systemMessage = this.buildSystemMessage();
    const userMessage = this.buildUserMessage(stats);
    const responseFormat = this.buildResponseSchema();

    const requestBody: OpenRouterRequest = {
      model: options?.model ?? this.defaultModel,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      response_format: responseFormat,
      max_tokens: options?.maxTokens ?? 100,
      temperature: options?.temperature ?? 0.7,
      top_p: 0.9,
    };

    // Make request
    const response = await this.makeRequest('/chat/completions', requestBody);

    // Parse response
    const message = this.parseResponse(response);

    // Cache result
    this.saveToCache(userId, stats, message);

    return message;
  }

  /**
   * Test OpenRouter API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testRequest: OpenRouterRequest = {
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      };

      await this.makeRequest('/chat/completions', testRequest);
      return true;
    } catch (error) {
      console.error('OpenRouter connection test failed:', error);
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

  private async makeRequest(
    endpoint: string,
    body: OpenRouterRequest,
    attempt: number = 1
  ): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://astrorunner.app',
          'X-Title': 'AstroRunner Activity Logger',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { message: response.statusText }
        }));

        // Retry on rate limit or server error
        if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.delay(delay);
          return this.makeRequest(endpoint, body, attempt + 1);
        }

        throw new OpenRouterAPIError(
          errorData.error?.message || response.statusText,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry on network errors or timeouts
      if (
        (error instanceof TypeError || (error as any).name === 'AbortError') &&
        attempt < this.maxRetries
      ) {
        const delay = Math.pow(2, attempt) * 1000;
        await this.delay(delay);
        return this.makeRequest(endpoint, body, attempt + 1);
      }

      if ((error as any).name === 'AbortError') {
        throw new OpenRouterTimeoutError('Request timeout');
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  private buildUserMessage(stats: ActivityStats): string {
    const monthName = new Date(stats.year, stats.month - 1).toLocaleString('en-US', {
      month: 'long'
    });
    const distance = this.formatDistance(stats.totalDistanceMeters, stats.distanceUnit);
    const duration = this.formatDuration(stats.totalDuration);

    return `Generate a motivational message for ${monthName} ${stats.year}:

Activity Summary:
- Total activities: ${stats.totalActivities} (${stats.runCount} runs, ${stats.walkCount} walks, ${stats.mixedCount} mixed)
- Total distance: ${distance}
- Total time: ${duration}
- Month progress: Day ${stats.daysElapsed} of ${stats.totalDays} (${stats.daysRemaining} days remaining)

Create an encouraging message that:
1. Acknowledges their current progress
2. Motivates them for the remaining days
3. Is specific to their activity level
4. Is 1-2 sentences maximum`;
  }

  private buildResponseSchema(): ResponseFormat {
    return {
      type: 'json_schema',
      json_schema: {
        name: 'motivation_message',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The motivational message (1-2 sentences, max 150 characters)',
            },
            tone: {
              type: 'string',
              enum: ['encouraging', 'celebratory', 'challenging'],
              description: 'The tone of the message based on activity level',
            },
          },
          required: ['message', 'tone'],
          additionalProperties: false,
        },
      },
    };
  }

  private formatDistance(meters: number, unit: 'km' | 'mi'): string {
    if (meters === 0) return `0 ${unit}`;

    if (unit === 'km') {
      const km = meters / 1000;
      return `${km.toFixed(2)} km`;
    } else {
      const miles = meters / 1609.34;
      return `${miles.toFixed(2)} mi`;
    }
  }

  private formatDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) return '0m';

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0m';
  }

  private getCacheKey(userId: string, month: number, year: number): string {
    return `${userId}:${year}-${month.toString().padStart(2, '0')}`;
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

  private saveToCache(
    userId: string,
    stats: ActivityStats,
    message: MotivationalMessage
  ): void {
    const key = this.getCacheKey(userId, stats.month, stats.year);
    this.cache.set(key, {
      message,
      stats: { ...stats },
      timestamp: Date.now(),
    });
  }

  private statsMatch(cached: ActivityStats, current: ActivityStats): boolean {
    return (
      cached.totalActivities === current.totalActivities &&
      cached.totalDistanceMeters === current.totalDistanceMeters
    );
  }

  private validateStats(stats: ActivityStats): void {
    if (stats.month < 1 || stats.month > 12) {
      throw new OpenRouterValidationError('Invalid month: must be 1-12');
    }

    if (stats.year < 2000 || stats.year > 2100) {
      throw new OpenRouterValidationError('Invalid year: must be 2000-2100');
    }

    if (stats.totalActivities < 0) {
      throw new OpenRouterValidationError('Total activities cannot be negative');
    }

    if (stats.totalDistanceMeters < 0) {
      throw new OpenRouterValidationError('Total distance cannot be negative');
    }

    if (stats.daysElapsed < 0 || stats.daysRemaining < 0) {
      throw new OpenRouterValidationError('Invalid day counts');
    }
  }

  private parseResponse(response: OpenRouterResponse): MotivationalMessage {
    const choice = response.choices?.[0];

    if (!choice || !choice.message || !choice.message.content) {
      throw new OpenRouterValidationError('Invalid response structure from API');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(choice.message.content);
    } catch (error) {
      throw new OpenRouterValidationError('Failed to parse JSON response from API');
    }

    if (!parsed.message || typeof parsed.message !== 'string') {
      throw new OpenRouterValidationError('Response missing required field: message');
    }

    if (!parsed.tone || !['encouraging', 'celebratory', 'challenging'].includes(parsed.tone)) {
      throw new OpenRouterValidationError('Response missing or invalid field: tone');
    }

    return {
      message: parsed.message,
      tone: parsed.tone,
      generatedAt: new Date().toISOString(),
      model: response.model || this.defaultModel,
      cached: false,
    };
  }
}
```

**Testing:**
- Test with mock data
- Test error scenarios
- Test caching behavior
- Verify TypeScript compilation

---

### Phase 4: Service Initialization and Export

**Files to Create:**
- `src/lib/services/index.ts`

**Steps:**

4.1. Create service singleton:

```typescript
import { OpenRouterService } from './openrouter.service';

/**
 * Singleton instance of OpenRouter service
 * Initialized with environment variables
 */
export const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  model: import.meta.env.OPENROUTER_MODEL, // Optional override
});

// Re-export types and errors for convenience
export type {
  ActivityStats,
  GenerationOptions,
  MotivationalMessage,
} from './openrouter.types';

export {
  OpenRouterError,
  OpenRouterAPIError,
  OpenRouterValidationError,
  OpenRouterTimeoutError,
} from './openrouter.errors';

export { getFallbackMotivation } from './openrouter.fallback';
```

4.2. Update environment variables:

Add to `.env.example`:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
```

**Testing:**
- Verify service can be imported
- Test with actual API key (if available)

---

### Phase 5: UI Component Integration

**Files to Create:**
- `src/components/MotivationBanner.tsx`

**Steps:**

5.1. Create React component for displaying motivation:

```typescript
import { Card } from '@/components/ui/card';
import { Sparkles, RefreshCw } from 'lucide-react';
import type { MotivationalMessage } from '@/lib/services';

interface MotivationBannerProps {
  motivation: MotivationalMessage | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function MotivationBanner({
  motivation,
  onRegenerate,
  isRegenerating = false
}: MotivationBannerProps) {
  if (!motivation) return null;

  // Color scheme based on tone
  const toneColors = {
    encouraging: 'bg-blue-50 border-blue-200 text-blue-900',
    celebratory: 'bg-green-50 border-green-200 text-green-900',
    challenging: 'bg-orange-50 border-orange-200 text-orange-900',
  };

  return (
    <Card
      className={`p-4 mb-4 border-2 transition-all ${toneColors[motivation.tone]} ${
        onRegenerate ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
      }`}
      onClick={onRegenerate}
      role={onRegenerate ? 'button' : undefined}
      tabIndex={onRegenerate ? 0 : undefined}
      onKeyDown={(e) => {
        if (onRegenerate && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onRegenerate();
        }
      }}
      aria-label={onRegenerate ? 'Click to generate new motivation' : undefined}
    >
      <div className="flex items-start gap-3">
        {isRegenerating ? (
          <RefreshCw className="w-5 h-5 mt-0.5 flex-shrink-0 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed">
            {motivation.message}
          </p>
          <p className="text-xs opacity-70 mt-1">
            {isRegenerating ? 'Generating...' : 'AI-powered motivation • Click to refresh'}
          </p>
        </div>
      </div>
    </Card>
  );
}
```

**Testing:**
- Test with different tones
- Verify responsive design
- Check accessibility

---

### Phase 6: Page Integration

**Files to Modify:**
- `src/pages/activities.astro`
- `src/components/ActivitiesPageContainer.tsx`

**Steps:**

6.1. Update `activities.astro` to generate motivation:

```astro
---
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.astro';
import { TopBar } from '@/components/TopBar';
import { ActivitiesPageContainer } from '@/components/ActivitiesPageContainer';
import { openRouterService, getFallbackMotivation, isAIMotivationEnabled } from '@/lib/services';
import { aggregateActivityStats } from '@/lib/utils/activity-stats';
import type { MotivationalMessage } from '@/lib/services';

export const prerender = false;

// TODO: Replace with actual authenticated user
const DEFAULT_USER_ID = '8cf52aca-44f8-4c23-9e5f-c3edf6d3aacd';
const DEFAULT_DISTANCE_UNIT = 'km';

const supabase = Astro.locals.supabase;
const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

// Generate motivation only for current month and if feature is enabled
let motivation: MotivationalMessage | null = null;
const aiMotivationEnabled = isAIMotivationEnabled();

if (aiMotivationEnabled) {
  try {
    // Aggregate activity stats
    const stats = await aggregateActivityStats(
      supabase,
      DEFAULT_USER_ID,
      now,
      DEFAULT_DISTANCE_UNIT
    );

    // Generate AI motivation
    try {
      motivation = await openRouterService.generateMotivationalMessage(
        DEFAULT_USER_ID,
        stats
      );
    } catch (error) {
      console.error('Failed to generate AI motivation:', error);
      // Use fallback - generic motivational text in English
      motivation = getFallbackMotivation(stats);
    }
  } catch (error) {
    console.error('Failed to aggregate stats:', error);
    // No motivation if stats unavailable
  }
}
---

<AuthenticatedLayout title="Activities">
  <div id="top-bar-root" slot="top-bar">
    <TopBar client:load />
  </div>

  <ActivitiesPageContainer
    client:load
    userId={DEFAULT_USER_ID}
    distanceUnit={DEFAULT_DISTANCE_UNIT}
    currentMonth={currentMonth}
    currentYear={currentYear}
    initialMotivation={motivation}
    aiMotivationEnabled={aiMotivationEnabled}
  />
</AuthenticatedLayout>
```

6.2. Update `ActivitiesPageContainer.tsx` to display motivation:

```typescript
import { MotivationBanner } from './MotivationBanner';
import type { MotivationalMessage } from '@/lib/services';

interface ActivitiesPageContainerProps {
  userId: string;
  distanceUnit: 'km' | 'mi';
  currentMonth: number;
  currentYear: number;
  initialMotivation: MotivationalMessage | null;
  aiMotivationEnabled: boolean;
}

export function ActivitiesPageContainer({
  userId,
  distanceUnit,
  currentMonth,
  currentYear,
  initialMotivation,
  aiMotivationEnabled,
}: ActivitiesPageContainerProps) {
  const [motivation, setMotivation] = useState<MotivationalMessage | null>(
    initialMotivation
  );
  const [isRegeneratingMotivation, setIsRegeneratingMotivation] = useState(false);

  // ... existing state and hooks

  // Handler to regenerate motivation
  const handleRegenerateMotivation = async () => {
    if (!aiMotivationEnabled || isRegeneratingMotivation) return;

    setIsRegeneratingMotivation(true);

    try {
      // Call API endpoint to regenerate motivation
      const response = await fetch('/api/motivation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          distanceUnit,
          bypassCache: true, // Force regeneration
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate motivation');
      }

      const newMotivation = await response.json();
      setMotivation(newMotivation);
    } catch (error) {
      console.error('Failed to regenerate motivation:', error);
      // Keep existing motivation on error
    } finally {
      setIsRegeneratingMotivation(false);
    }
  };

  // Show motivation only for current month
  const showMotivation =
    aiMotivationEnabled &&
    selectedMonth.getMonth() + 1 === currentMonth &&
    selectedMonth.getFullYear() === currentYear;

  return (
    <div className="container mx-auto px-4 pb-8">
      <MonthNavigation {...monthNavProps} />

      {/* Show motivation banner below month navigation */}
      {showMotivation && motivation && (
        <MotivationBanner
          motivation={motivation}
          onRegenerate={handleRegenerateMotivation}
          isRegenerating={isRegeneratingMotivation}
        />
      )}

      <div className="mb-4">
        <AddActivityButton onClick={handleAddActivity} />
      </div>

      <ActivityList {...activityListProps} />

      {/* ... modals */}
    </div>
  );
}
```

6.3. Create API endpoint for regenerating motivation:

**File to Create:** `src/pages/api/motivation/generate.ts`

```typescript
import type { APIRoute } from 'astro';
import { openRouterService, getFallbackMotivation, isAIMotivationEnabled } from '@/lib/services';
import { aggregateActivityStats } from '@/lib/utils/activity-stats';
import type { MotivationalMessage } from '@/lib/services';

export const POST: APIRoute = async ({ request, locals }) => {
  // Check if feature is enabled
  if (!isAIMotivationEnabled()) {
    return new Response(
      JSON.stringify({ error: 'AI motivation feature is disabled' }),
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, distanceUnit = 'km', bypassCache = false } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400 }
      );
    }

    // Get supabase client
    const supabase = locals.supabase;

    // Aggregate activity stats for current month
    const now = new Date();
    const stats = await aggregateActivityStats(
      supabase,
      userId,
      now,
      distanceUnit
    );

    // Generate motivation
    let motivation: MotivationalMessage;
    try {
      motivation = await openRouterService.generateMotivationalMessage(
        userId,
        stats,
        { bypassCache }
      );
    } catch (error) {
      console.error('Failed to generate AI motivation:', error);
      // Use fallback - generic motivational text in English
      motivation = getFallbackMotivation(stats);
    }

    return new Response(JSON.stringify(motivation), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error generating motivation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate motivation' }),
      { status: 500 }
    );
  }
};
```

**Testing:**
- Test on activities page
- Verify motivation shows only for current month
- Test fallback on error
- Verify caching behavior
- Test click-to-regenerate functionality
- Verify feature flag disables feature when set to 'false'
- Test "AI-powered motivation" text is always visible

---

### Phase 7: Testing and Validation

**Steps:**

7.1. **Unit Tests** (optional but recommended):
- Test `aggregateActivityStats` with various data
- Test `formatDuration` and `formatDistance`
- Test fallback message logic

7.2. **Integration Tests**:
- Test full flow: stats → API → UI
- Test error handling
- Test caching

7.3. **Manual Testing Scenarios**:

| Scenario | Expected Result |
|----------|----------------|
| User with 0 activities | Shows encouraging "get started" message (fallback) |
| User with 5 activities | Shows encouraging message with progress |
| User with 20+ activities | Shows celebratory message |
| Viewing past month | No motivation shown |
| Viewing future month | No motivation shown |
| Viewing current month | AI motivation shown below month navigation |
| API key missing | Falls back to generic English motivational message |
| API timeout | Falls back to cached or generic message |
| Network error | Falls back to cached or generic message |
| Feature flag set to 'false' | No motivation shown at all |
| Feature flag set to 'true' | Motivation works normally |
| Click on motivation banner | Shows loading spinner, regenerates new message |
| Click while regenerating | Prevents duplicate requests |
| Cache within 15 minutes | Returns cached message instantly |
| Cache after 15 minutes | Fetches new message from API |
| "AI-powered motivation" text | Always visible below message |
| "Click to refresh" hint | Visible in subtitle text |

7.4. **Performance Tests**:
- Measure page load time with/without API call
- Verify caching reduces subsequent loads
- Check cache invalidation on new activity

**Testing Checklist:**
- [ ] Service instantiates correctly with all config options
- [ ] Cache TTL is configurable via environment variable
- [ ] Feature flag properly enables/disables feature
- [ ] Free tier model (llama-3.1-8b) works correctly
- [ ] API authentication works
- [ ] Stats aggregation is accurate
- [ ] Prompt construction is correct
- [ ] Response parsing validates schema
- [ ] Caching works with 15-minute TTL
- [ ] Error handling falls back to English generic messages
- [ ] UI displays motivation correctly
- [ ] "AI-powered motivation" text always visible
- [ ] Click-to-regenerate functionality works
- [ ] Loading spinner shows during regeneration
- [ ] Regeneration bypasses cache
- [ ] Prevents duplicate requests while regenerating
- [ ] Motivation only shows for current month
- [ ] Tone colors display correctly (blue/green/orange)
- [ ] Hover effect and cursor pointer work
- [ ] Keyboard accessibility (Enter/Space to regenerate)
- [ ] Mobile responsive design works
- [ ] No console errors
- [ ] TypeScript compiles without errors
- [ ] API endpoint /api/motivation/generate works
- [ ] API costs are $0 with free tier

---

### Phase 8: Deployment and Monitoring

**Steps:**

8.1. **Environment Configuration**:

```bash
# Production .env
OPENROUTER_API_KEY=sk-or-v1-your-production-key
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free  # Free tier
OPENROUTER_CACHE_TTL=900000  # 15 minutes (adjust as needed)
ENABLE_AI_MOTIVATION=true
```

8.2. **Monitoring Setup**:

Create logging wrapper (optional):

```typescript
// src/lib/services/openrouter.monitoring.ts
export function logAPIUsage(
  userId: string,
  model: string,
  tokens: number,
  cached: boolean
) {
  // Log to your monitoring service
  console.log('[OpenRouter]', {
    userId,
    model,
    tokens,
    cached,
    timestamp: new Date().toISOString(),
  });
}
```

8.3. **Cost Monitoring**:

- Set up OpenRouter dashboard alerts
- Monitor token usage weekly
- Set budget limits
- Review API logs for errors

8.4. **Performance Monitoring**:

- Track page load times
- Monitor cache hit rate
- Check error rate
- Review user feedback

---

## 8. Configuration Reference

### Environment Variables

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-...

# Optional (with defaults)
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free  # Default: free tier model
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_TIMEOUT=30000              # 30 seconds
OPENROUTER_MAX_RETRIES=3              # Number of retry attempts
OPENROUTER_CACHE_TTL=900000           # 15 minutes (in milliseconds)

# Feature flag
ENABLE_AI_MOTIVATION=true             # Set to 'false' to disable the feature
```

### Recommended Models

| Model | Cost (per 1M tokens) | Speed | Quality | Use Case |
|-------|---------------------|-------|---------|----------|
| `meta-llama/llama-3.1-8b-instruct:free` | **Free** | Medium | Good | **Default - Free tier** |
| `openai/gpt-4o-mini` | $0.15 / $0.60 | Fast | High | Paid upgrade option |
| `openai/gpt-3.5-turbo` | $0.50 / $1.50 | Very Fast | Good | Budget paid option |
| `anthropic/claude-3-haiku` | $0.25 / $1.25 | Fast | High | Quality alternative |

**Cost Information:**
- **Free tier (default)**: $0 with rate limits (check OpenRouter for current limits)
- Average request: ~200 input tokens + 50 output tokens = 250 tokens
- With caching (15 minute TTL): ~96 requests per day per active user (max)
- Actual requests with cache: ~4-8 requests per day per active user
- 100 active users with paid model (gpt-4o-mini): ~$2-5/month

### Model Parameters

```typescript
{
  temperature: 0.7,    // Balanced creativity (0.0 = deterministic, 1.0 = creative)
  max_tokens: 100,     // Limit response length (cost control)
  top_p: 0.9,         // Nucleus sampling (response diversity)
}
```

---

## 9. Future Enhancements

### Short-term (Next Sprint)

1. **Database Caching**
   - Store motivations in database instead of memory
   - Persist across server restarts
   - Share cache across multiple server instances

2. **Manual Refresh**
   - Add refresh button to regenerate motivation
   - Clear cache on user request

3. **Personalization**
   - Track user preferences (e.g., tone preference)
   - Adjust prompts based on user history
   - A/B test different prompt styles

### Medium-term (Next Month)

1. **Analytics Dashboard**
   - Track API usage and costs
   - Monitor error rates
   - View popular message themes

2. **Fallback Model List**
   - Automatic failover to backup models
   - Cost optimization by model selection

3. **Multilingual Support**
   - Detect user language preference
   - Generate motivations in user's language

### Long-term (Next Quarter)

1. **Advanced Personalization**
   - Learn from user activity patterns
   - Seasonal messaging (holidays, weather)
   - Achievement-based motivations

2. **Community Features**
   - Share motivational messages
   - Community challenges with AI-generated prompts

3. **Voice Integration**
   - Text-to-speech for motivations
   - Audio encouragement

---

## 10. Troubleshooting Guide

### Common Issues

#### Issue: "OpenRouter API key is required"

**Cause:** Missing or empty `OPENROUTER_API_KEY` environment variable
**Solution:**
1. Check `.env` file contains `OPENROUTER_API_KEY=sk-or-v1-...`
2. Restart dev server after adding environment variable
3. Verify environment variable is loaded: `console.log(import.meta.env.OPENROUTER_API_KEY)`

#### Issue: "Request timeout"

**Cause:** Slow API response or network issues
**Solution:**
1. Check OpenRouter status page
2. Increase timeout in service config
3. Verify network connectivity
4. Fallback message will be shown automatically

#### Issue: "Invalid response structure from API"

**Cause:** Model doesn't support structured outputs or returned unexpected format
**Solution:**
1. Verify model supports `json_schema` (check OpenRouter docs)
2. Switch to a supported model (e.g., `openai/gpt-4o-mini`)
3. Check OpenRouter API changelog for breaking changes

#### Issue: "Motivation not showing on page"

**Cause:** Various possible issues
**Solution:**
1. Check if viewing current month (motivation only shows for current month)
2. Check browser console for errors
3. Verify `initialMotivation` prop is passed to component
4. Check if stats aggregation succeeded

#### Issue: "High API costs"

**Cause:** Too many requests or inefficient caching
**Solution:**
1. Increase cache TTL (currently 1 hour)
2. Reduce max_tokens limit
3. Switch to cheaper model
4. Implement database caching

---

## 11. Summary

This implementation plan provides a comprehensive guide for building the OpenRouter service integration. The service is designed to be:

- **Secure**: API key protected, server-side only
- **Reliable**: Comprehensive error handling and generic English fallbacks
- **Cost-effective**: Free tier model with 15-minute caching
- **User-friendly**: Contextual messages with click-to-regenerate
- **Configurable**: Easy cache TTL adjustment and feature flag
- **Maintainable**: Clear structure, type-safe, well-documented

The implementation follows all project conventions and integrates seamlessly with the existing Activities page architecture.

**Key Features:**
- ✅ Free tier model (meta-llama/llama-3.1-8b-instruct:free)
- ✅ 15-minute cache TTL (configurable via env variable)
- ✅ Feature flag to enable/disable (ENABLE_AI_MOTIVATION)
- ✅ Generic English fallback messages on API failure
- ✅ "AI-powered motivation" text always visible
- ✅ Click-to-regenerate with loading spinner
- ✅ Keyboard accessible (Enter/Space to regenerate)
- ✅ Only shows for current month view

**Key Files:**
- `src/lib/services/openrouter.service.ts` - Core service
- `src/lib/services/openrouter.types.ts` - Type definitions
- `src/lib/services/openrouter.errors.ts` - Custom errors
- `src/lib/services/openrouter.fallback.ts` - Fallback messages (English)
- `src/lib/services/index.ts` - Service exports and feature flag
- `src/lib/utils/activity-stats.ts` - Stats aggregation
- `src/components/MotivationBanner.tsx` - UI component with click handler
- `src/pages/activities.astro` - Page integration with feature flag
- `src/pages/api/motivation/generate.ts` - Regeneration API endpoint

**Configuration:**
```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_CACHE_TTL=900000  # 15 minutes (easily adjustable)
ENABLE_AI_MOTIVATION=true    # Set to 'false' to disable
```

**Next Steps:**
1. Obtain free OpenRouter API key from https://openrouter.ai
2. Set environment variables in .env file
3. Follow Phase 1-8 implementation steps
4. Test all scenarios (especially click-to-regenerate and fallbacks)
5. Deploy to production
6. Monitor free tier rate limits

---

**Document Version:** 2.0
**Last Updated:** 2025-11-17
**Author:** AI Implementation Planner
**Status:** Ready for Implementation

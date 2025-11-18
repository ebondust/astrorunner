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
  private readonly cacheTTL: number;
  private cache: Map<string, CachedMotivation> = new Map();

  constructor(config: OpenRouterConfig) {
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new Error('OpenRouter API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://openrouter.ai/api/v1';
    this.defaultModel = config.model ?? 'meta-llama/llama-3.3-70b-instruct:free';
    this.timeout = config.timeout ?? 30000;
    this.maxRetries = config.maxRetries ?? 3;
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
    console.log('[OpenRouter] Generating motivational message for user:', userId);
    console.log('[OpenRouter] Activity stats:', stats);
    console.log('[OpenRouter] Options:', options);

    // Validate input
    this.validateStats(stats);

    // Check cache first
    if (!options?.bypassCache) {
      const cached = this.getFromCache(userId, stats);
      if (cached) {
        console.log('[OpenRouter] Returning cached motivation');
        return cached;
      }
      console.log('[OpenRouter] No cache found, will call API');
    } else {
      console.log('[OpenRouter] Bypassing cache');
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

    console.log('[OpenRouter] Request built successfully');

    // Make request
    const response = await this.makeRequest('/chat/completions', requestBody);

    // Parse response
    const message = this.parseResponse(response);

    console.log('[OpenRouter] Final parsed message:', message);

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
    console.log('[OpenRouter] Making request (attempt', attempt, ')');
    console.log('[OpenRouter] Endpoint:', `${this.baseUrl}${endpoint}`);
    console.log('[OpenRouter] Model:', body.model);
    console.log('[OpenRouter] Request body:', JSON.stringify(body, null, 2));

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

      console.log('[OpenRouter] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { message: response.statusText }
        }));

        console.log('[OpenRouter] Error response:', errorData);

        // Retry on rate limit or server error
        if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log('[OpenRouter] Retrying after', delay, 'ms');
          await this.delay(delay);
          return this.makeRequest(endpoint, body, attempt + 1);
        }

        throw new OpenRouterAPIError(
          errorData.error?.message || response.statusText,
          response.status
        );
      }

      const responseData = await response.json();
      console.log('[OpenRouter] Success response:', JSON.stringify(responseData, null, 2));
      return responseData;
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
      type: 'json_schema',
      json_schema: {
        name: 'motivation_message',
        strict: false, // Changed to false for better compatibility with free models
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
    console.log('[OpenRouter] Parsing response...');
    const choice = response.choices?.[0];

    if (!choice || !choice.message || !choice.message.content) {
      console.error('[OpenRouter] Invalid response structure:', response);
      throw new OpenRouterValidationError('Invalid response structure from API');
    }

    console.log('[OpenRouter] Raw content from API:', choice.message.content);

    let parsed: any;
    let content = choice.message.content;

    try {
      parsed = JSON.parse(content);
      console.log('[OpenRouter] Parsed JSON:', parsed);
    } catch (error) {
      console.error('[OpenRouter] Failed to parse JSON directly:', error);

      // Try to extract JSON from markdown code blocks or surrounding text
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                       content.match(/(\{[\s\S]*?\})/);

      if (jsonMatch && jsonMatch[1]) {
        console.log('[OpenRouter] Attempting to extract JSON from text:', jsonMatch[1]);
        try {
          parsed = JSON.parse(jsonMatch[1]);
          console.log('[OpenRouter] Successfully extracted JSON:', parsed);
        } catch (extractError) {
          console.error('[OpenRouter] Failed to extract JSON:', extractError);
          console.error('[OpenRouter] Original content was:', content);
          throw new OpenRouterValidationError('Failed to parse JSON response from API');
        }
      } else {
        console.error('[OpenRouter] No JSON found in content:', content);
        throw new OpenRouterValidationError('Failed to parse JSON response from API');
      }
    }

    if (!parsed.message || typeof parsed.message !== 'string') {
      console.error('[OpenRouter] Missing or invalid message field:', parsed);
      throw new OpenRouterValidationError('Response missing required field: message');
    }

    // Validate tone, but provide smart fallback if missing
    let tone: 'encouraging' | 'celebratory' | 'challenging' = 'encouraging';

    if (parsed.tone && ['encouraging', 'celebratory', 'challenging'].includes(parsed.tone)) {
      tone = parsed.tone;
    } else {
      console.warn('[OpenRouter] Missing or invalid tone field, using default:', parsed.tone);
      // Smart default based on message content
      const msg = parsed.message.toLowerCase();
      if (msg.includes('amazing') || msg.includes('incredible') || msg.includes('crushing')) {
        tone = 'celebratory';
      } else if (msg.includes('let\'s') || msg.includes('aim') || msg.includes('try')) {
        tone = 'challenging';
      }
      console.log('[OpenRouter] Applied smart default tone:', tone);
    }

    const result = {
      message: parsed.message,
      tone,
      generatedAt: new Date().toISOString(),
      model: response.model || this.defaultModel,
      cached: false,
    };

    console.log('[OpenRouter] Successfully parsed message:', result);
    return result;
  }
}

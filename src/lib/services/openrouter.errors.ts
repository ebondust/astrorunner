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

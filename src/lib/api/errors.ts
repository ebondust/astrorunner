/**
 * Standardized error response utilities for API endpoints
 * Ensures consistent error format across all endpoints
 */

interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  correlationId?: string;
}

/**
 * Creates a 400 Bad Request response
 * @param message - Human-readable error message
 * @param details - Optional validation error details
 * @returns Response with 400 status code
 */
export function badRequest(message: string, details?: Record<string, unknown>): Response {
  const body: ErrorResponse = {
    error: "ValidationError",
    message,
    ...(details && { details }),
  };

  return new Response(JSON.stringify(body), {
    status: 400,
    statusText: "Bad Request",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Creates a 401 Unauthorized response
 * @param message - Optional error message (defaults to "Authentication required")
 * @returns Response with 401 status code
 */
export function unauthorized(message = "Authentication required"): Response {
  const body: ErrorResponse = {
    error: "Unauthorized",
    message,
  };

  return new Response(JSON.stringify(body), {
    status: 401,
    statusText: "Unauthorized",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Creates a 422 Unprocessable Entity response
 * @param message - Human-readable error message
 * @param details - Optional semantic validation error details
 * @returns Response with 422 status code
 */
export function unprocessableEntity(message: string, details?: Record<string, unknown>): Response {
  const body: ErrorResponse = {
    error: "UnprocessableEntity",
    message,
    ...(details && { details }),
  };

  return new Response(JSON.stringify(body), {
    status: 422,
    statusText: "Unprocessable Entity",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Creates a 500 Internal Server Error response
 * @param correlationId - Correlation ID for server-side logging
 * @returns Response with 500 status code
 */
export function internalServerError(correlationId: string): Response {
  const body: ErrorResponse = {
    error: "InternalServerError",
    message: "An unexpected error occurred",
    correlationId,
  };

  return new Response(JSON.stringify(body), {
    status: 500,
    statusText: "Internal Server Error",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

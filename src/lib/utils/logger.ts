/**
 * Centralized logging utility for the application.
 *
 * - debug: Only logs in development mode
 * - info: Logs informational messages
 * - warn: Logs warnings
 * - error: Logs errors
 *
 * This utility provides structured logging with optional metadata
 * and respects the environment (dev vs production).
 */

type LogMetadata = Record<string, unknown>;

/**
 * Format log message with metadata if provided
 */
function formatMessage(message: string, metadata?: LogMetadata): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return message;
  }
  return `${message} ${JSON.stringify(metadata)}`;
}

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/* eslint-disable no-console -- Logger utility is allowed to use console */
export const logger = {
  /**
   * Log debug messages - only visible in development
   */
  debug: (message: string, metadata?: LogMetadata): void => {
    if (isDevelopment()) {
      console.log(`[DEBUG] ${formatMessage(message, metadata)}`);
    }
  },

  /**
   * Log informational messages
   */
  info: (message: string, metadata?: LogMetadata): void => {
    console.info(`[INFO] ${formatMessage(message, metadata)}`);
  },

  /**
   * Log warning messages
   */
  warn: (message: string, metadata?: LogMetadata): void => {
    console.warn(`[WARN] ${formatMessage(message, metadata)}`);
  },

  /**
   * Log error messages
   */
  error: (message: string, metadata?: LogMetadata): void => {
    console.error(`[ERROR] ${formatMessage(message, metadata)}`);
  },
};
/* eslint-enable no-console */

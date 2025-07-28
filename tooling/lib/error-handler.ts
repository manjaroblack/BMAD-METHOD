/**
 * Standardized error handling for BMad tooling
 * Provides consistent error patterns, logging, and exit codes
 */

import { colors } from "@std/fmt/colors";
import { ensureDir, exists } from "@std/fs";
import { dirname } from "@std/path";

// Standard exit codes
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_USAGE: 2,
  FILE_NOT_FOUND: 3,
  PERMISSION_DENIED: 4,
  NETWORK_ERROR: 5,
  VALIDATION_ERROR: 6,
  DEPENDENCY_ERROR: 7,
  BUILD_ERROR: 8,
  CONFIG_ERROR: 9,
} as const;

type ExitCode = typeof EXIT_CODES[keyof typeof EXIT_CODES];

// Error types with consistent formatting
export class BMadError extends Error {
  public readonly code: ExitCode;
  public readonly details: unknown;
  public readonly timestamp: string;

  constructor(message: string, code: ExitCode = EXIT_CODES.GENERAL_ERROR, details: unknown = null) {
    super(message);
    this.name = "BMadError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends BMadError {
  constructor(message: string, details: unknown = null) {
    super(message, EXIT_CODES.VALIDATION_ERROR, details);
    this.name = "ValidationError";
  }
}

export class ConfigError extends BMadError {
  constructor(message: string, details: unknown = null) {
    super(message, EXIT_CODES.CONFIG_ERROR, details);
    this.name = "ConfigError";
  }
}

export class BuildError extends BMadError {
  constructor(message: string, details: unknown = null) {
    super(message, EXIT_CODES.BUILD_ERROR, details);
    this.name = "BuildError";
  }
}

// Logging levels
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

export class Logger {
  private level: LogLevel;
  private logFile: string | null = null;

  constructor(level: LogLevel = LOG_LEVELS.INFO) {
    this.level = level;
  }

  async setLogFile(filePath: string): Promise<void> {
    this.logFile = filePath;
    // Ensure log directory exists
    await ensureDir(dirname(filePath));
  }

  private async _log(level: LogLevel, message: string, data: unknown = null): Promise<void> {
    if (level > this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS)[level];

    let formattedMessage: string;
    switch (level) {
      case LOG_LEVELS.ERROR:
        formattedMessage = colors.red(`[${levelName}] ${message}`);
        break;
      case LOG_LEVELS.WARN:
        formattedMessage = colors.yellow(`[${levelName}] ${message}`);
        break;
      case LOG_LEVELS.INFO:
        formattedMessage = colors.blue(`[${levelName}] ${message}`);
        break;
      case LOG_LEVELS.DEBUG:
        formattedMessage = colors.gray(`[${levelName}] ${message}`);
        break;
      default:
        formattedMessage = `[${levelName}] ${message}`;
    }

    console.log(formattedMessage);
    if (data) {
      console.log(colors.gray(JSON.stringify(data, null, 2)));
    }

    // Write to log file if configured
    if (this.logFile) {
      const logEntry = `${timestamp} [${levelName}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
      try {
        await Deno.writeTextFile(this.logFile, logEntry, { append: true });
      } catch (error) {
        console.error(colors.red(`Failed to write to log file: ${error.message}`));
      }
    }
  }

  async error(message: string, data: unknown = null): Promise<void> {
    await this._log(LOG_LEVELS.ERROR, message, data);
  }

  async warn(message: string, data: unknown = null): Promise<void> {
    await this._log(LOG_LEVELS.WARN, message, data);
  }

  async info(message: string, data: unknown = null): Promise<void> {
    await this._log(LOG_LEVELS.INFO, message, data);
  }

  async debug(message: string, data: unknown = null): Promise<void> {
    await this._log(LOG_LEVELS.DEBUG, message, data);
  }
}

// Global error handler
export async function handleError(error: Error | BMadError, logger: Logger | null = null): Promise<void> {
  const message = error instanceof BMadError 
    ? `${error.message} (Code: ${error.code})`
    : error.message;
  
  if (logger) {
    await logger.error(message, error instanceof BMadError ? error.details : null);
  } else {
    console.error(colors.red(`Error: ${message}`));
  }

  const exitCode = error instanceof BMadError ? error.code : EXIT_CODES.GENERAL_ERROR;
  Deno.exit(exitCode);
}

// Async wrapper for error handling
export function asyncHandler<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error as Error);
      throw error; // This won't be reached due to Deno.exit, but satisfies TypeScript
    }
  };
}

// Validation helpers
export function validateRequired(
  obj: Record<string, unknown>,
  fields: string[],
  errorMessage = "Missing required fields",
): void {
  const missing = fields.filter(field => !(field in obj) || obj[field] == null);
  if (missing.length > 0) {
    throw new ValidationError(`${errorMessage}: ${missing.join(", ")}`);
  }
}

export async function validateFileExists(filePath: string, errorMessage?: string): Promise<void> {
  const fileExists = await exists(filePath, { isFile: true });
  if (!fileExists) {
    throw new ValidationError(
      errorMessage || `File not found: ${filePath}`
    );
  }
}

export async function validateDirectory(dirPath: string, errorMessage?: string): Promise<void> {
  const dirExists = await exists(dirPath, { isDirectory: true });
  if (!dirExists) {
    throw new ValidationError(
      errorMessage || `Directory not found: ${dirPath}`
    );
  }
}

// Graceful shutdown handler
export function setupGracefulShutdown(cleanup?: () => Promise<void> | void): void {
  const handleShutdown = async (signal: string) => {
    console.log(colors.yellow(`\nReceived ${signal}, shutting down gracefully...`));
    
    if (cleanup) {
      try {
        await cleanup();
      } catch (error) {
        console.error(colors.red(`Cleanup failed: ${error.message}`));
      }
    }
    
    Deno.exit(EXIT_CODES.SUCCESS);
  };

  // Handle various shutdown signals
  Deno.addSignalListener("SIGINT", () => handleShutdown("SIGINT"));
  Deno.addSignalListener("SIGTERM", () => handleShutdown("SIGTERM"));
  
  // Handle unhandled promise rejections
  globalThis.addEventListener("unhandledrejection", (event) => {
    console.error(colors.red("Unhandled promise rejection:"), event.reason);
    Deno.exit(EXIT_CODES.GENERAL_ERROR);
  });
}
/**
 * Standardized error handling for BMad tooling
 * Provides consistent error patterns, logging, and exit codes
 */

import process from "node:process";
import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";

// Standard exit codes
const EXIT_CODES = {
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
};

// Error types with consistent formatting
class BMadError extends Error {
  constructor(message, code = EXIT_CODES.GENERAL_ERROR, details = null) {
    super(message);
    this.name = "BMadError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends BMadError {
  constructor(message, details = null) {
    super(message, EXIT_CODES.VALIDATION_ERROR, details);
    this.name = "ValidationError";
  }
}

class ConfigError extends BMadError {
  constructor(message, details = null) {
    super(message, EXIT_CODES.CONFIG_ERROR, details);
    this.name = "ConfigError";
  }
}

class BuildError extends BMadError {
  constructor(message, details = null) {
    super(message, EXIT_CODES.BUILD_ERROR, details);
    this.name = "BuildError";
  }
}

// Logging levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  constructor(level = LOG_LEVELS.INFO) {
    this.level = level;
    this.logFile = null;
  }

  setLogFile(filePath) {
    this.logFile = filePath;
    // Ensure log directory exists
    fs.ensureDirSync(path.dirname(filePath));
  }

  _log(level, message, data = null) {
    if (level > this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS)[level];

    let formattedMessage;
    switch (level) {
      case LOG_LEVELS.ERROR:
        formattedMessage = chalk.red(`[${levelName}] ${message}`);
        break;
      case LOG_LEVELS.WARN:
        formattedMessage = chalk.yellow(`[${levelName}] ${message}`);
        break;
      case LOG_LEVELS.INFO:
        formattedMessage = chalk.blue(`[${levelName}] ${message}`);
        break;
      case LOG_LEVELS.DEBUG:
        formattedMessage = chalk.gray(`[${levelName}] ${message}`);
        break;
      default:
        formattedMessage = `[${levelName}] ${message}`;
    }

    console.log(formattedMessage);

    if (data && this.level >= LOG_LEVELS.DEBUG) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }

    // Write to log file if configured
    if (this.logFile) {
      const logEntry = {
        timestamp,
        level: levelName,
        message,
        data,
      };
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + "\n");
    }
  }

  error(message, data = null) {
    this._log(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data = null) {
    this._log(LOG_LEVELS.WARN, message, data);
  }

  info(message, data = null) {
    this._log(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data = null) {
    this._log(LOG_LEVELS.DEBUG, message, data);
  }
}

// Global error handler
function handleError(error, logger = null) {
  const log = logger || new Logger();

  if (error instanceof BMadError) {
    log.error(`${error.name}: ${error.message}`);
    if (error.details) {
      log.debug("Error details:", error.details);
    }
    process.exit(error.code);
  } else {
    log.error(`Unexpected error: ${error.message}`);
    log.debug("Stack trace:", error.stack);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation helpers
function validateRequired(
  obj,
  fields,
  errorMessage = "Missing required fields",
) {
  const missing = fields.filter((field) => !obj[field]);
  if (missing.length > 0) {
    throw new ValidationError(`${errorMessage}: ${missing.join(", ")}`);
  }
}

function validateFileExists(filePath, errorMessage = null) {
  if (!fs.existsSync(filePath)) {
    throw new BMadError(
      errorMessage || `File not found: ${filePath}`,
      EXIT_CODES.FILE_NOT_FOUND,
    );
  }
}

function validateDirectory(dirPath, errorMessage = null) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new BMadError(
      errorMessage || `Directory not found: ${dirPath}`,
      EXIT_CODES.FILE_NOT_FOUND,
    );
  }
}

// Process exit handler
function setupGracefulShutdown(cleanup = null) {
  const signals = ["SIGINT", "SIGTERM", "SIGQUIT"];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(
        chalk.yellow(`\nReceived ${signal}, shutting down gracefully...`),
      );

      if (cleanup && typeof cleanup === "function") {
        try {
          await cleanup();
        } catch (error) {
          console.error(chalk.red("Error during cleanup:"), error.message);
        }
      }

      process.exit(EXIT_CODES.SUCCESS);
    });
  });
}

export {
  EXIT_CODES,
  LOG_LEVELS,
  BMadError,
  ValidationError,
  ConfigError,
  BuildError,
  Logger,
  handleError,
  asyncHandler,
  validateRequired,
  validateFileExists,
  validateDirectory,
  setupGracefulShutdown,
};

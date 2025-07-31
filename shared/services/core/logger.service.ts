/**
 * Logger service implementation for BMAD-METHOD
 * Provides structured logging with configurable levels and outputs
 */

import type { LoggerConfig } from "deps";

export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  setLevel(level: LogLevel): void;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export class Logger implements ILogger {
  private config: LoggerConfig;
  private static instance: Logger;

  constructor(config: LoggerConfig = { level: "info" }) {
    this.config = {
      enableConsole: true,
      enableFile: false,
      ...config,
    };
  }

  static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log("error", message, context, error);
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
    };

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    if (this.config.enableFile && this.config.filePath) {
      this.logToFile(entry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.config.level];
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    const message = `${prefix} ${entry.message}${contextStr}`;

    switch (entry.level) {
      case "debug":
        console.debug(message);
        break;
      case "info":
        console.info(message);
        break;
      case "warn":
        console.warn(message);
        break;
      case "error":
        console.error(message);
        if (entry.error) {
          console.error(entry.error);
        }
        break;
    }
  }

  private async logToFile(entry: LogEntry): Promise<void> {
    // File logging implementation would go here
    // For now, this is a placeholder that would use Deno.writeTextFile
    // in the actual implementation
    await Promise.resolve(); // Ensure method is properly async
    try {
      const _logLine = JSON.stringify(entry) + "\n";
      // await Deno.writeTextFile(this.config.filePath!, logLine, { append: true });
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

/**
 * Performance optimization utilities for BMad tooling
 * Provides caching, parallel processing, and performance monitoring
 */

import { ensureDir, join, Logger, resolve } from "deps";

interface CacheData {
  timestamp: number;
  maxAge: number;
  data: unknown;
}

interface ProcessOptions {
  timeout?: number;
  chunkSize?: number;
}

interface BatchOperation {
  type: "read" | "write" | "copy" | "delete";
  source: string;
  target?: string;
  content?: string;
}

interface TimerMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  count: number;
}

// Cache management
export class CacheManager {
  private cacheDir: string;
  private logger: Logger;

  constructor(cacheDir = ".bmad-cache") {
    this.cacheDir = resolve(cacheDir);
    this.logger = new Logger();
    this.ensureCacheDir();
  }

  private async ensureCacheDir(): Promise<void> {
    await ensureDir(this.cacheDir);
  }

  // Generate cache key from content or file path
  generateKey(input: string | unknown, prefix = ""): string {
    const _encoder = new TextEncoder();
    let hashInput: string;

    if (typeof input === "string") {
      try {
        // Try to get file stats if it's a file path
        const stat = Deno.statSync(input);
        hashInput = `${input}:${stat.mtime?.getTime()}:${stat.size}`;
      } catch {
        // If not a file, treat as content
        hashInput = input;
      }
    } else {
      hashInput = JSON.stringify(input);
    }

    // Use a simple hash function for Deno compatibility
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `${prefix}${Math.abs(hash).toString(16)}`;
  }

  // Get cached result
  get(key: string): unknown {
    try {
      const cachePath = join(this.cacheDir, `${key}.json`);
      if (Deno.statSync(cachePath)) {
        const cachedText = Deno.readTextFileSync(cachePath);
        const cached: CacheData = JSON.parse(cachedText);

        // Check if cache is still valid (24 hours by default)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - cached.timestamp < maxAge) {
          this.logger.debug(`Cache hit: ${key}`);
          return cached.data;
        } else {
          this.logger.debug(`Cache expired: ${key}`);
          Deno.removeSync(cachePath);
        }
      }
    } catch (error) {
      this.logger.warn(`Cache read error for ${key}:`, (error as Error).message);
    }

    return null;
  }

  // Set cached result
  set(key: string, data: unknown, maxAge = 24 * 60 * 60 * 1000): void {
    try {
      const cachePath = join(this.cacheDir, `${key}.json`);
      const cacheData: CacheData = {
        timestamp: Date.now(),
        maxAge,
        data,
      };

      Deno.writeTextFileSync(cachePath, JSON.stringify(cacheData, null, 2));
      this.logger.debug(`Cache set: ${key}`);
    } catch (error) {
      this.logger.warn(`Cache write error for ${key}:`, (error as Error).message);
    }
  }

  // Clear cache
  async clear(pattern: string | null = null): Promise<void> {
    try {
      if (pattern) {
        for await (const entry of Deno.readDir(this.cacheDir)) {
          if (entry.name.includes(pattern)) {
            await Deno.remove(join(this.cacheDir, entry.name));
          }
        }
      } else {
        await Deno.remove(this.cacheDir, { recursive: true });
        await this.ensureCacheDir();
      }
      this.logger.info("Cache cleared");
    } catch (error) {
      this.logger.warn("Cache clear error:", (error as Error).message);
    }
  }

  // Get cache statistics
  async getStats(): Promise<{ files: number; totalSize: number }> {
    try {
      let files = 0;
      let totalSize = 0;

      for await (const entry of Deno.readDir(this.cacheDir)) {
        if (entry.isFile) {
          files++;
          const stat = await Deno.stat(join(this.cacheDir, entry.name));
          totalSize += stat.size;
        }
      }

      return { files, totalSize };
    } catch (error) {
      this.logger.warn("Cache stats error:", (error as Error).message);
      return { files: 0, totalSize: 0 };
    }
  }
}

// Parallel processing for Deno
export class ParallelProcessor {
  private maxWorkers: number;
  private logger: Logger;

  constructor(maxWorkers: number | null = null) {
    this.maxWorkers = maxWorkers || navigator.hardwareConcurrency || 4;
    this.logger = new Logger();
  }

  // Process tasks in parallel using Promise.all with concurrency control
  async processInParallel<T, R>(
    tasks: T[],
    workerFunction: (task: T) => Promise<R>,
    options: ProcessOptions = {},
  ): Promise<R[]> {
    const { chunkSize = this.maxWorkers } = options;

    if (tasks.length <= chunkSize) {
      // Process all tasks at once if within chunk size
      return await Promise.all(tasks.map(workerFunction));
    }

    // Process in chunks to control concurrency
    const results: R[] = [];
    for (let i = 0; i < tasks.length; i += chunkSize) {
      const chunk = tasks.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk.map(workerFunction));
      results.push(...chunkResults);
    }

    return results;
  }

  // Batch file operations
  async batchFileOperations(
    operations: BatchOperation[],
    options: ProcessOptions = {},
  ): Promise<void> {
    await this.processInParallel(operations, async (op) => {
      try {
        switch (op.type) {
          case "read":
            return await Deno.readTextFile(op.source);
          case "write":
            if (op.content !== undefined) {
              await Deno.writeTextFile(op.source, op.content);
            }
            return;
          case "copy":
            if (op.target) {
              await Deno.copyFile(op.source, op.target);
            }
            return;
          case "delete":
            await Deno.remove(op.source);
            return;
          default:
            return;
        }
      } catch (error) {
        this.logger.warn(
          `Batch operation ${op.type} failed for ${op.source}:`,
          (error as Error).message,
        );
        return;
      }
    }, options);
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private timers: Map<string, TimerMetric>;
  private logger: Logger;

  constructor() {
    this.timers = new Map();
    this.logger = new Logger();
  }

  startTimer(name: string): void {
    const existing = this.timers.get(name);
    if (existing && !existing.endTime) {
      this.logger.warn(`Timer '${name}' is already running`);
      return;
    }

    this.timers.set(name, {
      name,
      startTime: performance.now(),
      count: (existing?.count || 0) + 1,
    });
  }

  endTimer(name: string): number | null {
    const timer = this.timers.get(name);
    if (!timer || timer.endTime) {
      this.logger.warn(`Timer '${name}' not found or already ended`);
      return null;
    }

    timer.endTime = performance.now();
    timer.duration = timer.endTime - timer.startTime;

    this.logger.debug(`Timer '${name}': ${timer.duration.toFixed(2)}ms`);
    return timer.duration;
  }

  getTimer(name: string): TimerMetric | undefined {
    return this.timers.get(name);
  }

  async timeFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  getAllMetrics(): TimerMetric[] {
    return Array.from(this.timers.values());
  }

  reset(): void {
    this.timers.clear();
  }

  logSummary(): void {
    const metrics = this.getAllMetrics();
    if (metrics.length === 0) {
      this.logger.info("No performance metrics recorded");
      return;
    }

    this.logger.info("Performance Summary:");
    metrics.forEach((metric) => {
      if (metric.duration) {
        this.logger.info(
          `  ${metric.name}: ${metric.duration.toFixed(2)}ms (${metric.count} calls)`,
        );
      }
    });
  }
}

// Dependency cache specialized for package management
export class DependencyCache extends CacheManager {
  constructor() {
    super(".bmad-cache/dependencies");
  }

  cacheDependencyResolution(
    packageJson: Record<string, unknown>,
    resolved: Record<string, unknown>,
  ): void {
    const key = this.generateKey(packageJson, "deps_");
    this.set(key, resolved);
  }

  getCachedDependencyResolution(
    packageJson: Record<string, unknown>,
  ): Record<string, unknown> | null {
    const key = this.generateKey(packageJson, "deps_");
    const result = this.get(key);
    return result as Record<string, unknown> | null;
  }
}

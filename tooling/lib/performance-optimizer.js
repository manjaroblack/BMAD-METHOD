/**
 * Performance optimization utilities for BMad tooling
 * Provides caching, parallel processing, and performance monitoring
 */

import process from "node:process";
import fs from "fs-extra";
import path from "node:path";
import crypto from "node:crypto";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import os from "node:os";
import { Logger } from "./error-handler.js";

// Cache management
class CacheManager {
  constructor(cacheDir = ".bmad-cache") {
    this.cacheDir = path.resolve(cacheDir);
    this.logger = new Logger();
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    fs.ensureDirSync(this.cacheDir);
  }

  // Generate cache key from content or file path
  generateKey(input, prefix = "") {
    const hash = crypto.createHash("sha256");

    if (typeof input === "string" && fs.existsSync(input)) {
      // File-based cache key
      const stats = fs.statSync(input);
      hash.update(`${input}:${stats.mtime.getTime()}:${stats.size}`);
    } else {
      // Content-based cache key
      hash.update(JSON.stringify(input));
    }

    return `${prefix}${hash.digest("hex")}`;
  }

  // Get cached result
  get(key) {
    try {
      const cachePath = path.join(this.cacheDir, `${key}.json`);
      if (fs.existsSync(cachePath)) {
        const cached = fs.readJsonSync(cachePath);

        // Check if cache is still valid (24 hours by default)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - cached.timestamp < maxAge) {
          this.logger.debug(`Cache hit: ${key}`);
          return cached.data;
        } else {
          this.logger.debug(`Cache expired: ${key}`);
          fs.removeSync(cachePath);
        }
      }
    } catch (error) {
      this.logger.warn(`Cache read error for ${key}:`, error.message);
    }

    return null;
  }

  // Set cached result
  set(key, data, maxAge = 24 * 60 * 60 * 1000) {
    try {
      const cachePath = path.join(this.cacheDir, `${key}.json`);
      const cacheData = {
        timestamp: Date.now(),
        maxAge,
        data,
      };

      fs.writeJsonSync(cachePath, cacheData);
      this.logger.debug(`Cache set: ${key}`);
    } catch (error) {
      this.logger.warn(`Cache write error for ${key}:`, error.message);
    }
  }

  // Clear cache
  clear(pattern = null) {
    try {
      if (pattern) {
        const files = fs.readdirSync(this.cacheDir);
        files.forEach((file) => {
          if (file.includes(pattern)) {
            fs.removeSync(path.join(this.cacheDir, file));
          }
        });
      } else {
        fs.emptyDirSync(this.cacheDir);
      }
      this.logger.info("Cache cleared");
    } catch (error) {
      this.logger.warn("Cache clear error:", error.message);
    }
  }

  // Get cache statistics
  getStats() {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const totalSize = files.reduce((size, file) => {
        const filePath = path.join(this.cacheDir, file);
        return size + fs.statSync(filePath).size;
      }, 0);

      return {
        files: files.length,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      };
    } catch (_error) {
      return { files: 0, totalSize: 0, totalSizeMB: "0.00" };
    }
  }
}

// Parallel processing utilities
class ParallelProcessor {
  constructor(maxWorkers = null) {
    this.maxWorkers = maxWorkers || Math.min(os.cpus().length, 8);
    this.logger = new Logger();
  }

  // Process array of tasks in parallel
  async processInParallel(tasks, workerFunction, options = {}) {
    const {
      chunkSize = Math.ceil(tasks.length / this.maxWorkers),
      timeout = 30000,
    } = options;

    if (tasks.length === 0) return [];

    // Split tasks into chunks
    const chunks = [];
    for (let i = 0; i < tasks.length; i += chunkSize) {
      chunks.push(tasks.slice(i, i + chunkSize));
    }

    this.logger.debug(
      `Processing ${tasks.length} tasks in ${chunks.length} chunks with ${this.maxWorkers} max workers`,
    );

    // Process chunks in parallel
    const promises = chunks.map((chunk) =>
      this.processChunk(chunk, workerFunction, timeout)
    );

    const results = await Promise.all(promises);
    return results.flat();
  }

  // Process a single chunk
  async processChunk(chunk, workerFunction, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Worker timeout after ${timeout}ms`));
      }, timeout);

      try {
        // If workerFunction is a string, treat it as a file path
        if (typeof workerFunction === "string") {
          const worker = new Worker(workerFunction, {
            workerData: { chunk },
          });

          worker.on("message", (result) => {
            clearTimeout(timer);
            resolve(result);
          });

          worker.on("error", (error) => {
            clearTimeout(timer);
            reject(error);
          });
        } else {
          // Execute function directly for small chunks
          const results = chunk.map(workerFunction);
          clearTimeout(timer);
          resolve(results);
        }
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  // Batch file operations
  async batchFileOperations(operations, options = {}) {
    const { concurrency = this.maxWorkers } = options;

    const executeOperation = async (operation) => {
      const { type, source, destination, options: opOptions } = operation;

      switch (type) {
        case "copy":
          await fs.copy(source, destination, opOptions);
          break;
        case "move":
          await fs.move(source, destination, opOptions);
          break;
        case "remove":
          await fs.remove(source);
          break;
        case "ensureDir":
          await fs.ensureDir(source);
          break;
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }

      return { operation, success: true };
    };

    // Process operations in batches
    const results = [];
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      const batchPromises = batch.map(executeOperation);
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }
}

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.logger = new Logger();
  }

  // Start timing an operation
  startTimer(name) {
    this.metrics.set(name, {
      startTime: process.hrtime.bigint(),
      endTime: null,
      duration: null,
    });
  }

  // End timing an operation
  endTimer(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.endTime = process.hrtime.bigint();
      metric.duration = Number(metric.endTime - metric.startTime) / 1000000; // Convert to milliseconds
      this.logger.debug(`${name} completed in ${metric.duration.toFixed(2)}ms`);
    }
  }

  // Get timing for an operation
  getTimer(name) {
    const metric = this.metrics.get(name);
    return metric ? metric.duration : null;
  }

  // Wrap a function with timing
  timeFunction(name, fn) {
    return async (...args) => {
      this.startTimer(name);
      try {
        const result = await fn(...args);
        this.endTimer(name);
        return result;
      } catch (error) {
        this.endTimer(name);
        throw error;
      }
    };
  }

  // Get all metrics
  getAllMetrics() {
    const results = {};
    for (const [name, metric] of this.metrics) {
      results[name] = {
        duration: metric.duration,
        durationMs: metric.duration ? `${metric.duration.toFixed(2)}ms` : null,
      };
    }
    return results;
  }

  // Reset all metrics
  reset() {
    this.metrics.clear();
  }

  // Log performance summary
  logSummary() {
    const metrics = this.getAllMetrics();
    const total = Object.values(metrics)
      .filter((m) => m.duration)
      .reduce((sum, m) => sum + m.duration, 0);

    this.logger.info("Performance Summary:");
    Object.entries(metrics).forEach(([name, metric]) => {
      if (metric.duration) {
        this.logger.info(`  ${name}: ${metric.durationMs}`);
      }
    });
    this.logger.info(`  Total: ${total.toFixed(2)}ms`);
  }
}

// Dependency resolution cache
class DependencyCache extends CacheManager {
  constructor() {
    super(".bmad-cache/dependencies");
  }

  // Cache dependency resolution results
  cacheDependencyResolution(packageJson, resolved) {
    const key = this.generateKey(packageJson, "deps_");
    this.set(key, resolved, 60 * 60 * 1000); // 1 hour cache
  }

  // Get cached dependency resolution
  getCachedDependencyResolution(packageJson) {
    const key = this.generateKey(packageJson, "deps_");
    return this.get(key);
  }
}

export { CacheManager, ParallelProcessor, PerformanceMonitor, DependencyCache };

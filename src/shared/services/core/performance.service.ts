/**
 * Performance monitoring service implementation for BMAD-METHOD
 * Provides timing, metrics, and performance monitoring capabilities
 */

import type { ILogger, PerformanceConfig } from "deps";

export interface IPerformanceMonitor {
  start(operationName: string): string;
  end(operationId: string): PerformanceMetric;
  mark(name: string): void;
  measure(name: string, startMark?: string, endMark?: string): PerformanceMeasure;
  getMetrics(): PerformanceMetric[];
  reset(): void;
}

export interface PerformanceMetric {
  id: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMeasure {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

export class PerformanceMonitor implements IPerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private marks: Map<string, number> = new Map();
  private logger?: ILogger;
  private static instance: PerformanceMonitor;

  constructor(config: PerformanceConfig = {}, logger?: ILogger) {
    this.config = {
      enableMonitoring: true,
      logLevel: "info",
      maxConcurrentOperations: 100,
      timeoutMs: 30000,
      ...config,
    };
    this.logger = logger;
  }

  static getInstance(config?: PerformanceConfig, logger?: ILogger): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config, logger);
    }
    return PerformanceMonitor.instance;
  }

  start(operationName: string): string {
    if (!this.config.enableMonitoring) {
      return "";
    }

    const id = this.generateId();
    const metric: PerformanceMetric = {
      id,
      operationName,
      startTime: performance.now(),
    };

    this.metrics.set(id, metric);

    if (this.logger) {
      this.logger.debug(`Performance monitoring started for: ${operationName}`, {
        operationId: id,
      });
    }

    // Clean up old metrics if we exceed max concurrent operations
    if (this.metrics.size > (this.config.maxConcurrentOperations || 100)) {
      this.cleanupOldMetrics();
    }

    return id;
  }

  end(operationId: string): PerformanceMetric {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      throw new Error(`Performance metric not found for operation ID: ${operationId}`);
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    if (this.logger) {
      const level = duration > 5000 ? "warn" : "debug";
      this.logger[level](`Performance monitoring completed for: ${metric.operationName}`, {
        operationId,
        duration: `${duration.toFixed(2)}ms`,
      });
    }

    return metric;
  }

  mark(name: string): void {
    if (!this.config.enableMonitoring) {
      return;
    }

    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string, endMark?: string): PerformanceMeasure {
    if (!this.config.enableMonitoring) {
      return { name, duration: 0, startTime: 0, endTime: 0 };
    }

    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    const startTime = startMark ? this.marks.get(startMark) : 0;

    if (startMark && !this.marks.has(startMark)) {
      throw new Error(`Start mark '${startMark}' not found`);
    }

    if (endMark && !this.marks.has(endMark)) {
      throw new Error(`End mark '${endMark}' not found`);
    }

    const duration = (endTime || 0) - (startTime || 0);

    return {
      name,
      duration,
      startTime: startTime || 0,
      endTime: endTime || 0,
    };
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  reset(): void {
    this.metrics.clear();
    this.marks.clear();
  }

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupOldMetrics(): void {
    const completedMetrics = Array.from(this.metrics.entries())
      .filter(([_, metric]) => metric.endTime !== undefined)
      .sort(([_, a], [__, b]) => (a.endTime || 0) - (b.endTime || 0));

    // Remove oldest 20% of completed metrics
    const toRemove = Math.floor(completedMetrics.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      const entry = completedMetrics[i];
      if (entry) {
        this.metrics.delete(entry[0]);
      }
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

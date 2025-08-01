/**
 * Memory Profiler - Track memory usage during installation
 * Helps identify memory leaks and optimize resource usage
 */

interface MemoryCheckpoint {
  label: string;
  timestamp: number;
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
  raw: {
    heapUsed: number;
  };
}

interface MemoryStats {
  totalCheckpoints: number;
  peakMemory: string;
  averageMemory: string;
  memoryGrowth: string;
  duration: number;
}

interface MemoryDelta {
  label: string;
  delta: number;
  deltaFormatted: string;
  percentage: number;
}

export class MemoryProfiler {
  private checkpoints: MemoryCheckpoint[] = [];
  private startTime: number;
  private peakMemory = 0;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Create a memory checkpoint
   * @param label - Label for this checkpoint
   */
  checkpoint(label: string): void {
    const memUsage = Deno.memoryUsage();

    const checkpoint: MemoryCheckpoint = {
      label,
      timestamp: Date.now() - this.startTime,
      memory: {
        rss: this.formatBytes(memUsage.rss),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        heapUsed: this.formatBytes(memUsage.heapUsed),
        external: this.formatBytes(memUsage.external),
      },
      raw: {
        heapUsed: memUsage.heapUsed,
      },
    };

    // Track peak memory
    if (memUsage.heapUsed > this.peakMemory) {
      this.peakMemory = memUsage.heapUsed;
    }

    this.checkpoints.push(checkpoint);
  }

  /**
   * Get memory deltas between checkpoints
   * @returns Array of memory deltas
   */
  getDeltas(): MemoryDelta[] {
    const deltas: MemoryDelta[] = [];

    for (let i = 1; i < this.checkpoints.length; i++) {
      const current = this.checkpoints[i];
      const previous = this.checkpoints[i - 1];

      if (!current || !previous) continue;

      const delta = current.raw.heapUsed - previous.raw.heapUsed;
      const percentage = previous.raw.heapUsed > 0 ? (delta / previous.raw.heapUsed) * 100 : 0;

      deltas.push({
        label: current.label,
        delta,
        deltaFormatted: this.formatBytes(Math.abs(delta), delta < 0),
        percentage,
      });
    }

    return deltas;
  }

  /**
   * Get memory statistics
   * @returns Memory statistics object
   */
  getStats(): MemoryStats {
    if (this.checkpoints.length === 0) {
      return {
        totalCheckpoints: 0,
        peakMemory: "0 B",
        averageMemory: "0 B",
        memoryGrowth: "0 B",
        duration: 0,
      };
    }

    const totalMemory = this.checkpoints.reduce(
      (sum, checkpoint) => sum + checkpoint.raw.heapUsed,
      0,
    );
    const averageMemory = totalMemory / this.checkpoints.length;
    const firstCheckpoint = this.checkpoints[0];
    const lastCheckpoint = this.checkpoints[this.checkpoints.length - 1];

    if (!firstCheckpoint || !lastCheckpoint) {
      return {
        totalCheckpoints: this.checkpoints.length,
        peakMemory: this.formatBytes(this.peakMemory),
        averageMemory: this.formatBytes(averageMemory),
        memoryGrowth: this.formatBytes(0),
        duration: 0,
      };
    }

    const memoryGrowth = lastCheckpoint.raw.heapUsed - firstCheckpoint.raw.heapUsed;

    return {
      totalCheckpoints: this.checkpoints.length,
      peakMemory: this.formatBytes(this.peakMemory),
      averageMemory: this.formatBytes(averageMemory),
      memoryGrowth: this.formatBytes(Math.abs(memoryGrowth), memoryGrowth < 0),
      duration: lastCheckpoint.timestamp,
    };
  }

  /**
   * Print memory report
   */
  printReport(): void {
    console.log("\n=== Memory Profile Report ===");

    if (this.checkpoints.length === 0) {
      console.log("No checkpoints recorded.");
      return;
    }

    // Print checkpoints
    console.log("\nCheckpoints:");
    this.checkpoints.forEach((checkpoint, index) => {
      const timeStr = `${(checkpoint.timestamp / 1000).toFixed(2)}s`;
      console.log(
        `${index + 1}. [${timeStr}] ${checkpoint.label}: ${checkpoint.memory.heapUsed}`,
      );
    });

    // Print deltas
    const deltas = this.getDeltas();
    if (deltas.length > 0) {
      console.log("\nMemory Deltas:");
      deltas.forEach((delta, index) => {
        const sign = delta.delta >= 0 ? "+" : "-";
        const percentageStr = delta.percentage.toFixed(1);
        console.log(
          `${index + 1}. ${delta.label}: ${sign}${delta.deltaFormatted} (${sign}${percentageStr}%)`,
        );
      });
    }

    // Print statistics
    const stats = this.getStats();
    console.log("\nStatistics:");
    console.log(`Total Checkpoints: ${stats.totalCheckpoints}`);
    console.log(`Peak Memory: ${stats.peakMemory}`);
    console.log(`Average Memory: ${stats.averageMemory}`);
    console.log(`Memory Growth: ${stats.memoryGrowth}`);
    console.log(`Duration: ${(stats.duration / 1000).toFixed(2)}s`);
  }

  /**
   * Get memory warnings
   * @returns Array of warning messages
   */
  getWarnings(): string[] {
    const warnings: string[] = [];
    const stats = this.getStats();
    const deltas = this.getDeltas();

    // Check for high memory usage
    if (this.peakMemory > 500 * 1024 * 1024) { // 500MB
      warnings.push(`High peak memory usage: ${stats.peakMemory}`);
    }

    // Check for large memory increases
    const largeIncreases = deltas.filter((delta) =>
      delta.delta > 50 * 1024 * 1024 && delta.percentage > 50
    );
    if (largeIncreases.length > 0) {
      warnings.push(`Large memory increases detected in ${largeIncreases.length} operations`);
    }

    // Check for potential memory leaks
    const consistentGrowth = deltas.filter((delta) => delta.delta > 0).length;
    if (consistentGrowth > deltas.length * 0.8) {
      warnings.push("Potential memory leak detected (consistent growth)");
    }

    return warnings;
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC(): void {
    try {
      // Deno doesn't have direct GC control, but we can suggest it
      const globalWithGC = globalThis as { gc?: () => void };
      if (globalWithGC.gc) {
        globalWithGC.gc();
      }
    } catch (_error) {
      // Ignore errors if GC is not available
    }
  }

  /**
   * Reset the profiler
   */
  reset(): void {
    this.checkpoints = [];
    this.startTime = Date.now();
    this.peakMemory = 0;
  }

  /**
   * Format bytes to human readable format
   * @param bytes - Number of bytes
   * @param isNegative - Whether the value is negative
   * @returns Formatted string
   */
  private formatBytes(bytes: number, isNegative = false): string {
    if (bytes === 0) return "0 B";

    const absBytes = Math.abs(bytes);
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(absBytes) / Math.log(k));
    const value = absBytes / Math.pow(k, i);
    const formatted = value.toFixed(i === 0 ? 0 : 1);

    return `${isNegative ? "-" : ""}${formatted} ${sizes[i]}`;
  }

  /**
   * Export checkpoints to JSON
   * @returns JSON string of checkpoints
   */
  exportToJSON(): string {
    return JSON.stringify(
      {
        checkpoints: this.checkpoints,
        stats: this.getStats(),
        deltas: this.getDeltas(),
        warnings: this.getWarnings(),
      },
      null,
      2,
    );
  }

  /**
   * Save memory profile to file
   * @param filePath - Path to save the profile
   */
  async saveProfile(filePath: string): Promise<void> {
    const profile = this.exportToJSON();
    await Deno.writeTextFile(filePath, profile);
  }
}

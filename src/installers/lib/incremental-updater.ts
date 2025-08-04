/**
 * Incremental update utilities for optimized installation and updates
 * Provides caching, differential updates, and dependency resolution
 */

import {
  CacheManager,
  copy,
  ensureDir,
  join,
  Logger,
  ParallelProcessor,
  PerformanceMonitor,
  relative,
  walk,
} from "deps";

interface FileInfo {
  path: string;
  size: number;
  checksum: string;
  modified: string;
}

interface Manifest {
  version: string;
  timestamp: string;
  files: Record<string, FileInfo>;
  directories: string[];
  totalSize: number;
}

interface ChangeSet {
  added: string[];
  modified: string[];
  deleted: string[];
  unchanged: string[];
}

class IncrementalUpdater {
  private logger: Logger;
  private cache: CacheManager;
  private processor: ParallelProcessor;
  private monitor: PerformanceMonitor;
  private manifestId?: string;
  private incrementalUpdateId?: string;
  private fullCopyId?: string;

  constructor() {
    this.logger = new Logger();
    this.cache = new CacheManager();
    this.processor = new ParallelProcessor();
    this.monitor = new PerformanceMonitor();
  }

  // Generate file manifest with checksums
  async generateManifest(
    sourceDir: string,
    _targetDir: string | null = null,
  ): Promise<Manifest> {
    this.manifestId = this.monitor.start("generate_manifest");
    const manifest: Manifest = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      files: {},
      directories: [],
      totalSize: 0,
    };

    try {
      const files = await this.getAllFiles(sourceDir);

      // Process files in parallel for better performance
      const processFile = async (filePath: string): Promise<FileInfo> => {
        const relativePath = relative(sourceDir, filePath);
        const stats = await Deno.stat(filePath);
        const content = await Deno.readFile(filePath);
        const checksum = await this.calculateChecksum(content);

        return {
          path: relativePath,
          size: stats.size,
          checksum,
          modified: stats.mtime?.toISOString() || new Date().toISOString(),
        };
      };

      const fileInfos = await this.processor.processInParallel(
        files,
        processFile,
      );

      // Build manifest
      for (const fileInfo of fileInfos) {
        manifest.files[fileInfo.path] = fileInfo;
        manifest.totalSize += fileInfo.size;
      }

      // Get directories
      manifest.directories = await this.getAllDirectories(sourceDir);

      if (this.manifestId) {
        this.monitor.end(this.manifestId);
      }
      this.logger.info(
        `Generated manifest for ${files.length} files (${manifest.totalSize} bytes)`,
      );

      return manifest;
    } catch (error) {
      if (this.manifestId) {
        this.monitor.end(this.manifestId);
      }
      this.logger.error(
        "Failed to generate manifest",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  // Compare two manifests and return changes
  compareManifests(
    oldManifest: Manifest | null,
    newManifest: Manifest,
  ): ChangeSet {
    const changes: ChangeSet = {
      added: [],
      modified: [],
      deleted: [],
      unchanged: [],
    };

    if (!oldManifest) {
      // If no old manifest, everything is new
      changes.added = Object.keys(newManifest.files);
      return changes;
    }

    // Check for added and modified files
    for (const [filePath, newFileInfo] of Object.entries(newManifest.files)) {
      const oldFileInfo = oldManifest.files[filePath];

      if (!oldFileInfo) {
        changes.added.push(filePath);
      } else if (oldFileInfo.checksum !== newFileInfo.checksum) {
        changes.modified.push(filePath);
      } else {
        changes.unchanged.push(filePath);
      }
    }

    // Check for deleted files
    for (const filePath of Object.keys(oldManifest.files)) {
      if (!newManifest.files[filePath]) {
        changes.deleted.push(filePath);
      }
    }

    return changes;
  }

  // Perform incremental update based on manifest comparison
  async performIncrementalUpdate(
    sourceDir: string,
    targetDir: string,
    oldManifest: Manifest | null = null,
  ): Promise<void> {
    this.incrementalUpdateId = this.monitor.start("incremental_update");

    try {
      // Generate new manifest
      const newManifest = await this.generateManifest(sourceDir);

      // Compare manifests
      const changes = await this.compareManifests(oldManifest, newManifest);

      this.logger.info(
        `Update analysis: ${changes.added.length} added, ${changes.modified.length} modified, ${changes.deleted.length} deleted`,
      );

      // Apply changes
      await this.applyChanges(sourceDir, targetDir, changes);

      // Save new manifest
      const manifestPath = join(targetDir, ".bmad-manifest.json");
      await this.saveManifest(newManifest, manifestPath);

      if (this.incrementalUpdateId) {
        this.monitor.end(this.incrementalUpdateId);
      }
      this.logger.info("Incremental update completed successfully");
    } catch (error) {
      if (this.incrementalUpdateId) {
        this.monitor.end(this.incrementalUpdateId);
      }
      this.logger.error(
        "Incremental update failed",
        error instanceof Error ? error : new Error(String(error)),
      );

      // Fallback to full copy
      this.logger.info("Falling back to full copy");
      await this.performFullCopy(sourceDir, targetDir);
    }
  }

  // Apply the calculated changes
  async applyChanges(
    sourceDir: string,
    targetDir: string,
    changes: ChangeSet,
  ): Promise<void> {
    // Ensure target directory exists
    await ensureDir(targetDir);

    // Delete files first
    for (const filePath of changes.deleted) {
      const targetPath = join(targetDir, filePath);
      try {
        await Deno.remove(targetPath);
        this.logger.debug(`Deleted: ${filePath}`);
      } catch (error) {
        this.logger.warn(`Failed to delete ${filePath}:`, error);
      }
    }

    // Copy added and modified files
    const filesToCopy = [...changes.added, ...changes.modified];

    const copyFile = async (filePath: string): Promise<void> => {
      const sourcePath = join(sourceDir, filePath);
      const targetPath = join(targetDir, filePath);
      await this.copyFileWithCache(sourcePath, targetPath);
    };

    await this.processor.processInParallel(filesToCopy, copyFile);

    this.logger.info(`Applied ${filesToCopy.length} file changes`);
  }

  // Copy file with caching support
  async copyFileWithCache(
    sourcePath: string,
    targetPath: string,
  ): Promise<void> {
    try {
      // Ensure target directory exists
      const targetDir = join(targetPath, "..");
      await ensureDir(targetDir);

      // Check cache first
      const sourceContent = await Deno.readFile(sourcePath);
      const checksum = await this.calculateChecksum(sourceContent);
      const cacheKey = `file:${checksum}`;

      const cachedContent = this.cache.get(cacheKey) as Uint8Array;
      if (cachedContent) {
        await Deno.writeFile(targetPath, cachedContent);
        this.logger.debug(`Copied from cache: ${sourcePath}`);
        return;
      }

      // Copy file and cache it
      await copy(sourcePath, targetPath, { overwrite: true });
      this.cache.set(cacheKey, sourceContent);
      this.logger.debug(`Copied: ${sourcePath} -> ${targetPath}`);
    } catch (error) {
      this.logger.error(
        `Failed to copy ${sourcePath}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  // Fallback: perform full copy
  async performFullCopy(sourceDir: string, targetDir: string): Promise<void> {
    this.fullCopyId = this.monitor.start("full_copy");

    try {
      await ensureDir(targetDir);
      await copy(sourceDir, targetDir, { overwrite: true });

      // Generate and save manifest
      const manifest = await this.generateManifest(sourceDir);
      const manifestPath = join(targetDir, ".bmad-manifest.json");
      await this.saveManifest(manifest, manifestPath);

      if (this.fullCopyId) {
        this.monitor.end(this.fullCopyId);
      }
      this.logger.info("Full copy completed");
    } catch (error) {
      if (this.fullCopyId) {
        this.monitor.end(this.fullCopyId);
      }
      this.logger.error(
        "Full copy failed",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  // Get all files in directory recursively
  async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      for await (
        const entry of walk(dir, {
          includeFiles: true,
          includeDirs: false,
          skip: [/node_modules/, /\.git/, /\.bmad-cache/],
        })
      ) {
        if (!this.shouldSkipDirectory(entry.path)) {
          files.push(entry.path);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to read directory ${dir}`,
        error instanceof Error ? error : new Error(String(error)),
      );
    }

    return files;
  }

  // Get all directories
  async getAllDirectories(dir: string): Promise<string[]> {
    const directories: string[] = [];

    try {
      for await (
        const entry of walk(dir, {
          includeFiles: false,
          includeDirs: true,
          skip: [/node_modules/, /\.git/, /\.bmad-cache/],
        })
      ) {
        if (!this.shouldSkipDirectory(entry.path)) {
          const relativePath = relative(dir, entry.path);
          if (relativePath) {
            directories.push(relativePath);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to read directories in ${dir}`,
        error instanceof Error ? error : new Error(String(error)),
      );
    }

    return directories;
  }

  // Check if directory should be skipped
  shouldSkipDirectory(dirName: string): boolean {
    const skipPatterns = [
      "node_modules",
      ".git",
      ".bmad-cache",
      ".DS_Store",
      "Thumbs.db",
      ".tmp",
      "temp",
    ];

    return skipPatterns.some((pattern) => dirName.includes(pattern));
  }

  // Calculate total size of changes
  calculateChangesSize(manifest: Manifest, changes: ChangeSet): number {
    let totalSize = 0;

    for (const filePath of [...changes.added, ...changes.modified]) {
      const fileInfo = manifest.files[filePath];
      if (fileInfo) {
        totalSize += fileInfo.size;
      }
    }

    return totalSize;
  }

  // Load manifest from file
  async loadManifest(manifestPath: string): Promise<Manifest | null> {
    try {
      if (await Deno.stat(manifestPath)) {
        const content = await Deno.readTextFile(manifestPath);
        return JSON.parse(content) as Manifest;
      }
    } catch (error) {
      this.logger.warn(`Failed to load manifest from ${manifestPath}:`, error);
    }

    return null;
  }

  // Save manifest to file
  async saveManifest(manifest: Manifest, manifestPath: string): Promise<void> {
    try {
      await ensureDir(join(manifestPath, ".."));
      await Deno.writeTextFile(manifestPath, JSON.stringify(manifest, null, 2));
      this.logger.debug(`Saved manifest to ${manifestPath}`);
    } catch (error) {
      this.logger.error(
        `Failed to save manifest to ${manifestPath}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  // Calculate checksum for content
  private async calculateChecksum(content: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", content);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Get performance metrics
  getPerformanceMetrics(): unknown {
    return this.monitor.getMetrics();
  }
}

export default IncrementalUpdater;

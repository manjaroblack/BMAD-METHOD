/**
 * Incremental update utilities for optimized installation and updates
 * Provides caching, differential updates, and dependency resolution
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { Logger } = require('../../lib/error-handler.js');
const { CacheManager, ParallelProcessor, PerformanceMonitor } = require('../../lib/performance-optimizer.js');

class IncrementalUpdater {
  constructor() {
    this.logger = new Logger();
    this.cache = new CacheManager();
    this.processor = new ParallelProcessor();
    this.monitor = new PerformanceMonitor();
  }

  // Generate file manifest with checksums
  async generateManifest(sourceDir, targetDir = null) {
    this.monitor.startTimer('generate_manifest');
    const manifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      files: {},
      directories: [],
      totalSize: 0
    };

    try {
      const files = await this.getAllFiles(sourceDir);
      
      // Process files in parallel for better performance
      const processFile = async (filePath) => {
        const relativePath = path.relative(sourceDir, filePath);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath);
        const checksum = crypto.createHash('sha256').update(content).digest('hex');
        
        return {
          path: relativePath,
          size: stats.size,
          checksum,
          modified: stats.mtime.toISOString()
        };
      };

      const fileInfos = await this.processor.processInParallel(files, processFile);
      
      // Build manifest
      fileInfos.forEach(info => {
        manifest.files[info.path] = {
          size: info.size,
          checksum: info.checksum,
          modified: info.modified
        };
        manifest.totalSize += info.size;
      });

      // Get directories
      manifest.directories = await this.getAllDirectories(sourceDir);

      this.monitor.endTimer('generate_manifest');
      return manifest;
    } catch (error) {
      this.monitor.endTimer('generate_manifest');
      throw error;
    }
  }

  // Compare manifests to find differences
  async compareManifests(oldManifest, newManifest) {
    const changes = {
      added: [],
      modified: [],
      deleted: [],
      unchanged: []
    };

    const oldFiles = new Set(Object.keys(oldManifest.files || {}));
    const newFiles = new Set(Object.keys(newManifest.files || {}));

    // Find added files
    for (const file of newFiles) {
      if (!oldFiles.has(file)) {
        changes.added.push(file);
      }
    }

    // Find deleted files
    for (const file of oldFiles) {
      if (!newFiles.has(file)) {
        changes.deleted.push(file);
      }
    }

    // Find modified files
    for (const file of newFiles) {
      if (oldFiles.has(file)) {
        const oldFile = oldManifest.files[file];
        const newFile = newManifest.files[file];
        
        if (oldFile.checksum !== newFile.checksum) {
          changes.modified.push(file);
        } else {
          changes.unchanged.push(file);
        }
      }
    }

    return changes;
  }

  // Perform incremental update
  async performIncrementalUpdate(sourceDir, targetDir, oldManifest = null) {
    this.monitor.startTimer('incremental_update');
    
    try {
      // Generate new manifest
      const newManifest = await this.generateManifest(sourceDir);
      
      // If no old manifest, perform full copy
      if (!oldManifest) {
        this.logger.info('No previous manifest found, performing full installation');
        await this.performFullCopy(sourceDir, targetDir);
        return {
          type: 'full',
          manifest: newManifest,
          stats: {
            filesProcessed: Object.keys(newManifest.files).length,
            totalSize: newManifest.totalSize
          }
        };
      }

      // Compare manifests
      const changes = await this.compareManifests(oldManifest, newManifest);
      
      this.logger.info(`Incremental update: ${changes.added.length} added, ${changes.modified.length} modified, ${changes.deleted.length} deleted`);

      // Apply changes
      await this.applyChanges(sourceDir, targetDir, changes);

      this.monitor.endTimer('incremental_update');
      
      return {
        type: 'incremental',
        manifest: newManifest,
        changes,
        stats: {
          filesProcessed: changes.added.length + changes.modified.length + changes.deleted.length,
          totalSize: this.calculateChangesSize(newManifest, changes)
        }
      };
    } catch (error) {
      this.monitor.endTimer('incremental_update');
      throw error;
    }
  }

  // Apply file changes
  async applyChanges(sourceDir, targetDir, changes) {
    // Ensure target directory exists
    await fs.ensureDir(targetDir);

    // Process deletions first
    for (const file of changes.deleted) {
      const targetPath = path.join(targetDir, file);
      try {
        await fs.remove(targetPath);
        this.logger.debug(`Deleted: ${file}`);
      } catch (error) {
        this.logger.warn(`Failed to delete ${file}: ${error.message}`);
      }
    }

    // Process additions and modifications in parallel
    const filesToCopy = [...changes.added, ...changes.modified];
    
    const copyFile = async (file) => {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      try {
        // Ensure target directory exists
        await fs.ensureDir(path.dirname(targetPath));
        
        // Copy file with caching
        await this.copyFileWithCache(sourcePath, targetPath);
        
        this.logger.debug(`Copied: ${file}`);
      } catch (error) {
        this.logger.error(`Failed to copy ${file}: ${error.message}`);
        throw error;
      }
    };

    await this.processor.processInParallel(filesToCopy, copyFile);
  }

  // Copy file with caching support
  async copyFileWithCache(sourcePath, targetPath) {
    const cacheKey = `file_copy_${sourcePath}_${targetPath}`;
    
    // Check if file is already cached and up-to-date
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      const sourceStats = await fs.stat(sourcePath);
      if (cached.modified === sourceStats.mtime.toISOString()) {
        this.logger.debug(`Using cached copy for ${path.basename(sourcePath)}`);
        return;
      }
    }

    // Copy file
    await fs.copy(sourcePath, targetPath, { overwrite: true });
    
    // Cache file info
    const stats = await fs.stat(sourcePath);
    await this.cache.set(cacheKey, {
      modified: stats.mtime.toISOString(),
      size: stats.size
    });
  }

  // Perform full copy operation
  async performFullCopy(sourceDir, targetDir) {
    this.monitor.startTimer('full_copy');
    
    try {
      await fs.ensureDir(targetDir);
      await fs.copy(sourceDir, targetDir, { 
        overwrite: true,
        filter: (src) => {
          // Skip hidden files and directories that shouldn't be copied
          const basename = path.basename(src);
          return !basename.startsWith('.git') && basename !== 'node_modules';
        }
      });
      
      this.monitor.endTimer('full_copy');
    } catch (error) {
      this.monitor.endTimer('full_copy');
      throw error;
    }
  }

  // Get all files in directory recursively
  async getAllFiles(dir) {
    const files = [];
    
    const walk = async (currentDir) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip certain directories
          if (!this.shouldSkipDirectory(entry.name)) {
            await walk(fullPath);
          }
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    };
    
    await walk(dir);
    return files;
  }

  // Get all directories
  async getAllDirectories(dir) {
    const directories = [];
    
    const walk = async (currentDir) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          const fullPath = path.join(currentDir, entry.name);
          const relativePath = path.relative(dir, fullPath);
          directories.push(relativePath);
          await walk(fullPath);
        }
      }
    };
    
    await walk(dir);
    return directories;
  }

  // Check if directory should be skipped
  shouldSkipDirectory(dirName) {
    const skipDirs = [
      '.git',
      '.svn',
      'node_modules',
      '.DS_Store',
      'Thumbs.db'
    ];
    
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  // Calculate total size of changes
  calculateChangesSize(manifest, changes) {
    let totalSize = 0;
    
    [...changes.added, ...changes.modified].forEach(file => {
      if (manifest.files[file]) {
        totalSize += manifest.files[file].size;
      }
    });
    
    return totalSize;
  }

  // Load manifest from file
  async loadManifest(manifestPath) {
    try {
      if (await fs.pathExists(manifestPath)) {
        return await fs.readJson(manifestPath);
      }
    } catch (error) {
      this.logger.warn(`Failed to load manifest: ${error.message}`);
    }
    return null;
  }

  // Save manifest to file
  async saveManifest(manifest, manifestPath) {
    try {
      await fs.ensureDir(path.dirname(manifestPath));
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    } catch (error) {
      this.logger.error(`Failed to save manifest: ${error.message}`);
      throw error;
    }
  }

  // Clean up old cache entries
  async cleanupCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      await this.cache.cleanup(maxAge);
      this.logger.debug('Cache cleanup completed');
    } catch (error) {
      this.logger.warn(`Cache cleanup failed: ${error.message}`);
    }
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return this.monitor.getAllMetrics();
  }
}

module.exports = IncrementalUpdater;
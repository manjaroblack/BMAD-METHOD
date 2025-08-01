/**
 * File System service implementation for BMAD-METHOD
 * Provides enhanced file system operations with error handling and utilities
 */

import {
  copy,
  ensureDir,
  exists,
  expandGlob,
  dirname,
  join,
  resolve,
} from "deps";

import type {
  IFileManager,
  IFileSystemService,
  IFileOperations,
  FileStats,
  GlobOptions,
  FileCopyOperation,
  FileCopyResult,
  ILogger
} from 'deps';

export class FileSystemService implements IFileManager, IFileSystemService, IFileOperations {
  private logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  // IFileManager implementation
  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      await this.ensureDirectory(dirname(destPath));
      await copy(sourcePath, destPath, { overwrite: true });
      
      this.logger?.debug(`File copied successfully`, {
        source: sourcePath,
        destination: destPath
      });
    } catch (error) {
      this.logger?.error(`Failed to copy file`, error as Error, {
        source: sourcePath,
        destination: destPath
      });
      throw error;
    }
  }

  async copyDirectory(sourceDir: string, destDir: string): Promise<void> {
    try {
      await this.ensureDirectory(destDir);
      await copy(sourceDir, destDir, { overwrite: true });
      
      this.logger?.debug(`Directory copied successfully`, {
        source: sourceDir,
        destination: destDir
      });
    } catch (error) {
      this.logger?.error(`Failed to copy directory`, error as Error, {
        source: sourceDir,
        destination: destDir
      });
      throw error;
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      return await exists(path);
    } catch (error) {
      this.logger?.error(`Failed to check if path exists`, error as Error, { path });
      return false;
    }
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await ensureDir(dirPath);
      this.logger?.debug(`Directory ensured`, { directory: dirPath });
    } catch (error) {
      this.logger?.error(`Failed to ensure directory`, error as Error, { directory: dirPath });
      throw error;
    }
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const content = await Deno.readTextFile(filePath);
      this.logger?.debug(`File read successfully`, { 
        file: filePath, 
        size: content.length 
      });
      return content;
    } catch (error) {
      this.logger?.error(`Failed to read file`, error as Error, { file: filePath });
      throw error;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await this.ensureDirectory(dirname(filePath));
      await Deno.writeTextFile(filePath, content);
      
      this.logger?.debug(`File written successfully`, {
        file: filePath,
        size: content.length
      });
    } catch (error) {
      this.logger?.error(`Failed to write file`, error as Error, { 
        file: filePath 
      });
      throw error;
    }
  }

  async remove(path: string): Promise<void> {
    try {
      await Deno.remove(path, { recursive: true });
      this.logger?.debug(`Path removed successfully`, { path });
    } catch (error) {
      this.logger?.error(`Failed to remove path`, error as Error, { path });
      throw error;
    }
  }

  async getStats(path: string): Promise<FileStats> {
    try {
      const stat = await Deno.stat(path);
      return {
        isFile: stat.isFile,
        isDirectory: stat.isDirectory,
        size: stat.size,
        modified: stat.mtime || new Date(),
        created: stat.birthtime || new Date()
      };
    } catch (error) {
      this.logger?.error(`Failed to get file stats`, error as Error, { path });
      throw error;
    }
  }

  // IFileSystemService implementation
  async copyFileWithRootReplacement(
    sourcePath: string,
    destPath: string,
    rootReplacement: string
  ): Promise<void> {
    try {
      const content = await this.readFile(sourcePath);
      const modifiedContent = content.replace(/\$\{ROOT\}/g, rootReplacement);
      await this.writeFile(destPath, modifiedContent);
      
      this.logger?.debug(`File copied with root replacement`, {
        source: sourcePath,
        destination: destPath,
        rootReplacement
      });
    } catch (error) {
      this.logger?.error(`Failed to copy file with root replacement`, error as Error, {
        source: sourcePath,
        destination: destPath,
        rootReplacement
      });
      throw error;
    }
  }

  async expandGlob(pattern: string, options: GlobOptions = {}): Promise<string[]> {
    try {
      const paths: string[] = [];
      for await (const entry of expandGlob(pattern, {
        root: options.cwd,
        includeDirs: true,
        globstar: true,
        ...options
      })) {
        paths.push(options.absolute ? entry.path : entry.name);
      }
      
      this.logger?.debug(`Glob pattern expanded`, {
        pattern,
        matchCount: paths.length
      });
      
      return paths;
    } catch (error) {
      this.logger?.error(`Failed to expand glob pattern`, error as Error, { pattern });
      throw error;
    }
  }

  resolvePath(...paths: string[]): string {
    return resolve(...paths);
  }

  dirname(path: string): string {
    return dirname(path);
  }

  join(...paths: string[]): string {
    if (paths.length === 0) return '';
    return join(paths[0]!, ...paths.slice(1));
  }

  // IFileOperations implementation
  async copyFiles(operations: FileCopyOperation[]): Promise<FileCopyResult[]> {
    const results: FileCopyResult[] = [];

    for (const operation of operations) {
      try {
        if (!operation.overwrite && await this.exists(operation.destination)) {
          results.push({
            operation,
            success: false,
            error: 'Destination exists and overwrite is false'
          });
          continue;
        }

        await this.copyFile(operation.source, operation.destination);
        
        if (operation.preserveTimestamp) {
          await this.preserveTimestamp(operation.source, operation.destination);
        }

        const stats = await this.getStats(operation.destination);
        results.push({
          operation,
          success: true,
          bytesWritten: stats.size
        });

      } catch (error) {
        results.push({
          operation,
          success: false,
          error: (error as Error).message
        });
      }
    }

    this.logger?.info(`Batch file copy completed`, {
      total: operations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }

  async createBackup(filePaths: string[], backupDir: string): Promise<string[]> {
    const backupPaths: string[] = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
      await this.ensureDirectory(backupDir);

      for (const filePath of filePaths) {
        if (await this.exists(filePath)) {
          const fileName = filePath.split('/').pop() || 'unknown';
          const backupPath = this.join(backupDir, `${timestamp}_${fileName}`);
          
          await this.copyFile(filePath, backupPath);
          backupPaths.push(backupPath);
        }
      }

      this.logger?.info(`Backup created successfully`, {
        fileCount: backupPaths.length,
        backupDir
      });

      return backupPaths;
    } catch (error) {
      this.logger?.error(`Failed to create backup`, error as Error, {
        backupDir,
        fileCount: filePaths.length
      });
      throw error;
    }
  }

  async restoreFromBackup(backupDir: string, targetDir: string): Promise<void> {
    try {
      const backupFiles = await this.expandGlob(this.join(backupDir, '*'));
      
      for (const backupFile of backupFiles) {
        const fileName = backupFile.split('_').slice(1).join('_'); // Remove timestamp prefix
        const targetPath = this.join(targetDir, fileName);
        
        await this.copyFile(backupFile, targetPath);
      }

      this.logger?.info(`Backup restored successfully`, {
        backupDir,
        targetDir,
        fileCount: backupFiles.length
      });
    } catch (error) {
      this.logger?.error(`Failed to restore from backup`, error as Error, {
        backupDir,
        targetDir
      });
      throw error;
    }
  }

  private async preserveTimestamp(sourcePath: string, destPath: string): Promise<void> {
    try {
      const sourceStats = await this.getStats(sourcePath);
      await Deno.utime(destPath, sourceStats.modified, sourceStats.modified);
    } catch (error) {
      this.logger?.warn(`Failed to preserve timestamp`, {
        source: sourcePath,
        destination: destPath,
        error: (error as Error).message
      });
      // Don't throw - timestamp preservation is not critical
    }
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemService();

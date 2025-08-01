/**
 * File Operations Utility for BMAD-METHOD
 * Provides specialized file operations for installation processes
 */

import { join, dirname, copy, ensureDir, exists } from "deps";
import type { ILogger, IFileSystemService } from 'deps';

export interface CopyOperation {
  source: string;
  destination: string;
  overwrite?: boolean;
  preserveTimestamp?: boolean;
  rootReplacement?: string;
}

export interface CopyResult {
  success: boolean;
  source: string;
  destination: string;
  bytesWritten?: number;
  error?: string;
}

export interface BatchCopyOptions {
  concurrency?: number;
  failFast?: boolean;
  createBackup?: boolean;
  validateAfterCopy?: boolean;
}

export class FileOperations {
  constructor(
    private fileSystem: IFileSystemService,
    private logger?: ILogger
  ) {}

  /**
   * Copy files with root replacement (replaces ${ROOT} placeholders)
   */
  async copyFileWithRootReplacement(
    sourcePath: string,
    destPath: string,
    rootReplacement: string
  ): Promise<void> {
    this.logger?.debug('Copying file with root replacement', {
      source: sourcePath,
      destination: destPath,
      rootReplacement
    });

    try {
      // Ensure destination directory exists
      await ensureDir(dirname(destPath));

      // Read source file
      const content = await Deno.readTextFile(sourcePath);
      
      // Replace root placeholders
      const modifiedContent = content.replace(/\$\{ROOT\}/g, rootReplacement);
      
      // Write modified content to destination
      await Deno.writeTextFile(destPath, modifiedContent);

      this.logger?.debug('File copied with root replacement successfully', {
        source: sourcePath,
        destination: destPath,
        replacements: (content.match(/\$\{ROOT\}/g) || []).length
      });

    } catch (error) {
      this.logger?.error('Failed to copy file with root replacement', error as Error, {
        source: sourcePath,
        destination: destPath,
        rootReplacement
      });
      throw error;
    }
  }

  /**
   * Batch copy multiple files with progress tracking
   */
  async batchCopy(
    operations: CopyOperation[],
    options: BatchCopyOptions = {}
  ): Promise<CopyResult[]> {
    const {
      concurrency = 5,
      failFast = false,
      createBackup = false,
      validateAfterCopy = false
    } = options;

    this.logger?.info('Starting batch copy operation', {
      operationCount: operations.length,
      concurrency,
      failFast,
      createBackup
    });

    const results: CopyResult[] = [];
    
    // Process operations in batches
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      const batchPromises = batch.map(operation => 
        this.processSingleCopy(operation, createBackup, validateAfterCopy)
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          const operation = batch[j];
          
          if (result && operation) {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            } else {
              const errorReason = result.reason instanceof Error ? result.reason.message : String(result.reason || 'Unknown error');
              const errorResult: CopyResult = {
                success: false,
                source: operation.source,
                destination: operation.destination,
                error: errorReason
              };
              results.push(errorResult);

              if (failFast) {
                this.logger?.error('Batch copy failed fast', result.reason, { operation });
                throw new Error(`Batch copy failed: ${errorReason}`);
              }
            }
          }
        }

      } catch (error) {
        this.logger?.error('Batch copy batch failed', error as Error, { batchIndex: i });
        if (failFast) throw error;
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    this.logger?.info('Batch copy operation completed', {
      totalOperations: operations.length,
      successful: successCount,
      failed: failureCount
    });

    return results;
  }

  /**
   * Copy common installation items (core files, configurations, etc.)
   */
  async copyCommonItems(
    sourceDir: string,
    targetDir: string,
    commonPaths: string[]
  ): Promise<string[]> {
    this.logger?.info('Copying common installation items', {
      sourceDir,
      targetDir,
      itemCount: commonPaths.length
    });

    const copiedItems: string[] = [];

    try {
      await ensureDir(targetDir);

      for (const commonPath of commonPaths) {
        const sourcePath = join(sourceDir, commonPath);
        const targetPath = join(targetDir, commonPath);

        if (await exists(sourcePath)) {
          try {
            // Ensure target directory exists
            await ensureDir(dirname(targetPath));
            
            // Copy file or directory
            await copy(sourcePath, targetPath, { overwrite: true });
            copiedItems.push(commonPath);

            this.logger?.debug('Common item copied', {
              item: commonPath,
              source: sourcePath,
              target: targetPath
            });

          } catch (error) {
            this.logger?.warn('Failed to copy common item', {
              item: commonPath,
              error: (error as Error).message
            });
          }
        } else {
          this.logger?.debug('Common item not found, skipping', {
            item: commonPath,
            sourcePath
          });
        }
      }

      this.logger?.info('Common items copy completed', {
        sourceDir,
        targetDir,
        requestedItems: commonPaths.length,
        copiedItems: copiedItems.length
      });

      return copiedItems;

    } catch (error) {
      this.logger?.error('Failed to copy common items', error as Error, {
        sourceDir,
        targetDir
      });
      throw error;
    }
  }

  /**
   * Create backup of files before modification
   */
  async createBackup(
    filePaths: string[],
    backupDir: string
  ): Promise<string[]> {
    this.logger?.info('Creating file backup', {
      fileCount: filePaths.length,
      backupDir
    });

    const backedUpFiles: string[] = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
      await ensureDir(backupDir);

      for (const filePath of filePaths) {
        if (await exists(filePath)) {
          const fileName = filePath.split('/').pop() || 'unknown';
          const backupPath = join(backupDir, `${timestamp}_${fileName}`);
          
          await copy(filePath, backupPath);
          backedUpFiles.push(backupPath);

          this.logger?.debug('File backed up', {
            original: filePath,
            backup: backupPath
          });
        }
      }

      this.logger?.info('Backup creation completed', {
        requestedFiles: filePaths.length,
        backedUpFiles: backedUpFiles.length,
        backupDir
      });

      return backedUpFiles;

    } catch (error) {
      this.logger?.error('Failed to create backup', error as Error, {
        fileCount: filePaths.length,
        backupDir
      });
      throw error;
    }
  }

  /**
   * Validate file copy by comparing checksums
   */
  async validateCopy(sourcePath: string, destPath: string): Promise<boolean> {
    try {
      if (!await exists(sourcePath) || !await exists(destPath)) {
        return false;
      }

      const sourceContent = await Deno.readTextFile(sourcePath);
      const destContent = await Deno.readTextFile(destPath);

      return sourceContent === destContent;

    } catch (error) {
      this.logger?.warn('Failed to validate copy', {
        source: sourcePath,
        destination: destPath,
        error: (error as Error).message
      });
      return false;
    }
  }

  private async processSingleCopy(
    operation: CopyOperation,
    createBackup: boolean,
    validateAfterCopy: boolean
  ): Promise<CopyResult> {
    try {
      const { source, destination, overwrite = true, rootReplacement } = operation;

      // Check if destination exists and handle overwrite
      if (!overwrite && await exists(destination)) {
        return {
          success: false,
          source,
          destination,
          error: 'Destination exists and overwrite is disabled'
        };
      }

      // Create backup if requested
      if (createBackup && await exists(destination)) {
        const backupDir = join(dirname(destination), '.backup');
        await this.createBackup([destination], backupDir);
      }

      // Perform copy operation
      if (rootReplacement) {
        await this.copyFileWithRootReplacement(source, destination, rootReplacement);
      } else {
        await ensureDir(dirname(destination));
        await copy(source, destination, { overwrite });
      }

      // Validate copy if requested
      if (validateAfterCopy && !rootReplacement) {
        const isValid = await this.validateCopy(source, destination);
        if (!isValid) {
          return {
            success: false,
            source,
            destination,
            error: 'Copy validation failed'
          };
        }
      }

      // Get file size
      let bytesWritten: number | undefined;
      try {
        const stat = await Deno.stat(destination);
        bytesWritten = stat.size;
      } catch {
        // Ignore stat errors
      }

      return {
        success: true,
        source,
        destination,
        bytesWritten
      };

    } catch (error) {
      return {
        success: false,
        source: operation.source,
        destination: operation.destination,
        error: (error as Error).message
      };
    }
  }
}

// Export factory function
export function createFileOperations(
  fileSystem: IFileSystemService,
  logger?: ILogger
): FileOperations {
  return new FileOperations(fileSystem, logger);
}

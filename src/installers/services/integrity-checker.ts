/**
 * Integrity Checker Service for BMAD-METHOD
 * Handles file integrity validation, checksum generation, and corruption detection
 */

import type { 
  IIntegrityValidator,
  ILogger,
  IFileService,
  FileIntegrityResult
} from 'deps';

export interface IntegrityCheckOptions {
  validateChecksums?: boolean;
  generateMissingChecksums?: boolean;
  excludePatterns?: string[];
  includePatterns?: string[];
}

export class IntegrityChecker implements IIntegrityValidator {
  constructor(
    private fileSystem: IFileService,
    private logger?: ILogger
  ) {}

  async validateFileChecksums(
    filePaths: string[], 
    manifestPath: string
  ): Promise<boolean> {
    this.logger?.info('Validating file checksums', {
      fileCount: filePaths.length,
      manifestPath
    });

    try {
      const manifest = await this.readManifestChecksums(manifestPath);
      if (!manifest) {
        this.logger?.warn('No manifest checksums found', { manifestPath });
        return false;
      }

      let validFiles = 0;
      let invalidFiles = 0;

      for (const filePath of filePaths) {
        const expectedChecksum = manifest[filePath];
        if (!expectedChecksum) {
          this.logger?.debug('No checksum found for file', { filePath });
          continue;
        }

        const actualChecksum = await this.calculateFileChecksum(filePath);
        if (actualChecksum === expectedChecksum) {
          validFiles++;
        } else {
          invalidFiles++;
          this.logger?.warn('Checksum mismatch detected', {
            filePath,
            expected: expectedChecksum,
            actual: actualChecksum
          });
        }
      }

      const isValid = invalidFiles === 0;
      this.logger?.info('File checksum validation completed', {
        validFiles,
        invalidFiles,
        isValid
      });

      return isValid;

    } catch (error) {
      this.logger?.error('Failed to validate file checksums', error as Error, {
        fileCount: filePaths.length,
        manifestPath
      });
      return false;
    }
  }

  async validateInstallationIntegrity(installDir: string): Promise<boolean> {
    this.logger?.info('Validating installation integrity', { installDir });

    try {
      const result = await this.checkFileIntegrity(installDir);
      const isValid = result.missing.length === 0 && result.modified.length === 0;
      
      this.logger?.info('Installation integrity validation completed', {
        installDir,
        missingFiles: result.missing.length,
        modifiedFiles: result.modified.length,
        isValid
      });

      return isValid;

    } catch (error) {
      this.logger?.error('Failed to validate installation integrity', error as Error, {
        installDir
      });
      return false;
    }
  }

  async generateChecksums(filePaths: string[]): Promise<Record<string, string>> {
    this.logger?.info('Generating checksums', { fileCount: filePaths.length });

    const checksums: Record<string, string> = {};
    let processedFiles = 0;

    try {
      for (const filePath of filePaths) {
        try {
          if (await this.fileSystem.exists(filePath)) {
            checksums[filePath] = await this.calculateFileChecksum(filePath);
            processedFiles++;
          } else {
            this.logger?.warn('File not found during checksum generation', { filePath });
          }
        } catch (error) {
          this.logger?.warn('Failed to generate checksum for file', {
            filePath,
            error: (error as Error).message
          });
        }
      }

      this.logger?.info('Checksum generation completed', {
        requestedFiles: filePaths.length,
        processedFiles,
        generatedChecksums: Object.keys(checksums).length
      });

      return checksums;

    } catch (error) {
      this.logger?.error('Failed to generate checksums', error as Error, {
        fileCount: filePaths.length
      });
      throw new Error(`Checksum generation failed: ${(error as Error).message}`);
    }
  }

  async checkFileIntegrity(
    installDir: string,
    manifest?: Record<string, unknown>,
    options: IntegrityCheckOptions = {}
  ): Promise<FileIntegrityResult> {
    this.logger?.info('Checking file integrity', { installDir });

    try {
      const expectedFiles = await this.getExpectedFiles(installDir, manifest);
      const actualFiles = await this.getActualFiles(installDir, options);
      
      const missing = this.findMissingFiles(expectedFiles, actualFiles);
      const modified = options.validateChecksums 
        ? await this.findModifiedFiles(installDir, expectedFiles, manifest)
        : [];

      const result: FileIntegrityResult = { missing, modified };

      this.logger?.info('File integrity check completed', {
        installDir,
        expectedFiles: expectedFiles.length,
        actualFiles: actualFiles.length,
        missingFiles: missing.length,
        modifiedFiles: modified.length
      });

      return result;

    } catch (error) {
      this.logger?.error('Failed to check file integrity', error as Error, { installDir });
      throw new Error(`File integrity check failed: ${(error as Error).message}`);
    }
  }

  async repairMissingFiles(
    installDir: string,
    missingFiles: string[],
    sourceDir?: string
  ): Promise<string[]> {
    this.logger?.info('Repairing missing files', {
      installDir,
      missingFileCount: missingFiles.length
    });

    const repairedFiles: string[] = [];
    const defaultSourceDir = sourceDir || this.getDefaultSourceDir();

    try {
      for (const missingFile of missingFiles) {
        try {
          const sourcePath = this.fileSystem.join(defaultSourceDir, missingFile);
          const targetPath = this.fileSystem.join(installDir, missingFile);

          if (await this.fileSystem.exists(sourcePath)) {
            await this.fileSystem.copyFile(sourcePath, targetPath);
            repairedFiles.push(missingFile);
            
            this.logger?.debug('Missing file repaired', {
              file: missingFile,
              sourcePath,
              targetPath
            });
          } else {
            this.logger?.warn('Source file not found for repair', {
              missingFile,
              sourcePath
            });
          }

        } catch (error) {
          this.logger?.error('Failed to repair missing file', error as Error, {
            missingFile
          });
        }
      }

      this.logger?.info('Missing file repair completed', {
        installDir,
        requestedFiles: missingFiles.length,
        repairedFiles: repairedFiles.length
      });

      return repairedFiles;

    } catch (error) {
      this.logger?.error('Failed to repair missing files', error as Error, {
        installDir,
        missingFileCount: missingFiles.length
      });
      throw new Error(`Missing file repair failed: ${(error as Error).message}`);
    }
  }

  private async getExpectedFiles(
    installDir: string,
    manifest?: Record<string, unknown>
  ): Promise<string[]> {
    if (manifest && manifest.files && Array.isArray(manifest.files)) {
      return manifest.files as string[];
    }

    // Fallback: scan current directory structure
    const files = await this.fileSystem.expandGlob(
      this.fileSystem.join(installDir, '**/*'),
      { absolute: false }
    );

    return files.filter((file: string) => !file.endsWith('/'));
  }

  private async getActualFiles(
    installDir: string,
    options: IntegrityCheckOptions
  ): Promise<string[]> {
    const pattern = this.fileSystem.join(installDir, '**/*');
    
    if (options.includePatterns && options.includePatterns.length > 0) {
      // Use include patterns if specified
      const allFiles: string[] = [];
      for (const includePattern of options.includePatterns) {
        const matchedFiles = await this.fileSystem.expandGlob(
          this.fileSystem.join(installDir, includePattern),
          { absolute: false }
        );
        allFiles.push(...matchedFiles);
      }
      return [...new Set(allFiles)].filter(file => !file.endsWith('/'));
    }

    const files = await this.fileSystem.expandGlob(pattern, { absolute: false });
    let filteredFiles = files.filter((file: string) => !file.endsWith('/'));

    // Apply exclude patterns
    if (options.excludePatterns && options.excludePatterns.length > 0) {
      filteredFiles = filteredFiles.filter((file: string) => 
        !options.excludePatterns!.some((pattern: string) => 
          file.includes(pattern) || file.match(pattern)
        )
      );
    }

    return filteredFiles;
  }

  private findMissingFiles(expectedFiles: string[], actualFiles: string[]): string[] {
    const actualFileSet = new Set(actualFiles);
    return expectedFiles.filter(file => !actualFileSet.has(file));
  }

  private async findModifiedFiles(
    installDir: string,
    expectedFiles: string[],
    manifest?: Record<string, unknown>
  ): Promise<string[]> {
    const modifiedFiles: string[] = [];
    
    if (!manifest || !manifest.integrity) {
      return modifiedFiles;
    }

    const checksums = manifest.integrity as Record<string, string>;

    for (const file of expectedFiles) {
      const expectedChecksum = checksums[file];
      if (!expectedChecksum) continue;

      try {
        const filePath = this.fileSystem.join(installDir, file);
        const actualChecksum = await this.calculateFileChecksum(filePath);
        
        if (actualChecksum !== expectedChecksum) {
          modifiedFiles.push(file);
        }
      } catch (error) {
        this.logger?.warn('Failed to check file checksum', {
          file,
          error: (error as Error).message
        });
        modifiedFiles.push(file); // Assume modified if can't verify
      }
    }

    return modifiedFiles;
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      // Simple checksum implementation using file content
      // In a real implementation, you'd use a proper hashing algorithm
      const content = await this.fileSystem.readFile(filePath);
      return this.simpleHash(content);
    } catch (error) {
      this.logger?.error('Failed to calculate file checksum', error as Error, { filePath });
      throw error;
    }
  }

  private async readManifestChecksums(manifestPath: string): Promise<Record<string, string> | null> {
    try {
      if (!await this.fileSystem.exists(manifestPath)) {
        return null;
      }

      const content = await this.fileSystem.readFile(manifestPath);
      const manifest = JSON.parse(content);
      
      return manifest.integrity || null;
    } catch (error) {
      this.logger?.error('Failed to read manifest checksums', error as Error, { manifestPath });
      return null;
    }
  }

  private simpleHash(content: string): string {
    // Simple hash function - in production, use a proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  private getDefaultSourceDir(): string {
    // This would return the default source directory for file repair
    return 'src'; // Placeholder
  }
}

// Export factory function
export function createIntegrityChecker(
  fileSystem: IFileService,
  logger?: ILogger
): IntegrityChecker {
  return new IntegrityChecker(fileSystem, logger);
}

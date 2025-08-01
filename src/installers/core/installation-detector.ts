/**
 * Installation Detector for BMAD-METHOD
 * Detects and analyzes existing installation states
 */

import { exists, join } from "deps";
import type { 
  InstallationState,
  FileIntegrityResult,
  IInstallationDetector,
  ILogger,
  IFileManager
} from 'deps';

export class InstallationDetector implements IInstallationDetector {
  private readonly manifestFileName = '.bmad-manifest.json';
  private readonly legacyManifestFiles = [
    '.bmad-install.json',
    'bmad-config.json',
    'installation.json'
  ];

  constructor(
    private fileSystem?: IFileManager,
    private logger?: ILogger
  ) {}

  async detectInstallationState(installDir: string): Promise<InstallationState> {
    this.logger?.info('Detecting installation state', { installDir });

    try {
      // Check if directory exists
      if (!await this.directoryExists(installDir)) {
        this.logger?.debug('Installation directory does not exist', { installDir });
        return { type: 'fresh' };
      }

      // Check for current v5 manifest
      const manifestPath = this.getManifestPath(installDir);
      if (await this.fileExists(manifestPath)) {
        return await this.analyzeV5Installation(installDir, manifestPath);
      }

      // Check for legacy installation files
      const legacyManifest = await this.findLegacyManifest(installDir);
      if (legacyManifest) {
        return await this.analyzeLegacyInstallation(installDir, legacyManifest);
      }

      // Check if directory has BMAD-related content but no manifest
      const hasContent = await this.hasExistingContent(installDir);
      if (hasContent) {
        this.logger?.info('Found existing content without manifest', { installDir });
        return {
          type: 'unknown_existing',
          expansionPacks: await this.detectExpansionPacks(installDir)
        };
      }

      // Empty or no relevant content
      this.logger?.debug('No existing installation detected', { installDir });
      return { type: 'fresh' };

    } catch (error) {
      this.logger?.error('Failed to detect installation state', error as Error, { installDir });
      
      // Return safe default
      return { 
        type: 'unknown_existing',
        expansionPacks: {}
      };
    }
  }

  async checkFileIntegrity(
    installDir: string, 
    manifest?: Record<string, unknown>
  ): Promise<FileIntegrityResult> {
    this.logger?.info('Checking file integrity', { installDir });

    try {
      if (!manifest) {
        // Try to load manifest
        const manifestPath = this.getManifestPath(installDir);
        if (await this.fileExists(manifestPath)) {
          const content = await this.readFile(manifestPath);
          manifest = JSON.parse(content);
        }
      }

      if (!manifest || !manifest.files) {
        this.logger?.warn('No manifest or file list available for integrity check', { installDir });
        return { missing: [], modified: [] };
      }

      const expectedFiles = manifest.files as string[];
      const missing: string[] = [];
      const modified: string[] = [];

      // Check each expected file
      for (const file of expectedFiles) {
        const filePath = this.joinPath(installDir, file);
        
        if (!await this.fileExists(filePath)) {
          missing.push(file);
          continue;
        }

        // Check if file has been modified (if checksums available)
        if (manifest.integrity && typeof manifest.integrity === 'object') {
          const checksums = manifest.integrity as Record<string, string>;
          const expectedChecksum = checksums[file];
          
          if (expectedChecksum) {
            const currentChecksum = await this.calculateSimpleChecksum(filePath);
            if (currentChecksum !== expectedChecksum) {
              modified.push(file);
            }
          }
        }
      }

      const result: FileIntegrityResult = { missing, modified };
      
      this.logger?.info('File integrity check completed', {
        installDir,
        totalFiles: expectedFiles.length,
        missingFiles: missing.length,
        modifiedFiles: modified.length
      });

      return result;

    } catch (error) {
      this.logger?.error('Failed to check file integrity', error as Error, { installDir });
      return { missing: [], modified: [] };
    }
  }

  compareVersions(version1: string, version2: string): number {
    try {
      // Handle unknown versions
      if (version1 === 'unknown' && version2 === 'unknown') return 0;
      if (version1 === 'unknown') return -1;
      if (version2 === 'unknown') return 1;

      // Parse semantic versions
      const v1Parts = version1.split('.').map(part => {
        const num = parseInt(part.replace(/[^\d]/g, ''), 10);
        return isNaN(num) ? 0 : num;
      });
      
      const v2Parts = version2.split('.').map(part => {
        const num = parseInt(part.replace(/[^\d]/g, ''), 10);
        return isNaN(num) ? 0 : num;
      });

      // Pad arrays to same length
      const maxLength = Math.max(v1Parts.length, v2Parts.length);
      while (v1Parts.length < maxLength) v1Parts.push(0);
      while (v2Parts.length < maxLength) v2Parts.push(0);

      // Compare each part
      for (let i = 0; i < maxLength; i++) {
        if (v1Parts[i]! < v2Parts[i]!) return -1;
        if (v1Parts[i]! > v2Parts[i]!) return 1;
      }

      return 0;

    } catch (error) {
      this.logger?.warn('Failed to compare versions', {
        version1,
        version2,
        error: (error as Error).message
      });
      return 0;
    }
  }

  // Private helper methods
  private async analyzeV5Installation(
    installDir: string, 
    manifestPath: string
  ): Promise<InstallationState> {
    try {
      const content = await this.readFile(manifestPath);
      const manifest = JSON.parse(content);

      this.logger?.debug('Analyzing v5 installation', {
        installDir,
        version: manifest.version,
        timestamp: manifest.timestamp
      });

      // Check file integrity
      const integrity = await this.checkFileIntegrity(installDir, manifest);

      return {
        type: 'v5_existing',
        manifest,
        expansionPacks: manifest.expansionPacks || {},
        integrity: integrity as unknown as Record<string, unknown>
      };

    } catch (error) {
      this.logger?.error('Failed to analyze v5 installation', error as Error, { installDir });
      return {
        type: 'unknown_existing',
        expansionPacks: await this.detectExpansionPacks(installDir)
      };
    }
  }

  private async analyzeLegacyInstallation(
    installDir: string,
    legacyManifestPath: string
  ): Promise<InstallationState> {
    try {
      const content = await this.readFile(legacyManifestPath);
      const legacyManifest = JSON.parse(content);

      this.logger?.debug('Analyzing legacy installation', {
        installDir,
        legacyManifestPath,
        version: legacyManifest.version
      });

      return {
        type: 'legacy_existing',
        manifest: {
          version: legacyManifest.version || 'legacy',
          legacy: true,
          originalManifest: legacyManifest
        },
        expansionPacks: await this.detectExpansionPacks(installDir)
      };

    } catch (error) {
      this.logger?.error('Failed to analyze legacy installation', error as Error, { installDir });
      return {
        type: 'unknown_existing',
        expansionPacks: await this.detectExpansionPacks(installDir)
      };
    }
  }

  private async findLegacyManifest(installDir: string): Promise<string | null> {
    for (const legacyFile of this.legacyManifestFiles) {
      const legacyPath = this.joinPath(installDir, legacyFile);
      if (await this.fileExists(legacyPath)) {
        this.logger?.debug('Found legacy manifest', { legacyPath });
        return legacyPath;
      }
    }
    return null;
  }

  private async hasExistingContent(installDir: string): Promise<boolean> {
    try {
      // Look for common BMAD directories and files
      const commonPaths = [
        'src',
        'extensions',
        'core',
        'bmad-core',
        '.bmad',
        'agents',
        'workflows',
        'templates'
      ];

      for (const path of commonPaths) {
        if (await this.fileExists(this.joinPath(installDir, path))) {
          return true;
        }
      }

      return false;

    } catch (error) {
      this.logger?.warn('Failed to check for existing content', {
        installDir,
        error: (error as Error).message
      });
      return false;
    }
  }

  private async detectExpansionPacks(installDir: string): Promise<Record<string, unknown>> {
    try {
      const extensionsDir = this.joinPath(installDir, 'extensions');
      
      if (!await this.directoryExists(extensionsDir)) {
        return {};
      }

      // This is a simplified detection - in practice would scan directories
      // and read pack manifests
      this.logger?.debug('Detecting expansion packs', { extensionsDir });
      
      // Placeholder implementation
      return {};

    } catch (error) {
      this.logger?.warn('Failed to detect expansion packs', {
        installDir,
        error: (error as Error).message
      });
      return {};
    }
  }

  private async calculateSimpleChecksum(filePath: string): Promise<string> {
    try {
      const content = await this.readFile(filePath);
      
      // Simple hash implementation
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return hash.toString(36);
    } catch (error) {
      this.logger?.error('Failed to calculate checksum', error as Error, { filePath });
      return 'error';
    }
  }

  // File system abstraction methods
  private async directoryExists(path: string): Promise<boolean> {
    if (this.fileSystem) {
      return await this.fileSystem.exists(path);
    }
    return await exists(path);
  }

  private async fileExists(path: string): Promise<boolean> {
    if (this.fileSystem) {
      return await this.fileSystem.exists(path);
    }
    return await exists(path);
  }

  private async readFile(path: string): Promise<string> {
    if (this.fileSystem) {
      return await this.fileSystem.readFile(path);
    }
    return await Deno.readTextFile(path);
  }

  private joinPath(...paths: string[]): string {
    // Use the imported join function directly since it's not an interface method
    if (paths.length === 0) return '';
    return join(paths[0]!, ...paths.slice(1));
  }

  private getManifestPath(installDir: string): string {
    return this.joinPath(installDir, this.manifestFileName);
  }
}

// Export factory function
export function createInstallationDetector(
  fileSystem?: IFileManager,
  logger?: ILogger
): InstallationDetector {
  return new InstallationDetector(fileSystem, logger);
}

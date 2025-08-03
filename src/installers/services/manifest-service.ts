/**
 * Manifest Service for BMAD-METHOD
 * Handles creation, reading, and updating of installation manifests
 */

import { expandGlob, join, safeExists } from "deps";
import type {
  IFileManager,
  ILogger,
  IManifestService,
  InstallationManifest,
} from "deps";

export class ManifestService implements IManifestService {
  private readonly manifestFileName = ".bmad-manifest.json";

  constructor(
    private fileSystem: IFileManager,
    private logger?: ILogger,
  ) {}

  async createInstallManifest(installDir: string): Promise<void> {
    const manifestPath = this.getManifestPath(installDir);

    this.logger?.info("Creating installation manifest", {
      installDir,
      manifestPath,
    });

    try {
      const manifest: InstallationManifest = {
        version: await this.getCoreVersion(),
        timestamp: new Date().toISOString(),
        coreVersion: await this.getCoreVersion(),
        expansionPacks: await this.detectInstalledExpansionPacks(installDir),
        files: await this.generateFileList(installDir),
        integrity: await this.generateIntegrityChecksums(installDir),
      };

      await this.fileSystem.writeFile(
        manifestPath,
        JSON.stringify(manifest, null, 2),
      );

      this.logger?.info("Installation manifest created successfully", {
        installDir,
        fileCount: manifest.files?.length || 0,
        expansionPackCount: Object.keys(manifest.expansionPacks || {}).length,
      });
    } catch (error) {
      this.logger?.error(
        "Failed to create installation manifest",
        error as Error,
        {
          installDir,
          manifestPath,
        },
      );
      throw new Error(`Manifest creation failed: ${(error as Error).message}`);
    }
  }

  async readInstallManifest(
    installDir: string,
  ): Promise<Record<string, unknown> | null> {
    const manifestPath = this.getManifestPath(installDir);

    this.logger?.debug("Reading installation manifest", {
      installDir,
      manifestPath,
    });

    try {
      if (!await safeExists(manifestPath)) {
        this.logger?.debug("Manifest file does not exist", { manifestPath });
        return null;
      }

      const content = await this.fileSystem.readFile(manifestPath);
      const manifest = JSON.parse(content);

      this.logger?.debug("Installation manifest read successfully", {
        installDir,
        version: manifest.version,
        timestamp: manifest.timestamp,
      });

      return manifest;
    } catch (error) {
      this.logger?.error(
        "Failed to read installation manifest",
        error as Error,
        {
          installDir,
          manifestPath,
        },
      );
      throw new Error(`Manifest reading failed: ${(error as Error).message}`);
    }
  }

  async updateInstallManifest(
    installDir: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    const manifestPath = this.getManifestPath(installDir);

    this.logger?.info("Updating installation manifest", {
      installDir,
      updates: Object.keys(updates),
    });

    try {
      let manifest = await this.readInstallManifest(installDir);

      if (!manifest) {
        this.logger?.warn("Manifest does not exist, creating new one");
        await this.createInstallManifest(installDir);
        manifest = await this.readInstallManifest(installDir);
      }

      if (!manifest) {
        throw new Error("Failed to create or read manifest");
      }

      // Merge updates into existing manifest
      const updatedManifest = {
        ...manifest,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      await this.fileSystem.writeFile(
        manifestPath,
        JSON.stringify(updatedManifest, null, 2),
      );

      this.logger?.info("Installation manifest updated successfully", {
        installDir,
        updateKeys: Object.keys(updates),
      });
    } catch (error) {
      this.logger?.error(
        "Failed to update installation manifest",
        error as Error,
        {
          installDir,
          updates,
        },
      );
      throw new Error(`Manifest update failed: ${(error as Error).message}`);
    }
  }

  async validateManifest(installDir: string): Promise<boolean> {
    this.logger?.info("Validating installation manifest", { installDir });

    try {
      const manifest = await this.readInstallManifest(installDir);

      if (!manifest) {
        this.logger?.warn(
          "Manifest validation failed: manifest does not exist",
          { installDir },
        );
        return false;
      }

      const isValid = this.isValidManifestStructure(manifest);

      if (isValid) {
        this.logger?.debug("Manifest validation passed", { installDir });
      } else {
        this.logger?.warn("Manifest validation failed: invalid structure", {
          installDir,
        });
      }

      return isValid;
    } catch (error) {
      this.logger?.error("Failed to validate manifest", error as Error, {
        installDir,
      });
      return false;
    }
  }

  async getManifestInfo(
    installDir: string,
  ): Promise<InstallationManifest | null> {
    const manifest = await this.readInstallManifest(installDir);
    return manifest as InstallationManifest | null;
  }

  private getManifestPath(installDir: string): string {
    return join(installDir, this.manifestFileName);
  }

  private getCoreVersion(): string {
    // This would get the version from a version service or config
    // For now, return a placeholder
    return "5.0.0"; // TODO: Get actual version from version service
  }

  private detectInstalledExpansionPacks(
    installDir: string,
  ): Record<string, unknown> {
    this.logger?.debug("Detecting installed expansion packs", { installDir });

    try {
      // This would delegate to expansion pack detection logic
      // For now, return empty object
      this.logger?.debug("Expansion pack detection placeholder");
      return {};
    } catch (error) {
      this.logger?.error("Failed to detect expansion packs", error as Error, {
        installDir,
      });
      return {};
    }
  }

  private async generateFileList(installDir: string): Promise<string[]> {
    this.logger?.debug("Generating file list for manifest", { installDir });

    try {
      // This would recursively scan the installation directory
      const fileEntries = expandGlob(
        join(installDir, "**/*"),
      );

      const files: string[] = [];
      for await (const entry of fileEntries) {
        files.push(entry.path);
      }

      // Filter out directories and the manifest file itself
      const filteredFiles = files.filter((file) =>
        !file.endsWith("/") &&
        !file.endsWith(this.manifestFileName)
      );

      this.logger?.debug("File list generated", {
        installDir,
        totalFiles: filteredFiles.length,
      });

      return filteredFiles;
    } catch (error) {
      this.logger?.error("Failed to generate file list", error as Error, {
        installDir,
      });
      return [];
    }
  }

  private generateIntegrityChecksums(
    installDir: string,
  ): Record<string, unknown> {
    this.logger?.debug("Generating integrity checksums", { installDir });

    try {
      // This would delegate to integrity checksum generation
      // For now, return empty object
      this.logger?.debug("Integrity checksum generation placeholder");
      return {};
    } catch (error) {
      this.logger?.error(
        "Failed to generate integrity checksums",
        error as Error,
        { installDir },
      );
      return {};
    }
  }

  private isValidManifestStructure(manifest: Record<string, unknown>): boolean {
    const requiredFields = ["version", "timestamp", "coreVersion"];

    return requiredFields.every((field) =>
      field in manifest && manifest[field] !== null &&
      manifest[field] !== undefined
    );
  }
}

// Export factory function
export function createManifestService(
  fileSystem: IFileManager,
  logger?: ILogger,
): ManifestService {
  return new ManifestService(fileSystem, logger);
}

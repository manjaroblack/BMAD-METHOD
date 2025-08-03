/**
 * Expansion Pack Service for BMAD-METHOD
 * Handles detection, installation, and management of expansion packs
 */

import { expandGlob, join, ProjectPaths, safeExists } from "deps";
import type { ExpansionPack, ExpansionPackInfo, ExpansionPackInstallResult, ExpansionPackManifest, ExpansionPackStatus, IExpansionPackService, IFileService, ILogger, InstallConfig } from "deps";

export class ExpansionPackService implements IExpansionPackService {
  private readonly expansionPacksDir = "extensions";
  private readonly packManifestFile = "pack-manifest.json";

  constructor(
    private fileSystem: IFileService,
    private logger?: ILogger,
  ) {}

  async getAvailableExpansionPacks(): Promise<ExpansionPack[]> {
    this.logger?.info("Getting available expansion packs");

    try {
      // This would scan the source directory for available expansion packs
      // For now, return a placeholder list
      const availablePacks: ExpansionPack[] = [
        {
          id: "development-tools",
          shortTitle: "Development Tools",
          version: "1.0.0",
          description: "Essential development tools and utilities",
          dependencies: [],
        },
        {
          id: "ui-components",
          shortTitle: "UI Components",
          version: "1.2.0",
          description: "Pre-built UI components and templates",
          dependencies: ["development-tools"],
        },
      ];

      this.logger?.info("Available expansion packs retrieved", {
        count: availablePacks.length,
        packs: availablePacks.map((p) => p.id),
      });

      return await Promise.resolve(availablePacks);
    } catch (error) {
      this.logger?.error(
        "Failed to get available expansion packs",
        error as Error,
      );
      throw new Error(
        `Failed to retrieve expansion packs: ${(error as Error).message}`,
      );
    }
  }

  async installExpansionPacks(
    installDir: string,
    selectedPacks: string[],
    config: InstallConfig = {},
  ): Promise<string[]> {
    this.logger?.info("Installing expansion packs", {
      installDir,
      selectedPacks,
      count: selectedPacks.length,
    });

    const installedPacks: string[] = [];
    const availablePacks = await this.getAvailableExpansionPacks();

    for (const packId of selectedPacks) {
      try {
        const pack = availablePacks.find((p) => p.id === packId);
        if (!pack) {
          this.logger?.warn("Expansion pack not found", { packId });
          continue;
        }

        const result = await this.installSingleExpansionPack(
          installDir,
          pack,
          config,
        );
        if (result.success) {
          installedPacks.push(packId);
          this.logger?.info("Expansion pack installed successfully", {
            packId,
            version: result.version,
            filesInstalled: result.installedFiles.length,
          });
        } else {
          this.logger?.error("Expansion pack installation failed", undefined, {
            packId,
            errors: result.errors,
          });
        }
      } catch (error) {
        this.logger?.error("Failed to install expansion pack", error as Error, {
          packId,
        });
      }
    }

    this.logger?.info("Expansion pack installation completed", {
      installDir,
      requestedCount: selectedPacks.length,
      installedCount: installedPacks.length,
      installedPacks,
    });

    return installedPacks;
  }

  async detectExpansionPacks(
    installDir: string,
  ): Promise<Record<string, unknown>> {
    this.logger?.info("Detecting installed expansion packs", { installDir });

    try {
      const packsDir = join(installDir, this.expansionPacksDir);

      if (!await safeExists(packsDir)) {
        this.logger?.debug("Expansion packs directory does not exist", {
          packsDir,
        });
        return {};
      }

      const installedPacks: Record<string, unknown> = {};
      const packEntries = expandGlob(
        join(packsDir, "*"),
      );

      const packDirs: string[] = [];
      for await (const entry of packEntries) {
        if (entry.isDirectory) {
          packDirs.push(entry.name);
        }
      }

      for (const packDir of packDirs) {
        try {
          const packInfo = await this.readExpansionPackInfo(
            join(packsDir, packDir),
          );

          if (packInfo) {
            installedPacks[packDir] = packInfo;
          }
        } catch (error) {
          this.logger?.warn("Failed to read expansion pack info", {
            packDir,
            error: (error as Error).message,
          });
        }
      }

      this.logger?.info("Expansion pack detection completed", {
        installDir,
        detectedCount: Object.keys(installedPacks).length,
        packs: Object.keys(installedPacks),
      });

      return installedPacks;
    } catch (error) {
      this.logger?.error("Failed to detect expansion packs", error as Error, {
        installDir,
      });
      return {};
    }
  }

  async updateExpansionPacks(
    installDir: string,
    packIds: string[],
  ): Promise<string[]> {
    this.logger?.info("Updating expansion packs", {
      installDir,
      packIds,
      count: packIds.length,
    });

    const updatedPacks: string[] = [];
    const availablePacks = await this.getAvailableExpansionPacks();
    const installedPacks = await this.detectExpansionPacks(installDir);

    for (const packId of packIds) {
      try {
        const availablePack = availablePacks.find((p) => p.id === packId);
        const installedPack = installedPacks[packId] as ExpansionPackInfo;

        if (!availablePack) {
          this.logger?.warn("Available expansion pack not found for update", {
            packId,
          });
          continue;
        }

        if (!installedPack) {
          this.logger?.warn("Installed expansion pack not found for update", {
            packId,
          });
          continue;
        }

        const needsUpdate = this.compareVersions(
          installedPack.version || "0.0.0",
          availablePack.version,
        ) < 0;

        if (needsUpdate) {
          await this.updateSingleExpansionPack(installDir, availablePack);
          updatedPacks.push(packId);

          this.logger?.info("Expansion pack updated successfully", {
            packId,
            fromVersion: installedPack.version,
            toVersion: availablePack.version,
          });
        } else {
          this.logger?.debug("Expansion pack is already up to date", {
            packId,
            version: availablePack.version,
          });
        }
      } catch (error) {
        this.logger?.error("Failed to update expansion pack", error as Error, {
          packId,
        });
      }
    }

    this.logger?.info("Expansion pack updates completed", {
      installDir,
      requestedCount: packIds.length,
      updatedCount: updatedPacks.length,
      updatedPacks,
    });

    return updatedPacks;
  }

  async getExpansionPackStatus(
    installDir: string,
    packId: string,
  ): Promise<ExpansionPackStatus> {
    try {
      const availablePacks = await this.getAvailableExpansionPacks();
      const installedPacks = await this.detectExpansionPacks(installDir);

      const availablePack = availablePacks.find((p) => p.id === packId);
      const installedPack = installedPacks[packId] as ExpansionPackInfo;

      if (!availablePack) {
        return "available"; // Not available in current version
      }

      if (!installedPack) {
        return "available";
      }

      const versionCompare = this.compareVersions(
        installedPack.version || "0.0.0",
        availablePack.version,
      );

      if (versionCompare < 0) {
        return "outdated";
      }

      // Check dependencies
      if (availablePack.dependencies && availablePack.dependencies.length > 0) {
        const missingDeps = await this.checkMissingDependencies(
          installDir,
          availablePack.dependencies,
        );

        if (missingDeps.length > 0) {
          return "missing-dependencies";
        }
      }

      return "installed";
    } catch (error) {
      this.logger?.error(
        "Failed to get expansion pack status",
        error as Error,
        { packId },
      );
      return "corrupted";
    }
  }

  private async installSingleExpansionPack(
    installDir: string,
    pack: ExpansionPack,
    _config: InstallConfig,
  ): Promise<ExpansionPackInstallResult> {
    const targetDir = join(installDir, this.expansionPacksDir, pack.id);

    try {
      // Ensure target directory exists
      await this.fileSystem.ensureDirectory(targetDir);

      // Copy expansion pack files (placeholder logic)
      const sourceDir = this.getExpansionPackSourceDir(pack.id);
      if (await safeExists(sourceDir)) {
        await this.fileSystem.copyDirectory(sourceDir, targetDir);
      }

      // Create pack manifest
      const manifest: ExpansionPackManifest = {
        id: pack.id,
        version: pack.version,
        shortTitle: pack.shortTitle,
        description: pack.description,
        dependencies: pack.dependencies,
        installPath: targetDir,
        timestamp: new Date().toISOString(),
      };

      await this.fileSystem.writeFile(
        this.fileSystem.join(targetDir, this.packManifestFile),
        JSON.stringify(manifest, null, 2),
      );

      // Get list of installed files
      const installedFiles = await this.fileSystem.expandGlob(
        this.fileSystem.join(targetDir, "**/*"),
        { absolute: false },
      );

      return {
        success: true,
        packId: pack.id,
        version: pack.version,
        installedFiles: installedFiles.filter((file: string) =>
          !file.endsWith("/")
        ),
      };
    } catch (error) {
      return {
        success: false,
        packId: pack.id,
        version: pack.version,
        installedFiles: [],
        errors: [(error as Error).message],
      };
    }
  }

  private async updateSingleExpansionPack(
    installDir: string,
    pack: ExpansionPack,
  ): Promise<void> {
    // Remove old version
    const targetDir = this.fileSystem.join(
      installDir,
      this.expansionPacksDir,
      pack.id,
    );
    if (await safeExists(targetDir)) {
      await this.fileSystem.remove(targetDir);
    }

    // Install new version
    await this.installSingleExpansionPack(installDir, pack, {});
  }

  private async readExpansionPackInfo(
    packDir: string,
  ): Promise<ExpansionPackInfo | null> {
    const manifestPath = this.fileSystem.join(packDir, this.packManifestFile);

    if (!await safeExists(manifestPath)) {
      return null;
    }

    try {
      const content = await this.fileSystem.readFile(manifestPath);
      const manifest = JSON.parse(content) as ExpansionPackManifest;

      return {
        manifest: {
          version: manifest.version,
          shortTitle: manifest.shortTitle,
        },
        version: manifest.version,
        shortTitle: manifest.shortTitle,
      };
    } catch (error) {
      this.logger?.warn("Failed to parse expansion pack manifest", {
        packDir,
        error: (error as Error).message,
      });
      return null;
    }
  }

  private async checkMissingDependencies(
    installDir: string,
    dependencies: string[],
  ): Promise<string[]> {
    const installedPacks = await this.detectExpansionPacks(installDir);
    const installedPackIds = Object.keys(installedPacks);

    return dependencies.filter((dep) => !installedPackIds.includes(dep));
  }

  private getExpansionPackSourceDir(packId: string): string {
    // This would return the source directory for the expansion pack
    // For now, return a placeholder path
    return this.fileSystem.join(ProjectPaths.extensions, packId);
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }
}

// Export factory function
export function createExpansionPackService(
  fileSystem: IFileService,
  logger?: ILogger,
): ExpansionPackService {
  return new ExpansionPackService(fileSystem, logger);
}

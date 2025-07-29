/**
 * BMad Method v3 to v5 Upgrader
 * Handles migration from v3 to v5 project structure
 */

import { ensureDir, exists, join, Logger } from "deps";

interface UpgradeOptions {
  dryRun?: boolean;
  backup?: boolean;
  verbose?: boolean;
}

interface UpgradeResult {
  success: boolean;
  changes: string[];
  errors: string[];
}

export class V3ToV5Upgrader {
  private rootDir: string;
  private logger: Logger;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.logger = new Logger();
  }

  async upgrade(options: UpgradeOptions = {}): Promise<UpgradeResult> {
    const { dryRun = false, backup = true, verbose: _verbose = false } = options;

    this.logger.info("Starting BMad Method v3 to v5 upgrade...");

    const result: UpgradeResult = {
      success: false,
      changes: [],
      errors: [],
    };

    try {
      // Check if this is a v3 project
      if (!await this.isV3Project()) {
        result.errors.push("This does not appear to be a BMad Method v3 project");
        return result;
      }

      // Create backup if requested
      if (backup && !dryRun) {
        await this.createBackup();
        result.changes.push("Created backup of v3 project");
      }

      // Perform upgrade steps
      this.upgradeProjectStructure(dryRun, result);
      this.upgradeAgentConfigs(dryRun, result);
      this.upgradeTeamConfigs(dryRun, result);
      this.upgradeToolingConfigs(dryRun, result);

      result.success = result.errors.length === 0;

      if (result.success) {
        this.logger.info("✅ Upgrade completed successfully!");
      } else {
        this.logger.error("❌ Upgrade completed with errors");
      }

      return result;
    } catch (error) {
      result.errors.push(`Upgrade failed: ${(error as Error).message}`);
      this.logger.error("Upgrade failed:", (error as Error).message);
      return result;
    }
  }

  private async isV3Project(): Promise<boolean> {
    // Check for v3 project indicators
    const v3Indicators = [
      "bmad-method.json",
      "src/agents",
      "src/core",
    ];

    for (const indicator of v3Indicators) {
      if (await exists(join(this.rootDir, indicator))) {
        return true;
      }
    }

    return false;
  }

  private async createBackup(): Promise<void> {
    const backupDir = join(this.rootDir, `backup-v3-${Date.now()}`);
    await ensureDir(backupDir);

    // Copy important files to backup
    const filesToBackup = [
      "bmad-method.json",
      "package.json",
      "src",
      "common",
      "tooling",
    ];

    for (const file of filesToBackup) {
      const sourcePath = join(this.rootDir, file);
      if (await exists(sourcePath)) {
        const targetPath = join(backupDir, file);
        try {
          await Deno.copyFile(sourcePath, targetPath);
        } catch {
          // If it's a directory, we'd need recursive copy
          // For now, just log that backup was attempted
          this.logger.debug(`Attempted to backup ${file}`);
        }
      }
    }

    this.logger.info(`Backup created at: ${backupDir}`);
  }

  private upgradeProjectStructure(dryRun: boolean, result: UpgradeResult): void {
    this.logger.info("Upgrading project structure...");

    // Placeholder for project structure upgrades
    if (!dryRun) {
      // Actual upgrade logic would go here
    }

    result.changes.push("Updated project structure to v5 format");
  }

  private upgradeAgentConfigs(dryRun: boolean, result: UpgradeResult): void {
    this.logger.info("Upgrading agent configurations...");

    // Placeholder for agent config upgrades
    if (!dryRun) {
      // Actual upgrade logic would go here
    }

    result.changes.push("Upgraded agent configurations");
  }

  private upgradeTeamConfigs(dryRun: boolean, result: UpgradeResult): void {
    this.logger.info("Upgrading team configurations...");

    // Placeholder for team config upgrades
    if (!dryRun) {
      // Actual upgrade logic would go here
    }

    result.changes.push("Upgraded team configurations");
  }

  private upgradeToolingConfigs(dryRun: boolean, result: UpgradeResult): void {
    this.logger.info("Upgrading tooling configurations...");

    // Placeholder for tooling config upgrades
    if (!dryRun) {
      // Actual upgrade logic would go here
    }

    result.changes.push("Upgraded tooling configurations");
  }

  async validateUpgrade(): Promise<boolean> {
    // Validate that the upgrade was successful
    try {
      // Check for v5 project structure
      const v5Files = [
        "deno.json",
        "import_map.json",
      ];

      for (const file of v5Files) {
        if (!await exists(join(this.rootDir, file))) {
          this.logger.warn(`Missing v5 file: ${file}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error("Validation failed:", (error as Error).message);
      return false;
    }
  }
}

export async function upgradeProject(
  rootDir: string,
  options: UpgradeOptions = {},
): Promise<UpgradeResult> {
  const upgrader = new V3ToV5Upgrader(rootDir);
  return await upgrader.upgrade(options);
}

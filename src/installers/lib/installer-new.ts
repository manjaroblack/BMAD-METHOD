/**
 * Simplified Installer Entry Point for BMAD-METHOD
 * Uses the new modular architecture with orchestrator pattern
 *
 * This replaces the original monolithic installer.ts (1,057 lines)
 * with a clean, maintainable entry point (~100 lines)
 */

import { 
  cyan, 
  red, 
  yellow,
  CorruptedInstallationError,
  createInstallerOrchestrator,
  createSpinner,
  DependencyResolutionError,
  DirectoryNotFoundError,
  InstallationError,
  InstallationTimeoutError,
  InstallerOrchestrator,
  InsufficientPermissionsError,
  IntegrityCheckFailedError,
  logger,
  performanceMonitor,
  UnsupportedVersionError,
  ConfigValidationError,
  InvalidValueError,
  RequiredFieldMissingError,
  ValidationError,
} from "deps";
import type { InstallConfig } from "deps";

/**
 * Main Installer class - simplified and modular
 * Delegates all work to the orchestrator while maintaining the same public API
 */
class Installer {
  private orchestrator: InstallerOrchestrator;

  constructor() {
    // Initialize orchestrator with proper dependencies
    this.orchestrator = createInstallerOrchestrator({
      logger,
      spinner: createSpinner("Installing..."),
      performanceMonitor,
      // Services will be auto-created by orchestrator with proper dependencies
    });

    logger.info("Modular installer initialized", {
      version: this.getCoreVersion(),
      architecture: "modular-orchestrator",
    });
  }

  /**
   * Main installation method - delegates to orchestrator
   */
  async install(config: InstallConfig): Promise<void> {
    try {
      this.validateConfig(config);
      await this.orchestrator.install(config);
    } catch (error) {
      this.handleInstallationError(error as Error, config);
      throw error;
    }
  }

  /**
   * Update existing installation
   */
  async update(options: Record<string, unknown> = {}): Promise<void> {
    try {
      await this.orchestrator.update(options);
    } catch (error) {
      this.handleUpdateError(error as Error, options);
      throw error;
    }
  }

  /**
   * Get installation status
   */
  async getInstallationStatus(
    directory: string,
  ): Promise<Record<string, unknown>> {
    try {
      return await this.orchestrator.getInstallationStatus(directory);
    } catch (error) {
      logger.error("Failed to get installation status", error as Error, {
        directory,
      });
      throw new InstallationError(
        `Failed to get installation status: ${(error as Error).message}`,
        "STATUS_CHECK_FAILED",
        { directory },
      );
    }
  }

  /**
   * Find existing installation
   */
  async findInstallation(): Promise<string | null> {
    try {
      return await this.orchestrator.findInstallation();
    } catch (error) {
      logger.error("Failed to find installation", error as Error);
      return null;
    }
  }

  /**
   * Get core version
   */
  getCoreVersion(): string {
    // This would be read from a version file or config
    return "5.0.0";
  }

  /**
   * Flattening operation for compatibility
   */
  flatten(options: Record<string, unknown>): void {
    try {
      logger.info("Starting flatten operation", { options });

      // This would delegate to a specialized flattening service
      // For now, provide a placeholder implementation
      console.log(cyan("🔄 Flattening operation..."));
      console.log(
        yellow(
          "⚠️  Flatten operation not yet implemented in modular architecture",
        ),
      );
      console.log("   This feature will be available in the next iteration");

      logger.warn("Flatten operation not yet implemented");
    } catch (error) {
      logger.error("Failed to flatten", error as Error, { options });
      throw new InstallationError(
        `Flatten operation failed: ${(error as Error).message}`,
        "FLATTEN_FAILED",
        { options },
      );
    }
  }

  // Private helper methods for error handling and validation
  private validateConfig(config: InstallConfig): void {
    if (!config.directory) {
      throw new RequiredFieldMissingError("directory");
    }

    if (config.selectedPacks && !Array.isArray(config.selectedPacks)) {
      throw new InvalidValueError(
        "selectedPacks",
        config.selectedPacks,
        "array",
      );
    }

    if (config.ides && !Array.isArray(config.ides)) {
      throw new InvalidValueError("ides", config.ides, "array");
    }

    logger.debug("Configuration validated successfully", {
      directory: config.directory,
      packsCount: config.selectedPacks?.length || 0,
      idesCount: config.ides?.length || 0,
    });
  }

  private handleInstallationError(error: Error, config: InstallConfig): void {
    // Enhanced error handling with specific error types
    if (error instanceof ValidationError) {
      logger.error("Configuration validation failed", error, { config });
      console.log(red(`❌ Configuration Error: ${error.message}`));
      return;
    }

    if (error instanceof InstallationError) {
      logger.error("Installation error occurred", error, {
        config,
        errorCode: (error as Error & { code?: string }).code,
      });
      console.log(
        red(`❌ Installation Error [${(error as Error & { code?: string }).code}]: ${error.message}`),
      );
      return;
    }

    // Handle specific error patterns
    if (
      error.message.includes("ENOENT") || error.message.includes("not found")
    ) {
      const dirError = new DirectoryNotFoundError(
        config.directory || "unknown",
      );
      logger.error("Directory not found", dirError, { config });
      console.log(red(`❌ ${dirError.message}`));
      return;
    }

    if (
      error.message.includes("EACCES") || error.message.includes("permission")
    ) {
      const permError = new InsufficientPermissionsError(
        config.directory || "unknown",
      );
      logger.error("Permission denied", permError, { config });
      console.log(red(`❌ ${permError.message}`));
      return;
    }

    // Generic error handling
    logger.error("Unexpected installation error", error, { config });
    console.log(red(`❌ Installation failed: ${error.message}`));
  }

  private handleUpdateError(
    error: Error,
    options: Record<string, unknown>,
  ): void {
    if (error instanceof InstallationError) {
      logger.error("Update error occurred", error, {
        options,
        errorCode: (error as Error & { code?: string }).code,
      });
      console.log(red(`❌ Update Error [${(error as Error & { code?: string }).code}]: ${error.message}`));
      return;
    }

    logger.error("Unexpected update error", error, { options });
    console.log(red(`❌ Update failed: ${error.message}`));
  }
}

// Export singleton instance to maintain compatibility with existing code
const installer = new Installer();
export default installer;

// Also export the class for testing and advanced usage
export { Installer };

// Export types for external use
export type { InstallConfig };

// Export error types for consumers
export {
  ConfigValidationError,
  CorruptedInstallationError,
  DependencyResolutionError,
  DirectoryNotFoundError,
  InstallationError,
  InstallationTimeoutError,
  InsufficientPermissionsError,
  IntegrityCheckFailedError,
  InvalidValueError,
  RequiredFieldMissingError,
  UnsupportedVersionError,
  ValidationError,
};

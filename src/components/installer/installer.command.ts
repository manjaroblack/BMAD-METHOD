import type { ICommand } from "../../core/commands/ICommand.ts";
import type { IInstallerService } from "./interfaces/IInstallerService.ts";
import type { InstallConfig } from "deps";
import { ServiceError } from "../../core/errors/ServiceError.ts";
import { InstallationError } from "../../core/errors/InstallationError.ts";

export class InstallerCommand implements ICommand {
  name = "install";
  description = "Install the BMad framework and expansion packs";

  constructor(
    private readonly installerService: IInstallerService,
  ) {}

  async execute(config: InstallConfig): Promise<void> {
    try {
      // If no directory is provided, use prompt handler to get it
      if (!config.directory) {
        console.log("No directory specified, starting interactive installation...");
        await this.installerService.promptHandler.promptInstallation();
        return; // The prompt handler will handle the actual installation
      }

      console.log(`Installing BMad framework to ${config.directory}`);

      // Install the framework
      await this.installerService.install(config);

      console.log("Installation completed successfully");
    } catch (error) {
      // Re-throw specific errors directly
      if (error instanceof InstallationError) {
        throw error;
      }
      
      // Re-throw ServiceError instances
      if (error instanceof ServiceError) {
        throw error;
      }
      
      // Wrap other errors in a ServiceError
      throw new ServiceError(
        `Failed to execute install command: ${(error as Error).message}`,
        "INSTALL_COMMAND_ERROR",
        error as Error | undefined,
      );
    }
  }

  async update(config: InstallConfig): Promise<void> {
    try {
      if (!config.directory) {
        throw new Error("Installation directory is required");
      }

      console.log(`Updating BMad framework in ${config.directory}`);

      // Update the framework
      await this.installerService.update(config);

      console.log("Update completed successfully");
    } catch (error) {
      // Re-throw specific errors directly
      if (error instanceof InstallationError) {
        throw error;
      }
      
      // Re-throw ServiceError instances
      if (error instanceof ServiceError) {
        throw error;
      }
      
      // Wrap other errors in a ServiceError
      throw new ServiceError(
        `Failed to execute update command: ${(error as Error).message}`,
        "UPDATE_COMMAND_ERROR",
        error as Error | undefined,
      );
    }
  }

  async repair(config: InstallConfig): Promise<void> {
    try {
      if (!config.directory) {
        throw new Error("Installation directory is required");
      }

      console.log(`Repairing BMad framework in ${config.directory}`);

      // Repair the framework
      await this.installerService.repair(config);

      console.log("Repair completed successfully");
    } catch (error) {
      // Re-throw specific errors directly
      if (error instanceof InstallationError) {
        throw error;
      }
      
      // Re-throw ServiceError instances
      if (error instanceof ServiceError) {
        throw error;
      }
      
      // Wrap other errors in a ServiceError
      throw new ServiceError(
        `Failed to execute repair command: ${(error as Error).message}`,
        "REPAIR_COMMAND_ERROR",
        error as Error | undefined,
      );
    }
  }
}

import type { IInstallerService } from "../interfaces/IInstallerService.ts";
import type { InstallConfig, IFileManager, ILogger, ICoreInstaller, IInstallerValidator, IIdeSetup, IConfigLoader, IResourceLocator, IPromptHandler } from "deps";
import type { ISpinner } from "../../../shared/services/core/spinner.service.ts";
import { InstallationError } from "../../../core/errors/InstallationError.ts";
import { ServiceError } from "../../../core/errors/ServiceError.ts";

export class InstallerService implements IInstallerService {
  constructor(
    private readonly fileManager: IFileManager,
    private readonly logger: ILogger,
    private readonly coreInstaller: ICoreInstaller,
    private readonly installerValidator: IInstallerValidator,
    private readonly ideSetup: IIdeSetup,
    private readonly configLoader: IConfigLoader,
    private readonly resourceLocator: IResourceLocator,
    public readonly promptHandler: IPromptHandler,
  ) {}

  async install(config: InstallConfig): Promise<void> {
    try {
      if (!config.directory) {
        throw new Error("Installation directory is required");
      }

      this.logger.info(`🚀 Installing to: ${config.directory}`);

      // Create a proper spinner
      // Note: In a real implementation, we would use a proper spinner
      const spinner: ISpinner = {
        text: "",
        start: () => {},
        stop: () => {},
        succeed: () => {},
        fail: () => {},
        info: () => {},
        warn: () => {},
        update: () => {}
      };

      try {
        spinner.start();

        // Detect existing installation state
        const state = await this.installerValidator.detectInstallationState(config.directory);

        if (state.type === "fresh") {
          await this.performFreshInstall(config, config.directory, spinner);
        } else if (state.type === "v5_existing") {
          // Handle existing v5 installation
          this.logger.info("\n🔍 Found existing BMad v5 installation");
          spinner.start();
        } else {
          await this.handleUnknownInstallation(config, config.directory, state, spinner);
        }

        // Setup IDE configurations
        if (config.ides && config.ides.length > 0) {
          await this.ideSetup.setupIdeConfigurations(config.directory, config.ides, spinner);
        }

        this.logger.info("Installation completed successfully!");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Installation failed: ${errorMessage}`);
        throw error;
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new InstallationError(
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

      this.logger.info(`Updating installation in directory: ${config.directory}`);

      // In a real implementation, we would:
      // 1. Check for updates
      // 2. Apply updates
      const spinner: ISpinner = {
        text: "Updating BMad core...",
        start: () => {},
        stop: () => {},
        succeed: () => {},
        fail: () => {},
        info: () => {},
        warn: () => {},
        update: () => {}
      };
      await this.coreInstaller.updateCore(config.directory, spinner);

      this.logger.info("Update completed successfully");
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new InstallationError(
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

      this.logger.info(`Repairing installation in directory: ${config.directory}`);

      // In a real implementation, we would:
      // 1. Validate installation integrity
      // 2. Repair missing or corrupted files
      
      // For now, just reinstall core to fix missing files
      const spinner: ISpinner = {
        text: "Repairing installation...",
        start: () => {},
        stop: () => {},
        succeed: () => {},
        fail: () => {},
        info: () => {},
        warn: () => {},
        update: () => {}
      };
      await this.coreInstaller.performRepair(
        config.directory,
        undefined,
        { missing: [], modified: [] },
        spinner
      );

      this.logger.info("Repair completed successfully");
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new InstallationError(
        `Failed to execute repair command: ${(error as Error).message}`,
        "REPAIR_COMMAND_ERROR",
        error as Error | undefined,
      );
    }
  }

  /**
   * Perform a fresh installation
   */
  private async performFreshInstall(
    config: InstallConfig,
    installDir: string,
    spinner: ISpinner,
  ): Promise<void> {
    console.log(`Performing fresh installation to: ${installDir}`);
    console.log(`Config: ${JSON.stringify(config)}`);
    spinner.start();
    spinner.text = "Performing fresh installation...";

    // Ensure install directory exists
    await this.fileManager.ensureDir(installDir);

    // For fresh installations, install core by default if no specific packs are selected
    // or if core is explicitly selected, or if full installation is requested
    const shouldInstallCore = !config.selectedPacks || 
                             config.selectedPacks.includes(".bmad-core") || 
                             config.full;
    
    if (shouldInstallCore) {
      console.log("Installing core...");
      await this.coreInstaller.installCore(installDir, spinner);
    } else {
      console.log("Skipping core installation - not selected");
    }

    // Install expansion packs if selected
    const expansionPacks = config.selectedPacks?.filter((pack) => pack !== ".bmad-core") || [];
    if (expansionPacks.length > 0) {
      console.log(`Installing expansion packs: ${expansionPacks.join(", ")}`);
      await this.installExpansionPacks(installDir, expansionPacks, spinner, config);
    } else {
      console.log("No expansion packs to install");
    }
  }

  /**
   * Handle an unknown installation
   */
  private async handleUnknownInstallation(
    config: InstallConfig,
    installDir: string,
    _state: { type: string; manifest?: Record<string, unknown>; expansionPacks?: Record<string, unknown>; integrity?: Record<string, unknown> },
    spinner: ISpinner,
  ): Promise<void> {
    // TODO: Implement unknown installation handling
    spinner.text = "Handling unknown installation...";
    await this.performFreshInstall(config, installDir, spinner);
  }

  /**
   * Handle an existing v5 installation
   */
  private handleExistingV5Installation(
    _config: InstallConfig,
    _installDir: string,
    _state: { type: string; manifest?: Record<string, unknown>; expansionPacks?: Record<string, unknown>; integrity?: Record<string, unknown> },
    spinner: ISpinner,
  ): void {
    spinner.stop();
    this.logger.info("\n🔍 Found existing BMad v5 installation");
    spinner.start();
  }

  /**
   * Install the core BMad system
   */
  private async installCore(installDir: string, spinner: ISpinner): Promise<void> {
    spinner.text = "Installing BMad core...";
    await this.coreInstaller.installCore(installDir, spinner);
  }

  /**
   * Install expansion packs
   */
  private async installExpansionPacks(
    _installDir: string,
    selectedPacks: string[],
    spinner: ISpinner,
    _config: InstallConfig = {},
  ): Promise<string[]> {
    spinner.text = `Installing ${selectedPacks.length} expansion packs...`;
    
    // Load available expansion packs
    const availablePacks = await this.configLoader.getAvailableExpansionPacks();
    
    // Filter to only the selected packs
    const packsToInstall = availablePacks.filter(pack => 
      selectedPacks.includes(pack.id)
    );
    
    // Install each pack
    const installedPacks: string[] = [];
    for (const pack of packsToInstall) {
      try {
        spinner.text = `Installing expansion pack: ${pack.shortTitle}...`;
        // TODO: Implement actual expansion pack installation
        await new Promise((resolve) => setTimeout(resolve, 50));
        installedPacks.push(pack.id);
      } catch (error) {
        this.logger.error(`Failed to install expansion pack ${pack.id}: ${error}`);
        // Continue with other packs
      }
    }
    
    return installedPacks;
  }

  /**
   * Setup IDE configurations
   */
  private async setupIdeConfigurations(
    installDir: string,
    ides: string[],
    spinner: ISpinner,
  ): Promise<void> {
    spinner.text = `Setting up ${ides.length} IDE configurations...`;
    await this.ideSetup.setupIdeConfigurations(installDir, ides, spinner);
  }
}

// Factory function for DI container
export function createInstallerService(
  fileManager: IFileManager,
  logger: ILogger,
  coreInstaller: ICoreInstaller,
  installerValidator: IInstallerValidator,
  ideSetup: IIdeSetup,
  configLoader: IConfigLoader,
  resourceLocator: IResourceLocator,
  promptHandler: IPromptHandler,
): IInstallerService {
  return new InstallerService(
    fileManager,
    logger,
    coreInstaller,
    installerValidator,
    ideSetup,
    configLoader,
    resourceLocator,
    promptHandler,
  );
}

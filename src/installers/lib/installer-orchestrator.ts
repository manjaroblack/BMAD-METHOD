import { createSpinner, cyan, yellow } from "deps";

import type {
  IConfigLoader,
  IFileManager,
  IIdeSetup,
  IInstallerValidator,
  ILogger,
  IPromptHandler,
  IResourceLocator,
  ISpinner,
} from "deps";

/**
 * Interface for installation configuration
 */
export interface IInstallConfig {
  directory?: string;
  selectedPacks?: string[];
  ides?: string[];
  full?: boolean;
  expansionOnly?: boolean;
  expansionPacks?: string[];
}

/**
 * Interface for installation state
 */
export interface IInstallationState {
  type: string;
  manifest?: Record<string, unknown>;
  expansionPacks?: Record<string, unknown>;
  integrity?: Record<string, unknown>;
}

/**
 * Orchestrator for coordinating the installation process
 */
export class InstallerOrchestrator {
  constructor(
    private readonly logger: ILogger,
    private readonly fileManager: IFileManager,
    private readonly ideSetup: IIdeSetup,
    private readonly configLoader: IConfigLoader,
    private readonly resourceLocator: IResourceLocator,
    private readonly installerValidator: IInstallerValidator,
    private readonly promptHandler: IPromptHandler,
  ) {}

  /**
   * Main installation method that orchestrates the entire process
   */
  async install(config: IInstallConfig): Promise<void> {
    if (!config.directory) {
      throw new Error("Installation directory is required");
    }

    this.logger.info(cyan(`🚀 Installing to: ${config.directory}`));

    // Create a proper spinner
    const spinner = createSpinner("Starting installation...");

    try {
      spinner.start();

      // Detect existing installation state
      const state = await this.detectInstallationState(config.directory);

      if (state.type === "fresh") {
        await this.performFreshInstall(config, config.directory, spinner);
      } else if (state.type === "v5_existing") {
        await this.handleExistingV5Installation(
          config,
          config.directory,
          state,
          spinner,
        );
      } else {
        await this.handleUnknownInstallation(
          config,
          config.directory,
          state,
          spinner,
        );
      }

      spinner.succeed("Installation completed successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(
        `Installation failed: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Detect the current installation state
   */
  private async detectInstallationState(
    installDir: string,
  ): Promise<IInstallationState> {
    return await this.installerValidator.detectInstallationState(installDir);
  }

  /**
   * Perform a fresh installation
   */
  private async performFreshInstall(
    config: IInstallConfig,
    installDir: string,
    spinner: ISpinner,
  ): Promise<void> {
    spinner.start();
    spinner.text = "Performing fresh installation...";

    // Ensure install directory exists
    await this.fileManager.ensureDir(installDir);

    // Install core if selected
    if (config.selectedPacks?.includes(".bmad-core") || config.full) {
      await this.installCore(installDir, spinner);
    }

    // Install expansion packs if selected
    const expansionPacks = config.selectedPacks?.filter((pack) => pack !== ".bmad-core") || [];
    if (expansionPacks.length > 0) {
      await this.installExpansionPacks(
        installDir,
        expansionPacks,
        spinner,
        config,
      );
    }

    // Setup IDE configurations
    if (config.ides && config.ides.length > 0) {
      this.setupIdeConfigurations(installDir, config.ides, spinner);
    }
  }

  /**
   * Handle an existing v5 installation
   */
  private async handleExistingV5Installation(
    config: IInstallConfig,
    installDir: string,
    _state: IInstallationState,
    spinner: ISpinner,
  ): Promise<void> {
    spinner.stop();

    this.logger.info(yellow("\n🔍 Found existing BMad v5 installation"));
    
    // For existing installations, install core if selected
    if (config.selectedPacks?.includes(".bmad-core") || config.full) {
      spinner.start();
      spinner.text = "Updating BMad core...";
      await this.installCore(installDir, spinner);
    }
    
    spinner.start();
  }

  /**
   * Handle an unknown installation
   */
  private async handleUnknownInstallation(
    config: IInstallConfig,
    installDir: string,
    _state: IInstallationState,
    spinner: ISpinner,
  ): Promise<void> {
    // TODO: Implement unknown installation handling
    spinner.text = "Handling unknown installation...";
    await this.performFreshInstall(config, installDir, spinner);
  }

  /**
   * Install the core BMad system
   */
  private async installCore(installDir: string, spinner: ISpinner): Promise<void> {
    // Import the CoreInstaller and create an instance
    const { CoreInstaller } = await import("./core-installer.ts");
    const { FileManager } = await import("./file-manager.ts");
    
    const fileManager = new FileManager();
    const coreInstaller = new CoreInstaller(fileManager);
    
    await coreInstaller.installCore(installDir, spinner);
  }

  /**
   * Install expansion packs
   */
  private installExpansionPacks(
    _installDir: string,
    selectedPacks: string[],
    spinner: ISpinner,
    _config: IInstallConfig = {},
  ): string[] {
    spinner.text = `Installing ${selectedPacks.length} expansion packs...`;
    
    // For now, we'll just return the list of packs
    // In a real implementation, this would actually install the packs
    return selectedPacks;
  }

  /**
   * Setup IDE configurations
   */
  private setupIdeConfigurations(
    _installDir: string,
    _ides: string[],
    spinner: ISpinner,
  ): void {
    spinner.text = "Setting up IDE configurations...";
    // For now, we'll just log that IDE setup is complete
    // In a real implementation, this would actually set up IDE configurations
  }
}

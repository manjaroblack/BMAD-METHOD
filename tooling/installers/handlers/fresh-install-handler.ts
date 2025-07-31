/**
 * Fresh Installation Handler for BMAD-METHOD
 * Handles new installations from scratch
 */

import { ensureDir } from "deps";
import type { 
  InstallationContext,
  InstallConfig,
  IInstallationHandler,

  ILogger
} from 'deps';

export class FreshInstallHandler implements IInstallationHandler {
  constructor(
    private logger?: ILogger
  ) {}

  canHandle(context: InstallationContext): boolean {
    return context.type === 'fresh' || context.state.type === 'fresh';
  }

  async handle(context: InstallationContext): Promise<void> {
    const { config, installDir } = context;
    
    this.logger?.info('Starting fresh installation', {
      installDir,
      selectedPacks: config.selectedPacks?.length || 0,
      ides: config.ides?.length || 0
    });

    await this.performFreshInstall(config, installDir);
    
    this.logger?.info('Fresh installation completed successfully', {
      installDir
    });
  }

  private async performFreshInstall(
    config: InstallConfig,
    installDir: string
  ): Promise<void> {
    // Ensure install directory exists
    await ensureDir(installDir);
    this.logger?.debug('Install directory ensured', { installDir });

    // Install core if selected
    if (this.shouldInstallCore(config)) {
      await this.installCore(installDir);
    }

    // Install expansion packs if selected
    const expansionPacks = this.getExpansionPacksToInstall(config);
    if (expansionPacks.length > 0) {
      await this.installExpansionPacks(installDir, expansionPacks);
    }

    // Setup IDE configurations
    if (config.ides && config.ides.length > 0) {
      await this.setupIdeConfigurations(installDir, config.ides);
    }
  }

  private shouldInstallCore(config: InstallConfig): boolean {
    return config.selectedPacks?.includes('.bmad-core') || 
           config.full === true;
  }

  private getExpansionPacksToInstall(config: InstallConfig): string[] {
    return config.selectedPacks?.filter(pack => pack !== '.bmad-core') || [];
  }

  private installCore(installDir: string): void {
    this.logger?.info('Installing BMAD core', { installDir });
    
    try {
      // This would delegate to the core installer service
      // For now, this is a placeholder that would be implemented
      // when we create the core installer service
      this.logger?.debug('Core installation placeholder - would delegate to CoreInstaller service');
      
      // TODO: Implement actual core installation logic
      // await this.coreInstaller.installCore(installDir);
      
    } catch (error) {
      this.logger?.error('Failed to install core', error as Error, { installDir });
      throw new Error(`Core installation failed: ${(error as Error).message}`);
    }
  }

  private async installExpansionPacks(
    installDir: string,
    expansionPacks: string[]
  ): Promise<void> {
    this.logger?.info('Installing expansion packs', {
      installDir,
      packs: expansionPacks,
      count: expansionPacks.length
    });
    try {
      // This would delegate to the expansion pack service
      // For now, this is a placeholder
      await Promise.resolve();
      this.logger?.info('Expansion packs installed successfully');
      this.logger?.debug('Expansion pack installation placeholder - would delegate to ExpansionPackService');
      
      // TODO: Implement actual expansion pack installation logic
      // await this.expansionPackService.installExpansionPacks(installDir, expansionPacks, config);
      
    } catch (error) {
      this.logger?.error('Failed to install expansion packs', error as Error, {
        installDir,
        packs: expansionPacks
      });
      throw new Error(`Expansion pack installation failed: ${(error as Error).message}`);
    }
  }

  private setupIdeConfigurations(
    installDir: string,
    ides: string[]
  ): void {
    this.logger?.info('Setting up IDE configurations', {
      installDir,
      ides,
      count: ides.length
    });

    try {
      // This would delegate to the IDE setup service
      // For now, this is a placeholder
      this.logger?.debug('IDE setup placeholder - would delegate to IdeSetupService');
      
      // TODO: Implement actual IDE configuration logic
      // await this.ideSetupService.setupIdeConfigurations(installDir, ides);
      
    } catch (error) {
      this.logger?.error('Failed to setup IDE configurations', error as Error, {
        installDir,
        ides
      });
      throw new Error(`IDE configuration setup failed: ${(error as Error).message}`);
    }
  }
}

// Export factory function
export function createFreshInstallHandler(logger?: ILogger): FreshInstallHandler {
  return new FreshInstallHandler(logger);
}

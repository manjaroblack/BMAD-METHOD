/**
 * Update Installation Handler for BMAD-METHOD
 * Handles updating existing installations to newer versions
 */

// deno-lint-ignore-file no-explicit-any no-unused-vars require-await

import { yellow, cyan } from "deps";
import type { 
  InstallationContext,
  InstallConfig,
  IInstallationHandler,
  ILogger
} from 'deps';

export class UpdateHandler implements IInstallationHandler {
  constructor(
    private logger?: ILogger
  ) {}

  canHandle(context: InstallationContext): boolean {
    return context.type === 'update' || 
           (context.state.type === 'v5_existing' && this.shouldUpdate(context));
  }

  async handle(context: InstallationContext): Promise<void> {
    const { config, installDir, state } = context;
    
    this.logger?.info('Starting installation update', {
      installDir,
      currentVersion: state.manifest?.version,
      targetVersion: this.getCoreVersion()
    });

    await this.performUpdate(config, installDir, state);
    
    this.logger?.info('Installation update completed successfully', {
      installDir
    });
  }

  private shouldUpdate(context: InstallationContext): boolean {
    const currentVersion = typeof context.state.manifest?.version === 'string' 
      ? context.state.manifest.version 
      : 'unknown';
    const newVersion = this.getCoreVersion();
    
    return this.compareVersions(currentVersion, newVersion) < 0;
  }

  private async performUpdate(
    config: InstallConfig,
    installDir: string,
    state: any
  ): Promise<void> {
    const currentVersion = typeof state.manifest?.version === 'string'
      ? state.manifest.version
      : 'unknown';
    const newVersion = this.getCoreVersion();

    // Display update information
    console.log(yellow('\n🔄 Updating BMad installation'));
    console.log(`   Directory: ${installDir}`);
    console.log(`   Current version: ${currentVersion}`);
    console.log(`   Target version: ${newVersion}`);

    // Perform backup before update
    await this.createBackup(installDir, state.manifest);

    // Update core components
    if (this.shouldUpdateCore(config)) {
      await this.updateCore(installDir);
    }

    // Update expansion packs
    const expansionPacks = this.getExpansionPacksToUpdate(config, state);
    if (expansionPacks.length > 0) {
      await this.updateExpansionPacks(installDir, expansionPacks);
    }

    // Update IDE configurations if needed
    if (config.ides && config.ides.length > 0) {
      await this.updateIdeConfigurations(installDir, config.ides);
    }

    // Update manifest
    await this.updateManifest(installDir, newVersion);
  }

  private shouldUpdateCore(config: InstallConfig): boolean {
    return !config.expansionOnly;
  }

  private getExpansionPacksToUpdate(config: InstallConfig, state: any): string[] {
    const selectedPacks = config.selectedPacks || [];
    const installedPacks = Object.keys(state.expansionPacks || {});
    
    // Return intersection of selected and installed packs
    return selectedPacks.filter(pack => 
      pack !== '.bmad-core' && installedPacks.includes(pack)
    );
  }

  private async createBackup(installDir: string, manifest: any): Promise<void> {
    this.logger?.info('Creating backup before update', { installDir });
    
    try {
      // This would delegate to the backup service
      this.logger?.debug('Backup creation placeholder - would delegate to BackupService');
      
      // TODO: Implement actual backup logic
      // await this.backupService.createBackup(installDir, manifest);
      
    } catch (error) {
      this.logger?.error('Failed to create backup', error as Error, { installDir });
      throw new Error(`Backup creation failed: ${(error as Error).message}`);
    }
  }

  private async updateCore(installDir: string): Promise<void> {
    this.logger?.info('Updating BMAD core', { installDir });
    
    try {
      // This would delegate to the core installer service
      this.logger?.debug('Core update placeholder - would delegate to CoreInstaller service');
      
      // TODO: Implement actual core update logic
      // await this.coreInstaller.updateCore(installDir);
      
    } catch (error) {
      this.logger?.error('Failed to update core', error as Error, { installDir });
      throw new Error(`Core update failed: ${(error as Error).message}`);
    }
  }

  private async updateExpansionPacks(
    installDir: string,
    expansionPacks: string[]
  ): Promise<void> {
    this.logger?.info('Updating expansion packs', {
      installDir,
      packs: expansionPacks,
      count: expansionPacks.length
    });

    try {
      // This would delegate to the expansion pack service
      this.logger?.debug('Expansion pack update placeholder - would delegate to ExpansionPackService');
      
      // TODO: Implement actual expansion pack update logic
      // await this.expansionPackService.updateExpansionPacks(installDir, expansionPacks);
      
    } catch (error) {
      this.logger?.error('Failed to update expansion packs', error as Error, {
        installDir,
        packs: expansionPacks
      });
      throw new Error(`Expansion pack update failed: ${(error as Error).message}`);
    }
  }

  private async updateIdeConfigurations(
    installDir: string,
    ides: string[]
  ): Promise<void> {
    this.logger?.info('Updating IDE configurations', {
      installDir,
      ides,
      count: ides.length
    });

    try {
      // This would delegate to the IDE setup service
      this.logger?.debug('IDE configuration update placeholder - would delegate to IdeSetupService');
      
      // TODO: Implement actual IDE configuration update logic
      // await this.ideSetupService.updateIdeConfigurations(installDir, ides);
      
    } catch (error) {
      this.logger?.error('Failed to update IDE configurations', error as Error, {
        installDir,
        ides
      });
      throw new Error(`IDE configuration update failed: ${(error as Error).message}`);
    }
  }

  private async updateManifest(installDir: string, newVersion: string): Promise<void> {
    this.logger?.info('Updating installation manifest', { installDir, newVersion });
    
    try {
      // This would delegate to the manifest service
      this.logger?.debug('Manifest update placeholder - would delegate to ManifestService');
      
      // TODO: Implement actual manifest update logic
      // await this.manifestService.updateInstallManifest(installDir, { version: newVersion });
      
    } catch (error) {
      this.logger?.error('Failed to update manifest', error as Error, { installDir });
      throw new Error(`Manifest update failed: ${(error as Error).message}`);
    }
  }

  private getCoreVersion(): string {
    // This would get the version from a version service or config
    // For now, return a placeholder
    return '5.0.0'; // TODO: Get actual version
  }

  private compareVersions(version1: string, version2: string): number {
    // Simple version comparison - would be more sophisticated in practice
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
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
export function createUpdateHandler(logger?: ILogger): UpdateHandler {
  return new UpdateHandler(logger);
}

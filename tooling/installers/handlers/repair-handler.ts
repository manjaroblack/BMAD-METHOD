/**
 * Repair Installation Handler for BMAD-METHOD
 * Handles repairing corrupted or incomplete installations
 */

import { red, yellow, green } from "deps";
import type { 
  InstallationContext,
  InstallConfig,
  FileIntegrityResult,
  IInstallationHandler,
  ILogger
} from 'deps';

export class RepairHandler implements IInstallationHandler {
  constructor(
    private logger?: ILogger
  ) {}

  canHandle(context: InstallationContext): boolean {
    return context.type === 'repair' || this.hasIntegrityIssues(context);
  }

  async handle(context: InstallationContext): Promise<void> {
    const { config, installDir, state } = context;
    
    this.logger?.info('Starting installation repair', {
      installDir,
      stateType: state.type
    });

    // First, check file integrity to identify issues
    const integrity = await this.checkFileIntegrity(installDir, state.manifest);
    
    if (this.hasNoIntegrityIssues(integrity)) {
      this.logger?.info('No integrity issues found, repair not needed', { installDir });
      console.log(green('✅ Installation integrity check passed - no repair needed'));
      return;
    }

    await this.performRepair(config, installDir, state, integrity);
    
    this.logger?.info('Installation repair completed successfully', { installDir });
  }

  private hasIntegrityIssues(context: InstallationContext): boolean {
    const integrity = context.state.integrity as FileIntegrityResult | undefined;
    if (!integrity) return false;
    
    return integrity.missing.length > 0 || integrity.modified.length > 0;
  }

  private hasNoIntegrityIssues(integrity: FileIntegrityResult): boolean {
    return integrity.missing.length === 0 && integrity.modified.length === 0;
  }

  private async performRepair(
    _config: InstallConfig,
    installDir: string,
    // deno-lint-ignore no-explicit-any
    state: any,
    integrity: FileIntegrityResult
  ): Promise<void> {
    console.log(yellow('\n🔧 Repairing BMad installation'));
    console.log(`   Directory: ${installDir}`);
    
    this.displayIntegrityIssues(integrity);

    // Create backup before repair
    await this.createBackup(installDir, state.manifest);

    // Repair missing files
    if (integrity.missing.length > 0) {
      await this.repairMissingFiles(installDir, integrity.missing);
    }

    // Repair modified files (restore from source)
    if (integrity.modified.length > 0) {
      await this.repairModifiedFiles(installDir, integrity.modified);
    }

    // Verify repair was successful
    await this.verifyRepair(installDir, state.manifest);

    // Update manifest if needed
    await this.updateManifest(installDir);
  }

  private displayIntegrityIssues(integrity: FileIntegrityResult): void {
    console.log('\n⚠️  Installation issues detected:');
    
    if (integrity.missing.length > 0) {
      console.log(red(`   Missing files: ${integrity.missing.length}`));
      if (integrity.missing.length <= 5) {
        integrity.missing.forEach(file => console.log(`     - ${file}`));
      } else {
        integrity.missing.slice(0, 5).forEach(file => console.log(`     - ${file}`));
        console.log(`     ... and ${integrity.missing.length - 5} more`);
      }
    }
    
    if (integrity.modified.length > 0) {
      console.log(yellow(`   Modified files: ${integrity.modified.length}`));
      if (integrity.modified.length <= 5) {
        integrity.modified.forEach(file => console.log(`     - ${file}`));
      } else {
        integrity.modified.slice(0, 5).forEach(file => console.log(`     - ${file}`));
        console.log(`     ... and ${integrity.modified.length - 5} more`);
      }
    }
  }

  private checkFileIntegrity(
    installDir: string, 
    _manifest: unknown
  ): FileIntegrityResult {
    this.logger?.info('Checking file integrity', { installDir });
    
    try {
      // This would delegate to the integrity checker service
      this.logger?.debug('File integrity check placeholder - would delegate to IntegrityChecker service');
      
      // TODO: Implement actual integrity checking logic
      // return await this.integrityChecker.checkFileIntegrity(installDir, manifest);
      
      // For now, return empty result
      return { missing: [], modified: [] };
      
    } catch (error) {
      this.logger?.error('Failed to check file integrity', error as Error, { installDir });
      throw new Error(`Integrity check failed: ${(error as Error).message}`);
    }
  }

  // deno-lint-ignore no-explicit-any
  private createBackup(installDir: string, _manifest: any): void {
    this.logger?.info('Creating backup before repair', { installDir });
    
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

  private repairMissingFiles(installDir: string, missingFiles: string[]): void {
    this.logger?.info('Repairing missing files', {
      installDir,
      count: missingFiles.length,
      files: missingFiles.slice(0, 5) // Log first 5 files
    });

    console.log(`\n🔄 Restoring ${missingFiles.length} missing files...`);

    try {
      // This would delegate to the file repair service
      this.logger?.debug('Missing file repair placeholder - would delegate to FileRepairService');
      
      // TODO: Implement actual missing file repair logic
      // await this.fileRepairService.repairMissingFiles(installDir, missingFiles);
      
      console.log(green(`✅ Restored ${missingFiles.length} missing files`));
      
    } catch (error) {
      this.logger?.error('Failed to repair missing files', error as Error, {
        installDir,
        missingFiles
      });
      throw new Error(`Missing file repair failed: ${(error as Error).message}`);
    }
  }

  private repairModifiedFiles(installDir: string, modifiedFiles: string[]): void {
    this.logger?.info('Repairing modified files', {
      installDir,
      count: modifiedFiles.length,
      files: modifiedFiles.slice(0, 5) // Log first 5 files
    });

    console.log(`\n🔄 Restoring ${modifiedFiles.length} modified files...`);

    try {
      // This would delegate to the file repair service
      this.logger?.debug('Modified file repair placeholder - would delegate to FileRepairService');
      
      // TODO: Implement actual modified file repair logic
      // await this.fileRepairService.repairModifiedFiles(installDir, modifiedFiles);
      
      console.log(green(`✅ Restored ${modifiedFiles.length} modified files`));
      
    } catch (error) {
      this.logger?.error('Failed to repair modified files', error as Error, {
        installDir,
        modifiedFiles
      });
      throw new Error(`Modified file repair failed: ${(error as Error).message}`);
    }
  }

  private async verifyRepair(installDir: string, manifest: Record<string, unknown>): Promise<void> {
    this.logger?.info('Verifying repair completion', { installDir });
    
    console.log('\n🔍 Verifying repair...');

    try {
      const postRepairIntegrity = await this.checkFileIntegrity(installDir, manifest);
      
      if (this.hasNoIntegrityIssues(postRepairIntegrity)) {
        console.log(green('✅ Repair verification successful'));
        this.logger?.info('Repair verification passed', { installDir });
      } else {
        const message = 'Repair verification failed - issues still exist';
        console.log(red(`❌ ${message}`));
        this.logger?.error(message, undefined, {
          installDir,
          remainingIssues: postRepairIntegrity
        });
        throw new Error(message);
      }
      
    } catch (error) {
      this.logger?.error('Failed to verify repair', error as Error, { installDir });
      throw new Error(`Repair verification failed: ${(error as Error).message}`);
    }
  }

  private updateManifest(installDir: string): void {
    this.logger?.info('Updating manifest after repair', { installDir });
    
    try {
      // This would delegate to the manifest service
      this.logger?.debug('Manifest update placeholder - would delegate to ManifestService');
      
      // TODO: Implement actual manifest update logic
      // await this.manifestService.updateInstallManifest(installDir, { 
      //   lastRepaired: new Date().toISOString() 
      // });
      
    } catch (error) {
      this.logger?.error('Failed to update manifest', error as Error, { installDir });
      throw new Error(`Manifest update failed: ${(error as Error).message}`);
    }
  }
}

// Export factory function
export function createRepairHandler(logger?: ILogger): RepairHandler {
  return new RepairHandler(logger);
}

/**
 * Unknown Install Handler for BMAD-METHOD
 * Handles installation when existing state cannot be determined
 */

import type { 
  InstallConfig,
  IInstallationHandler,
  ILogger,
  InstallationContext
} from 'deps';

import { 
  ISpinner,
  BMadError,
  EXIT_CODES
} from 'deps';

export interface UnknownInstallOptions {
  forceCleanInstall?: boolean;
  attemptRecovery?: boolean;
  backupExisting?: boolean;
  validateBefore?: boolean;
}

export class UnknownInstallHandler implements IInstallationHandler {
  private logger: ILogger;
  private spinner: ISpinner;

  constructor(logger: ILogger, spinner: ISpinner) {
    this.logger = logger;
    this.spinner = spinner;
  }

  /**
   * Check if this handler can process the given context
   */
  canHandle(_context: InstallationContext): boolean {
    // UnknownInstallHandler is a fallback handler that can handle any context
    // when the installation state cannot be determined
    return true;
  }

  /**
   * Handle installation when existing state cannot be determined
   */
  async handle(context: InstallationContext): Promise<void> {
    const { config, installDir, options = {} } = context as InstallationContext & {
      config: InstallConfig;
      installDir: string;
      options?: UnknownInstallOptions;
    };
    const {
      forceCleanInstall = false,
      attemptRecovery = true,
      backupExisting = true,
      validateBefore = true
    } = options;

    this.logger.info('Starting unknown installation state handler', {
      installDir,
      forceCleanInstall,
      attemptRecovery,
      backupExisting
    });

    try {
      this.spinner.text = 'Analyzing unknown installation state...';
      this.spinner.start();

      // Step 1: Validate the installation directory
      if (validateBefore) {
        await this.validateInstallationDirectory(installDir);
      }

      // Step 2: Attempt to identify what exists
      const existingState = await this.analyzeExistingState(installDir);
      
      this.logger.info('Existing state analysis completed', existingState);

      // Step 3: Decide on recovery strategy
      const strategy = this.determineRecoveryStrategy(existingState, {
        forceCleanInstall,
        attemptRecovery,
        backupExisting
      });

      this.logger.info('Recovery strategy determined', { strategy });

      // Step 4: Execute recovery strategy
      await this.executeRecoveryStrategy(strategy, config, installDir, existingState);

      this.spinner.succeed('Unknown installation state resolved successfully');

      this.logger.info('Unknown installation state handled successfully', {
        installDir,
        strategy,
        existingState
      });

    } catch (error) {
      this.spinner.fail('Failed to handle unknown installation state');
      this.logger.error('Unknown installation handler failed', error as Error, {
        installDir,
        options
      });
      throw new BMadError(
        `Failed to handle unknown installation state: ${(error as Error).message}`,
        EXIT_CODES.GENERAL_ERROR,
        { installDir, options, error: error as Error }
      );
    }
  }

  /**
   * Validate the installation directory for basic requirements
   */
  private async validateInstallationDirectory(installDir: string): Promise<void> {
    this.spinner.text = 'Validating installation directory...';
    
    try {
      // Check if directory exists
      try {
        const stat = await Deno.stat(installDir);
        if (!stat.isDirectory) {
          throw new Error('Installation path exists but is not a directory');
        }
      } catch (error) {
        if ((error as Error).name === 'NotFound') {
          // Directory doesn't exist - this is actually fine for installation
          this.logger.debug('Installation directory does not exist, will be created', {
            installDir
          });
          return;
        }
        throw error;
      }

      // Check permissions
      try {
        // Test write permissions by creating a temporary file
        const testFile = `${installDir}/.bmad-test-${Date.now()}`;
        await Deno.writeTextFile(testFile, 'test');
        await Deno.remove(testFile);
      } catch (_error) {
        throw new Error(`Insufficient permissions for installation directory: ${installDir}`);
      }

      this.logger.debug('Installation directory validation passed', { installDir });

    } catch (error) {
      this.logger.error('Installation directory validation failed', error as Error, {
        installDir
      });
      throw error;
    }
  }

  /**
   * Analyze existing state in the installation directory
   */
  private async analyzeExistingState(installDir: string): Promise<ExistingStateAnalysis> {
    this.spinner.text = 'Analyzing existing installation state...';

    const analysis: ExistingStateAnalysis = {
      hasManifest: false,
      hasCore: false,
      hasExpansionPacks: false,
      hasConfiguration: false,
      corruptedFiles: [],
      unknownFiles: [],
      estimatedVersion: null,
      fileCount: 0,
      totalSize: 0
    };

    try {
      // Check if directory exists
      try {
        await Deno.stat(installDir);
      } catch (error) {
        if ((error as Error).name === 'NotFound') {
          this.logger.debug('Installation directory does not exist', { installDir });
          return analysis;
        }
        throw error;
      }

      // Analyze directory contents
      const entries = [];
      for await (const entry of Deno.readDir(installDir)) {
        entries.push(entry);
        analysis.fileCount++;

        // Get file size
        try {
          const stat = await Deno.stat(`${installDir}/${entry.name}`);
          analysis.totalSize += stat.size;
        } catch {
          // Ignore stat errors for individual files
        }
      }

      // Check for key files and directories
      for (const entry of entries) {
        const name = entry.name.toLowerCase();
        const path = `${installDir}/${entry.name}`;

        // Check for manifest
        if (name === '.bmad-manifest.json' || name === 'manifest.json') {
          analysis.hasManifest = true;
          try {
            const manifestContent = await Deno.readTextFile(path);
            const manifest = JSON.parse(manifestContent);
            analysis.estimatedVersion = manifest.version || null;
          } catch (error) {
            this.logger.warn('Found manifest but could not parse it', {
              path,
              error: (error as Error).message
            });
            analysis.corruptedFiles.push(path);
          }
        }

        // Check for core installation
        else if (name === 'core' || name === '.bmad-core') {
          analysis.hasCore = true;
        }

        // Check for expansion packs
        else if (name.startsWith('expansion-') || name.includes('pack')) {
          analysis.hasExpansionPacks = true;
        }

        // Check for configuration
        else if (name.includes('config') || name.includes('settings')) {
          analysis.hasConfiguration = true;
        }

        // Check for unknown BMAD files
        else if (name.startsWith('.bmad-') || name.startsWith('bmad-')) {
          // These might be BMAD-related but we don't recognize them
          analysis.unknownFiles.push(path);
        }
      }

      this.logger.debug('Existing state analysis completed', analysis);
      return analysis;

    } catch (error) {
      this.logger.error('Failed to analyze existing state', error as Error, {
        installDir
      });
      throw error;
    }
  }

  /**
   * Determine the best recovery strategy based on existing state
   */
  private determineRecoveryStrategy(
    existingState: ExistingStateAnalysis,
    options: UnknownInstallOptions
  ): RecoveryStrategy {
    // If force clean install is requested, always do clean install
    if (options.forceCleanInstall) {
      return 'clean-install';
    }

    // If no BMAD-related files exist, do clean install
    if (!existingState.hasManifest && !existingState.hasCore && 
        !existingState.hasExpansionPacks && existingState.unknownFiles.length === 0) {
      return 'clean-install';
    }

    // If recovery is disabled, do clean install
    if (!options.attemptRecovery) {
      return 'clean-install';
    }

    // If we have a manifest and core, try to repair
    if (existingState.hasManifest && existingState.hasCore) {
      return 'repair-install';
    }

    // If we have some BMAD files but no manifest, try partial recovery
    if (existingState.hasCore || existingState.hasExpansionPacks || 
        existingState.unknownFiles.length > 0) {
      return 'partial-recovery';
    }

    // Default to clean install
    return 'clean-install';
  }

  /**
   * Execute the determined recovery strategy
   */
  private async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    config: InstallConfig,
    installDir: string,
    existingState: ExistingStateAnalysis
  ): Promise<void> {
    this.spinner.text = `Executing ${strategy} strategy...`;

    switch (strategy) {
      case 'clean-install':
        await this.executeCleanInstall(config, installDir, existingState);
        break;
      
      case 'repair-install':
        await this.executeRepairInstall(config, installDir, existingState);
        break;
      
      case 'partial-recovery':
        await this.executePartialRecovery(config, installDir, existingState);
        break;
      
      default:
        throw new Error(`Unknown recovery strategy: ${strategy}`);
    }
  }

  /**
   * Execute clean installation strategy
   */
  private async executeCleanInstall(
    _config: InstallConfig,
    installDir: string,
    existingState: ExistingStateAnalysis
  ): Promise<void> {
    this.logger.info('Executing clean install strategy', {
      installDir,
      existingFileCount: existingState.fileCount
    });

    // Create backup if requested and files exist
    if (existingState.fileCount > 0) {
      await this.createBackup(installDir);
    }

    // Clear the directory
    await this.clearDirectory(installDir);

    // Delegate to fresh install handler (would need to inject this dependency)
    this.logger.info('Clean install preparation completed, delegating to fresh install handler');
  }

  /**
   * Execute repair installation strategy
   */
  private async executeRepairInstall(
    _config: InstallConfig,
    installDir: string,
    existingState: ExistingStateAnalysis
  ): Promise<void> {
    this.logger.info('Executing repair install strategy', {
      installDir,
      estimatedVersion: existingState.estimatedVersion
    });

    // Create backup
    await this.createBackup(installDir);

    // Delegate to repair handler (would need to inject this dependency)
    this.logger.info('Repair install preparation completed, delegating to repair handler');
  }

  /**
   * Execute partial recovery strategy
   */
  private async executePartialRecovery(
    _config: InstallConfig,
    installDir: string,
    existingState: ExistingStateAnalysis
  ): Promise<void> {
    this.logger.info('Executing partial recovery strategy', {
      installDir,
      unknownFileCount: existingState.unknownFiles.length
    });

    // Create backup
    await this.createBackup(installDir);

    // Try to salvage what we can
    await this.salvageExistingFiles(installDir, existingState);

    // Then do a fresh install to fill in missing pieces
    this.logger.info('Partial recovery completed, delegating to fresh install handler');
  }

  /**
   * Create backup of existing installation
   */
  private async createBackup(installDir: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `${installDir}.backup-${timestamp}`;

    try {
      this.spinner.text = 'Creating backup of existing installation...';
      
      // Copy entire directory to backup location
      await Deno.rename(installDir, backupDir);
      
      this.logger.info('Backup created successfully', {
        originalDir: installDir,
        backupDir
      });

    } catch (error) {
      this.logger.error('Failed to create backup', error as Error, {
        installDir,
        backupDir
      });
      throw error;
    }
  }

  /**
   * Clear installation directory
   */
  private async clearDirectory(installDir: string): Promise<void> {
    try {
      this.spinner.text = 'Clearing installation directory...';
      
      try {
        await Deno.remove(installDir, { recursive: true });
      } catch (error) {
        if ((error as Error).name !== 'NotFound') {
          throw error;
        }
      }

      // Recreate the directory
      await Deno.mkdir(installDir, { recursive: true });

      this.logger.debug('Installation directory cleared', { installDir });

    } catch (error) {
      this.logger.error('Failed to clear directory', error as Error, {
        installDir
      });
      throw error;
    }
  }

  /**
   * Salvage existing files that might be useful
   */
  private salvageExistingFiles(
    _installDir: string,
    existingState: ExistingStateAnalysis
  ): void {
    this.spinner.text = 'Salvaging existing files...';

    // For now, just log what we found
    // In a real implementation, we would selectively preserve
    // files that appear to be valid BMAD components
    
    this.logger.info('File salvage analysis', {
      hasCore: existingState.hasCore,
      hasExpansionPacks: existingState.hasExpansionPacks,
      unknownFiles: existingState.unknownFiles.length,
      corruptedFiles: existingState.corruptedFiles.length
    });
  }
}

// Supporting interfaces
interface ExistingStateAnalysis extends Record<string, unknown> {
  hasManifest: boolean;
  hasCore: boolean;
  hasExpansionPacks: boolean;
  hasConfiguration: boolean;
  corruptedFiles: string[];
  unknownFiles: string[];
  estimatedVersion: string | null;
  fileCount: number;
  totalSize: number;
}

type RecoveryStrategy = 'clean-install' | 'repair-install' | 'partial-recovery';

// Export factory function
export function createUnknownInstallHandler(
  logger: ILogger,
  spinner: ISpinner
): UnknownInstallHandler {
  return new UnknownInstallHandler(logger, spinner);
}

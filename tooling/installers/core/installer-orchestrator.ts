/**
 * Installer Orchestrator for BMAD-METHOD
 * Main coordination point that manages installation flow using dependency injection
 */

import { 
  green, 
  red, 
  resolve,
  type InstallConfig,
  type InstallationState,
  type InstallationContext,
  type InstallationType,
  type IInstaller,
  type IInstallationHandler,
  type ILogger,
  type ISpinner,
  type IPerformanceMonitor,
  type InstallationResult,
  type IFileService
} from "deps";

import { 
  InstallationDetector,
  FreshInstallHandler,
  UpdateHandler,
  RepairHandler,
  ManifestService,
  ExpansionPackService,
  IntegrityChecker
} from 'deps';

export interface InstallerDependencies {
  logger?: ILogger;
  spinner?: ISpinner;
  performanceMonitor?: IPerformanceMonitor;
  installationDetector?: InstallationDetector;
  manifestService?: ManifestService;
  expansionPackService?: ExpansionPackService;
  integrityChecker?: IntegrityChecker;
  handlers?: {
    freshInstall?: FreshInstallHandler;
    update?: UpdateHandler;
    repair?: RepairHandler;
  };
}

export class InstallerOrchestrator implements IInstaller {
  private logger: ILogger;
  private spinner: ISpinner;
  private performanceMonitor: IPerformanceMonitor;
  private installationDetector: InstallationDetector;
  private manifestService: ManifestService;
  private expansionPackService: ExpansionPackService;
  private integrityChecker: IntegrityChecker;
  private handlers: Map<string, IInstallationHandler>;
  private text: string;

  constructor(dependencies: InstallerDependencies = {}) {
    // Dependency injection with fallbacks
    this.logger = dependencies.logger || this.createDefaultLogger();
    this.spinner = dependencies.spinner || this.createDefaultSpinner();
    this.performanceMonitor = dependencies.performanceMonitor || this.createDefaultPerformanceMonitor();
    this.text = '';
    
    // Create services with dependencies
    this.installationDetector = dependencies.installationDetector || 
      new InstallationDetector(this.createDefaultFileSystem(), this.logger);
    this.manifestService = dependencies.manifestService || 
      new ManifestService(this.createDefaultFileSystem(), this.logger);
    this.expansionPackService = dependencies.expansionPackService || 
      new ExpansionPackService(this.createDefaultFileSystem(), this.logger);
    this.integrityChecker = dependencies.integrityChecker || 
      new IntegrityChecker(this.createDefaultFileSystem(), this.logger);

    // Initialize handlers
    this.handlers = new Map();
    this.initializeHandlers(dependencies.handlers);

    this.logger.info('Installer orchestrator initialized', {
      handlersCount: this.handlers.size,
      handlerTypes: Array.from(this.handlers.keys())
    });
  }

  async install(config: InstallConfig): Promise<InstallationResult> {
    const operationId = this.performanceMonitor.start('full-installation');
    let result: InstallationResult;
    
    try {
      if (!config.directory) {
        throw new Error("Installation directory is required");
      }

      const installDir = resolve(config.directory);
      this.logger.info('Starting installation', { 
        installDir,
        config: this.sanitizeConfigForLogging(config)
      });

      // Initialize spinner
      this.spinner.start();
      this.spinner.update('Detecting installation state...');

      // Detect current installation state
      const state = await this.installationDetector.detectInstallationState(installDir);
      const installationType = this.determineInstallationType(state, config);
      
      // Create installation context
      const context: InstallationContext = {
        config,
        installDir,
        state,
        type: installationType
      };

      this.logger.info('Installation context determined', {
        installDir,
        stateType: state.type,
        installationType
      });

      // Find and execute appropriate handler
      const handler = this.findHandler(context);
      if (!handler) {
        throw new Error(`No handler found for installation type: ${installationType}`);
      }

      this.spinner.update(`Performing ${installationType} installation...`);
      await handler.handle(context);

      // Create/update manifest
      this.spinner.update('Creating installation manifest...');
      await this.manifestService.createInstallManifest(installDir);

      // Show success message
      this.spinner.succeed('Installation completed successfully!');
      this.showSuccessMessage(config, installDir);

      this.logger.info('Installation completed successfully', {
        installDir,
        installationType,
        duration: this.performanceMonitor.end(operationId).duration
      });

      // Set success result
      result = {
        success: true,
        type: installationType
      };

    } catch (error) {
      this.spinner.fail('Installation failed');
      this.logger.error('Installation failed', error as Error, {
        config: this.sanitizeConfigForLogging(config)
      });
      
      console.log(red(`❌ Installation failed: ${(error as Error).message}`));
      
      // Set error result
      result = {
        success: false,
        type: 'error',
        error: (error as Error).message
      };

    } finally {
      this.performanceMonitor.end(operationId);
    }
    
    return result!;
  }

  async update(options: Record<string, unknown> = {}): Promise<void> {
    const operationId = this.performanceMonitor.start('installation-update');

    try {
      this.logger.info('Starting update process', { options });

      // Find existing installation
      const installDir = await this.findInstallation();
      if (!installDir) {
        throw new Error('No existing installation found');
      }

      // Convert options to install config for update
      const config: InstallConfig = {
        directory: installDir,
        selectedPacks: options.selectedPacks as string[] || [],
        ides: options.ides as string[] || [],
        full: options.full as boolean || false
      };

      // Perform update installation
      await this.install(config);

      this.logger.info('Update completed successfully', {
        installDir,
        duration: this.performanceMonitor.end(operationId).duration
      });

    } catch (error) {
      this.logger.error('Update failed', error as Error, { options });
      throw error;
    } finally {
      this.performanceMonitor.end(operationId);
    }
  }

  async getInstallationStatus(directory: string): Promise<Record<string, unknown>> {
    try {
      this.logger.info('Getting installation status', { directory });

      const state = await this.installationDetector.detectInstallationState(directory);
      const manifest = await this.manifestService.readInstallManifest(directory);
      const expansionPacks = await this.expansionPackService.detectExpansionPacks(directory);
      const integrityValid = await this.integrityChecker.validateInstallationIntegrity(directory);

      const status = {
        exists: state.type !== 'fresh',
        state: state.type,
        version: manifest?.version || 'unknown',
        installedAt: manifest?.timestamp || null,
        expansionPacks,
        integrityValid,
        lastChecked: new Date().toISOString()
      };

      this.logger.info('Installation status retrieved', { directory, status });
      return status;

    } catch (error) {
      this.logger.error('Failed to get installation status', error as Error, { directory });
      throw error;
    }
  }

  async findInstallation(): Promise<string | null> {
    try {
      this.logger.info('Finding existing installation');

      // Common installation directories to check
      const commonDirs = [
        '.',
        './bmad',
        '../bmad',
        Deno.env.get('BMAD_HOME'),
        Deno.env.get('HOME') && `${Deno.env.get('HOME')}/.bmad`,
        '/usr/local/bmad'
      ].filter(Boolean) as string[];

      for (const dir of commonDirs) {
        try {
          const resolvedDir = resolve(dir);
          const status = await this.getInstallationStatus(resolvedDir);
          
          if (status.exists) {
            this.logger.info('Existing installation found', { directory: resolvedDir });
            return resolvedDir;
          }
        } catch (_error) {
          // Continue searching
        }
      }

      this.logger.info('No existing installation found');
      return null;

    } catch (error) {
      this.logger.error('Failed to find installation', error as Error);
      return null;
    }
  }

  // Private helper methods
  private initializeHandlers(customHandlers?: InstallerDependencies['handlers']): void {
    // Create default handlers or use provided ones
    const freshInstallHandler = customHandlers?.freshInstall || 
      new FreshInstallHandler(this.logger);
    const updateHandler = customHandlers?.update || 
      new UpdateHandler(this.logger);
    const repairHandler = customHandlers?.repair || 
      new RepairHandler(this.logger);

    // Register handlers
    this.handlers.set('fresh', freshInstallHandler);
    this.handlers.set('update', updateHandler);
    this.handlers.set('repair', repairHandler);
    this.handlers.set('v5_existing', updateHandler); // Existing v5 uses update handler
    this.handlers.set('unknown_existing', repairHandler); // Unknown uses repair handler
  }

  private determineInstallationType(
    state: InstallationState, 
    _config: InstallConfig
  ): InstallationType {
    if (state.type === 'fresh') {
      return 'fresh';
    }

    if (state.type === 'v5_existing') {
      // Check if this should be an update or repair
      const hasIntegrityIssues = state.integrity && 
        (((state.integrity as Record<string, unknown>).missing as unknown[])?.length > 0 || 
         ((state.integrity as Record<string, unknown>).modified as unknown[])?.length > 0);
      
      return hasIntegrityIssues ? 'repair' : 'update';
    }

    if (state.type === 'unknown_existing') {
      return 'repair';
    }

    return 'unknown';
  }

  private findHandler(context: InstallationContext): IInstallationHandler | null {
    for (const [type, handler] of this.handlers) {
      if (handler.canHandle(context)) {
        this.logger.debug('Handler found for context', { 
          handlerType: type,
          contextType: context.type 
        });
        return handler;
      }
    }

    this.logger.warn('No handler found for context', { context });
    return null;
  }

  private showSuccessMessage(config: InstallConfig, installDir: string): void {
    console.log(green('\n✅ Installation completed successfully!'));
    console.log(`   📁 Directory: ${installDir}`);
    
    if (config.selectedPacks && config.selectedPacks.length > 0) {
      console.log(`   📦 Packages: ${config.selectedPacks.length} installed`);
    }
    
    if (config.ides && config.ides.length > 0) {
      console.log(`   🔧 IDEs configured: ${config.ides.join(', ')}`);
    }
    
    console.log('\n🚀 Ready to use BMAD-METHOD!');
  }

  private sanitizeConfigForLogging(config: InstallConfig): Record<string, unknown> {
    return {
      directory: config.directory,
      selectedPacksCount: config.selectedPacks?.length || 0,
      idesCount: config.ides?.length || 0,
      full: config.full,
      expansionOnly: config.expansionOnly
    };
  }

  // Default dependency creation methods
  private createDefaultLogger(): ILogger {
    // Return a simple console logger implementation
    return {
      debug: (msg: string, ctx?: unknown) => console.debug(`[DEBUG] ${msg}`, ctx || ''),
      info: (msg: string, ctx?: unknown) => console.info(`[INFO] ${msg}`, ctx || ''),
      warn: (msg: string, ctx?: unknown) => console.warn(`[WARN] ${msg}`, ctx || ''),
      error: (msg: string, err?: Error, ctx?: unknown) => console.error(`[ERROR] ${msg}`, err || '', ctx || ''),
      setLevel: () => {}
    };
  }

  private createDefaultSpinner(): ISpinner {
    // Return a simple console-based spinner
    return {
      text: '',
      start: () => console.log('⏳ Starting...'),
      stop: () => {},
      succeed: (msg?: string) => console.log(green(`✅ ${msg || 'Success'}`)),
      fail: (msg?: string) => console.log(red(`❌ ${msg || 'Failed'}`)),
      info: (msg?: string) => console.log(`ℹ️ ${msg || 'Info'}`),
      warn: (msg?: string) => console.log(`⚠️ ${msg || 'Warning'}`),
      update: (text: string) => { this.text = text; }
    };
  }

  private createDefaultPerformanceMonitor(): IPerformanceMonitor {
    // Return a simple performance monitor
    const metrics = new Map();
    return {
      start: (name: string) => {
        const id = `${name}_${Date.now()}`;
        metrics.set(id, { name, startTime: performance.now() });
        return id;
      },
      end: (id: string) => {
        const metric = metrics.get(id);
        if (metric) {
          metric.endTime = performance.now();
          metric.duration = metric.endTime - metric.startTime;
          metrics.delete(id);
        }
        return metric || { id, operationName: '', startTime: 0, duration: 0 };
      },
      mark: () => {},
      measure: () => ({ name: '', duration: 0, startTime: 0, endTime: 0 }),
      getMetrics: () => [],
      reset: () => metrics.clear()
    };
  }

  private createDefaultFileSystem(): IFileService {
    // In a real implementation, this would return a proper file system service
    // For now, return a placeholder that implements the interface
    return {
      // IFileManager methods (partial implementation)
      exists: (_path: string) => Promise.resolve(false),
      readFile: (_path: string) => Promise.resolve(''),
      writeFile: async (_path: string, _content: string) => {},
      copyFile: async (_src: string, _dest: string) => {},
      removeFile: async (_path: string) => {},
      
      // IFileSystemService methods (partial implementation)
      join: (...paths: string[]) => paths.join('/'),
      resolve: (...paths: string[]) => paths.join('/'),
      expandGlob: (_pattern: string) => Promise.resolve([]),
      dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
      extname: (path: string) => '.' + path.split('.').pop() || '',
      basename: (path: string) => path.split('/').pop() || '',
      
      // Additional IFileOperations methods (partial implementation)
      ensureDir: async (_path: string) => {},
      copy: async (_src: string, _dest: string) => {},
      remove: async (_path: string) => {},
      getStats: (_path: string) => Promise.resolve({ isFile: true, isDirectory: false, size: 0, modified: new Date() }),
      readDir: (_path: string) => Promise.resolve([]),
      copyDirectory: async (_src: string, _dest: string) => {},
      ensureDirectory: async (_path: string) => {},
      move: async (_src: string, _dest: string) => {}
    } as unknown as IFileService;
  }
}

// Export factory function
export function createInstallerOrchestrator(
  dependencies?: InstallerDependencies
): InstallerOrchestrator {
  return new InstallerOrchestrator(dependencies);
}

// Note: Default instance removed to avoid circular dependency issues
// Use createInstallerOrchestrator() factory function instead

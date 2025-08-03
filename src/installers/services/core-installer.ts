/**
 * Core Installer Service for BMAD-METHOD
 * Handles installation of core BMAD framework components
 */

import {
  join,
  copy,
  ensureDir,
  safeExists,
  InstallationError,
  ProjectPaths
} from "deps";
import type { InstallConfig, ILogger, ISpinner, IFileSystemService } from "deps";

export interface CoreInstallationResult {
  success: boolean;
  installedComponents: string[];
  skippedComponents: string[];
  errors: string[];
  installPath: string;
  version: string;
}

export interface CoreComponent {
  name: string;
  path: string;
  required: boolean;
  dependencies: string[];
  postInstallActions?: string[];
}

export class CoreInstaller {
  private logger: ILogger;
  private spinner: ISpinner;
  private fileSystem: IFileSystemService;

  // Core components that make up the BMAD framework
  private readonly coreComponents: CoreComponent[] = [
    {
      name: 'agents',
      path: join(ProjectPaths.core, 'agents'),
      required: true,
      dependencies: [],
      postInstallActions: ['validate-agents']
    },
    {
      name: 'workflows',
      path: join(ProjectPaths.core, 'workflows'),
      required: true,
      dependencies: ['agents'],
      postInstallActions: ['register-workflows']
    },
    {
      name: 'checklists',
      path: join(ProjectPaths.core, 'checklists'),
      required: true,
      dependencies: ['agents'],
      postInstallActions: ['register-checklists']
    },
    {
      name: 'tasks',
      path: join(ProjectPaths.core, 'tasks'),
      required: true,
      dependencies: ['agents'],
      postInstallActions: ['register-tasks']
    },
    {
      name: 'templates',
      path: 'core/templates',
      required: true,
      dependencies: [],
      postInstallActions: ['compile-templates']
    },
    {
      name: 'data',
      path: 'core/data',
      required: false,
      dependencies: [],
      postInstallActions: ['setup-data-directories']
    },
    {
      name: 'tooling',
      path: 'tooling',
      required: true,
      dependencies: [],
      postInstallActions: ['setup-cli-tools']
    },
    {
      name: 'configurations',
      path: 'config',
      required: false,
      dependencies: [],
      postInstallActions: ['validate-configurations']
    }
  ];

  constructor(
    logger: ILogger,
    spinner: ISpinner,
    fileSystem: IFileSystemService
  ) {
    this.logger = logger;
    this.spinner = spinner;
    this.fileSystem = fileSystem;
  }

  /**
   * Install core BMAD framework components
   */
  async installCore(
    sourceDir: string,
    targetDir: string,
    config: InstallConfig
  ): Promise<CoreInstallationResult> {
    this.logger.info('Starting core installation', {
      sourceDir,
      targetDir,
      selectedComponents: config.selectedPacks
    });

    const result: CoreInstallationResult = {
      success: false,
      installedComponents: [],
      skippedComponents: [],
      errors: [],
      installPath: targetDir,
      version: 'unknown'
    };

    try {
      this.spinner.text = 'Installing BMAD core components...';
      this.spinner.start();

      // Ensure target directory exists
      await ensureDir(targetDir);

      // Filter components based on configuration
      const componentsToInstall = this.filterComponents(config);
      
      this.logger.info('Components selected for installation', {
        total: componentsToInstall.length,
        required: componentsToInstall.filter(c => c.required).length,
        optional: componentsToInstall.filter(c => !c.required).length
      });

      // Install components in dependency order
      const sortedComponents = this.sortComponentsByDependencies(componentsToInstall);
      
      for (const component of sortedComponents) {
        try {
          await this.installComponent(component, sourceDir, targetDir);
          result.installedComponents.push(component.name);
          
          this.spinner.text = `Installed ${component.name}...`;
          
        } catch (error) {
          const errorMessage = `Failed to install component ${component.name}: ${(error as Error).message}`;
          result.errors.push(errorMessage);
          
          this.logger.error('Component installation failed', error as Error, {
            component: component.name,
            sourceDir,
            targetDir
          });

          // If it's a required component, fail the entire installation
          if (component.required) {
            throw new InstallationError(
              `Required component installation failed: ${component.name}`,
              'CORE_COMPONENT_FAILED',
              { component: component.name, error: error as Error }
            );
          } else {
            // For optional components, log and continue
            result.skippedComponents.push(component.name);
            this.logger.warn('Optional component skipped due to error', {
              component: component.name,
              error: errorMessage
            });
          }
        }
      }

      // Execute post-installation actions
      await this.executePostInstallActions(result.installedComponents, targetDir);

      // Validate installation
      const validationResult = await this.validateInstallation(targetDir, result.installedComponents);
      
      if (!validationResult.isValid) {
        result.errors.push(...validationResult.errors);
        throw new InstallationError(
          'Core installation validation failed',
          'CORE_VALIDATION_FAILED',
          { validationErrors: validationResult.errors }
        );
      }

      result.success = true;
      this.spinner.succeed(`Core installation completed (${result.installedComponents.length} components)`);

      this.logger.info('Core installation completed successfully', {
        targetDir,
        installedComponents: result.installedComponents,
        skippedComponents: result.skippedComponents,
        totalErrors: result.errors.length
      });

      return result;

    } catch (error) {
      result.success = false;
      this.spinner.fail('Core installation failed');
      
      this.logger.error('Core installation failed', error as Error, {
        sourceDir,
        targetDir,
        partialResults: result
      });

      throw error;
    }
  }

  /**
   * Update existing core installation
   */
  async updateCore(
    sourceDir: string,
    targetDir: string,
    config: InstallConfig
  ): Promise<CoreInstallationResult> {
    this.logger.info('Starting core update', {
      sourceDir,
      targetDir
    });

    try {
      this.spinner.text = 'Updating BMAD core components...';
      this.spinner.start();

      // Create backup before update
      await this.createUpdateBackup(targetDir);

      // Get currently installed components
      const currentComponents = await this.getInstalledComponents(targetDir);
      
      // Determine which components need updating
      const componentsToUpdate = await this.getComponentsToUpdate(
        currentComponents,
        sourceDir,
        config
      );

      this.logger.info('Components identified for update', {
        current: currentComponents.length,
        toUpdate: componentsToUpdate.length
      });

      // Update components
      const result = await this.installCore(sourceDir, targetDir, config);
      
      this.spinner.succeed('Core update completed successfully');
      return result;

    } catch (error) {
      this.spinner.fail('Core update failed');
      
      // Attempt to restore from backup
      await this.restoreFromBackup(targetDir);
      
      this.logger.error('Core update failed', error as Error, {
        sourceDir,
        targetDir
      });

      throw error;
    }
  }

  /**
   * Filter components based on installation configuration
   */
  private filterComponents(config: InstallConfig): CoreComponent[] {
    let components = [...this.coreComponents];

    // If specific components are selected, filter to those
    if (config.selectedPacks && config.selectedPacks.length > 0) {
      components = components.filter(component => 
        config.selectedPacks!.includes(component.name) || component.required
      );
    }

    // Apply additional filters based on installation type
    if (config.expansionOnly) {
      components = components.filter(component => component.required);
    }

    return components;
  }

  /**
   * Sort components by their dependencies
   */
  private sortComponentsByDependencies(components: CoreComponent[]): CoreComponent[] {
    const sorted: CoreComponent[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (component: CoreComponent) => {
      if (visiting.has(component.name)) {
        throw new Error(`Circular dependency detected for component: ${component.name}`);
      }
      
      if (visited.has(component.name)) {
        return;
      }

      visiting.add(component.name);

      // Visit dependencies first
      for (const depName of component.dependencies) {
        const dependency = components.find(c => c.name === depName);
        if (dependency) {
          visit(dependency);
        }
      }

      visiting.delete(component.name);
      visited.add(component.name);
      sorted.push(component);
    };

    for (const component of components) {
      visit(component);
    }

    return sorted;
  }

  /**
   * Install a single component
   */
  private async installComponent(
    component: CoreComponent,
    sourceDir: string,
    targetDir: string
  ): Promise<void> {
    const sourcePath = join(sourceDir, component.path);
    const targetPath = join(targetDir, component.path);

    this.logger.debug('Installing component', {
      name: component.name,
      sourcePath,
      targetPath
    });

    try {
      // Check if source exists
      if (!await safeExists(sourcePath)) {
        if (component.required) {
          throw new Error(`Required source path not found: ${sourcePath}`);
        } else {
          this.logger.warn('Optional component source not found, skipping', {
            component: component.name,
            sourcePath
          });
          return;
        }
      }

      // Ensure target directory exists
      await ensureDir(targetPath);

      // Copy component files
      await copy(sourcePath, targetPath, { overwrite: true });

      this.logger.debug('Component installed successfully', {
        name: component.name,
        targetPath
      });

    } catch (error) {
      this.logger.error('Component installation failed', error as Error, {
        component: component.name,
        sourcePath,
        targetPath
      });
      throw error;
    }
  }

  /**
   * Execute post-installation actions for installed components
   */
  private async executePostInstallActions(
    installedComponents: string[],
    targetDir: string
  ): Promise<void> {
    this.spinner.text = 'Executing post-installation actions...';

    for (const componentName of installedComponents) {
      const component = this.coreComponents.find(c => c.name === componentName);
      if (!component || !component.postInstallActions) {
        continue;
      }

      for (const action of component.postInstallActions) {
        try {
          await this.executePostInstallAction(action, component, targetDir);
        } catch (error) {
          this.logger.warn('Post-install action failed', {
            component: componentName,
            action,
            error: (error as Error).message
          });
          // Don't fail installation for post-install action failures
        }
      }
    }
  }

  /**
   * Execute a specific post-installation action
   */
  private async executePostInstallAction(
    action: string,
    component: CoreComponent,
    targetDir: string
  ): Promise<void> {
    this.logger.debug('Executing post-install action', {
      action,
      component: component.name,
      targetDir
    });

    switch (action) {
      case 'validate-agents':
        await this.validateAgents(targetDir);
        break;
      
      case 'register-workflows':
        await this.registerWorkflows(targetDir);
        break;
      
      case 'register-checklists':
        await this.registerChecklists(targetDir);
        break;
      
      case 'register-tasks':
        await this.registerTasks(targetDir);
        break;
      
      case 'compile-templates':
        await this.compileTemplates(targetDir);
        break;
      
      case 'setup-data-directories':
        await this.setupDataDirectories(targetDir);
        break;
      
      case 'setup-cli-tools':
        await this.setupCliTools(targetDir);
        break;
      
      case 'validate-configurations':
        await this.validateConfigurations(targetDir);
        break;
      
      default:
        this.logger.warn('Unknown post-install action', { action });
    }
  }

  /**
   * Validate core installation
   */
  private async validateInstallation(
    targetDir: string,
    installedComponents: string[]
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check that all required components are present
    const requiredComponents = this.coreComponents.filter(c => c.required);
    for (const component of requiredComponents) {
      if (!installedComponents.includes(component.name)) {
        errors.push(`Required component missing: ${component.name}`);
      } else {
        // Check that the component directory exists
        const componentPath = join(targetDir, component.path);
        if (!(await safeExists(componentPath))) {
          errors.push(`Component directory missing: ${componentPath}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create backup before update
   */
  private async createUpdateBackup(targetDir: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `${targetDir}.backup-${timestamp}`;
    
    try {
      await copy(targetDir, backupDir);
      this.logger.info('Update backup created', { backupDir });
    } catch (error) {
      this.logger.warn('Failed to create update backup', {
        error: (error as Error).message
      });
    }
  }

  /**
   * Get list of currently installed components
   */
  private async getInstalledComponents(targetDir: string): Promise<string[]> {
    const installed: string[] = [];
    
    for (const component of this.coreComponents) {
      const componentPath = join(targetDir, component.path);
      if (await safeExists(componentPath)) {
        installed.push(component.name);
      }
    }
    
    return installed;
  }

  /**
   * Get components that need updating
   */
  private getComponentsToUpdate(
    _currentComponents: string[],
    _sourceDir: string,
    config: InstallConfig
  ): CoreComponent[] {
    // For now, return all components (could be enhanced with version checking)
    return this.filterComponents(config);
  }

  /**
   * Restore from backup
   */
  private restoreFromBackup(targetDir: string): void {
    // Implementation would restore from the most recent backup
    this.logger.info('Restore from backup would be implemented here', { targetDir });
  }

  // Post-install action implementations (stubs for now)
  private validateAgents(targetDir: string): void {
    this.logger.debug('Validating agents', { targetDir });
  }

  private registerWorkflows(targetDir: string): void {
    this.logger.debug('Registering workflows', { targetDir });
  }

  private registerChecklists(targetDir: string): void {
    this.logger.debug('Registering checklists', { targetDir });
  }

  private registerTasks(targetDir: string): void {
    this.logger.debug('Registering tasks', { targetDir });
  }

  private compileTemplates(targetDir: string): void {
    this.logger.debug('Compiling templates', { targetDir });
  }

  private setupDataDirectories(targetDir: string): void {
    this.logger.debug('Setting up data directories', { targetDir });
  }

  private setupCliTools(targetDir: string): void {
    this.logger.debug('Setting up CLI tools', { targetDir });
  }

  private validateConfigurations(targetDir: string): void {
    this.logger.debug('Validating configurations', { targetDir });
  }
}

// Export factory function
export function createCoreInstaller(
  logger: ILogger,
  spinner: ISpinner,
  fileSystem: IFileSystemService
): CoreInstaller {
  return new CoreInstaller(logger, spinner, fileSystem);
}

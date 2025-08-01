/**
 * Extension Manager Service - Manages extension lifecycle, loading, and orchestration
 */

import {
  type ExtensionConfig,
  type ExtensionManifest,
  ExtensionStatus,
  ExtensionType,
  type ExtensionLoadResult,
  type ExtensionSearchCriteria,
  type ExtensionMetrics,
  type ExtensionContext,
  type ExtensionError,
  type ExtensionRegistry,
  type ExtensionResources,
  join,
  ProjectPaths
} from 'deps';

export interface IExtensionManager {
  initialize(): Promise<void>;
  loadExtension(extensionPath: string): Promise<ExtensionLoadResult>;
  unloadExtension(extensionId: string): Promise<void>;
  activateExtension(extensionId: string): Promise<void>;
  deactivateExtension(extensionId: string): Promise<void>;
  getExtension(extensionId: string): ExtensionManifest | undefined;
  getExtensions(criteria?: ExtensionSearchCriteria): ExtensionManifest[];
  getActiveExtensions(): ExtensionManifest[];
  reloadExtension(extensionId: string): Promise<ExtensionLoadResult>;
  validateExtension(extensionPath: string): Promise<ExtensionError[]>;
  getMetrics(): ExtensionMetrics;
}

export class ExtensionManager implements IExtensionManager {
  private registry: ExtensionRegistry;
  private extensionContexts: Map<string, ExtensionContext> = new Map();
  private loadedModules: Map<string, unknown> = new Map();
  private isInitialized = false;

  constructor() {
    this.registry = {
      extensions: new Map(),
      activeExtensions: new Set(),
      loadedExtensions: new Map()
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Extension Manager is already initialized');
    }

    try {
      // Load all extensions from the extensions directory
      await this.discoverAndLoadExtensions();
      
      // Activate extensions that should be auto-activated
      await this.activateAutoStartExtensions();
      
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Extension Manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadExtension(extensionPath: string): Promise<ExtensionLoadResult> {
    const startTime = Date.now();
    
    try {
      // Validate extension structure
      const validationErrors = await this.validateExtension(extensionPath);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors[0],
          duration: Date.now() - startTime
        };
      }

      // Load extension configuration
      const config = await this.loadExtensionConfig(extensionPath);
      
      // Check for conflicts with existing extensions
      if (this.registry.extensions.has(config.id)) {
        return {
          success: false,
          error: {
            code: 'EXTENSION_ALREADY_LOADED',
            message: `Extension ${config.id} is already loaded`,
            timestamp: new Date(),
            severity: 'error'
          },
          duration: Date.now() - startTime
        };
      }

      // Load extension resources
      const resources = await this.loadExtensionResources(extensionPath, config);
      
      // Create extension manifest
      const manifest: ExtensionManifest = {
        config,
        status: ExtensionStatus.INACTIVE,
        path: extensionPath,
        loadedAt: new Date(),
        resources: resources as ExtensionResources,
        metadata: {}
      };

      // Register extension
      this.registry.extensions.set(config.id, manifest);
      
      return {
        success: true,
        extension: manifest,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXTENSION_LOAD_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          severity: 'error'
        },
        duration: Date.now() - startTime
      };
    }
  }

  async unloadExtension(extensionId: string): Promise<void> {
    const extension = this.registry.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    // Deactivate if active
    if (this.registry.activeExtensions.has(extensionId)) {
      await this.deactivateExtension(extensionId);
    }

    // Remove from registry
    this.registry.extensions.delete(extensionId);
    this.registry.loadedExtensions.delete(extensionId);
    this.extensionContexts.delete(extensionId);
  }

  async activateExtension(extensionId: string): Promise<void> {
    const extension = this.registry.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    if (extension.status === ExtensionStatus.ACTIVE) {
      return; // Already active
    }

    try {
      // Check dependencies
      await this.checkExtensionDependencies(extension);
      
      // Create extension context
      const context = this.createExtensionContext(extension);
      this.extensionContexts.set(extensionId, context);

      // Load and execute extension module if it has one
      if (await this.hasExtensionModule(extension.path)) {
        const module = await this.loadExtensionModule(extension.path);
        if (module && typeof (module as Record<string, unknown>).activate === 'function') {
          await ((module as Record<string, unknown>).activate as (context: ExtensionContext) => Promise<void>)(context);
        }
        this.loadedModules.set(extensionId, module);
      }

      // Update status
      extension.status = ExtensionStatus.ACTIVE;
      this.registry.activeExtensions.add(extensionId);
      this.registry.loadedExtensions.set(extensionId, extension);

    } catch (error) {
      extension.status = ExtensionStatus.ERROR;
      extension.errors = extension.errors || [];
      extension.errors.push({
        code: 'ACTIVATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        severity: 'error'
      });
      throw error;
    }
  }

  async deactivateExtension(extensionId: string): Promise<void> {
    const extension = this.registry.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    if (extension.status !== ExtensionStatus.ACTIVE) {
      return; // Already inactive
    }

    try {
      // Call deactivate function if exists
      const module = this.loadedModules.get(extensionId) as { deactivate?: () => Promise<void> | void } | undefined;
      if (module && typeof module.deactivate === 'function') {
        await module.deactivate();
      }

      // Clean up context subscriptions
      const context = this.extensionContexts.get(extensionId);
      if (context) {
        context.subscriptions.forEach(sub => sub.disposed = true);
      }

      // Update status
      extension.status = ExtensionStatus.INACTIVE;
      this.registry.activeExtensions.delete(extensionId);
      this.registry.loadedExtensions.delete(extensionId);
      this.loadedModules.delete(extensionId);
      this.extensionContexts.delete(extensionId);

    } catch (error) {
      extension.status = ExtensionStatus.ERROR;
      extension.errors = extension.errors || [];
      extension.errors.push({
        code: 'DEACTIVATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        severity: 'warning'
      });
    }
  }

  getExtension(extensionId: string): ExtensionManifest | undefined {
    return this.registry.extensions.get(extensionId);
  }

  getExtensions(criteria?: ExtensionSearchCriteria): ExtensionManifest[] {
    const extensions = Array.from(this.registry.extensions.values());
    
    if (!criteria) {
      return extensions;
    }

    return extensions.filter(ext => {
      if (criteria.type && ext.config.type !== criteria.type) return false;
      if (criteria.category && ext.config.category !== criteria.category) return false;
      if (criteria.author && ext.config.author !== criteria.author) return false;
      if (criteria.status && ext.status !== criteria.status) return false;
      if (criteria.keywords && !criteria.keywords.some(k => ext.config.keywords.includes(k))) return false;
      return true;
    });
  }

  getActiveExtensions(): ExtensionManifest[] {
    return this.getExtensions({ status: ExtensionStatus.ACTIVE });
  }

  async reloadExtension(extensionId: string): Promise<ExtensionLoadResult> {
    const extension = this.registry.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    const wasActive = extension.status === ExtensionStatus.ACTIVE;
    
    // Unload current extension
    await this.unloadExtension(extensionId);
    
    // Load extension again
    const result = await this.loadExtension(extension.path);
    
    // Reactivate if it was active before
    if (result.success && wasActive && result.extension) {
      await this.activateExtension(result.extension.config.id);
    }
    
    return result;
  }

  async validateExtension(extensionPath: string): Promise<ExtensionError[]> {
    const errors: ExtensionError[] = [];
    
    try {
      // Check if config file exists
      const configExists = await this.fileExists(`${extensionPath}/config.yaml`);
      if (!configExists) {
        errors.push({
          code: 'MISSING_CONFIG',
          message: 'Extension config.yaml file not found',
          timestamp: new Date(),
          severity: 'error'
        });
      }

      // Additional validation logic would go here
      
    } catch (error) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        timestamp: new Date(),
        severity: 'error'
      });
    }
    
    return errors;
  }

  getMetrics(): ExtensionMetrics {
    const extensions = Array.from(this.registry.extensions.values());
    
    const metrics: ExtensionMetrics = {
      totalExtensions: extensions.length,
      activeExtensions: this.registry.activeExtensions.size,
      loadedExtensions: this.registry.loadedExtensions.size,
      errorExtensions: extensions.filter(ext => ext.status === ExtensionStatus.ERROR).length,
      averageLoadTime: 0,
      extensionsByType: {} as Record<ExtensionType, number>,
      extensionsByStatus: {} as Record<ExtensionStatus, number>
    };

    // Count by type
    Object.values(ExtensionType).forEach(type => {
      metrics.extensionsByType[type] = extensions.filter(ext => ext.config.type === type).length;
    });

    // Count by status
    Object.values(ExtensionStatus).forEach(status => {
      metrics.extensionsByStatus[status] = extensions.filter(ext => ext.status === status).length;
    });

    return metrics;
  }

  private async discoverAndLoadExtensions(): Promise<void> {
    // Load extensions from the extensions directory
    const extensionPaths = [
      join(ProjectPaths.extensions, 'bmad-2d-phaser-game-dev'),
      join(ProjectPaths.extensions, 'bmad-2d-unity-game-dev'),
      join(ProjectPaths.extensions, 'bmad-infrastructure-devops')
    ];

    for (const path of extensionPaths) {
      try {
        await this.loadExtension(path);
      } catch (error) {
        console.warn(`Failed to load extension from ${path}:`, error);
      }
    }
  }

  private async activateAutoStartExtensions(): Promise<void> {
    const extensions = Array.from(this.registry.extensions.values());
    
    for (const extension of extensions) {
      if (extension.config.activationEvents.includes('*')) {
        try {
          await this.activateExtension(extension.config.id);
        } catch (error) {
          console.warn(`Failed to auto-activate extension ${extension.config.id}:`, error);
        }
      }
    }
  }

  private loadExtensionConfig(_extensionPath: string): ExtensionConfig {
    // This would load and parse the config.yaml file
    // TODO: Implement actual config loading logic
    return {
      id: `extension_${Date.now()}`,
      name: 'Mock Extension',
      version: '1.0.0',
      description: 'Mock extension for testing',
      type: ExtensionType.CUSTOM,
      category: 'development',
      author: 'BMAD',
      keywords: [],
      dependencies: [],
      engines: {},
      activationEvents: [],
      contributes: {}
    };
  }

  private loadExtensionResources(extensionPath: string, config: ExtensionConfig): {
    agents: unknown[];
    workflows: unknown[];
    tasks: unknown[];
    templates: unknown[];
    checklists: unknown[];
    data: unknown[];
  } {
    // Load extension resources (agents, workflows, etc.)
    // TODO: Implement actual resource loading logic using extensionPath and config
    console.log(`Loading resources for extension at ${extensionPath} with config:`, config.id);
    return {
      agents: [],
      workflows: [],
      tasks: [],
      templates: [],
      checklists: [],
      data: []
    };
  }

  private checkExtensionDependencies(extension: ExtensionManifest): void {
    for (const dep of extension.config.dependencies) {
      if (!dep.optional && !this.registry.extensions.has(dep.id)) {
        throw new Error(`Missing required dependency: ${dep.id}`);
      }
    }
  }

  private createExtensionContext(extension: ExtensionManifest): ExtensionContext {
    return {
      extensionId: extension.config.id,
      extensionPath: extension.path,
      globalStoragePath: `${extension.path}/.storage/global`,
      workspaceStoragePath: `${extension.path}/.storage/workspace`,
      subscriptions: [],
      configuration: {}
    };
  }

  private async hasExtensionModule(extensionPath: string): Promise<boolean> {
    return await this.fileExists(`${extensionPath}/index.ts`) || 
           await this.fileExists(`${extensionPath}/index.js`);
  }

  private loadExtensionModule(extensionPath: string): unknown {
    // This would dynamically import the extension module
    // TODO: Implement actual module loading logic using extensionPath
    console.log(`Loading module for extension at ${extensionPath}`);
    return undefined;
  }

  private fileExists(path: string): boolean {
    // This would check if file exists
    // TODO: Implement actual file existence check using path
    console.log(`Checking if file exists: ${path}`);
    return false;
  }
}

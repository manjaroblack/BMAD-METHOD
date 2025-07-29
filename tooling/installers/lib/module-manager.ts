/**
 * Module Manager - Centralized dynamic import management
 * Handles loading and caching of ES modules to reduce memory overhead
 */

interface CommonModules {
  [key: string]: unknown;
}

export class ModuleManager {
  private _cache = new Map<string, unknown>();
  private _loadingPromises = new Map<string, Promise<unknown>>();

  /**
   * Initialize all commonly used ES modules at once
   * @returns Object containing all loaded modules
   */
  async initializeCommonModules(): Promise<CommonModules> {
    const modules = await Promise.all([
      this.getModule("@std/fmt/colors"),
      this.getModule("@std/cli/spinner"),
      this.getModule("@std/cli/prompt-secret"),
    ]);

    return {
      colors: modules[0],
      spinner: modules[1],
      prompt: modules[2],
    };
  }

  /**
   * Get a module by name, with caching
   * @param moduleName - Name of the module to load
   * @returns The loaded module
   */
  async getModule(moduleName: string): Promise<unknown> {
    // Return from cache if available
    if (this._cache.has(moduleName)) {
      return this._cache.get(moduleName);
    }

    // If already loading, return the existing promise
    if (this._loadingPromises.has(moduleName)) {
      return this._loadingPromises.get(moduleName);
    }

    // Start loading the module
    const loadPromise = this._loadModule(moduleName);
    this._loadingPromises.set(moduleName, loadPromise);

    try {
      const module = await loadPromise;
      this._cache.set(moduleName, module);
      this._loadingPromises.delete(moduleName);
      return module;
    } catch (error) {
      this._loadingPromises.delete(moduleName);
      throw error;
    }
  }

  /**
   * Load a module dynamically
   * @param moduleName - Name of the module to load
   * @returns The loaded module
   */
  private async _loadModule(moduleName: string): Promise<unknown> {
    try {
      // Handle different module types
      if (moduleName.startsWith("@std/")) {
        // Deno standard library modules
        return await import(moduleName);
      } else if (moduleName.startsWith("npm:")) {
        // NPM modules via Deno
        return await import(moduleName);
      } else if (moduleName.startsWith("./") || moduleName.startsWith("../")) {
        // Relative imports
        return await import(moduleName);
      } else {
        // Try as NPM module first, then as standard library
        try {
          return await import(`npm:${moduleName}`);
        } catch {
          return await import(`@std/${moduleName}`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to load module '${moduleName}': ${(error as Error).message}`);
    }
  }

  /**
   * Clear the module cache
   */
  clearCache(): void {
    this._cache.clear();
    this._loadingPromises.clear();
  }

  /**
   * Get multiple modules at once
   * @param moduleNames - Array of module names to load
   * @returns Array of loaded modules
   */
  getModules(moduleNames: string[]): Promise<unknown[]> {
    const promises = moduleNames.map((name) => this.getModule(name));
    return Promise.all(promises);
  }

  /**
   * Check if a module is cached
   * @param moduleName - Name of the module to check
   * @returns True if module is cached
   */
  isCached(moduleName: string): boolean {
    return this._cache.has(moduleName);
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  getCacheStats(): { cached: number; loading: number; total: number } {
    return {
      cached: this._cache.size,
      loading: this._loadingPromises.size,
      total: this._cache.size + this._loadingPromises.size,
    };
  }

  /**
   * Preload modules for better performance
   * @param moduleNames - Array of module names to preload
   */
  async preloadModules(moduleNames: string[]): Promise<void> {
    await Promise.allSettled(
      moduleNames.map((name) => this.getModule(name)),
    );
  }
}

// Create and export a singleton instance
const moduleManager = new ModuleManager();
export default moduleManager;

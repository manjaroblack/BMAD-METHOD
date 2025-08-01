/**
 * Centralized Path Management for BMAD-METHOD
 * Single source of truth for all project paths
 */

import { join } from "deps";

/**
 * Central path resolver that provides consistent access to project directories
 * Uses Deno.cwd() as the project root for reliability
 */
export class ProjectPaths {
  private static _projectRoot: string | null = null;

  /**
   * Get the project root directory
   * Caches the result for performance
   */
  static get root(): string {
    if (!this._projectRoot) {
      this._projectRoot = Deno.cwd();
    }
    return this._projectRoot;
  }

  /**
   * Get the core directory path
   */
  static get core(): string {
    return join(this.root, "core");
  }

  /**
   * Get the extensions directory path
   */
  static get extensions(): string {
    return join(this.root, "extensions");
  }

  /**
   * Get the source directory path
   */
  static get src(): string {
    return join(this.root, "src");
  }

  /**
   * Get the tooling directory path
   */
  static get tooling(): string {
    return join(this.root, "tooling");
  }

  /**
   * Get the docs directory path
   */
  static get docs(): string {
    return join(this.root, "docs");
  }

  /**
   * Get the config directory path
   */
  static get config(): string {
    return join(this.root, "config");
  }

  /**
   * Get the tests directory path
   */
  static get tests(): string {
    return join(this.root, "tests");
  }

  /**
   * Get the shared directory path
   */
  static get shared(): string {
    return join(this.root, "shared");
  }

  /**
   * Get path to a specific agent file
   */
  static getAgentPath(agentId: string): string {
    return join(this.core, "agents", `${agentId}.md`);
  }

  /**
   * Get path to a specific workflow file
   */
  static getWorkflowPath(workflowId: string): string {
    return join(this.core, "workflows", `${workflowId}.md`);
  }

  /**
   * Get path to a specific task file
   */
  static getTaskPath(taskId: string): string {
    return join(this.core, "tasks", `${taskId}.md`);
  }

  /**
   * Get path to a specific extension
   */
  static getExtensionPath(extensionId: string): string {
    return join(this.extensions, extensionId);
  }

  /**
   * Get path to core config file
   */
  static get coreConfig(): string {
    return join(this.core, "core-config.yaml");
  }

  /**
   * Get path to main config file
   */
  static get mainConfig(): string {
    return join(this.config, "bmad.config.yaml");
  }

  /**
   * Get path to the flattener tool
   */
  static get flattenerTool(): string {
    return join(this.tooling, "user-tools", "flattener", "main.ts");
  }

  /**
   * Clear the cached project root (useful for testing)
   */
  static clearCache(): void {
    this._projectRoot = null;
  }
}

// Export convenience constants for backward compatibility
export const PROJECT_ROOT = ProjectPaths.root;
export const CORE_PATH = ProjectPaths.core;
export const EXTENSIONS_PATH = ProjectPaths.extensions;
export const SRC_PATH = ProjectPaths.src;
export const TOOLING_PATH = ProjectPaths.tooling;
export const DOCS_PATH = ProjectPaths.docs;
export const CONFIG_PATH = ProjectPaths.config;

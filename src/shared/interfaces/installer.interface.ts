/**
 * Installer service interface definitions for BMAD-METHOD
 * Defines contracts for installation-related services
 */

import type { 
  InstallConfig, 
  InstallationState, 
  InstallationContext,
  FileIntegrityResult,
  InstallationResult,
  ExpansionPack
} from 'deps';

export interface IInstaller {
  /**
   * Perform a complete installation based on configuration
   */
  install(config: InstallConfig): Promise<InstallationResult>;

  /**
   * Update an existing installation
   */
  update(options?: Record<string, unknown>): Promise<void>;

  /**
   * Get the current installation status
   */
  getInstallationStatus(directory: string): Promise<Record<string, unknown>>;

  /**
   * Find existing installation directory
   */
  findInstallation(): Promise<string | null>;
}

export interface IInstallationDetector {
  /**
   * Detect the current state of an installation
   */
  detectInstallationState(installDir: string): Promise<InstallationState>;

  /**
   * Check file integrity of installation
   */
  checkFileIntegrity(
    installDir: string, 
    manifest?: Record<string, unknown>
  ): Promise<FileIntegrityResult>;

  /**
   * Compare two version strings
   */
  compareVersions(version1: string, version2: string): number;
}

export interface IInstallationHandler {
  /**
   * Handle installation based on context
   */
  handle(context: InstallationContext): Promise<void>;

  /**
   * Check if this handler can process the given context
   */
  canHandle(context: InstallationContext): boolean;
}

export interface ICoreInstaller {
  /**
   * Install core BMAD components
   */
  installCore(installDir: string): Promise<void>;

  /**
   * Update core BMAD components
   */
  updateCore(installDir: string): Promise<void>;

  /**
   * Get current core version
   */
  getCoreVersion(): string;
}

export interface IExpansionPackService {
  /**
   * Get available expansion packs
   */
  getAvailableExpansionPacks(): Promise<ExpansionPack[]>;

  /**
   * Install selected expansion packs
   */
  installExpansionPacks(
    installDir: string,
    selectedPacks: string[],
    config?: InstallConfig
  ): Promise<string[]>;

  /**
   * Detect installed expansion packs
   */
  detectExpansionPacks(installDir: string): Promise<Record<string, unknown>>;
}

export interface IManifestService {
  /**
   * Create installation manifest
   */
  createInstallManifest(installDir: string): Promise<void>;

  /**
   * Read installation manifest
   */
  readInstallManifest(installDir: string): Promise<Record<string, unknown> | null>;

  /**
   * Update installation manifest
   */
  updateInstallManifest(installDir: string, updates: Record<string, unknown>): Promise<void>;
}

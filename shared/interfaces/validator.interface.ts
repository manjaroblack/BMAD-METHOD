/**
 * Validator service interface definitions for BMAD-METHOD
 * Defines contracts for validation services
 */

import type { InstallConfig, ValidationConfig } from 'deps';

export interface IValidator {
  /**
   * Validate installation configuration
   */
  validateInstallConfig(config: InstallConfig): Promise<boolean>;

  /**
   * Validate directory structure
   */
  validateDirectoryStructure(directory: string): Promise<boolean>;

  /**
   * Validate dependencies
   */
  validateDependencies(dependencies: string[]): Promise<boolean>;
}

export interface IConfigValidator {
  /**
   * Validate YAML configuration files
   */
  validateYamlConfig(configPath: string): Promise<boolean>;

  /**
   * Validate JSON configuration files
   */
  validateJsonConfig(configPath: string): Promise<boolean>;

  /**
   * Validate configuration against schema
   */
  validateAgainstSchema(config: unknown, schemaPath: string): Promise<boolean>;
}

export interface IIntegrityValidator {
  /**
   * Validate file checksums
   */
  validateFileChecksums(filePaths: string[], manifestPath: string): Promise<boolean>;

  /**
   * Validate installation integrity
   */
  validateInstallationIntegrity(installDir: string): Promise<boolean>;

  /**
   * Generate file checksums
   */
  generateChecksums(filePaths: string[]): Promise<Record<string, string>>;
}

export interface IValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  context?: Record<string, unknown>;
}

export interface IValidationRule {
  name: string;
  description: string;
  validate(input: unknown, config?: ValidationConfig): Promise<IValidationResult>;
}

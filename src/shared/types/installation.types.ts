/**
 * Installation-related type definitions for BMAD-METHOD
 * Extracted from installer.ts as part of modularization effort
 */

export interface InstallConfig {
  directory?: string;
  selectedPacks?: string[];
  ides?: string[];
  full?: boolean;
  expansionOnly?: boolean;
  expansionPacks?: string[];
}

export interface InstallationState {
  type: string;
  manifest?: Record<string, unknown>;
  expansionPacks?: Record<string, unknown>;
  integrity?: Record<string, unknown>;
}

export interface FileIntegrityResult {
  missing: string[];
  modified: string[];
}

export interface InstallationManifest {
  version: string;
  timestamp: string;
  coreVersion: string;
  expansionPacks?: Record<string, unknown>;
  files?: string[];
  integrity?: Record<string, unknown>;
}

export type InstallationType =
  | "fresh"
  | "update"
  | "repair"
  | "unknown"
  | "existing-v5";

export interface InstallationContext {
  config: InstallConfig;
  installDir: string;
  state: InstallationState;
  type: InstallationType;
}

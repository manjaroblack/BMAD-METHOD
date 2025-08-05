/**
 * Expansion Pack type definitions for BMAD-METHOD
 * Extracted from installer.ts as part of modularization effort
 */

export interface ExpansionPack {
  id: string;
  shortTitle: string;
  version: string;
  description?: string;
  dependencies?: string[];
}

export interface ExpansionPackInfo {
  manifest?: {
    version?: string;
    shortTitle?: string;
  };
  version?: string;
  shortTitle?: string;
}

export interface ExpansionPackManifest {
  id: string;
  version: string;
  shortTitle: string;
  description?: string;
  dependencies?: string[];
  files?: string[];
  installPath?: string;
  timestamp?: string;
}

export interface ExpansionPackDependency {
  packId: string;
  version: string;
  optional?: boolean;
}

export interface ExpansionPackInstallResult {
  success: boolean;
  packId: string;
  version: string;
  installedFiles: string[];
  errors?: string[];
}

export type ExpansionPackStatus =
  | "available"
  | "installed"
  | "outdated"
  | "missing-dependencies"
  | "corrupted";

export interface ExpansionPackContext {
  pack: ExpansionPack;
  installDir: string;
  status: ExpansionPackStatus;
  resolvedDependencies?: ExpansionPackDependency[];
}

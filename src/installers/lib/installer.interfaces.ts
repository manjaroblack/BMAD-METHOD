// Interfaces for the BMad Method installer refactoring
// These interfaces define the contracts for all services

import type {
  ILogger,
  InstallationState,
  InstallConfig,
} from "deps";

export interface IPromptHandler {
  promptInstallation(): Promise<void>;
  // Add other prompt-related methods as needed
}

export interface IInstallerService {
  logger: ILogger;
  install(config: InstallConfig): Promise<void>;
  // Add other installer service methods as needed
}

export interface IFileManager {
  ensureDir(path: string): Promise<void>;
  copy(src: string, dest: string): Promise<void>;
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
  readDir(path: string): AsyncIterable<Deno.DirEntry>;
  exists(path: string): Promise<boolean>;
  // Add other file-related methods as needed
}

export interface IIdeSetup {
  setupIdeConfigurations(
    installDir: string,
    ides: string[],
    spinner?: unknown,
  ): Promise<void>;
  // Add other IDE setup methods as needed
}

export interface IConfigLoader {
  load(): Promise<Record<string, unknown>>;
  getAvailableExpansionPacks(): Promise<ExpansionPack[]>;
  // Add other config loading methods as needed
}

export interface ExpansionPack {
  id: string;
  shortTitle: string;
  version: string;
  description?: string;
  dependencies?: string[];
}

export interface IResourceLocator {
  getBmadCorePath(): string;
  getExpansionPacksPath(): string;
  getExpansionPackPath(packId: string): string;
  // Add other resource location methods as needed
}

export interface IInstallerValidator {
  detectInstallationState(installDir: string): Promise<InstallationState>;
  checkFileIntegrity(
    installDir: string,
    manifest: Record<string, unknown> | undefined,
  ): Promise<{ missing: string[]; modified: string[] }>;
  // Add other validation methods as needed
}

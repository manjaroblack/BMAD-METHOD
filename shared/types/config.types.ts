/**
 * Configuration type definitions for BMAD-METHOD
 * Extracted from installer.ts as part of modularization effort
 */

export interface BmadConfig {
  version?: string;
  coreVersion?: string;
  installDir?: string;
  selectedPacks?: string[];
  enabledIdes?: string[];
  settings?: Record<string, unknown>;
}

export interface AgentConfig {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  settings?: Record<string, unknown>;
  dependencies?: string[];
}

export interface IdeConfig {
  name: string;
  enabled: boolean;
  configPath?: string;
  version?: string;
  settings?: Record<string, unknown>;
}

export interface ValidationConfig {
  strictMode?: boolean;
  validateDependencies?: boolean;
  validateIntegrity?: boolean;
  allowPartialInstall?: boolean;
}

export interface PerformanceConfig {
  enableMonitoring?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  maxConcurrentOperations?: number;
  timeoutMs?: number;
}

export interface SpinnerConfig {
  enabled?: boolean;
  style?: 'dots' | 'line' | 'arrow' | 'bouncingBar';
  color?: string;
  text?: string;
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole?: boolean;
  enableFile?: boolean;
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

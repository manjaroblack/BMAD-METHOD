/**
 * Extension framework types and interfaces for the BMAD-METHOD extension system
 */

export enum ExtensionType {
  GAME_DEVELOPMENT = 'game-development',
  INFRASTRUCTURE = 'infrastructure',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  WEB = 'web',
  CUSTOM = 'custom'
}

export enum ExtensionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOADING = 'loading',
  ERROR = 'error',
  DISABLED = 'disabled'
}

export interface ExtensionConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  type: ExtensionType;
  category: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords: string[];
  dependencies: ExtensionDependency[];
  engines: Record<string, string>;
  scripts?: Record<string, string>;
  activationEvents: string[];
  contributes: ExtensionContributions;
}

export interface ExtensionDependency {
  id: string;
  version: string;
  optional?: boolean;
}

export interface ExtensionContributions {
  agents?: string[];
  workflows?: string[];
  tasks?: string[];
  templates?: string[];
  checklists?: string[];
  commands?: ExtensionCommand[];
  configuration?: ExtensionConfigurationSchema[];
}

export interface ExtensionCommand {
  command: string;
  title: string;
  category?: string;
  description?: string;
  icon?: string;
}

export interface ExtensionConfigurationSchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: string | number | boolean | object | unknown[];
  description: string;
  required?: boolean;
  enum?: (string | number)[];
}

export interface ExtensionManifest {
  config: ExtensionConfig;
  status: ExtensionStatus;
  path: string;
  loadedAt?: Date;
  lastModified?: Date;
  errors?: ExtensionError[];
  resources: ExtensionResources;
  metadata: Record<string, unknown>;
}

export interface ExtensionResources {
  agents: ExtensionAgentResource[];
  workflows: ExtensionWorkflowResource[];
  tasks: ExtensionTaskResource[];
  templates: ExtensionTemplateResource[];
  checklists: ExtensionChecklistResource[];
  data: ExtensionDataResource[];
}

export interface ExtensionAgentResource {
  id: string;
  path: string;
  config: Record<string, unknown>;
  type: string;
  enabled: boolean;
}

export interface ExtensionWorkflowResource {
  id: string;
  path: string;
  definition: Record<string, unknown>;
  type: string;
  enabled: boolean;
}

export interface ExtensionTaskResource {
  id: string;
  path: string;
  definition: Record<string, unknown>;
  type: string;
  enabled: boolean;
}

export interface ExtensionTemplateResource {
  id: string;
  path: string;
  content: string;
  type: string;
  category: string;
  enabled: boolean;
}

export interface ExtensionChecklistResource {
  id: string;
  path: string;
  items: ChecklistItem[];
  category: string;
  enabled: boolean;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  dependencies?: string[];
}

export interface ExtensionDataResource {
  id: string;
  path: string;
  content: string;
  type: string;
  category: string;
}

export interface ExtensionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
}

export interface ExtensionContext {
  extensionId: string;
  extensionPath: string;
  globalStoragePath: string;
  workspaceStoragePath: string;
  subscriptions: ExtensionSubscription[];
  configuration: Record<string, unknown>;
}

export interface ExtensionSubscription {
  id: string;
  type: string;
  handler: (...args: unknown[]) => void;
  disposed: boolean;
}

export interface ExtensionActivationContext {
  extension: ExtensionManifest;
  globalState: Record<string, unknown>;
  workspaceState: Record<string, unknown>;
  subscriptions: ExtensionSubscription[];
  logger: ExtensionLogger;
}

export interface ExtensionLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

export interface ExtensionRegistry {
  extensions: Map<string, ExtensionManifest>;
  activeExtensions: Set<string>;
  loadedExtensions: Map<string, ExtensionManifest>;
}

export interface ExtensionLoadResult {
  success: boolean;
  extension?: ExtensionManifest;
  error?: ExtensionError;
  duration: number;
}

export interface ExtensionSearchCriteria {
  type?: ExtensionType;
  category?: string;
  keywords?: string[];
  author?: string;
  status?: ExtensionStatus;
}

export interface ExtensionMetrics {
  totalExtensions: number;
  activeExtensions: number;
  loadedExtensions: number;
  errorExtensions: number;
  averageLoadTime: number;
  extensionsByType: Record<ExtensionType, number>;
  extensionsByStatus: Record<ExtensionStatus, number>;
}

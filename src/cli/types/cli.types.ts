/**
 * CLI framework types and interfaces for the BMAD-METHOD tooling system
 */

// deno-lint-ignore-file no-explicit-any

export interface CommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
  options: CommandOption[];
  subcommands?: CommandDefinition[];
  handler: CommandHandler;
  examples?: CommandExample[];
  category?: string;
  hidden?: boolean;
}

export interface CommandOption {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  short?: string;
  required?: boolean;
  defaultValue?: unknown;
  choices?: unknown[];
  validator?: (value: any) => boolean | string;
}

export interface CommandExample {
  description: string;
  command: string;
}

export interface CommandContext {
  args: string[];
  options: Record<string, any>;
  workingDir: string;
  config: CLIConfig;
  logger: CLILogger;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  exitCode: number;
}

export type CommandHandler = (context: CommandContext) => Promise<CommandResult>;

export interface CLIConfig {
  rootDir: string;
  outputDir: string;
  tempDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  verbose: boolean;
  dryRun: boolean;
  concurrency: number;
}

export interface CLILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  success(message: string, ...args: any[]): void;
}

export interface CLIPlugin {
  name: string;
  version: string;
  description: string;
  commands: CommandDefinition[];
  initialize?: (cli: ICLI) => Promise<void>;
  cleanup?: () => Promise<void>;
}

export interface ICLI {
  registerCommand(command: CommandDefinition): void;
  registerPlugin(plugin: CLIPlugin): Promise<void>;
  executeCommand(commandName: string, args: string[], options: Record<string, any>): Promise<CommandResult>;
  getCommands(): CommandDefinition[];
  getCommand(name: string): CommandDefinition | undefined;
  configure(config: Partial<CLIConfig>): void;
  getConfig(): CLIConfig;
}

export interface CLIMiddleware {
  name: string;
  priority: number;
  execute(context: CommandContext, next: () => Promise<CommandResult>): Promise<CommandResult>;
}

export interface BuildOptions {
  agentsOnly?: boolean;
  teamsOnly?: boolean;
  expansionsOnly?: boolean;
  noExpansions?: boolean;
  clean?: boolean;
  watch?: boolean;
  verbose?: boolean;
}

export interface VersionBumpOptions {
  type: 'patch' | 'minor' | 'major' | 'prerelease';
  target: 'all' | 'core' | 'expansion' | string;
  dryRun?: boolean;
  force?: boolean;
}

export interface ValidationOptions {
  quick?: boolean;
  fix?: boolean;
  outputFormat?: 'json' | 'text' | 'junit';
  failFast?: boolean;
}

export enum CLIEventType {
  COMMAND_START = 'command:start',
  COMMAND_SUCCESS = 'command:success',
  COMMAND_FAILURE = 'command:failure',
  COMMAND_END = 'command:end',
  PLUGIN_LOADED = 'plugin:loaded',
  CONFIG_CHANGED = 'config:changed'
}

export interface CLIEvent {
  type: CLIEventType;
  timestamp: Date;
  data?: any;
}

export type CLIEventListener = (event: CLIEvent) => void;

export interface CLIMetrics {
  commandsExecuted: number;
  successfulCommands: number;
  failedCommands: number;
  averageExecutionTime: number;
  mostUsedCommand: string;
  pluginsLoaded: number;
}

export interface CLIHelp {
  generateCommandHelp(command: CommandDefinition): string;
  generateOverviewHelp(commands: CommandDefinition[]): string;
  generatePluginHelp(plugin: CLIPlugin): string;
}

export interface CLIValidation {
  validateCommand(command: CommandDefinition): ValidationResult;
  validateOptions(options: Record<string, any>, definitions: CommandOption[]): ValidationResult;
  validateArgs(args: string[], command: CommandDefinition): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field?: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field?: string;
  message: string;
  code: string;
}

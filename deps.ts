// Central dependency management for BMAD-METHOD
// All external dependencies are re-exported from this file
// This follows Deno conventions for dependency management

// Cliffy CLI Framework - Latest stable versions from JSR
export { Command } from "jsr:@cliffy/command@1.0.0-rc.8";
export { Checkbox, Input, Select } from "jsr:@cliffy/prompt@1.0.0-rc.8";
export * as ansi from "jsr:@cliffy/ansi@1.0.0-rc.8";

// Deno Standard Library - Latest versions from JSR
// CLI utilities
export { parseArgs } from "jsr:@std/cli@1.0.21";
export { Spinner } from "jsr:@std/cli@1.0.21/unstable-spinner";

// File system utilities
export { copy, ensureDir, exists, expandGlob, walk } from "jsr:@std/fs@1.0.19";

// Path utilities
export { basename, dirname, extname, join, relative, resolve } from "jsr:@std/path@1.1.1";
export { SEPARATOR } from "jsr:@std/path@1.1.1/posix";

// Formatting utilities
export { blue, bold, cyan, gray, green, magenta, red, yellow } from "jsr:@std/fmt@1.0.8/colors";
export { format as formatBytes } from "jsr:@std/fmt@1.0.8/bytes";

// YAML parsing and serialization
export { parse as parseYaml, stringify as stringifyYaml } from "jsr:@std/yaml@1.0.9";

// Additional standard library modules that might be used
export { assert, assertEquals } from "jsr:@std/assert@1.0.13";
export { delay } from "jsr:@std/async@1.0.13";
export { deepMerge } from "jsr:@std/collections@1.1.2";

// Local tooling modules - re-exported for centralized dependency management
// Error handling and logging
export {
  asyncHandler,
  BMadError,
  BuildError,
  ConfigError,
  EXIT_CODES,
  handleError,
  LOG_LEVELS,
  Logger,
  setupGracefulShutdown,
  validateDirectory,
  validateFileExists,
  validateRequired,
  ValidationError,
} from "./tooling/lib/error-handler.ts";

// Performance optimization utilities
export {
  CacheManager,
  DependencyCache,
  ParallelProcessor,
} from "./tooling/lib/performance-optimizer.ts";

// Deno version management
export { default as DenoVersionManager } from "./tooling/lib/node-version-manager.ts";

// YAML utilities
export { extractYamlFromAgent } from "./tooling/lib/yaml-utils.ts";

// Dependency resolution
export { DependencyResolver } from "./tooling/lib/dependency-resolver.ts";

// Build tools
export { WebBuilder } from "./tooling/build-tools/web-builder.ts";

// Dependency management
export { default as DependencyManager } from "./tooling/scripts/manage-dependencies.ts";

// Core Services - Agent Management
export {
  AgentManager,
  type IAgentManager,
  type AgentSystemStatus,
  type TeamWorkflowResult
} from "./src/core/services/agent-manager.service.ts";

// Core Services - Extension Management
export {
  ExtensionManager,
  type IExtensionManager
} from "./src/core/extensions/services/extension-manager.service.ts";

// Extension Types
export {
  ExtensionType,
  ExtensionStatus,
  type ExtensionConfig,
  type ExtensionDependency,
  type ExtensionContributions,
  type ExtensionCommand,
  type ExtensionConfigurationSchema,
  type ExtensionManifest,
  type ExtensionResources,
  type ExtensionAgentResource,
  type ExtensionWorkflowResource,
  type ExtensionTaskResource,
  type ExtensionTemplateResource,
  type ExtensionChecklistResource,
  type ChecklistItem,
  type ExtensionDataResource,
  type ExtensionError,
  type ExtensionContext,
  type ExtensionSubscription,
  type ExtensionActivationContext,
  type ExtensionLogger,
  type ExtensionRegistry,
  type ExtensionLoadResult,
  type ExtensionSearchCriteria,
  type ExtensionMetrics
} from "./src/core/extensions/types/extension.types.ts";

// Core Agents
export {
  type IAgent
} from "./src/core/agents/base/base-agent.ts";

export {
  AgentRegistry,
  type IAgentRegistry
} from "./src/core/agents/registry/agent-registry.ts";

// Agent Types
export {
  type AgentConfig,
  AgentRole,
  type AgentTask,
  type AgentResponse,
  AgentStatus,
  type AgentTeam,
  type AgentState
} from "./src/core/agents/types/agent.types.ts";

// CLI Framework
export {
  CLIFramework
} from "./tooling/cli/core/cli-framework.ts";

// CLI Types
export {
  type CommandDefinition,
  type CommandOption,
  type CommandExample,
  type CommandContext,
  type CommandResult,
  type CommandHandler,
  type CLIConfig,
  type CLILogger,
  type CLIPlugin,
  type ICLI,
  type CLIMiddleware,
  type BuildOptions,
  type VersionBumpOptions,
  type ValidationOptions,
  CLIEventType,
  type CLIEvent,
  type CLIEventListener,
  type CLIMetrics,
  type CLIHelp,
  type CLIValidation,
  type ValidationResult,
  type ValidationError as CLIValidationError,
  type ValidationWarning
} from "./tooling/cli/types/cli.types.ts";

// CLI Commands
export {
  BuildCommandPlugin
} from "./tooling/cli/commands/build.command.ts";

export {
  VersionManagementCommandPlugin
} from "./tooling/cli/commands/version-management.command.ts";

// Shared Types
export {
  type InstallConfig,
  type InstallationState,
  type FileIntegrityResult,
  type InstallationManifest,
  type InstallationType,
  type InstallationContext
} from "./shared/types/installation.types.ts";

export {
  type InstallationResult
} from "./shared/types/installation-result.types.ts";

export {
  type BmadConfig,
  type AgentConfig as AgentConfigSettings,
  type IdeConfig,
  type ValidationConfig,
  type LoggerConfig,
  type SpinnerConfig,
  type PerformanceConfig
} from "./shared/types/config.types.ts";

export {
  type ExpansionPack,
  type ExpansionPackInfo,
  type ExpansionPackManifest,
  type ExpansionPackDependency,
  type ExpansionPackInstallResult,
  type ExpansionPackStatus,
  type ExpansionPackContext
} from "./shared/types/expansion-pack.types.ts";

// Shared Interfaces
export {
  type IInstaller,
  type IInstallationDetector,
  type IInstallationHandler,
  type ICoreInstaller,
  type IExpansionPackService,
  type IManifestService
} from "./shared/interfaces/installer.interface.ts";

export {
  type IValidator,
  type IConfigValidator,
  type IIntegrityValidator,
  type IValidationResult,
  type IValidationRule
} from "./shared/interfaces/validator.interface.ts";

export {
  type IFileManager,
  type IFileSystemService,
  type IFileService,
  type FileStats,
  type GlobOptions,
  type IFileOperations,
  type FileCopyOperation,
  type FileCopyResult
} from "./shared/interfaces/file-manager.interface.ts";

// Shared Services
export {
  logger,
  type ILogger
} from "./shared/services/core/logger.service.ts";

export {
  createSpinner,
  SpinnerService,
  type ISpinner,
  spinner
} from "./shared/services/core/spinner.service.ts";

export {
  PerformanceMonitor,
  performanceMonitor,
  type IPerformanceMonitor,
  type PerformanceMetric,
  type PerformanceMeasure
} from "./shared/services/core/performance.service.ts";

export {
  fileSystemService
} from "./shared/services/utils/file-system.service.ts";

// Shared Errors
export {
  InstallationError,
  DirectoryNotFoundError,
  InsufficientPermissionsError,
  CorruptedInstallationError,
  UnsupportedVersionError,
  DependencyResolutionError,
  InstallationTimeoutError,
  IntegrityCheckFailedError
} from "./shared/errors/installation.errors.ts";

// Installer Services
export {
  InstallerOrchestrator,
  createInstallerOrchestrator
} from "./tooling/installers/core/installer-orchestrator.ts";

export {
  InstallationDetector
} from "./tooling/installers/core/installation-detector.ts";

export {
  FreshInstallHandler
} from "./tooling/installers/handlers/fresh-install-handler.ts";

export {
  UpdateHandler
} from "./tooling/installers/handlers/update-handler.ts";

export {
  RepairHandler
} from "./tooling/installers/handlers/repair-handler.ts";

export {
  ManifestService
} from "./tooling/installers/services/manifest-service.ts";

export {
  ExpansionPackService
} from "./tooling/installers/services/expansion-pack-service.ts";

// Resource Locator and Config Loader
export { default as resourceLocator } from "./tooling/installers/lib/resource-locator.ts";
export { default as configLoader } from "./tooling/installers/lib/config-loader.ts";

export {
  IntegrityChecker
} from "./tooling/installers/services/integrity-checker.ts";

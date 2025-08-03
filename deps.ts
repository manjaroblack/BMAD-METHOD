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
export { copy, ensureDir, expandGlob, walk } from "jsr:@std/fs@1.0.19";

// Path utilities
export { basename, dirname, extname, join, relative, resolve } from "jsr:@std/path@1.1.1";
export { SEPARATOR } from "jsr:@std/path@1.1.1/posix";

// Formatting utilities
export { blue, bold, cyan, gray, green, magenta, red, yellow } from "jsr:@std/fmt@1.0.8/colors";
export { format as formatBytes } from "jsr:@std/fmt@1.0.8/bytes";

// YAML parsing and serialization
export { parse as parseYaml, stringify as stringifyYaml } from "jsr:@std/yaml@1.0.9";

// Additional standard library modules that might be used
export { assert, assertEquals, assertExists, assertRejects } from "jsr:@std/assert@1.0.13";
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
} from "./src/lib/error-handler.ts";

// Performance optimization utilities
export {
  CacheManager,
  DependencyCache,
  ParallelProcessor,
} from "./src/lib/performance-optimizer.ts";

// Deno version management
export { default as DenoVersionManager } from "./src/lib/node-version-manager.ts";

// YAML utilities
export { extractYamlFromAgent } from "./src/lib/yaml-utils.ts";

// Dependency resolution
export { DependencyResolver } from "./src/lib/dependency-resolver.ts";

// Build tools
export { WebBuilder } from "./src/build-tools/web-builder.ts";

// Dependency management
export { default as DependencyManager } from "./src/scripts/manage-dependencies.ts";

// Installer module
export { default as Installer } from "./src/installers/lib/installer.ts";

// Core Services - Agent Management
export {
  AgentManager,
  type AgentSystemStatus,
  type IAgentManager,
  type TeamWorkflowResult,
} from "./src/shared/services/agent-manager.service.ts";

// Core Services - Extension Management
export {
  ExtensionManager,
  type IExtensionManager,
} from "./src/shared/extensions/extension-manager.service.ts";

export {
  ExtensionLoader,
  type IExtensionLoader,
} from "./src/shared/extensions/extension-loader.ts";

export {
  ExtensionRegistry as ExtensionRegistryService,
  type IExtensionRegistry,
} from "./src/shared/extensions/extension-registry.service.ts";

// Extension Types
export {
  type ChecklistItem,
  type ExtensionActivationContext,
  type ExtensionAgentResource,
  type ExtensionChecklistResource,
  type ExtensionCommand,
  type ExtensionConfig,
  type ExtensionConfigurationSchema,
  type ExtensionContext,
  type ExtensionContributions,
  type ExtensionDataResource,
  type ExtensionDependency,
  type ExtensionError,
  type ExtensionLoadResult,
  type ExtensionLogger,
  type ExtensionManifest,
  type ExtensionMetrics,
  type ExtensionRegistry,
  type ExtensionResources,
  type ExtensionSearchCriteria,
  ExtensionStatus,
  type ExtensionSubscription,
  type ExtensionTaskResource,
  type ExtensionTemplateResource,
  ExtensionType,
  type ExtensionWorkflowResource,
} from "./src/shared/extensions/extension.types.ts";

// Core Agents
export { type IAgent } from "./src/shared/agents/base-agent.ts";

export { AgentRegistry, type IAgentRegistry } from "./src/shared/agents/agent-registry.ts";

// Agent Types
export {
  type AgentConfig,
  type AgentResponse,
  AgentRole,
  type AgentState,
  AgentStatus,
  type AgentTask,
  type AgentTeam,
} from "./src/shared/agents/agent.types.ts";

// CLI Framework
export { CLIFramework } from "./src/cli/core/cli-framework.ts";

// CLI Types
export {
  type BuildOptions,
  type CLIConfig,
  type CLIEvent,
  type CLIEventListener,
  CLIEventType,
  type CLIHelp,
  type CLILogger,
  type CLIMetrics,
  type CLIMiddleware,
  type CLIPlugin,
  type CLIValidation,
  type CommandContext,
  type CommandDefinition,
  type CommandExample,
  type CommandHandler,
  type CommandOption,
  type CommandResult,
  type ICLI,
  type ValidationError as CLIValidationError,
  type ValidationOptions,
  type ValidationResult,
  type ValidationWarning,
  type VersionBumpOptions,
} from "./src/cli/types/cli.types.ts";

// CLI Commands
export { BuildCommandPlugin } from "./src/cli/commands/build.command.ts";

export { VersionManagementCommandPlugin } from "./src/cli/commands/version-management.command.ts";

// Shared Types
export {
  type FileIntegrityResult,
  type InstallationContext,
  type InstallationManifest,
  type InstallationState,
  type InstallationType,
  type InstallConfig,
} from "./src/shared/types/installation.types.ts";

export { type InstallationResult } from "./src/shared/types/installation-result.types.ts";

// Centralized Path Management
export {
  CONFIG_PATH,
  CORE_PATH,
  DOCS_PATH,
  EXTENSIONS_PATH,
  PROJECT_ROOT,
  ProjectPaths,
  SRC_PATH,
  TOOLING_PATH,
} from "./src/shared/paths.ts";

export {
  type AgentConfig as AgentConfigSettings,
  type BmadConfig,
  type IdeConfig,
  type LoggerConfig,
  type PerformanceConfig,
  type SpinnerConfig,
  type ValidationConfig,
} from "./src/shared/types/config.types.ts";

export {
  type ExpansionPack,
  type ExpansionPackContext,
  type ExpansionPackDependency,
  type ExpansionPackInfo,
  type ExpansionPackInstallResult,
  type ExpansionPackManifest,
  type ExpansionPackStatus,
} from "./src/shared/types/expansion-pack.types.ts";

// Shared Interfaces
export {
  type ICoreInstaller,
  type IExpansionPackService,
  type IInstallationDetector,
  type IInstallationHandler,
  type IInstaller,
  type IManifestService,
} from "./src/shared/interfaces/installer.interface.ts";

export {
  type IConfigValidator,
  type IIntegrityValidator,
  type IValidationResult,
  type IValidationRule,
  type IValidator,
} from "./src/shared/interfaces/validator.interface.ts";

export {
  type FileCopyOperation,
  type FileCopyResult,
  type FileStats,
  type GlobOptions,
  type IFileManager,
  type IFileOperations,
  type IFileService,
  type IFileSystemService,
} from "./src/shared/interfaces/file-manager.interface.ts";

// Shared Services
export { type ILogger, logger } from "./src/shared/services/core/logger.service.ts";

export {
  createSpinner,
  type ISpinner,
  spinner,
  SpinnerService,
} from "./src/shared/services/core/spinner.service.ts";

export {
  type IPerformanceMonitor,
  type PerformanceMeasure,
  type PerformanceMetric,
  PerformanceMonitor,
  performanceMonitor,
} from "./src/shared/services/core/performance.service.ts";

export { fileSystemService } from "./src/shared/services/utils/file-system.service.ts";

// Shared Errors
export {
  CorruptedInstallationError,
  DependencyResolutionError,
  DirectoryNotFoundError,
  InstallationError,
  InstallationTimeoutError,
  InsufficientPermissionsError,
  IntegrityCheckFailedError,
  UnsupportedVersionError,
} from "./src/shared/errors/installation.errors.ts";

// Installer Services
export {
  createInstallerOrchestrator,
  InstallerOrchestrator,
} from "./src/installers/core/installer-orchestrator.ts";

export { InstallationDetector } from "./src/installers/core/installation-detector.ts";

export { FreshInstallHandler } from "./src/installers/handlers/fresh-install-handler.ts";

export { UpdateHandler } from "./src/installers/handlers/update-handler.ts";

export { RepairHandler } from "./src/installers/handlers/repair-handler.ts";

export { ManifestService } from "./src/installers/services/manifest-service.ts";

export { ExpansionPackService } from "./src/installers/services/expansion-pack-service.ts";

// Resource Locator and Config Loader
export { default as resourceLocator } from "./src/installers/lib/resource-locator.ts";
export { default as configLoader } from "./src/installers/lib/config-loader.ts";

export { IntegrityChecker } from "./src/installers/services/integrity-checker.ts";

// Workflow Types
export {
  type StepExecution,
  StepStatus,
  type WorkflowAction,
  type WorkflowCondition,
  type WorkflowContext,
  type WorkflowDefinition,
  type WorkflowEvent,
  type WorkflowExecution,
  type WorkflowMetrics,
  WorkflowStatus,
  type WorkflowStep,
  type WorkflowTemplate,
  WorkflowType,
} from "./src/shared/workflows/workflow.types.ts";

// Validation Errors
export {
  ConfigValidationError,
  InvalidValueError,
  RequiredFieldMissingError,
  SchemaValidationError,
  ValidationCollectionError,
  ValidationError,
} from "./src/shared/errors/validation.errors.ts";

// Task Types
export {
  type Task,
  type TaskArtifact,
  type TaskCheckpoint,
  type TaskDefinition,
  type TaskDependency,
  type TaskError,
  type TaskExecution,
  type TaskFilter,
  type TaskLog,
  type TaskMetrics,
  type TaskOutputDefinition,
  type TaskParameterDefinition,
  TaskPriority,
  type TaskQueue,
  type TaskResult,
  type TaskSchedule,
  TaskStatus,
  type TaskTemplate,
  TaskType,
  type ValidationRule,
} from "./src/shared/tasks/task.types.ts";

// Task Services
export {
  TaskExecutor,
  type ITaskExecutor,
} from "./src/shared/tasks/task-executor.ts";

export {
  TaskScheduler,
  type ITaskScheduler,
} from "./src/shared/tasks/task-scheduler.ts";

// Workflow Services
export {
  WorkflowEngine,
  type IWorkflowEngine,
} from "./src/shared/workflows/workflow-engine.ts";

// Safe filesystem utilities
export { safeExists, safeIsDirectory, safeIsFile } from "./src/installers/utils/safe-fs.ts";

// Flattener tool
export { default as flattener } from "./tooling/user-tools/flattener/main.ts";

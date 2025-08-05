// Central dependency management for BMAD-METHOD
// All external dependencies are re-exported from this file
// This follows Deno conventions for dependency management

// Cliffy CLI Framework - Latest stable versions from JSR
export { Command } from "jsr:@cliffy/command@1.0.0-rc.8";
export { Checkbox, Input, Select } from "jsr:@cliffy/prompt@1.0.0-rc.8";
export * as ansi from "jsr:@cliffy/ansi@1.0.0-rc.8";

// InversifyJS - Dependency Injection Framework
export { Container, inject, injectable, multiInject, type interfaces } from "npm:inversify@6.0.1";
// Required for InversifyJS decorators
import "npm:reflect-metadata@0.2.2";

// Core Services
export type { ICliService } from "./src/core/services/cli/ICliService.ts";
export { CliService } from "./src/core/services/cli/CliService.ts";
export type { IConfigService } from "./src/core/services/config/IConfigService.ts";
export { ConfigService } from "./src/core/services/config/ConfigService.ts";
export { ServiceError } from "./src/core/errors/ServiceError.ts";
export { TYPES } from "./src/core/types.ts";
export type { ICommand } from "./src/core/commands/ICommand.ts";

// Flattener Component
export type { IFileDiscoverer } from "./src/components/flattener/interfaces/IFileDiscoverer.ts";
export { FileDiscoverer } from "./src/components/flattener/services/FileDiscoverer.ts";
export { FlattenerCommand } from "./src/components/flattener/flattener.command.ts";

// Deno Standard Library - Latest versions from JSR
// CLI utilities
export { parseArgs } from "jsr:@std/cli@1.0.21";
export { Spinner } from "jsr:@std/cli@1.0.21/unstable-spinner";

// Testing utilities
export { describe, it, beforeEach, afterEach } from "jsr:@std/testing@1.0.13/bdd";
export { stub, type Stub } from "jsr:@std/testing@1.0.13/mock";

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

// YAML utilities
export { extractYamlFromAgent } from "./src/lib/yaml-utils.ts";

// Dependency resolution
export { DependencyResolver } from "./src/lib/dependency-resolver.ts";

// Build tools
export { WebBuilder } from "./src/build-tools/web-builder.ts";

// Installer module
// export { default as Installer } from "./src/installers/lib/installer.ts"; // Legacy installer - removed in favor of modular orchestrator

// --- Internal Installer Modules ---
// Interfaces
export type { IConfigLoader, IFileManager, IIdeSetup, IInstallerValidator, IPromptHandler, IResourceLocator } from "./src/installers/lib/installer.interfaces.ts";

// Shared Types
export {
  type FileIntegrityResult,
  type InstallationContext,
  type InstallationManifest,
  type InstallationState,
  type InstallationType,
  type InstallConfig,
} from "./src/shared/types/installation.types.ts";

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

// Shared Services
export {
  type ILogger,
  logger,
} from "./src/shared/services/core/logger.service.ts";

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

// Resource Locator and Config Loader
// export { default as resourceLocator } from "./src/installers/lib/resource-locator.ts";
export { ResourceLocator } from "./src/installers/lib/resource-locator.ts";
// export { default as configLoader } from "./src/installers/lib/config-loader.ts";
export { ConfigLoader } from "./src/installers/lib/config-loader.ts";
export { InstallerValidator } from "./src/installers/lib/installer-validator.ts";

export {
  InstallerOrchestrator,
  type IInstallConfig,
  type IInstallationState,
} from "./src/installers/lib/installer-orchestrator.ts";

export {
  FileIntegrityChecker,
  type IFileIntegrityChecker,
} from "./src/installers/lib/file-integrity-checker.ts";

export {
  VersionComparator,
  type IVersionComparator,
} from "./src/installers/lib/version-comparator.ts";

export {
  ExpansionPackHandler,
  type IExpansionPackHandler,
} from "./src/installers/lib/expansion-pack-handler.ts";

export {
  IdeSetupHandler,
  type IIdeSetupHandler,
} from "./src/installers/lib/ide-setup-handler.ts";

export {
  CoreInstaller,
  type ICoreInstaller,
} from "./src/installers/lib/core-installer.ts";

export {
  FileCopyUtilities,
  type IFileCopyUtilities,
} from "./src/installers/lib/file-copy-utilities.ts";

export {
  AgentManifestUtilities,
  type IAgentManifestUtilities,
} from "./src/installers/lib/agent-manifest-utilities.ts";

// Flattener tool
export { default as flattener } from "./tooling/user-tools/flattener/main.ts";

// Installer modules
export { promptInstallation } from "./src/installers/lib/prompt-handler.ts";
export { PromptHandler } from "./src/installers/lib/prompt-handler.ts";
export { FileManager } from "./src/installers/lib/file-manager.ts";
export { IdeSetup } from "./src/installers/lib/ide-setup.ts";
export { default as BaseIdeSetup } from "./src/installers/lib/ide-base-setup.ts";
export { setupCommands } from "./src/installers/lib/cli-commands.ts";
export { displayLogo, getVersion, initializeInstaller } from "./src/installers/lib/cli-utils.ts";

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
  PerformanceMonitor,
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

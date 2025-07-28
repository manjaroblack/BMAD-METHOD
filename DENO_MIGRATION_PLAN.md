# BMAD-METHOD Deno Migration Plan

## Overview

This document outlines a comprehensive plan to migrate the BMAD-METHOD project from Node.js to Deno. The migration will modernize the codebase while maintaining all existing functionality.

## Current Project Analysis

### Dependencies to Migrate

#### Production Dependencies
- `@kayvan/markdown-tree-parser: ^1.6.0` → Need Deno-compatible alternative
- `bmad-method: ^5.0.0` → Self-reference, will be updated
- `chalk: ^5.4.1` → Replace with Deno's native styling or `std/fmt/colors`
- `commander: ^14.0.0` → Replace with Deno's native `std/cli` or `cliffy`
- `fs-extra: ^11.3.0` → Replace with Deno's native `std/fs`
- `glob: ^11.0.3` → Replace with Deno's native `std/fs/expand_glob`
- `inquirer: ^12.8.2` → Replace with `cliffy/prompt`
- `js-yaml: ^4.1.0` → Replace with Deno's native `std/yaml`
- `minimatch: ^10.0.3` → Replace with Deno's native `std/path/glob`
- `ora: ^8.2.0` → Replace with custom spinner or `cliffy/ansi/spinner`

#### Development Dependencies
- `@semantic-release/*` → Keep for CI/CD (runs in Node.js environment)
- `husky: ^9.1.7` → Keep for git hooks
- `jest: ^30.0.5` → Replace with Deno's native testing
- `lint-staged: ^16.1.2` → Keep for pre-commit hooks
- `prettier: ^3.6.2` → Replace with `deno fmt`
- `semantic-release: ^24.2.7` → Keep for releases
- `yaml-lint: ^1.7.0` → Replace with custom validation using `std/yaml`

#### Additional Node.js APIs to Replace
- `child_process` → `Deno.Command` API
- `node:timers` → `setTimeout`, `setInterval` (global in Deno)
- `node:module` → `import.meta` and dynamic imports
- `node:url` → `URL` constructor (global in Deno)
- `node:worker_threads` → `Worker` API (different in Deno)
- `node:os` → `Deno.build`, `Deno.env`, `Deno.hostname()`
- `semver` → `std/semver` (if needed)

### File Structure Changes

#### Current Structure
```
tooling/
├── cli/
│   ├── bmad-npx-wrapper.js
│   └── cli.js
├── build-tools/
│   └── web-builder.js
├── lib/
│   ├── dependency-resolver.js
│   ├── error-handler.js
│   ├── node-version-manager.js
│   ├── performance-optimizer.js
│   └── yaml-utils.js
├── scripts/
│   ├── manage-dependencies.js
│   ├── master-optimizer.js
│   ├── optimize-build.js
│   ├── semantic-release-sync-installer.js
│   ├── validate-installation.js
│   └── yaml-format.js
├── version-management/
│   ├── bump-all-versions.js
│   ├── bump-expansion-version.js
│   ├── sync-installer-version.js
│   ├── update-expansion-version.js
│   └── version-bump.js
├── installers/
│   ├── bin/bmad.js
│   ├── lib/
│   │   ├── installer.js
│   │   ├── config-loader.js
│   │   ├── file-manager.js
│   │   ├── ide-base-setup.js
│   │   ├── ide-setup.js
│   │   ├── incremental-updater.js
│   │   ├── installer-validator.js
│   │   ├── memory-profiler.js
│   │   ├── module-manager.js
│   │   └── resource-locator.js
│   └── package.json
├── development-tools/
│   └── upgraders/
│       └── v3-to-v4-upgrader.js
├── user-tools/
│   └── flattener/
│       └── main.js
└── ...
```

## Files Requiring Migration

### Core CLI and Build Tools
- `tooling/cli/cli.js` - Main CLI entry point
- `tooling/build-tools/web-builder.js` - Web bundle builder
- `tooling/lib/dependency-resolver.js` - Dependency resolution
- `tooling/lib/yaml-utils.js` - YAML utilities
- `tooling/lib/error-handler.js` - Error handling
- `tooling/lib/performance-optimizer.js` - Performance monitoring
- `tooling/lib/node-version-manager.js` - Node version management
- `tooling/development-tools/upgraders/v3-to-v4-upgrader.js` - Project upgrader
- `tooling/user-tools/flattener/main.js` - File flattener utility

### Scripts and Automation
- `tooling/scripts/manage-dependencies.js` - Dependency management
- `tooling/scripts/master-optimizer.js` - Build optimization
- `tooling/scripts/optimize-build.js` - Build optimization
- `tooling/scripts/semantic-release-sync-installer.js` - Release synchronization
- `tooling/scripts/validate-installation.js` - Installation validation
- `tooling/scripts/yaml-format.js` - YAML formatting

### Version Management
- `tooling/version-management/bump-all-versions.js` - Version bumping
- `tooling/version-management/bump-expansion-version.js` - Expansion version management
- `tooling/version-management/sync-installer-version.js` - Installer version sync
- `tooling/version-management/update-expansion-version.js` - Expansion updates
- `tooling/version-management/version-bump.js` - Core version bumping

### Installer System
- `tooling/installers/bin/bmad.js` - Installer CLI
- `tooling/installers/lib/installer.js` - Main installer
- `tooling/installers/lib/config-loader.js` - Configuration loading
- `tooling/installers/lib/file-manager.js` - File management
- `tooling/installers/lib/ide-base-setup.js` - IDE base setup
- `tooling/installers/lib/ide-setup.js` - IDE configuration
- `tooling/installers/lib/incremental-updater.js` - Incremental updates
- `tooling/installers/lib/installer-validator.js` - Installation validation
- `tooling/installers/lib/memory-profiler.js` - Memory profiling
- `tooling/installers/lib/module-manager.js` - Module management
- `tooling/installers/lib/resource-locator.js` - Resource location
- `tooling/installers/package.json` - Installer dependencies

#### Proposed Deno Structure
```
tooling/
├── cli/
│   ├── bmad-deno-wrapper.ts
│   └── cli.ts
├── build-tools/
│   └── web-builder.ts
├── lib/
│   ├── dependency-resolver.ts
│   ├── error-handler.ts
│   ├── deno-version-manager.ts
│   ├── performance-optimizer.ts
│   └── yaml-utils.ts
├── scripts/
│   ├── manage-dependencies.ts
│   ├── master-optimizer.ts
│   ├── optimize-build.ts
│   ├── semantic-release-sync-installer.ts
│   ├── validate-installation.ts
│   └── yaml-format.ts
├── version-management/
│   ├── bump-all-versions.ts
│   ├── bump-expansion-version.ts
│   ├── sync-installer-version.ts
│   ├── update-expansion-version.ts
│   └── version-bump.ts
├── installers/
│   ├── bin/bmad.ts
│   ├── lib/
│   │   ├── installer.ts
│   │   ├── config-loader.ts
│   │   ├── file-manager.ts
│   │   ├── ide-base-setup.ts
│   │   ├── ide-setup.ts
│   │   ├── incremental-updater.ts
│   │   ├── installer-validator.ts
│   │   ├── memory-profiler.ts
│   │   ├── module-manager.ts
│   │   └── resource-locator.ts
│   └── deno.json
├── development-tools/
│   └── upgraders/
│       └── v3-to-v4-upgrader.ts
├── user-tools/
│   └── flattener/
│       └── main.ts
├── deno.json
├── import_map.json
└── ...
```

## Migration Strategy

### Phase 1: Setup Deno Environment

1. **Create Deno Configuration**
   - Add `deno.json` with project configuration
   - Create `import_map.json` for dependency management
   - Configure permissions and tasks

2. **Update VS Code Configuration**
   - Modify `.vscode/launch.json` for Deno debugging
   - Add Deno extension recommendations
   - Update workspace settings

### Phase 2: Core Library Migration

1. **Migrate Utility Libraries**
   - `yaml-utils.js` → `yaml-utils.ts`
   - `error-handler.js` → `error-handler.ts`
   - `performance-optimizer.js` → `performance-optimizer.ts`

2. **Replace Node.js Specific APIs**
   - `fs-extra` → `std/fs`
   - `path` → `std/path`
   - `process` → `Deno` namespace

### Phase 3: CLI and Build Tools Migration

1. **Migrate CLI Framework**
   - Replace `commander` with `cliffy`
   - Update argument parsing and command structure
   - Migrate interactive prompts from `inquirer` to `cliffy/prompt`

2. **Migrate Build System**
   - Convert `web-builder.js` to TypeScript
   - Replace Node.js file operations with Deno APIs
   - Update glob patterns to use `std/fs/expand_glob`

### Phase 4: Testing and Validation

1. **Replace Jest with Deno Testing**
   - Convert test files to Deno test format
   - Update test scripts in configuration
   - Ensure all functionality works correctly

2. **Update Development Workflow**
   - Replace `prettier` with `deno fmt`
   - Update linting to use `deno lint`
   - Modify CI/CD pipelines

## Special Migration Considerations

### Complex Files Requiring Extra Attention

#### 1. `tooling/scripts/manage-dependencies.js`
- **Challenge**: Heavy use of `child_process`, `fs-extra`, and npm-specific commands
- **Solution**: Replace with `Deno.Command` for subprocess execution, `std/fs` for file operations
- **Note**: npm audit functionality will need custom implementation or external tool integration

#### 2. `tooling/installers/lib/installer.js` (2500+ lines)
- **Challenge**: Complex installer logic with Node.js-specific patterns
- **Solution**: Break into smaller modules, replace Node.js APIs incrementally
- **Priority**: High - core functionality for project setup

#### 3. Version Management Scripts
- **Challenge**: Mixed import styles (CommonJS + ES modules)
- **Solution**: Standardize on ES modules, update all import statements
- **Note**: Some files use `#!/usr/bin/env node` shebang - update to Deno

#### 4. Performance and Memory Profiling
- **Challenge**: Node.js-specific profiling APIs
- **Solution**: Use Deno's built-in performance APIs or external tools
- **Impact**: May need to rewrite profiling logic entirely

#### 5. CI/CD Pipeline Migration
- **Challenge**: GitHub Actions workflow depends on Node.js and npm
- **Solution**: Replace with Deno setup actions, update semantic release configuration
- **Impact**: Critical for automated releases and deployment
- **Files**: `.github/workflows/release.yaml`, `config/.releaserc.json`

#### 6. Development Environment Configuration
- **Challenge**: VS Code settings and launch configurations are Node.js-specific
- **Solution**: Update to use Deno extension and debugging capabilities
- **Impact**: Affects developer experience and debugging workflow
- **Files**: `.vscode/settings.json`, `.vscode/launch.json`

### Package.json Dependencies Analysis

#### Critical Dependencies (High Migration Effort)
- `fs-extra` - Used extensively across 20+ files
- `child_process` - Used in build scripts and dependency management
- `inquirer` - Used in installer and CLI interactions
- `glob` - Used for file discovery and pattern matching

#### Moderate Dependencies (Medium Migration Effort)
- `chalk` - Used for colored output (easy replacement)
- `ora` - Used for loading spinners (custom implementation needed)
- `commander` - Used for CLI parsing (replace with cliffy)

#### Low Impact Dependencies (Easy Migration)
- `js-yaml` - Direct replacement with `std/yaml`
- `semver` - Available in Deno standard library
- Node.js built-ins - Direct Deno API replacements available

## Detailed Implementation Plan

### 1. Deno Configuration Files

#### `deno.json`
```json
{
  "version": "4.32.0",
  "name": "bmad-method",
  "exports": "./tooling/cli/cli.ts",
  "tasks": {
    "build": "deno run --allow-read --allow-write tooling/cli/cli.ts build",
    "build:agents": "deno run --allow-read --allow-write tooling/cli/cli.ts build --agents-only",
    "build:teams": "deno run --allow-read --allow-write tooling/cli/cli.ts build --teams-only",
    "list:agents": "deno run --allow-read tooling/cli/cli.ts list:agents",
    "list:teams": "deno run --allow-read tooling/cli/cli.ts list:teams",
    "validate": "deno run --allow-read tooling/cli/cli.ts validate",
    "test": "deno test --allow-read --allow-write",
    "fmt": "deno fmt",
    "lint": "deno lint",
    "check": "deno check **/*.ts"
  },
  "imports": {
    "@std/": "https://deno.land/std@0.208.0/",
    "@cliffy/": "https://deno.land/x/cliffy@v1.0.0-rc.3/"
  },
  "compilerOptions": {
    "allowJs": false,
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "fmt": {
    "useTabs": false,
    "lineWidth": 100,
    "indentWidth": 2,
    "semiColons": true,
    "singleQuote": false,
    "proseWrap": "preserve"
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  }
}
```

#### `import_map.json`
```json
{
  "imports": {
    "@std/fs": "https://deno.land/std@0.208.0/fs/mod.ts",
    "@std/path": "https://deno.land/std@0.208.0/path/mod.ts",
    "@std/yaml": "https://deno.land/std@0.208.0/yaml/mod.ts",
    "@std/fmt/colors": "https://deno.land/std@0.208.0/fmt/colors.ts",
    "@std/testing": "https://deno.land/std@0.208.0/testing/mod.ts",
    "@cliffy/command": "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts",
    "@cliffy/prompt": "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts",
    "@cliffy/ansi": "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/mod.ts"
  }
}
```

### 2. Key File Migrations

#### CLI Migration (`tooling/cli/cli.ts`)
```typescript
#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { Command } from "@cliffy/command";
import { WebBuilder } from "../build-tools/web-builder.ts";
import { V3ToV4Upgrader } from "../development-tools/upgraders/v3-to-v4-upgrader.ts";

const cli = new Command()
  .name("bmad-build")
  .description("BMad-Method build tool for creating web bundles")
  .version("4.32.0");

cli.command("build")
  .description("Build web bundles for agents and teams")
  .option("-a, --agents-only", "Build only agent bundles")
  .option("-t, --teams-only", "Build only team bundles")
  .option("-e, --expansions-only", "Build only expansion pack bundles")
  .option("--no-expansions", "Skip building expansion packs")
  .option("--no-clean", "Skip cleaning output directories")
  .action(async (options) => {
    const builder = new WebBuilder({
      rootDir: Deno.cwd(),
    });

    try {
      if (options.clean) {
        console.log("Cleaning output directories...");
        await builder.cleanOutputDirs();
      }
      // ... rest of implementation
    } catch (error) {
      console.error("Build failed:", error.message);
      Deno.exit(1);
    }
  });

if (import.meta.main) {
  await cli.parse(Deno.args);
}
```

#### YAML Utils Migration (`tooling/lib/yaml-utils.ts`)
```typescript
/**
 * Utility functions for YAML extraction from agent files
 */

/**
 * Extract YAML content from agent markdown files
 * @param agentContent - The full content of the agent file
 * @param cleanCommands - Whether to clean command descriptions (default: false)
 * @returns The extracted YAML content or null if not found
 */
export function extractYamlFromAgent(
  agentContent: string,
  cleanCommands = false,
): string | null {
  // Remove carriage returns and match YAML block
  const yamlMatch = agentContent.replace(/\r/g, "").match(/```ya?ml\n([\s\S]*?)\n```/);
  if (!yamlMatch) return null;

  let yamlContent = yamlMatch[1].trim();

  // Clean up command descriptions if requested
  // Converts "- command - description" to just "- command"
  if (cleanCommands) {
    yamlContent = yamlContent.replace(/^(\s*-)(\s*"[^"]+")(\s*-\s*.*)$/gm, "$1$2");
  }

  return yamlContent;
}
```

### 3. VS Code Configuration Updates

#### `.vscode/launch.json`
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "🚀 Debug BMAD CLI (Deno)",
      "type": "node",
      "request": "launch",
      "program": "deno",
      "args": [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--inspect-wait",
        "${workspaceFolder}/tooling/cli/cli.ts",
        "build"
      ],
      "cwd": "${workspaceFolder}",
      "env": {
        "DENO_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true
    }
  ]
}
```

#### `.vscode/settings.json`
```json
{
  "deno.enable": true,
  "deno.lint": true,
  "deno.unstable": false,
  "deno.config": "./deno.json",
  "deno.importMap": "./import_map.json",
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno",
    "editor.formatOnSave": true
  },
  "[javascript]": {
    "editor.defaultFormatter": "denoland.vscode-deno"
  }
}
```

## Migration Checklist

### Pre-Migration
- [ ] Backup current project
- [ ] Document current functionality
- [ ] Set up Deno development environment
- [ ] Create feature branch for migration
- [ ] Audit all 30+ JavaScript files for Node.js dependencies

### Phase 1: Setup
- [ ] Create `deno.json` configuration
- [ ] Create `import_map.json`
- [ ] Update VS Code settings
- [ ] Set up basic project structure
- [ ] Plan migration order for 30+ files

### Phase 2: Core Library Migration
- [ ] Migrate `yaml-utils.js` to `yaml-utils.ts`
- [ ] Migrate `error-handler.js` to `error-handler.ts`
- [ ] Migrate `performance-optimizer.js` to `performance-optimizer.ts`
- [ ] Migrate `dependency-resolver.js` to `dependency-resolver.ts`
- [ ] Migrate `node-version-manager.js` to `node-version-manager.ts`
- [ ] Update all internal imports

### Phase 3: CLI and Build Tools
- [ ] Migrate `cli.js` to `cli.ts`
- [ ] Migrate `web-builder.js` to `web-builder.ts`
- [ ] Migrate `v3-to-v4-upgrader.js` to `v3-to-v4-upgrader.ts`
- [ ] Migrate `flattener/main.js` to `flattener/main.ts`
- [ ] Update all CLI commands and options
- [ ] Test build functionality

### Phase 3.1: Scripts Migration
- [ ] Migrate `manage-dependencies.js` (complex - 741 lines)
- [ ] Migrate `master-optimizer.js`
- [ ] Migrate `optimize-build.js`
- [ ] Migrate `semantic-release-sync-installer.js`
- [ ] Migrate `validate-installation.js`
- [ ] Migrate `yaml-format.js`
- [ ] Update all script shebangs from `#!/usr/bin/env node` to Deno

### Phase 3.2: Version Management Migration
- [ ] Migrate `bump-all-versions.js` (fix mixed import styles)
- [ ] Migrate `bump-expansion-version.js`
- [ ] Migrate `sync-installer-version.js`
- [ ] Migrate `update-expansion-version.js`
- [ ] Migrate `version-bump.js`
- [ ] Standardize all to ES modules

### Phase 3.3: Installer System Migration (High Priority)
- [ ] Migrate `installers/bin/bmad.js`
- [ ] Migrate `installers/lib/installer.js` (2500+ lines - break into modules)
- [ ] Migrate `installers/lib/config-loader.js`
- [ ] Migrate `installers/lib/file-manager.js`
- [ ] Migrate `installers/lib/ide-base-setup.js`
- [ ] Migrate `installers/lib/ide-setup.js`
- [ ] Migrate `installers/lib/incremental-updater.js`
- [ ] Migrate `installers/lib/installer-validator.js`
- [ ] Migrate `installers/lib/memory-profiler.js`
- [ ] Migrate `installers/lib/module-manager.js`
- [ ] Migrate `installers/lib/resource-locator.js`
- [ ] Create separate `deno.json` for installer package
- [ ] Test complete installer functionality

### Phase 4: Testing and Validation
- [ ] Replace Jest with Deno testing
- [ ] Update all test files
- [ ] Test all 30+ migrated files individually
- [ ] Test integration between all components
- [ ] Verify installer system works end-to-end
- [ ] Test CLI commands and build processes
- [ ] Verify version management scripts
- [ ] Test dependency management functionality
- [ ] Update documentation
- [ ] Update CI/CD pipelines

### Phase 5: CI/CD and Development Environment Migration
- [ ] **GitHub Actions Workflow Updates**:
  - [ ] Replace Node.js setup with Deno setup in `.github/workflows/release.yaml`
  - [ ] Update `npm ci` to Deno dependency caching
  - [ ] Replace `npm run validate` and `npm run format` with Deno equivalents
  - [ ] Update semantic release to work with Deno project structure
  - [ ] Test automated release process with Deno
- [ ] **Semantic Release Configuration**:
  - [ ] Update `.releaserc.json` to handle `deno.json` instead of `package.json`
  - [ ] Modify asset tracking for Deno files
  - [ ] Update installer sync script path
  - [ ] Test version bumping with new structure
- [ ] **VS Code Configuration Updates**:
  - [ ] Update `.vscode/settings.json` for Deno
  - [ ] Modify `.vscode/launch.json` debug configurations
  - [ ] Add Deno extension recommendations
  - [ ] Update workspace settings for TypeScript

### Phase 6: Documentation and Cleanup
- [ ] **Documentation Updates**:
  - [ ] Update main `README.md` with Deno installation instructions
  - [ ] Update `CONTRIBUTING.md` with Deno development setup
  - [ ] Update `docs/developer/core-architecture.md` for Deno changes
  - [ ] Update `docs/user/user-guide.md` with new CLI usage
  - [ ] Update `tooling/README.md` for Deno tooling
  - [ ] Update `tooling/installers/README.md` for Deno installer
  - [ ] Create comprehensive migration guide in `docs/developer/`
  - [ ] Update VS Code settings documentation
  - [ ] Update CI/CD documentation in `docs/versioning-and-releases.md`
- [ ] **Project Cleanup**:
  - [ ] Remove all `package.json` files (root and installer)
  - [ ] Remove all `node_modules` directories
  - [ ] Remove `package-lock.json` files
  - [ ] Clean up `.gitignore` (remove Node.js-specific entries)
  - [ ] Remove Node.js-specific VS Code settings
  - [ ] Clean up any remaining Node.js-specific code comments
  - [ ] Remove npm scripts from any remaining configs
- [ ] **Optimization and Validation**:
  - [ ] Optimize import maps for performance
  - [ ] Validate all Deno permissions are minimal
  - [ ] Performance test all functionality
  - [ ] Verify all file extensions are correct (.ts)
  - [ ] Check all shebang lines use Deno
  - [ ] Validate TypeScript strict mode compliance

## Benefits of Migration

1. **Modern Runtime**: Deno provides a more modern JavaScript/TypeScript runtime
2. **Built-in TypeScript**: Native TypeScript support without compilation step
3. **Security**: Secure by default with explicit permissions
4. **Standard Library**: Comprehensive standard library reduces dependencies
5. **Better Tooling**: Built-in formatter, linter, and test runner
6. **Web Standards**: Better alignment with web platform APIs
7. **Simplified Dependencies**: No package.json or node_modules

## Potential Challenges

1. **Learning Curve**: Team needs to learn Deno-specific patterns
2. **Ecosystem**: Some Node.js packages may not have Deno equivalents
3. **CI/CD Migration**: Complex GitHub Actions workflow and semantic release setup
4. **Third-party Tools**: Some tools may still require Node.js (semantic-release, husky)
5. **Performance**: Need to validate performance characteristics
6. **Development Environment**: VS Code configurations and debugging setup
7. **Registry Migration**: Moving from npm to Deno registry for dependencies

## Timeline Estimate

**Total Duration: 8-10 weeks** (Updated based on comprehensive file analysis including CI/CD)

- **Week 1-2**: Setup and core library migration (5 core files)
- **Week 3-4**: CLI, build tools, and scripts migration (15+ files)
- **Week 5-6**: Installer system migration (12 files, including 2500+ line installer.js)
- **Week 7**: Version management and remaining utilities (6 files)
- **Week 8**: CI/CD and development environment migration
- **Week 9**: Testing, validation, and integration
- **Week 10**: Documentation updates, cleanup, and final validation

### Detailed Breakdown:
- **30+ JavaScript files** to migrate to TypeScript
- **Complex installer system** (2500+ lines) requiring modularization
- **Mixed import styles** requiring standardization
- **Heavy Node.js API usage** requiring extensive replacements
- **Multiple package.json files** to consolidate

*Note: Timeline reflects the discovery of 20+ additional files beyond the initial assessment. The installer system alone may require 1-2 weeks due to its complexity.*

## Rollback Plan

If migration issues arise:
1. Maintain current Node.js version in separate branch
2. Use feature flags to gradually roll out Deno version
3. Keep both versions running in parallel during transition
4. Document all breaking changes and workarounds

## Comprehensive Migration Audit Results

### Critical Files Confirmed for Migration

#### Package.json Files (2 files)
- `/Users/ds/dev/BMAD-METHOD/package.json` (83 lines) - Main project configuration
- `/Users/ds/dev/BMAD-METHOD/tooling/installers/package.json` (44 lines) - Installer dependencies

#### Node.js Built-in Module Usage (Extensive)
- **fs/fs-extra**: Used in 15+ files (incremental-updater.js, manage-dependencies.js, etc.)
- **path**: Used in 20+ files across all tooling
- **crypto**: Used in incremental-updater.js, memory-profiler.js
- **child_process**: Used in 10+ files (manage-dependencies.js, node-version-manager.js, etc.)
- **v8**: Used in memory-profiler.js for heap snapshots
- **stream**: Used in file-manager.js for Transform streams
- **process.env**: Used extensively for environment variables
- **__dirname/__filename**: Used in 10+ files for path resolution
- **require()**: Mixed with ES modules in several files
- **module.exports**: CommonJS exports in 15+ files

#### NPM/Node.js Specific Patterns
- **npm scripts**: 25+ scripts in main package.json
- **npx references**: Throughout documentation and CLI wrappers
- **node_modules**: Referenced in .gitignore, flattener, installers
- **Jest testing**: Configured in package.json, referenced in VS Code launch.json
- **Prettier**: Referenced in .gitignore, package.json scripts
- **Husky**: Referenced in .gitignore, package.json prepare script

#### Hidden Configuration Files
- `.prettierignore`, `.prettierrc` (referenced in .gitignore)
- `.husky/` directory (referenced in .gitignore)
- `.env` files (referenced in .gitignore and templates)
- `.nvmrc` generation (in node-version-manager.js)

### Additional Migration Considerations

#### Mixed Module Systems
- Several files mix CommonJS (`require()`, `module.exports`) with ES modules
- Need to standardize all to ES modules for Deno compatibility
- Files like `bump-all-versions.js` have mixed import styles

#### Complex Dependencies
- **jest**: ^30.0.5 - Needs complete replacement with Deno testing
- **inquirer**: ^12.8.2 - Used extensively in CLI interactions
- **commander**: ^14.0.0 - Used for CLI parsing, replace with cliffy
- **fs-extra**: ^11.3.0 - Most critical dependency, used everywhere
- **glob**: ^11.0.3 - File pattern matching, replace with std/fs
- **ora**: ^8.2.0 - Loading spinners, needs custom implementation

#### Documentation Updates Required
- 15+ documentation files reference npm/npx commands
- README.md has extensive npm/npx usage examples
- Contributing.md has Node.js setup instructions
- User guide references npx installation

## Next Steps

1. **Immediate Actions**:
   - Install Deno runtime and VS Code extension
   - Create development branch for migration
   - Set up basic Deno configuration files
   - Audit current documentation for migration needs
   - **NEW**: Create comprehensive dependency mapping document
   - **NEW**: Plan mixed module system standardization

2. **Week 1 Priorities**:
   - Migrate core utility libraries
   - Establish import patterns
   - Test basic functionality
   - Begin documentation inventory
   - **NEW**: Standardize all files to ES modules
   - **NEW**: Create Deno-compatible versions of critical utilities

3. **CI/CD and Development Environment Planning**:
   - Update GitHub Actions workflow (`.github/workflows/release.yaml`)
   - Modify semantic release configuration (`.releaserc.json`)
   - Update VS Code settings and launch configurations
   - Plan npm to Deno registry migration strategy
   - Update development scripts and validation commands
   - **NEW**: Plan Jest to Deno testing migration
   - **NEW**: Update all npm script references in documentation

4. **Documentation Strategy**:
   - Create documentation migration checklist
   - Identify all files referencing Node.js setup
   - Plan user communication for breaking changes
   - Prepare migration guide template
   - **NEW**: Update 15+ files with npm/npx references
   - **NEW**: Create Deno installation and usage guides

5. **Cleanup Strategy**:
   - Inventory all Node.js artifacts to remove
   - Plan .gitignore updates
   - Identify configuration files needing updates
   - Schedule cleanup validation checkpoints
   - **NEW**: Remove .prettierrc, .prettierignore, .husky/ references
   - **NEW**: Clean up .nvmrc generation code
   - **NEW**: Update flattener exclusion patterns

6. **Risk Mitigation**:
   - Maintain parallel Node.js version during migration
   - Implement comprehensive testing at each phase
   - Document any breaking changes or limitations
   - Create rollback procedures for each phase
   - **NEW**: Plan for mixed module system compatibility issues
   - **NEW**: Create fallback strategies for complex dependencies

7. **Success Metrics**:
   - All CLI commands function correctly
   - Build processes complete successfully
   - Installation procedures work end-to-end
   - Performance meets or exceeds current benchmarks
   - Documentation is complete and accurate
   - No Node.js artifacts remain in codebase
   - **NEW**: All module systems standardized to ES modules
   - **NEW**: Zero npm/npx references in codebase
   - **NEW**: Complete Jest to Deno testing migration

This migration will modernize the BMAD-METHOD project while maintaining all existing functionality and improving developer experience.
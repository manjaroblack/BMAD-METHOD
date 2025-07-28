# BMad Method - Refactoring Documentation

## Overview

This document outlines the comprehensive refactoring and reorganization of the BMad Method codebase to improve maintainability, clarity, and developer experience.

## New Directory Structure

### Before (Old Structure)
```
├── src/core/            # Core framework files (installed as .bmad-core)
├── agent-configs/       # Agent configurations
├── tools/              # Mixed tooling concerns
├── expansion-packs/    # Extension modules
├── docs/              # Documentation
└── package.json       # Project configuration
```

### After (New Structure)
```
├── src/
│   ├── core/           # Core framework (now in src/core/)
│   │   ├── checklists/
│   │   ├── data/
│   │   ├── tasks/
│   │   ├── templates/
│   │   ├── workflows/
│   │   └── core-config.yaml
│   └── agents/         # Agent configurations (moved from agent-configs/)
│       ├── teams/      # Team configurations
│       └── *.yaml      # Individual agent configs
├── tooling/            # Separated tooling concerns (moved from tools/)
│   ├── cli/           # Command line interface
│   ├── build-tools/   # Build system (renamed from builders/)
│   ├── installers/    # Installation tools
│   ├── lib/          # Shared utilities
│   ├── development-tools/  # Development utilities
│   │   ├── flattener/ # Document flattening
│   │   └── upgraders/ # Version upgrade tools
│   ├── scripts/       # Standalone utility scripts
│   ├── version-management/  # Version control and releases
│   └── md-assets/     # Markdown templates and assets
├── extensions/         # Extension modules (moved from expansion-packs/)
├── config/            # Centralized configuration
│   └── bmad.config.yaml
├── docs/              # Documentation (unchanged)
└── dist/              # Build output
```

## Key Changes

### 1. Domain-Driven Organization
- **`src/`**: Contains the core framework and agent definitions
- **`tooling/`**: Separated all build, CLI, and development tools
- **`extensions/`**: Renamed from `expansion-packs` for clarity
- **`config/`**: Centralized configuration management

### 2. Improved Separation of Concerns
- **CLI tools** are now in `tooling/cli/`
- **Build system** is isolated in `tooling/build-tools/`
- **Installation logic** is in `tooling/installers/`
- **Shared utilities** are in `tooling/lib/`

### 3. Configuration Centralization
- New main config file: `config/bmad.config.yaml`
- Maintains backward compatibility with existing configs
- Provides single source of truth for directory paths

### 4. Updated Entry Points
- Main entry: `tooling/cli/cli.js` (was `tools/cli.js`)
- Binary wrappers: `tooling/cli/bmad-npx-wrapper.js`
- All npm scripts updated to use new paths

## Migration Guide

### For Developers
1. Update any hardcoded paths in custom scripts
2. Use the new configuration file for path references
3. Update import statements if extending the framework

### For Users
- No action required - all npm scripts and CLI commands work as before
- Existing projects will continue to function normally

### For Extension Developers
1. Update paths in extension configurations
2. Use new directory structure for new extensions
3. Reference the centralized config for path resolution

## Benefits

### 1. Improved Maintainability
- Clear separation between framework code and tooling
- Logical grouping of related functionality
- Easier to locate and modify specific components

### 2. Better Developer Experience
- Intuitive directory structure
- Centralized configuration management
- Cleaner project root directory

### 3. Enhanced Scalability
- Modular architecture supports easier extension
- Clear boundaries between different concerns
- Simplified testing and CI/CD processes

### 4. Consistency
- Standardized naming conventions
- Uniform directory structure across all components
- Predictable file locations

## Backward Compatibility

- All existing npm scripts continue to work
- CLI commands remain unchanged
- Existing projects require no modifications
- Configuration files are automatically migrated

## Future Improvements

1. **Module System**: Consider implementing a proper module system for extensions
2. **Type Definitions**: Add TypeScript definitions for better IDE support
3. **Plugin Architecture**: Enhance the extension system with standardized APIs
4. **Documentation Generation**: Automated docs from code and configs

## Testing the Refactoring

To verify the refactoring was successful:

```bash
# Test build system
npm run build

# Test CLI commands
npm run list:agents
npm run validate

# Test installation
npm run install:bmad
```

All commands should work exactly as before, but now use the new directory structure internally.
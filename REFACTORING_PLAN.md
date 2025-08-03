# BMad Method Installer Refactoring Plan

## Overview
This document outlines the plan to refactor `bmad.ts` to improve modularity and maintainability. The current file is a monolithic entrypoint that contains CLI definitions, interactive prompts, and business logic mixed together.

## Goals
- Separate concerns into distinct modules
- Improve code readability and maintainability
- Enable easier testing of individual components
- Maintain all existing functionality

## Current Structure Analysis
- `bmad.ts`: 11.9KB monolithic CLI entrypoint
- `lib/installer.ts`: 39KB with core installation logic (already well-separated)
- Various handler files in `handlers/` directory
- Utility modules in `lib/` directory

## Refactoring Steps

### Phase 1: Create New Module Structure

- [ ] Create `src/installers/lib/prompt-handler.ts` for interactive prompt logic
- [ ] Create `src/installers/lib/cli-commands.ts` for CLI command definitions
- [ ] Create `src/installers/lib/cli-utils.ts` for CLI utility functions
- [ ] Create specialized command handlers in `handlers/` directory

### Phase 2: Extract Functionality

- [ ] Extract `promptInstallation()` function to `prompt-handler.ts`
- [ ] Extract all CLI command definitions to `cli-commands.ts`
- [ ] Move version initialization logic to `cli-utils.ts`
- [ ] Move ASCII art display to `cli-utils.ts`
- [ ] Create specialized handlers for each command

### Phase 3: Refactor Main Entry Point

- [ ] Simplify `bmad.ts` to only wire CLI components
- [ ] Remove inline business logic from `bmad.ts`
- [ ] Update imports to use new module structure

### Phase 4: Testing and Validation

- [ ] Verify all commands work as before
- [ ] Test interactive installation flow
- [ ] Test all command options
- [ ] Validate error handling

### Phase 5: Documentation and Cleanup

- [ ] Update any necessary documentation
- [ ] Remove any unused code
- [ ] Ensure consistent code style

## Module Responsibilities

### `bmad.ts` (Main Entry Point)
- Application bootstrap
- CLI initialization and wiring
- Minimal inline logic

### `prompt-handler.ts`
- Interactive installation prompts
- IDE selection logic
- Installation confirmation
- User input validation

### `cli-commands.ts`
- CLI command definitions
- Command option specifications
- Command action wiring

### `cli-utils.ts`
- Version initialization
- ASCII art display
- Common formatting functions
- Error display utilities

### Specialized Command Handlers
- `install-command-handler.ts`: Install logic
- `update-command-handler.ts`: Update logic
- `status-command-handler.ts`: Status logic
- `flatten-command-handler.ts`: Flatten logic

## Implementation Order
1. Create new module files
2. Extract functionality incrementally
3. Test each extracted component
4. Simplify main entry point
5. Final validation

## Expected Benefits
- Improved code organization
- Easier maintenance
- Better testability
- Enhanced reusability
- Reduced complexity in main entry point

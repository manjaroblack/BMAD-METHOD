# BMAD-METHOD Style Guide (2025)

A comprehensive style guide for cutting-edge TypeScript development following the "Deno way" with modern best practices, modular architecture, and robust engineering principles.

## Philosophy

- **Strict typing** with specific error types
- **Performance-first** with efficient patterns
- **Functional patterns** preferred
- **Self-documenting code** through explicit types
- **Deno-native** approaches over external dependencies
- **Modular architecture** with clear separation of concerns
- **Dependency injection** using interfaces for loose coupling

## Code Organization

### Directory Structure

```text
.
├── src
│   ├── components
│   │   ├── flattener
│   │   │   ├── flattener.command.ts
│   │   │   ├── services
│   │   │   │   └── FileDiscoverer.ts
│   │   │   └── interfaces
│   │   │       └── IFileDiscoverer.ts
│   │   └── installer
│   │       ├── installer.command.ts
│   │       ├── services
│   │       │   └── DependencyInstaller.ts
│   │       └── interfaces
│   │           └── IDependencyInstaller.ts
│   ├── core
│   │   ├── commands
│   │   │   └── ICommand.ts
│   │   ├── services
│   │   │   ├── cli
│   │   │   │   ├── CliService.ts
│   │   │   │   └── ICliService.ts
│   │   │   └── config
│   │   │       ├── ConfigService.ts
│   │   │       └── IConfigService.ts
│   │   ├── types.ts
│   │   └── errors
│   │       └── ServiceError.ts
│   └── shared
├── tests
│   ├── unit
│   └── integration
├── deps.ts
└── mod.ts
```

**Rationale**: Promotes separation of concerns, improves maintainability, and enables better code organization.

### Module Boundaries

Each module should have:

1. A clear, single responsibility
2. Well-defined interfaces for all public APIs
3. Internal implementation details that are not exposed
4. Proper error handling with specific error types
5. Comprehensive unit tests

## Dependency Management

### Centralized Dependencies

All dependencies (internal and external) must be centralized in `deps.ts`:

```typescript
// deps.ts
// External dependencies from JSR
export { walk } from "jsr:@std/fs@0.224.0";
export { parse } from "jsr:@std/flags@0.224.0";
export { Command } from "jsr:@cliffy/command@1.0.0-rc.8";

// Internal dependencies
export { FileDiscoverer } from "./src/components/flattener/services/FileDiscoverer.ts";
export type { IFileDiscoverer } from "./src/components/flattener/interfaces/IFileDiscoverer.ts";
export { FlattenerCommand } from "./src/components/flattener/flattener.command.ts";
```

All modules import dependencies through the 'deps' alias:

```typescript
// ✅ Good
import { walk, Command } from 'deps';
import type { IFileDiscoverer } from 'deps';

// ❌ Bad
import { walk } from "jsr:@std/fs@0.224.0";
import { FileDiscoverer } from "./src/components/flattener/services/FileDiscoverer.ts";
```

**Rationale**: Centralizes dependency management, easier upgrades, better security auditing, and maintains consistency.

### Import Formatting

Group imports by type with proper formatting:

```typescript
// ✅ Good - Grouped imports by type
import {
  Command,
  parse,
  walk,
} from 'deps';

import type {
  Config,
  IFileDiscoverer,
  User,
} from 'deps';

// ❌ Bad - Horizontal imports
import { walk, parse, Command } from 'deps';
import type { User, Config, IFileDiscoverer } from 'deps';
```

**Rationale**: Improves readability, easier to scan, avoids horizontal scrolling, and groups related imports together.

## Type Safety

### Explicit Typing

Always use explicit types rather than inference:

```typescript
// ✅ Good - Explicit types
function processUser(user: User): Promise<UserResult> {
  return processUserData(user);
}

const users: User[] = [];
const config: Config = loadConfig();

// ❌ Bad - Implicit types
function processUser(user) {
  return processUserData(user);
}

const users = [];
const config = loadConfig();
```

### Type-only Imports

Separate type-only imports from runtime imports:

```typescript
// ✅ Good - Explicit type imports
import type { User, Config } from 'deps';
import { processUser } from 'deps';

// ❌ Bad - Mixed imports
import { User, Config, processUser } from 'deps';
```

**Rationale**: Better tree-shaking, clearer separation of types vs runtime code.

## Error Handling

### Specific Error Types

Create specific error classes for different error conditions:

```typescript
// Base error class
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Specific error types
export class ConfigError extends ServiceError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONFIG_ERROR', cause);
    this.name = 'ConfigError';
  }
}

export class FileNotFoundError extends ServiceError {
  constructor(message: string, cause?: Error) {
    super(message, 'FILE_NOT_FOUND', cause);
    this.name = 'FileNotFoundError';
  }
}
```

### Error Handling Patterns

Handle errors at the appropriate level with specific error types:

```typescript
try {
  const data = await Deno.readTextFile("./config.json");
  const config = parseConfig(data);
  // Process config
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    throw new ConfigError(`Configuration file not found`, error);
  } else if (error instanceof ConfigError) {
    // Re-throw config errors
    throw error;
  } else {
    // Handle unexpected errors
    throw new ServiceError(`Unexpected error loading config`, 'UNEXPECTED_ERROR', error);
  }
}
```

## Modular Architecture

### Single Responsibility Principle

Each module, class, and function should have one clear purpose:

```typescript
// ✅ Good - Single responsibility
export class FileDiscoverer implements IFileDiscoverer {
  async discoverFiles(directory: string): Promise<string[]> {
    // Only responsible for discovering files
    return await walkDirectory(directory);
  }
}

export class FlattenerService {
  constructor(private readonly fileDiscoverer: IFileDiscoverer) {}
  
  async flatten(directory: string): Promise<void> {
    // Only responsible for flattening logic
    const files = await this.fileDiscoverer.discoverFiles(directory);
    await this.processFiles(files);
  }
}
```

### Interface-based Design

Depend on interfaces rather than concrete implementations:

```typescript
// ✅ Good - Interface-based design
export interface IFileDiscoverer {
  discoverFiles(directory: string): Promise<string[]>;
}

export class FileDiscoverer implements IFileDiscoverer {
  async discoverFiles(directory: string): Promise<string[]> {
    // Implementation
  }
}

export class FlattenerCommand {
  constructor(
    private readonly fileDiscoverer: IFileDiscoverer,  // Depend on interface
  ) {}
  
  async execute(options: { directory: string }): Promise<void> {
    const files = await this.fileDiscoverer.discoverFiles(options.directory);
    // Process files
  }
}
```

## Dependency Injection

### Container-based DI

Use a DI container for managing service lifecycles:

```typescript
// container.ts
import { FileDiscoverer } from 'deps';
import type { IFileDiscoverer } from 'deps';

const container = new Container();
container.register<IFileDiscoverer>('IFileDiscoverer', () => new FileDiscoverer());

// main.ts
const fileDiscoverer = container.get<IFileDiscoverer>('IFileDiscoverer');
const flattenerCommand = new FlattenerCommand(fileDiscoverer);
```

### Loose Coupling

Decouple services completely using Dependency Injection:

```typescript
// ✅ Good - Loose coupling through DI
export class FlattenerCommand {
  constructor(
    private readonly fileDiscoverer: IFileDiscoverer,  // Depend on interface
    private readonly logger: ILogger,                  // Not concrete class
  ) {}
  
  async execute(options: { directory: string }): Promise<void> {
    const files = await this.fileDiscoverer.discoverFiles(options.directory);
    // Process files
  }
}

// ❌ Bad - Tight coupling
export class FlattenerCommand {
  private readonly fileDiscoverer = new FileDiscoverer();  // Direct instantiation
  private readonly logger = new ConsoleLogger();            // Hard to change
  
  async execute(options: { directory: string }): Promise<void> {
    // Cannot easily swap implementations
  }
}
```

## Testing

### Unit Testing

Write isolated unit tests with mocks for dependencies:

```typescript
// ✅ Good - Easy to test with mocks
import { assertEquals } from 'deps';
import { stub } from 'deps';

Deno.test("FlattenerCommand should log and discover files", () => {
  const mockDiscoverer = { discoverFiles: stub() };
  const mockLogger = { info: stub(), error: stub(), debug: stub() };
  
  const command = new FlattenerCommand(mockDiscoverer, mockLogger);
  // Test execution
});
```

### Integration Testing

Write high-level integration tests for commands:

```typescript
Deno.test("FlattenerCommand integration test", async () => {
  // Set up test environment
  const testDir = await Deno.makeTempDir();
  
  // Execute command
  const command = new FlattenerCommand(fileDiscoverer, logger);
  await command.execute({ directory: testDir });
  
  // Verify results
  // ...
  
  // Clean up
  await Deno.remove(testDir, { recursive: true });
});
```

## Performance

### Avoid Accumulating Spread

```typescript
// ✅ Good - Use array methods
const result = items.concat(newItems);
// or
const result = [...items, ...newItems];

// ❌ Bad - Accumulating spread in loops
let result: Item[] = [];
for (const item of items) {
  result = [...result, item]; // O(n²) performance
}
```

### Prefer Immutable Patterns

```typescript
// ✅ Good - Immutable by default
const users = await fetchUsers();
const config = loadConfig();

// ❌ Bad - Unnecessary mutability
let users = await fetchUsers();
let config = loadConfig();
```

## Security

### ASCII-only Code

```typescript
// ✅ Good - ASCII characters only
const pi = Math.PI;
const message = "Hello, world!";

// ❌ Bad - Non-ASCII characters
const π = Math.PI;
const message = "Hello, 世界!";
```

### Safe Operations

```typescript
// ✅ Good - Safe property access
const value = obj.hasOwnProperty("key") ? obj.key : undefined;
// or
const value = obj.key ?? undefined;

// ❌ Bad - Using delete operator
delete obj.key; // Performance impact and type safety issues
```

## Documentation

### Self-Documenting Code

Write code that documents itself through clear naming and explicit types:

```typescript
// ✅ Good - Self-documenting
interface UserProcessor {
  process(user: User): Promise<ProcessedUser>;
}

function calculateTotalPrice(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad - Unclear naming
function calc(x: any[]): number {
  return x.reduce((a, b) => a + b.price, 0);
}
```

### Inline Comments

Use inline comments sparingly and only when necessary to explain why, not what:

```typescript
// ✅ Good - Explains why
const buffer = new ArrayBuffer(1024); // Pre-allocate buffer for performance

// ❌ Bad - States what
const buffer = new ArrayBuffer(1024); // Create a new buffer
```

## Deno-Native Patterns

### CLI Patterns

```typescript
// ✅ Good - Using Cliffy with Deno patterns
import { Command } from 'deps';

await new Command()
  .name("my-cli")
  .version("1.0.0")
  .description("A CLI tool built with Deno")
  .action(() => {
    console.log("Hello from Deno CLI!");
  })
  .parse(Deno.args);
```

### Configuration Patterns

```typescript
// ✅ Good - Using JSR JSONC support
import { parse } from 'deps';

const configText = await Deno.readTextFile("./config.jsonc");
const config = parse(configText) as ConfigSchema;
```

### File System Patterns

```typescript
// ✅ Good - Using JSR fs utilities
import { walk } from 'deps';

for await (const entry of walk("./src", { exts: [".ts"] })) {
  console.log(entry.path);
}
```

**Rationale**: Leverages JSR standardized packages for better reliability and consistency, reduces external dependencies, follows Deno conventions.

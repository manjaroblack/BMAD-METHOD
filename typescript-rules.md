# TypeScript Ruleset (2025)

Cutting-edge TypeScript configuration emphasizing type safety, performance, and modern best practices following the "Deno way".

## Philosophy

- **Strict typing** with specific error types
- **Performance-first** with efficient patterns
- **Functional patterns** preferred
- **Self-documenting code** through explicit types
- **Deno-native** approaches over external dependencies
- **Modular architecture** with clear separation of concerns
- **Dependency injection** using interfaces for loose coupling

## Core Rules & Rationale

### Type Safety Rules

#### 1. Strict TypeScript Configuration

```typescript
// ✅ Good - Explicit types with strict checking
function processUser(user: User): Promise<UserResult> {
  return processUserData(user);
}

// ❌ Bad - Implicit any types
function processUser(user) {
  return processUserData(user);
}
```

**Rationale**: Prevents runtime errors, improves IDE support, enables better refactoring.

#### 2. Explicit Module Specifiers

```typescript
// ✅ Good - Explicit file extensions
import { helper } from 'deps';
import { config } from 'deps';

// ❌ Bad - Implicit extensions
import { helper } from 'deps';
import { config } from 'deps';
```

**Rationale**: Deno requires explicit specifiers, improves performance, reduces ambiguity.

#### 3. Centralized Internal and External Dependencies

```typescript
// ✅ Good - deps.ts pattern with JSR where possible
// deps.ts
export { walk } from "jsr:@std/fs@0.224.0";
export { parse } from "jsr:@std/flags@0.224.0";
export { Command } from "jsr:@cliffy/command@1.0.0-rc.8";

// Internal imports also centralized
export { FileDiscoverer } from "./src/components/flattener/services/FileDiscoverer.ts";
export type { IFileDiscoverer } from "./src/components/flattener/interfaces/IFileDiscoverer.ts";
export { FlattenerCommand } from "./src/components/flattener/flattener.command.ts";

// main.ts
import {
  walk,
  parse,
  Command,
  FileDiscoverer,
  FlattenerCommand
} from 'deps';
import type { IFileDiscoverer } from 'deps';

// ❌ Bad - Direct external imports
import { walk } from "jsr:@std/fs@0.224.0";

// ❌ Bad - Direct internal imports
import { FileDiscoverer } from "./src/components/flattener/services/FileDiscoverer.ts";
```

**Rationale**: Centralizes all dependency management (both internal and external), easier upgrades, better security auditing, leverages JSR for standardized packages, and maintains consistency across the codebase.

### Code Quality Rules

#### 4. Prefer const over let

```typescript
// ✅ Good - Immutable by default
const users = await fetchUsers();
const config = loadConfig();

// ❌ Bad - Unnecessary mutability
let users = await fetchUsers();
let config = loadConfig();
```

**Rationale**: Prevents accidental mutations, clearer intent, functional programming principles.

#### 5. Explicit Function Return Types

```typescript
// ✅ Good - Clear contracts
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

async function fetchUser(id: string): Promise<User | null> {
  return await userRepository.findById(id);
}

// ❌ Bad - Inferred return types
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Rationale**: Self-documenting code, better IDE support, prevents type inference errors.

#### 6. Type-only Imports

```typescript
// ✅ Good - Explicit type imports
import type { 
  User, 
  Config 
} from 'deps';
import { processUser } from 'deps';

// ❌ Bad - Mixed imports
import { User, Config, processUser } from 'deps';
```

**Rationale**: Better tree-shaking, clearer separation of types vs runtime code.

#### 7. Grouped Vertical Imports for Readability

```typescript
// ✅ Good - Grouped imports by type
import {
  Command,
  parse,
  walk,
} from 'deps';

import type {
  Config,
  User,
} from 'deps';

// ❌ Bad - Horizontal imports (hard to read)
import { walk, parse, Command } from 'deps';
import type { User, Config } from 'deps';
```

**Rationale**: Improves readability, easier to scan, avoids horizontal scrolling, and groups related imports together.

### Performance Rules

#### 8. No Accumulating Spread

```typescript
// ✅ Good - Use array methods or specific APIs
const result = items.concat(newItems);
// or
const result = [...items, ...newItems];

// ❌ Bad - Accumulating spread in loops
let result: Item[] = [];
for (const item of items) {
  result = [...result, item]; // O(n²) performance
}
```

**Rationale**: Prevents O(n²) performance issues, more efficient memory usage.

#### 9. Prefer Array Shorthand Syntax

```typescript
// ✅ Good - Shorthand syntax
const users: User[] = [];
const ids: string[] = [];

// ❌ Bad - Array constructor syntax
const users: Array<User> = [];
const ids: Array<string> = [];
```

**Rationale**: More concise, better readability, consistent with community standards.

### Security Rules

#### 10. ASCII-only Code

```typescript
// ✅ Good - ASCII characters only
const pi = Math.PI;
const message = "Hello, world!";

// ❌ Bad - Non-ASCII characters
const π = Math.PI;
const message = "Hello, 世界!";
```

**Rationale**: Prevents encoding issues, improves portability, avoids display problems.

#### 11. No Dangerous Operations

```typescript
// ✅ Good - Safe property access
const value = obj.hasOwnProperty("key") ? obj.key : undefined;
// or
const value = obj.key ?? undefined;

// ❌ Bad - Using delete operator
delete obj.key; // Performance impact and type safety issues
```

**Rationale**: Maintains object shape consistency, better performance, type safety.

## Separation of Concerns

### Single Responsibility Principle

Each module, class, and function should have one clear purpose and responsibility.

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

// ❌ Bad - Multiple responsibilities
export class FileProcessor {
  async discoverAndFlatten(directory: string): Promise<void> {
    // Handles both discovery and flattening
    const files = await this.walkDirectory(directory);
    await this.processFiles(files);
    await this.writeToDisk(files);
    await this.updateConfig(files);
  }
}
```

**Rationale**: Easier to understand, test, and maintain. Changes to one responsibility don't affect others.

### Reusability

Design components to be reusable across the codebase.

```typescript
// ✅ Good - Reusable interface
export interface ILogger {
  info(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

// Can be used by any service that needs logging
export class FileService {
  constructor(private readonly logger: ILogger) {}
  
  async processFile(path: string): Promise<void> {
    this.logger.info(`Processing file: ${path}`);
    // Process file
  }
}

// ❌ Bad - Hard-coded dependency
export class FileService {
  private readonly logger = new ConsoleLogger(); // Not reusable
  
  async processFile(path: string): Promise<void> {
    this.logger.info(`Processing file: ${path}`);
    // Process file
  }
}
```

**Rationale**: Reduces code duplication, promotes consistency, and enables easier refactoring.

### Testability

Enable easier unit testing of individual components through loose coupling.

```typescript
// ✅ Good - Easy to test with mocks
export class FlattenerCommand {
  constructor(
    private readonly fileDiscoverer: IFileDiscoverer,
    private readonly logger: ILogger,
  ) {}
  
  async execute(options: { directory: string }): Promise<void> {
    this.logger.info(`Flattening directory: ${options.directory}`);
    const files = await this.fileDiscoverer.discoverFiles(options.directory);
    // Process files
  }
}

// In tests, we can easily mock dependencies
Deno.test("FlattenerCommand should log and discover files", () => {
  const mockDiscoverer = { discoverFiles: stub() };
  const mockLogger = { info: stub(), error: stub(), debug: stub() };
  
  const command = new FlattenerCommand(mockDiscoverer, mockLogger);
  // Test execution
});

// ❌ Bad - Hard to test due to tight coupling
export class FlattenerCommand {
  private readonly fileDiscoverer = new FileDiscoverer();
  private readonly logger = new ConsoleLogger();
  
  async execute(options: { directory: string }): Promise<void> {
    // Cannot easily mock dependencies for testing
  }
}
```

**Rationale**: Enables isolated unit testing, improves code quality, and reduces testing complexity.

### Maintainability through Dependency Injection

Decouple services completely using Dependency Injection (DI). This makes the code incredibly flexible and even easier to test.

```typescript
// ✅ Good - Interface-based DI with loose coupling
// interfaces/IFileDiscoverer.ts
export interface IFileDiscoverer {
  discoverFiles(directory: string): Promise<string[]>;
}

// services/FileDiscoverer.ts
export class FileDiscoverer implements IFileDiscoverer {
  async discoverFiles(directory: string): Promise<string[]> {
    // Implementation
  }
}

// commands/FlattenerCommand.ts
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

// container.ts - External entity creates and injects services
import { FileDiscoverer } from 'deps';
import type { IFileDiscoverer } from 'deps';

const container = new Container();
container.register<IFileDiscoverer>('IFileDiscoverer', () => new FileDiscoverer());

const fileDiscoverer = container.get<IFileDiscoverer>('IFileDiscoverer');
const logger = container.get<ILogger>('ILogger');
const flattenerCommand = new FlattenerCommand(fileDiscoverer, logger);

// ❌ Bad - Tight coupling
export class FlattenerCommand {
  private readonly fileDiscoverer = new FileDiscoverer();  // Direct instantiation
  private readonly logger = new ConsoleLogger();            // Hard to change
  
  async execute(options: { directory: string }): Promise<void> {
    // Cannot easily swap implementations
  }
}
```

**Rationale**: Enables loose coupling, makes code more flexible, and allows for easier testing and maintenance.

## Modular Architecture Patterns

### Clear Directory Structure

```typescript
// ✅ Good - Well-organized modular structure
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
```

**Rationale**: Promotes separation of concerns, improves maintainability, and enables better code organization.

## Dependency Injection Patterns

### Interface-based Dependency Injection

```typescript
// ✅ Good - Interface-based DI with centralized binding
// interfaces/IFileDiscoverer.ts
export interface IFileDiscoverer {
  discoverFiles(directory: string): Promise<string[]>;
}

// services/FileDiscoverer.ts
import type { IFileDiscoverer } from 'deps';

export class FileDiscoverer implements IFileDiscoverer {
  async discoverFiles(directory: string): Promise<string[]> {
    // Implementation
  }
}

// commands/FlattenerCommand.ts
import type { IFileDiscoverer } from 'deps';

export class FlattenerCommand {
  constructor(
    private readonly fileDiscoverer: IFileDiscoverer,
  ) {}

  async execute(options: { directory: string }): Promise<void> {
    const files = await this.fileDiscoverer.discoverFiles(options.directory);
    // Process files
  }
}

// container.ts
import { FileDiscoverer } from 'deps';
import type { IFileDiscoverer } from 'deps';

const container = new Container();
container.register<IFileDiscoverer>('IFileDiscoverer', () => new FileDiscoverer());

// main.ts
const fileDiscoverer = container.get<IFileDiscoverer>('IFileDiscoverer');
const flattenerCommand = new FlattenerCommand(fileDiscoverer);

// ❌ Bad - Direct implementation imports
import { FileDiscoverer } from 'deps';

export class FlattenerCommand {
  private readonly fileDiscoverer = new FileDiscoverer();

  async execute(options: { directory: string }): Promise<void> {
    const files = await this.fileDiscoverer.discoverFiles(options.directory);
    // Process files
  }
}
```

**Rationale**: Enables loose coupling, easier testing, better maintainability.

## Deno-Native Patterns

### Error Handling

```typescript
// ✅ Good - Specific error types with Deno patterns
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

// Using Deno's built-in error handling
try {
  const data = await Deno.readTextFile("./config.json");
  // Process data
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    // Handle file not found
  } else if (error instanceof ServiceError) {
    // Handle custom service error
  } else {
    // Handle unexpected error
  }
}
```

### Functional Patterns

```typescript
// ✅ Good - Pure functions with explicit types
const createUser = (name: string, email: string): User => ({
  id: crypto.randomUUID(),
  name,
  email,
  createdAt: new Date(),
});

const processUsers = (users: User[]): ProcessedUser[] =>
  users.map((user) => processUser(user));

// ❌ Bad - Impure functions
let globalState = {};
function createUser(name: string, email: string) {
  const user = { name, email };
  globalState[user.id] = user;
  return user;
}
```

### Testing Patterns

```typescript
// ✅ Good - Using Deno's built-in testing
import { assertEquals } from 'deps';

Deno.test("should create user with correct properties", () => {
  const user = createUser("John", "john@example.com");
  assertEquals(user.name, "John");
  assertEquals(user.email, "john@example.com");
});

// ❌ Bad - No testing
// No tests for createUser function
```

**Rationale**: Leverages Deno's built-in testing capabilities, reduces external dependencies, uses JSR for standardized testing utilities.

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
// ✅ Good - Using Deno's built-in JSONC support
import { parse } from 'deps';

const configText = await Deno.readTextFile("./config.jsonc");
const config = parse(configText) as ConfigSchema;
```

### File System Patterns

```typescript
// ✅ Good - Using Deno's built-in fs utilities
import { walk } from 'deps';

for await (const entry of walk("./src", { exts: [".ts"] })) {
  console.log(entry.path);
}
```

**Rationale**: Leverages Deno's built-in capabilities, reduces external dependencies, follows Deno conventions.

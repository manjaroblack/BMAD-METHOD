# TypeScript Ruleset (2025)

Cutting-edge TypeScript rules emphasizing modularity, type safety, performance, testing, and modern
best practices following the "Deno way".

## Table of Contents

- [Philosophy](#philosophy) — guiding principles and priorities.
- [Core Rules & Rationale](#core-rules--rationale) — strict typing, imports, performance, and
  security with examples.
- [Separation of Concerns](#separation-of-concerns) — keep modules focused and composable.
- [Dependency Injection](#dependency-injection) — interface-based DI, composition roots,
  testability.
- [Modular Architecture Patterns](#modular-architecture-patterns) — layering, boundaries, and module
  organization.
- [Deno-Native Patterns](#deno-native-patterns) — errors, logging, permissions, and Deno idioms.
- [Testing: The Deno Way](#testing-the-deno-way) — snapshots, mocking/spying, property-based tests.
- [Documentation Patterns](#documentation-patterns) — docs-as-code, JSDoc/TSDoc, doctests, deno doc,
  versioned API links.
- [Project Configuration & CI](#project-configuration--ci) — canonical deno.jsonc, tasks,
  lint/format, CI.
- [Dependency & Import Strategy](#dependency--import-strategy-jsr-first-depsts-pinning) — JSR-first,
  deps.ts, pinning, optional @std alias.
- [Reproducibility: Lockfile & Vendoring](#reproducibility-lockfile--vendoring) — lock freeze,
  vendor, offline builds.
- [Benchmarking: Deno.bench](#benchmarking-denobench) — write reliable benchmarks and compare
  alternatives.
- [Time Control](#time-control-faketime-and-using) — deterministic timers with FakeTime and `using`.
- [Node Compatibility Stance](#node-compatibility-stance-web-apis-first) — prefer Web APIs/JSR over
  Node polyfills.
- [Logging Patterns](#logging-patterns) — structured logs and best practices.
- [Deno KV Patterns (Optional)](#optional-deno-kv-patterns) — KV schemas, transactions, limits.
- [Configuration Patterns](#configuration-patterns) — JSONC parsing, env, validation.
- [File System Patterns](#file-system-patterns) — safe fs ops, walking, and globs.

## Philosophy

- **Strict typing** with specific error types
- **Performance-first** with efficient patterns
- **Functional patterns** preferred
- **Self-documenting code** through explicit types
- **Deno-native** approaches over external dependencies
- **Modular architecture** with clear separation of concerns
- **Dependency injection** using interfaces for loose coupling
- **Testing** with Deno's built-in testing capabilities

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

#### 2. Centralized Internal and External Dependencies

```typescript
// ✅ Good - deps.ts pattern with JSR where possible
// deps.ts
export { walk } from 'jsr:@std/fs@0.224.0';
export { parse as parseFlags } from 'jsr:@std/flags@0.224.0';
export { parse as parseJsonc } from 'jsr:@std/jsonc@0.224.0';
export { Command } from 'jsr:@cliffy/command@1.0.0-rc.8';

// Internal imports also centralized
export { FileDiscoverer } from './src/components/flattener/services/FileDiscoverer.ts';
export type { IFileDiscoverer } from './src/components/flattener/interfaces/IFileDiscoverer.ts';
export { FlattenerCommand } from './src/components/flattener/flattener.command.ts';

// main.ts
import { Command, FileDiscoverer, FlattenerCommand, parseFlags, walk } from 'deps';
import type { IFileDiscoverer } from 'deps';

// ❌ Bad - Direct external imports
import { walk } from 'jsr:@std/fs@0.224.0';

// ❌ Bad - Direct internal imports
import { FileDiscoverer } from './src/components/flattener/services/FileDiscoverer.ts';
```

**Rationale**: Centralizes all dependency management (both internal and external), easier upgrades,
better security auditing, leverages JSR for standardized packages, and maintains consistency across
the codebase.

#### 3. Explicit .ts Extensions for Internal Imports

```typescript
// ✅ Good - Always include .ts for local files
import { FlattenerCommand } from './src/components/flattener/flattener.command.ts';
import type { IFileDiscoverer } from './src/components/flattener/interfaces/IFileDiscoverer.ts';

// ❌ Bad - Missing extension can break resolution and tooling
import { FlattenerCommand } from './src/components/flattener/flattener.command';
```

**Rationale**: Ensures correct ESM resolution, better tooling, and consistent imports across the
codebase.

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

#### 6. Group Imports by Type

```typescript
// ✅ Good - Explicit type imports
import type { Config, User } from 'deps';
import { processUser } from 'deps';

// ❌ Bad - Mixed imports
import { Config, type processUser, User } from 'deps';
```

**Rationale**: Better tree-shaking, clearer separation of types vs runtime code. Use one import
statement per type group per module; do not mix type-only and value imports.

### Performance Rules

#### 7. No Accumulating Spread

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

#### 8. Prefer Array Shorthand Syntax

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

#### 9. No Dangerous Operations

```typescript
// ✅ Good - Safe property access
const value = Object.hasOwn(obj, 'key') ? obj.key : undefined;
// or when older runtimes lack Object.hasOwn:
const value2 = Object.prototype.hasOwnProperty.call(obj, 'key') ? obj.key : undefined;
// or, when the property may be absent
const value3 = obj.key ?? undefined;

// ❌ Bad - Using delete operator
delete obj.key; // Performance impact and type safety issues
```

Tip: To produce a copy without a property (avoid `delete`), use destructuring to create a new
object:

```ts
const { key: _omit, ...rest } = obj; // rest has all properties except "key"
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

**Rationale**: Easier to understand, test, and maintain. Changes to one responsibility don't affect
others.

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
Deno.test('FlattenerCommand should log and discover files', () => {
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

## Dependency Injection

Decouple services completely using Dependency Injection (DI). This makes the code incredibly
flexible and even easier to test.

Key principles:

- Depend on interfaces, not implementations.
- Construct and inject dependencies at the composition root (container/factory), not inside
  consumers.
- Do not import concrete implementations in consumers; prefer `import type { IFoo } from "deps"` and
  inject.
- Keep constructors small; avoid service locators; favor explicit parameters.
- Centralize bindings in one place to simplify testing and swapping implementations.

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
    private readonly fileDiscoverer: IFileDiscoverer, // Depend on interface
    private readonly logger: ILogger, // Not concrete class
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
container.register<IFileDiscoverer>(
  'IFileDiscoverer',
  () => new FileDiscoverer(),
);

const fileDiscoverer = container.get<IFileDiscoverer>('IFileDiscoverer');
const logger = container.get<ILogger>('ILogger');
const flattenerCommand = new FlattenerCommand(fileDiscoverer, logger);

// ❌ Bad - Tight coupling
export class FlattenerCommand {
  private readonly fileDiscoverer = new FileDiscoverer(); // Direct instantiation
  private readonly logger = new ConsoleLogger(); // Hard to change

  async execute(options: { directory: string }): Promise<void> {
    // Cannot easily swap implementations
  }
}
```

**Rationale**: Enables loose coupling, makes code more flexible, and allows for easier testing and
maintenance.

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

**Rationale**: Promotes separation of concerns, improves maintainability, and enables better code
organization.

## Deno-Native Patterns

### Error Handling

```typescript
// ✅ Good - Specific error types with Deno patterns
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message, { cause });
    this.name = 'ServiceError';
  }
}

// Using Deno's built-in error handling
try {
  const data = await Deno.readTextFile('./config.json');
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

const processUsers = (users: User[]): ProcessedUser[] => users.map((user) => processUser(user));

// ❌ Bad - Impure functions
let globalState = {};
function createUser(name: string, email: string) {
  const user = { name, email };
  globalState[user.id] = user;
  return user;
}
```

## Testing: The Deno Way

Cutting-edge Deno testing centers on its powerful, built-in test runner via `Deno.test`. Modern
practice leverages snapshot testing, sophisticated mocking, and property-based testing—all
Deno-native and centralized via `deps.ts`.

### Core Concepts

- `Deno.test` is the foundation for defining tests (sync, async, and with steps via `t.step`).
- Sandboxed by default: tests follow Deno permissions—grant only what you need.
- Standard assertions from `@std/assert` and rich utilities from `@std/testing`.
- Run with `deno test` (use `--watch`, `--filter`, or permission flags as needed).

### deps.ts (testing exports)

```typescript
// deps.ts (testing)
export { assertEquals, assertThrows } from 'jsr:@std/assert@0.224.0';
export { assertSnapshot } from 'jsr:@std/testing@0.224.0/snapshot';
export { assertSpyCalls, spy, stub } from 'jsr:@std/testing@0.224.0/mock';
export { default as fc } from 'npm:fast-check@3.19.0';
```

### Example: A simple test file

```typescript
// my_app.test.ts
import { assertEquals, assertThrows } from 'deps';

// A simple function to test
function add(a: number, b: number): number {
  return a + b;
}

// A basic test case using the Deno.test function
Deno.test('add function correctly adds two numbers', () => {
  const result = add(2, 3);
  assertEquals(result, 5);
});

// An async test case
Deno.test('async test example', async () => {
  const p = Promise.resolve('hello world');
  assertEquals(await p, 'hello world');
});

// Using test steps for better organization (describe/it-like via t.step)
Deno.test('User model validation', async (t) => {
  class User {
    constructor(public name: string) {
      if (!name) throw new Error('Name cannot be empty');
    }
  }

  await t.step('should throw if name is empty', () => {
    assertThrows(() => new User(''), Error, 'Name cannot be empty');
  });

  await t.step('should create a user with a valid name', () => {
    const user = { name: 'Devin' } as const;
    assertEquals(user.name, 'Devin');
  });
});
```

Run tests:

```sh
deno test
# Options: --watch, --filter "pattern", --allow-net, --allow-read, etc.
```

### Advanced: Snapshot testing

Snapshot testing captures and compares complex outputs across runs.

```typescript
// snapshot_example.test.ts
import { assertSnapshot } from 'deps';

Deno.test('snapshot of a complex object', async (t) => {
  const userProfile = {
    id: 123,
    username: 'devin',
    roles: ['admin', 'editor'] as const,
    preferences: {
      theme: 'dark',
      notifications: true,
    },
    lastLogin: new Date('2025-08-09T17:00:00Z'),
  } as const;

  // First run creates __snapshots__/snapshot_example.test.ts.snap
  await assertSnapshot(t, userProfile);
});
```

### Advanced: Mocking and spying

Use `@std/testing/mock` to stub or spy on dependencies for isolation.

```typescript
// mock_example.test.ts
import { assertEquals, stub } from 'deps';

// Dependency as an object so we can stub its method
const userApi = {
  fetchUserData(id: number): { id: number; name: string } {
    // In reality, this would make a network request
    return { id, name: 'Fetched User' };
  },
};

function getUserDisplayName(id: number): string {
  const user = userApi.fetchUserData(id);
  return `User: ${user.name.toUpperCase()}`;
}

Deno.test('getUserDisplayName formats the user name', () => {
  const fetchStub = stub(userApi, 'fetchUserData', () => ({
    id: 1,
    name: 'Stubbed User',
  }));

  try {
    const displayName = getUserDisplayName(1);
    assertEquals(displayName, 'User: STUBBED USER');
  } finally {
    fetchStub.restore();
  }
});
```

### Advanced: Property-based testing

Define properties that should hold for all valid inputs; `fast-check` generates cases.

```typescript
// property_based_example.test.ts
import { assertEquals, fc } from 'deps';

Deno.test('addition should be commutative', () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), (a, b) => {
      assertEquals(a + b, b + a);
    }),
  );
});
```

**Rationale**: First-class Deno testing with centralized deps ensures consistency, strong type
safety, fewer external tools, and modern coverage via snapshots, mocks/spies, and property-based
tests.

## Documentation Patterns

Deno-native docs-as-code. Treat documentation as part of your codebase with executable examples,
versioned API links, and CI gates that keep docs accurate.

### JSDoc/TSDoc Conventions

- Document every exported symbol with a one-line summary and a concise description.
- Use fenced TypeScript examples (```ts) under `@example` blocks; keep them copy-pasteable and
  pinned to JSR versions.
- Prefer specific error types in `@throws` and include permissions notes (e.g.,
  `Requires --allow-read`).
- Use `@deprecated`, `@experimental`, and `@since` for lifecycle clarity.

````ts
/**
 * Parse a JSONC config file into a typed Config.
 *
 * @example
 * ```ts
 * import { parseConfig } from "jsr:@scope/pkg@1";
 * const cfg = await parseConfig("deno.jsonc");
 * ```
 * @throws {ConfigError} on invalid syntax
 * @permission --allow-read for the config file path
 */
export async function parseConfig(path: string): Promise<Config> {
  // ...
}
````

### Doctests (Executable Examples)

- Keep examples trustworthy by running doctests in CI and locally.
- Scope to key docs (README, guides) and pin imports for determinism.

```bash
deno test --doc README.md docs/**/*.md
```

### deno doc (API Source of Truth)

- Lint API docs: `deno doc --lint mod.ts`
- Generate HTML for local review or site embedding:
  `deno doc --html --name="Project" --output=docs/api mod.ts`
- Emit JSON for custom tooling/xrefs: `deno doc --json mod.ts > docs/api.json`

```jsonc
// deno.jsonc (docs tasks)
{
  "tasks": {
    "docs:test": "deno test --doc README.md docs/**/*.md",
    "api:lint": "deno doc --lint mod.ts",
    "api:html": "deno doc --html --name=\"Project\" --output=docs/api mod.ts",
    "api:json": "deno doc --json mod.ts > docs/api.json"
  }
}
```

### Linking and Versioning

- Prefer linking to JSR’s canonical, versioned API docs; keep guides focused and narrative.
- In examples, import from `jsr:@scope/pkg@1` (major-pinned) for stability.
- When permissions are required, show flags inline near examples.

### Optional: Static Site Integration

- If publishing narrative docs, use a Deno-native SSG (e.g., Lume) with search and syntax
  highlighting.
- Keep site build as a separate task; don’t couple code builds to docs builds.

### Docs Site Features (Lume)

- Static search: use the `pagefind` plugin (zero-config static, fast, privacy-friendly).
- Typed MDX components: write guides in MDX + TSX; enable `"jsx": "react-jsx"` and
  `"jsxImportSource": "lume"` in `deno.jsonc`; create reusable typed components for
  callouts/tabs/banners.
- Multi-version and i18n: either link to versioned JSR docs by major version or publish versioned
  subdirs (e.g., `v1/`, `v2/`); use Lume’s `multilanguage` plugin for locales.
- Visuals and rich content: `prism` (code), `katex` (math), and Mermaid (via remark plugin) for
  diagrams.

```ts
// docs/_config.ts (example)
import lume from 'lume/mod.ts';
import mdx from 'lume/plugins/mdx.ts';
import prism from 'lume/plugins/prism.ts';
import pagefind from 'lume/plugins/pagefind.ts';
import multilanguage from 'lume/plugins/multilanguage.ts';
import katex from 'lume/plugins/katex.ts';

export default lume()
  .use(mdx())
  .use(prism())
  .use(pagefind())
  .use(multilanguage())
  .use(katex());
```

**Rationale**: Executable, versioned, and linted docs prevent drift, keep examples fresh, and align
with Deno’s single-source-of-truth approach via TypeScript types and JSDoc.

## Project Configuration & CI

Establish a canonical, reproducible project configuration with strict compiler options, centralized
imports, deterministic dependency resolution, and CI tasks that enforce quality gates.

### deno.jsonc (canonical baseline)

```jsonc
{
  // Reproducibility and isolation
  "lock": true,
  "nodeModulesDir": false,

  // Strict TypeScript (Deno controls module resolution and libs by default)
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noImplicitOverride": true
  },

  // Import map style aliasing for centralized deps
  "imports": {
    "deps": "./deps.ts"
  },

  // Uniform tasks for local dev and CI
  "tasks": {
    "fmt": "deno fmt",
    "lint": "deno lint",
    "typecheck": "deno check ./src/mod.ts",
    "test": "deno test --fail-fast",
    "test:watch": "deno test --watch --fail-fast",
    "coverage": "deno test --coverage=coverage && deno coverage coverage --lcov > coverage.lcov",
    "bench": "deno bench --fail-fast",
    "lock:freeze": "deno lock --frozen"
  }
}
```

Note on libs: Deno sets sane defaults for the runtime. Only customize `compilerOptions.lib` for
multi-runtime libraries (e.g., add "dom" for browser types). Prefer "deno.ns" when mixing with
browser libs to expose Deno-specific APIs without conflicts. See:
<https://docs.deno.com/runtime/reference/ts_config_migration/>

#### Lint & Format configuration

Keep lint/format fast and noise-free by excluding generated and vendored folders, while sticking to
recommended rules.

```jsonc
{
  "lint": {
    "files": { "exclude": ["vendor/", "coverage/", "__snapshots__/"] },
    "rules": { "tags": ["recommended"] }
  },
  "fmt": {
    "files": { "exclude": ["vendor/", "coverage/"] }
  }
}
```

#### Dependency management commands

```sh
# Add/remove deps with lock updates
deno add jsr:@std/fs@0.224.0
deno remove jsr:@std/fs
```

#### CI checklist (GitHub Actions example)

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deno:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - name: Format (check)
        run: deno fmt --check
      - name: Lint
        run: deno lint
      - name: Typecheck
        run: deno task typecheck
      - name: Lock freeze
        run: deno task lock:freeze
      - name: Test
        run: deno task test
      - name: Coverage
        run: deno task coverage
      - name: Upload lcov (artifact)
        uses: actions/upload-artifact@v4
        with:
          name: coverage-lcov
          path: coverage.lcov
```

## Dependency & Import Strategy (JSR-first, deps.ts, pinning)

Goals: security, consistency, and easy upgrades.

- Prefer JSR specifiers and pin versions: `jsr:@std/fs@0.224.0`.
- Centralize all external and internal imports in `deps.ts` and expose a single alias `deps` via
  `deno.jsonc` imports.
- Avoid direct `https:` imports in app code; if needed, only in `deps.ts`.
- Keep internal imports routed through `deps`.

Example `deps.ts`

```ts
// Standard library
export { walk } from 'jsr:@std/fs@0.224.0';
export { parse as parseFlags } from 'jsr:@std/flags@0.224.0';
export { parse as parseJsonc } from 'jsr:@std/jsonc@0.224.0';
export { assertEquals, assertThrows } from 'jsr:@std/assert@0.224.0';
export { assertSnapshot } from 'jsr:@std/testing@0.224.0/snapshot';
export { assertSpyCalls, spy, stub } from 'jsr:@std/testing@0.224.0/mock';
export { FakeTime } from 'jsr:@std/testing@0.224.0/time';

// Third-party (prefer JSR; fall back to npm: when no JSR)
export { default as fc } from 'npm:fast-check@3.19.0';

// Internal exports (centralized)
export { FileDiscoverer } from './src/components/flattener/services/FileDiscoverer.ts';
export type { IFileDiscoverer } from './src/components/flattener/interfaces/IFileDiscoverer.ts';
```

## Reproducibility: Lockfile & Vendoring

- Always commit the lockfile (created/updated automatically). In CI, run `deno lock --frozen` to
  fail on drift.
- For hermetic/offline builds, use `deno vendor` to vendor remote modules; commit the `vendor/`
  folder. When vendoring, keep `imports` mapping consistent and re-run `deno vendor` after version
  bumps.

Common commands

```sh
# Freeze dependencies (CI gate)
deno lock --frozen

# Vendor dependencies (optional, for hermetic builds)
deno vendor src/mod.ts
```

If you vendor, point your project to the generated import map so resolution is fully offline:

```jsonc
{
  "importMap": "vendor/import_map.json"
}
```

Dependency management commands

```sh
# Add/remove deps with lock updates
deno add jsr:@std/fs@0.224.0
deno remove jsr:@std/fs
```

### Testing: Permissions (least-privilege)

Prefer per-test permissions via `permissions` on `Deno.test` definitions rather than global
`--allow-*` flags.

```ts
// test/config_read.test.ts
import { assertEquals } from 'deps';

Deno.test({
  name: 'reads config file safely',
  permissions: { read: ['./config.jsonc'] },
}, async () => {
  const text = await Deno.readTextFile('./config.jsonc');
  assertEquals(typeof text, 'string');
});
```

More granular examples:

```ts
Deno.test({
  name: 'calls API over HTTPS only',
  permissions: { net: ['api.example.com:443'], env: ['API_TOKEN'] },
}, async () => {
  const res = await fetch('https://api.example.com/data', {
    headers: { Authorization: `Bearer ${Deno.env.get('API_TOKEN')}` },
  });
  // ... assertions
});
```

### Coverage Workflow

- Generate coverage with `--coverage`. Convert to LCOV for tooling and upload as CI artifact.
- Snapshot files (`.snap`) should be committed to VCS; do not hand-edit them. Let `assertSnapshot`
  update snapshots as needed.
- Ignore local coverage dirs in VCS.

```sh
deno test --coverage=coverage
deno coverage coverage --lcov > coverage.lcov
```

`.gitignore`

```gitignore
coverage/
```

## Benchmarking: Deno.bench

Microbenchmarks support performance-first decisions. Keep benchmarks isolated and side-effect free.

```ts
// bench/sum.bench.ts
Deno.bench('sum 0..10k', () => {
  let s = 0;
  for (let i = 0; i < 10_000; i++) s += i;
});
```

Best practices

- Isolate benchmarks; avoid I/O and global state.
- Warm up within the function if needed; keep inputs deterministic.
- Run with `deno bench --fail-fast` and consider `--filter` to focus hot paths.
- Compare alternatives in the same file to reduce run-to-run variance.

Run with `deno bench --fail-fast`.

## Time Control: FakeTime and using

Control timers deterministically to eliminate flaky tests.

```ts
import { FakeTime } from 'deps';
import { assertSpyCalls, spy } from 'deps';

function secondInterval(cb: () => void): number {
  return setInterval(cb, 1000);
}

Deno.test('secondInterval ticks predictably', () => {
  using time = new FakeTime();
  const cb = spy();
  const id = secondInterval(cb);
  assertSpyCalls(cb, 0);
  time.tick(1000);
  assertSpyCalls(cb, 1);
  clearInterval(id);
  time.tick(2000);
  assertSpyCalls(cb, 1);
});
```

## Node Compatibility Stance (Web APIs first)

- Prefer Web Standards and JSR packages over Node polyfills.
- Use `npm:` specifiers only when no JSR or standard solution exists.
- Do not rely on Node-only globals/APIs unless a strict compatibility boundary is required and
  documented.

## Logging Patterns

Use an interface-based logger with a pluggable backend (e.g., `@std/log`). Inject `ILogger` for
testability.

```ts
// interfaces/ILogger.ts
export interface ILogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

// services/StdLogger.ts
import * as log from 'jsr:@std/log@0.224.0';
import type { ILogger } from '../interfaces/ILogger.ts';

export class StdLogger implements ILogger {
  constructor() {
    log.setup({
      handlers: { console: new log.handlers.ConsoleHandler('DEBUG') },
      loggers: { default: { level: 'DEBUG', handlers: ['console'] } },
    });
  }
  info(msg: string): void {
    log.getLogger().info(msg);
  }
  warn(msg: string): void {
    log.getLogger().warning(msg);
  }
  error(msg: string): void {
    log.getLogger().error(msg);
  }
  debug(msg: string): void {
    log.getLogger().debug(msg);
  }
}
```

## Optional: Deno KV Patterns

If your app uses Deno KV, follow these patterns:

- Open KV at the edge of the program and inject where needed; avoid global singletons in libraries.
- Prefer atomic ops for multi-key updates; avoid hot-path full scans.
- Use structured keys (`["user", userId]`) and TTL where appropriate.

```ts
// kv.ts
export async function createKv() {
  const kv = await Deno.openKv();
  return kv;
}

// consumer.ts
export async function incrementCounter(kv: Deno.Kv, key: string): Promise<number> {
  const r = await kv.get<number>(['counter', key]);
  const n = (r.value ?? 0) + 1;
  await kv.set(['counter', key], n, { expireIn: 60_000 });
  return n;
}
```

Atomic transactions and queues

```ts
// Atomic multi-key update
export async function transfer(
  kv: Deno.Kv,
  from: string,
  to: string,
  amount: number,
): Promise<boolean> {
  const fromKey = ['acct', from];
  const toKey = ['acct', to];
  const [fromBal, toBal] = await Promise.all([
    kv.get<number>(fromKey),
    kv.get<number>(toKey),
  ]);
  if ((fromBal.value ?? 0) < amount) return false;
  const res = await kv.atomic()
    .check(fromBal) // optimistic concurrency
    .check(toBal)
    .set(fromKey, (fromBal.value ?? 0) - amount)
    .set(toKey, (toBal.value ?? 0) + amount)
    .commit();
  return res.ok;
}

// Queue producer/consumer
export async function enqueueEmail(kv: Deno.Kv, payload: Record<string, unknown>) {
  await kv.enqueue({ type: 'email', payload }, { delay: 1_000 });
}

export async function listen(kv: Deno.Kv, handler: (msg: unknown) => Promise<void>) {
  for await (const msg of kv.listenQueue({ signal: AbortSignal.timeout(60_000) })) {
    await handler(msg);
  }
}
```

## Configuration Patterns

```typescript
// ✅ Good - Using Deno's built-in JSONC support
import { parseJsonc } from 'deps';

const configText = await Deno.readTextFile('./config.jsonc');
const config = parseJsonc(configText) as ConfigSchema;
```

## File System Patterns

```typescript
// ✅ Good - Using Deno's built-in fs utilities
import { walk } from 'deps';

for await (const entry of walk('./src', { exts: ['.ts'] })) {
  console.log(entry.path);
}
```

**Rationale**: Leverages Deno's built-in capabilities, reduces external dependencies, follows Deno
conventions.

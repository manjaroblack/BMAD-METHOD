# TS Rules (2025)

## Philosophy

- Strict typing + specific errors
- Performance-first
- Functional patterns
- Self-documenting
- Deno-native
- Modular design
- DI with interfaces

## Rules

### Type Safety

1. **Strict config** - All strict options on
2. **Explicit extensions** - `.ts` in imports
3. **Centralized deps** - `deps.ts` pattern
4. **Prefer const** - Immutable default
5. **Explicit returns** - Function return types
6. **Type-only imports** - `import type {}`
7. **Vertical imports** - One per line

### Performance

1. **No accumulating spread** - Avoid `[...arr, item]` loops
2. **Array shorthand** - `T[]` not `Array<T>`
3. **Immutable patterns** - Prefer const

### Security

1. **ASCII only** - No unicode
2. **No delete** - Use destructuring
3. **Safe ops** - hasOwnProperty over delete

### Architecture

1. **Modular structure** - Clear separation
2. **Interface-based DI** - Loose coupling
3. **Single responsibility** - One purpose
4. **JSR deps** - Standardized packages

## Patterns

### Errors

```ts
// Base error
export class ServiceError extends Error {
  constructor(message: string, public readonly code: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Specific errors
export class ConfigError extends ServiceError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONFIG_ERROR', cause);
    this.name = 'ConfigError';
  }
}
```

### DI Pattern

```ts
// Interface
export interface IFileDiscoverer {
  discoverFiles(directory: string): Promise<string[]>;
}

// Implementation
export class FileDiscoverer implements IFileDiscoverer {
  async discoverFiles(directory: string): Promise<string[]> {
    // Implementation
  }
}

// Consumer
export class FlattenerCommand {
  constructor(private readonly fileDiscoverer: IFileDiscoverer) {}
}
```

### Functions

```ts
// ✅ Good - Pure function
const createUser = (name: string, email: string): User => ({
  id: crypto.randomUUID(),
  name,
  email,
  createdAt: new Date()
});

// ✅ Good - Vertical imports
import {
  parse,
  walk,
} from 'deps';

import type {
  Config,
  User,
} from 'deps';
```

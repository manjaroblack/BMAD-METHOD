# TypeScript Ruleset (2025)

Cutting-edge TypeScript configuration emphasizing type safety, performance, and modern best practices.

## Philosophy

- **Strict typing** with specific error types
- **Performance-first** with efficient patterns
- **Functional patterns** preferred
- **Self-documenting code** through explicit types

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

#### 3. Centralized External Dependencies

```typescript
// ✅ Good - deps.ts pattern
// deps.ts
export { serve } from "https://deno.land/std@0.224.0/http/server.ts";
export { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";

// main.ts
import { serve, assertEquals } from 'deps';

// ❌ Bad - Direct external imports
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
```

**Rationale**: Centralizes dependency management, easier upgrades, better security auditing.

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
import type { User, Config } from 'deps';
import { processUser } from 'deps';

// ❌ Bad - Mixed imports
import { User, Config, processUser } from 'deps';
```

**Rationale**: Better tree-shaking, clearer separation of types vs runtime code.

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

#### 9. ASCII-only Code

```typescript
// ✅ Good - ASCII characters only
const pi = Math.PI;
const message = "Hello, world!";

// ❌ Bad - Non-ASCII characters
const π = Math.PI;
const message = "Hello, 世界!";
```

**Rationale**: Prevents encoding issues, improves portability, avoids display problems.

#### 10. No Dangerous Operations

```typescript
// ✅ Good - Safe property access
const value = obj.hasOwnProperty("key") ? obj.key : undefined;
// or
const value = obj.key ?? undefined;

// ❌ Bad - Using delete operator
delete obj.key; // Performance impact and type safety issues
```

**Rationale**: Maintains object shape consistency, better performance, type safety.

## Advanced Patterns

### Error Handling

```typescript
// ✅ Good - Specific error types
class ValidationError extends Error {
  constructor(field: string, value: unknown) {
    super(`Invalid value for field "${field}": ${value}`);
    this.name = "ValidationError";
  }
}

function validateUser(user: unknown): User {
  if (!isUser(user)) {
    throw new ValidationError("user", user);
  }
  return user;
}

// ❌ Bad - Generic errors
function validateUser(user: unknown): User {
  if (!isUser(user)) {
    throw new Error("Invalid user");
  }
  return user;
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

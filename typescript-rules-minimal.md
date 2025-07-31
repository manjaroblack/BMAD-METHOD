# TS Rules

## Philosophy

- Strict typing + specific errors
- Performance-first
- Functional patterns
- Self-documenting

## Rules

### Type Safety

1. **Strict config** - All strict options on
2. **Explicit extensions** - `.ts` in imports  
3. **Centralized deps** - `deps.ts` pattern
4. **Prefer const** - Immutable default
5. **Explicit returns** - Function return types
6. **Type-only imports** - `import type {}`

### Performance  

1. **No accumulating spread** - Avoid `[...arr, item]` loops
2. **Array shorthand** - `T[]` not `Array<T>`

### Security

1. **ASCII only** - No unicode
2. **No delete** - Use destructuring

## Patterns

### Errors

```ts
class ValidationError extends Error {
  constructor(field: string, value: unknown) {
    super(`Invalid ${field}: ${value}`);
    this.name = 'ValidationError';
  }
}
```

### Functions

```ts
const createUser = (name: string, email: string): User => ({
  id: crypto.randomUUID(),
  name,
  email,
  createdAt: new Date()
});
```

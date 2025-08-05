# Dependency Injection Container Guide

## Overview

The BMAD-METHOD project uses a custom dependency injection (DI) container implementation that provides inversion of control (IoC) capabilities. This guide explains how to use and extend the DI container.

## Core Concepts

### Service Identifiers

Services are identified by string keys defined in `src/core/types.ts`. This approach provides type safety while maintaining flexibility:

```typescript
// src/core/types.ts
export const TYPES = {
  // Core Services
  ICliService: "ICliService",
  IConfigService: "IConfigService",

  // Component Services
  IFileDiscoverer: "IFileDiscoverer",
  IInstallerService: "IInstallerService",

  // Commands
  ICommand: "ICommand",
};
```

### Service Lifetimes

The container supports two service lifetimes:

1. **Singleton**: Only one instance is created and shared across all requests. This is the default lifetime and is suitable for stateless services.
2. **Transient**: A new instance is created for each request. This is suitable for stateful services that maintain instance-specific data.

#### Singleton Services

Singleton services are created once and the same instance is returned for all subsequent requests. This is memory-efficient and appropriate for services that don't maintain state:

```typescript
// Registering a singleton service (default)
container.register(TYPES.IConfigService, createConfigService, "singleton");

// Alternative syntax (also singleton)
container.register(TYPES.IConfigService, createConfigService);
```

#### Transient Services

Transient services create a new instance each time they are requested. This is useful for services that maintain state or have dependencies that should not be shared:

```typescript
// Registering a transient service
container.register(TYPES.ISomeStatefulService, createSomeStatefulService, "transient");
```

#### Choosing Between Singleton and Transient

- Use **singleton** for:
  - Stateless services (services without instance variables that change)
  - Services that are expensive to create
  - Services that maintain no user-specific data
  - Utility services

- Use **transient** for:
  - Stateful services (services with instance variables that change)
  - Services that maintain user-specific data
  - Services that need to be isolated between requests

### Factory Functions

Services are registered using factory functions, which enables dependency injection at registration time:

```typescript
container.register(TYPES.IConfigService, createConfigService, "singleton");
```

Factory functions provide several benefits:

1. **Lazy initialization**: Services are only created when first requested
2. **Dependency injection**: Dependencies can be injected at registration time
3. **Flexibility**: Complex initialization logic can be encapsulated
4. **Testability**: Easy to mock or replace with test doubles

Example of a factory function with dependency injection:

```typescript
// Service that depends on another service
container.register(TYPES.ICliService, () =>
  createCliService(
    container.getAll(TYPES.ICommand),
  ), "singleton");
```

## Usage Patterns

### Registering Services

Services are registered in `src/core/di.config.ts`. Here are various examples of service registration patterns:

```typescript
// Register a simple service with no dependencies
container.register(TYPES.IConfigService, createConfigService, "singleton");

// Register a service with dependencies
container.register(TYPES.ICliService, () =>
  createCliService(
    container.getAll(TYPES.ICommand),
  ), "singleton");

// Register a service that depends on another service
container.register(TYPES.ICommand, () =>
  new FlattenerCommand(
    container.get(TYPES.IFileDiscoverer),
  ), "singleton");

// Register a transient service
container.register(TYPES.ISomeStatefulService, createSomeStatefulService, "transient");

// Register multiple implementations of the same service type
container.register(TYPES.ICommand, () =>
  new FlattenerCommand(
    container.get(TYPES.IFileDiscoverer),
  ), "singleton");

container.register(TYPES.ICommand, () =>
  new InstallerCommand(
    container.get(TYPES.IInstallerService),
  ), "singleton");
```

### Retrieving Services

Services are retrieved from the container using their identifiers:

```typescript
// Get a single service instance
const configService = container.get<IConfigService>(TYPES.IConfigService);

// Get all registered services for a type (useful for commands)
const commands = container.getAll<ICommand>(TYPES.ICommand);

// Example usage in a service factory
container.register(TYPES.ISomeService, () =>
  new SomeService(
    container.get(TYPES.IConfigService), // Inject config service
    container.getAll(TYPES.ISomeDependency), // Inject all implementations of a dependency
  ), "singleton");
```

### Multiple Service Registrations

The container supports registering multiple implementations of the same service type, which is useful for command patterns:

```typescript
// Register multiple commands
container.register(TYPES.ICommand, () =>
  new FlattenerCommand(
    container.get(TYPES.IFileDiscoverer),
  ), "singleton");

container.register(TYPES.ICommand, () =>
  new InstallerCommand(
    container.get(TYPES.IInstallerService),
  ), "singleton");

// Retrieve all registered commands
const commands = container.getAll<ICommand>(TYPES.ICommand);

// You can also iterate through commands
container.getAll<ICommand>(TYPES.ICommand).forEach((command) => {
  console.log(`Registered command: ${command.name}`);
});
```

## Implementation Details

### Container Class

The `Container` class in `src/core/container.ts` provides the core DI functionality:

- `register<T>(id, factory, type)`: Registers a service factory
- `get<T>(id)`: Retrieves a service instance
- `getAll<T>(id)`: Retrieves all registered services for a type

### Service Metadata

Each registered service includes metadata about its:

- Identifier
- Factory function
- Lifetime type (singleton or transient)

## Common DI Patterns and Usage Examples

### 1. Service with Dependencies

This is the most common pattern where a service depends on one or more other services:

```typescript
// In di.config.ts
container.register(TYPES.IFileDiscoverer, createFileDiscoverer, "singleton");

container.register(TYPES.ICommand, () =>
  new FlattenerCommand(
    container.get(TYPES.IFileDiscoverer),
  ), "singleton");
```

### 2. Service Collection Pattern

Useful for command patterns where multiple implementations of the same interface are needed:

```typescript
// Register multiple commands
container.register(TYPES.ICommand, () =>
  new FlattenerCommand(
    container.get(TYPES.IFileDiscoverer),
  ), "singleton");

container.register(TYPES.ICommand, () =>
  new InstallerCommand(
    container.get(TYPES.IInstallerService),
  ), "singleton");

// Retrieve all commands
const commands = container.getAll<ICommand>(TYPES.ICommand);

// Process all commands
commands.forEach((command) => {
  command.execute();
});
```

### 3. Factory Pattern with Configuration

Useful when services need configuration parameters:

```typescript
// In di.config.ts
container.register(TYPES.IConfigService, createConfigService, "singleton");

container.register(TYPES.ICliService, () => {
  const config = container.get<IConfigService>(TYPES.IConfigService);
  return createCliService(
    container.getAll(TYPES.ICommand),
    config.get("appName", "default-app"),
  );
}, "singleton");
```

### 4. Conditional Service Registration

Register different implementations based on configuration or environment:

```typescript
// In di.config.ts
container.register(TYPES.IConfigService, createConfigService, "singleton");

const config = container.get<IConfigService>(TYPES.IConfigService);
if (config.get("useMockServices", false)) {
  container.register(TYPES.IFileDiscoverer, createMockFileDiscoverer, "singleton");
} else {
  container.register(TYPES.IFileDiscoverer, createFileDiscoverer, "singleton");
}
```

### 5. Decorator Pattern with Services

Wrap services with additional functionality:

```typescript
// In di.config.ts
container.register(TYPES.IFileDiscoverer, createFileDiscoverer, "singleton");

container.register(TYPES.IDecoratedFileDiscoverer, () => {
  const baseDiscoverer = container.get<IFileDiscoverer>(TYPES.IFileDiscoverer);
  const config = container.get<IConfigService>(TYPES.IConfigService);
  return new LoggingFileDiscovererDecorator(
    baseDiscoverer,
    config.get("logLevel", "info"),
  );
}, "singleton");
```

## Best Practices

1. **Use Interfaces for Service Types**: Depend on abstractions, not concrete implementations
2. **Register Services in di.config.ts**: Keep all service registrations centralized
3. **Use Factory Functions**: Enable dependency injection at registration time
4. **Define Service Identifiers in types.ts**: Maintain a single source of truth for service keys
5. **Follow Singleton/Transient Guidelines**: Use singletons for stateless services, transients for stateful ones

## Extending the Container

To add a new service:

1. Add a service identifier to `src/core/types.ts`
2. Create your service implementation
3. Register the service in `src/core/di.config.ts`
4. Inject the service where needed using `container.get()`

Example:

```typescript
// 1. Add to types.ts
export const TYPES = {
  // ... existing types
  IMyService: "IMyService",
};

// 2. Create service implementation
export interface IMyService {
  doSomething(): void;
}

export class MyService implements IMyService {
  doSomething(): void {
    // Implementation
  }
}

export function createMyService(): IMyService {
  return new MyService();
}

// 3. Register in di.config.ts
import { createMyService } from "../path/to/MyService.ts";

container.register(TYPES.IMyService, createMyService, "singleton");

// 4. Use in other services
container.register(TYPES.ISomeOtherService, () =>
  new SomeOtherService(
    container.get(TYPES.IMyService),
  ), "singleton");
```

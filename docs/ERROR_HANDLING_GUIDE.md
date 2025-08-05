# Error Handling Guide

## Overview

The BMAD-METHOD project follows a consistent error handling pattern using custom error classes and structured error reporting. This guide explains the error handling patterns used throughout the project and how to properly implement error handling in new code.

## Core Error Classes

### ServiceError

The primary custom error class used throughout the application is `ServiceError`, which extends the built-in `Error` class:

```typescript
// src/core/errors/ServiceError.ts
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = "ServiceError";

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }
  }
}
```

Key features of `ServiceError`:

1. **Message**: Human-readable error description
2. **Code**: Optional error code for programmatic error handling
3. **Cause**: Optional underlying error that caused this error (chaining)
4. **Stack trace preservation**: Maintains proper stack trace information

### BMadError and Related Classes

In some parts of the codebase, particularly in installers and utilities, you'll find the `BMadError` class and its specialized variants:

```typescript
// src/lib/error-handler.ts
export class BMadError extends Error {
  public readonly code: ExitCode;
  public readonly details: unknown;
  public readonly timestamp: string;

  constructor(message: string, code: ExitCode = EXIT_CODES.GENERAL_ERROR, details: unknown = null) {
    super(message);
    this.name = "BMadError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class ConfigError extends BMadError {
  constructor(message: string, details: unknown = null) {
    super(message, EXIT_CODES.CONFIG_ERROR, details);
    this.name = "ConfigError";
  }
}

export class ValidationError extends BMadError {
  constructor(message: string, details: unknown = null) {
    super(message, EXIT_CODES.VALIDATION_ERROR, details);
    this.name = "ValidationError";
  }
}

export class BuildError extends BMadError {
  constructor(message: string, details: unknown = null) {
    super(message, EXIT_CODES.BUILD_ERROR, details);
    this.name = "BuildError";
  }
}
```

## Error Handling Patterns

### 1. Try-Catch with Error Wrapping

The most common pattern is to wrap operations in try-catch blocks and re-throw with more context:

```typescript
// src/core/services/config/ConfigService.ts
async load(): Promise<unknown> {
  try {
    if (existsSync(this.configPath)) {
      const text = await Deno.readTextFile(this.configPath);
      this.config = JSON.parse(text) as Record<string, unknown>;
    } else {
      this.config = {};
    }
    return this.config;
  } catch (error) {
    throw new ServiceError(
      `Failed to load config from ${this.configPath}`,
      'CONFIG_LOAD_ERROR',
      error as Error | undefined,
    );
  }
}
```

### 2. Error Type Checking

When catching errors, check the error type before re-throwing to avoid wrapping errors unnecessarily:

```typescript
// src/components/installer/installer.command.ts
async execute(options: { directory: string }): Promise<void> {
  try {
    console.log(`Installing BMad framework to ${options.directory}`);
    
    // Install the framework
    await this.installerService.install({ directory: options.directory });
    
    console.log('Installation completed successfully');
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error; // Re-throw as-is
    }
    throw new ServiceError(
      'Failed to execute install command',
      'INSTALL_COMMAND_ERROR',
      error as Error | undefined,
    );
  }
}
```

### 3. Global Error Handling

For CLI applications, global error handling is implemented to provide consistent error output and exit codes:

```typescript
// src/lib/error-handler.ts
export async function handleError(
  error: Error | BMadError,
  logger: Logger | null = null,
): Promise<void> {
  const message = error instanceof BMadError
    ? `${error.message} (Code: ${error.code})`
    : error.message;

  if (logger) {
    await logger.error(message, error instanceof BMadError ? error.details : null);
  } else {
    console.error(red(`Error: ${message}`));
  }

  const exitCode = error instanceof BMadError ? error.code : EXIT_CODES.GENERAL_ERROR;
  Deno.exit(exitCode);
}
```

### 4. Validation Errors

Validation errors are handled with specialized functions:

```typescript
// src/lib/error-handler.ts
export function validateRequired(
  obj: Record<string, unknown>,
  fields: string[],
  errorMessage = "Missing required fields",
): void {
  const missing = fields.filter((field) => !(field in obj) || obj[field] == null);
  if (missing.length > 0) {
    throw new ValidationError(`${errorMessage}: ${missing.join(", ")}`);
  }
}
```

## Best Practices

1. **Use Custom Error Classes**: Always use `ServiceError` or appropriate specialized error classes instead of generic `Error`

2. **Provide Context**: Include relevant context in error messages (file paths, operation names, etc.)

3. **Use Error Codes**: Include error codes for programmatic error handling

4. **Preserve Error Chains**: Use the `cause` parameter to maintain error chains when wrapping errors

5. **Check Error Types**: Before wrapping an error, check if it's already a custom error type

6. **Handle Errors at Appropriate Levels**: Handle errors at the appropriate level - low-level functions should throw, high-level functions should handle or wrap

7. **Exit Gracefully**: For CLI applications, use global error handlers to ensure consistent exit codes

8. **Log Appropriately**: Use appropriate logging levels and include error details when available

## Examples

### Basic Service Error

```typescript
try {
  const data = await readFile(filePath);
  return processData(data);
} catch (error) {
  throw new ServiceError(
    `Failed to process file: ${filePath}`,
    "FILE_PROCESS_ERROR",
    error as Error,
  );
}
```

### Validation Error

```typescript
function createUser(userData: Partial<User>): User {
  validateRequired(userData, ["name", "email"], "User data missing required fields");

  return {
    id: generateId(),
    name: userData.name!,
    email: userData.email!,
  };
}
```

### Global Error Handler Usage

```typescript
// In main CLI entry point
try {
  await cliService.run();
} catch (error) {
  await handleError(error);
}
```

### Creating Custom Error Classes

For domain-specific errors, create custom error classes that extend ServiceError:

```typescript
// src/core/errors/ConfigError.ts
export class ConfigError extends ServiceError {
  constructor(message: string, cause?: Error) {
    super(message, "CONFIG_ERROR", cause);
    this.name = "ConfigError";
  }
}

// src/core/errors/FileProcessingError.ts
export class FileProcessingError extends ServiceError {
  constructor(filePath: string, cause?: Error) {
    super(
      `Failed to process file: ${filePath}`,
      "FILE_PROCESSING_ERROR",
      cause,
    );
    this.name = "FileProcessingError";
  }
}
```

### Using Custom Error Classes

```typescript
// In a config service
async loadConfig(configPath: string): Promise<Config> {
  try {
    const content = await Deno.readTextFile(configPath);
    return JSON.parse(content) as Config;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new ConfigError(`Config file not found: ${configPath}`, error);
    }
    throw new ConfigError(`Failed to load config: ${error.message}`, error);
  }
}

// In a file processing service
async processFile(filePath: string): Promise<void> {
  try {
    const content = await Deno.readTextFile(filePath);
    // Process content...
  } catch (error) {
    throw new FileProcessingError(filePath, error);
  }
}
```

## Error Propagation

Errors should be propagated up the call stack until they can be handled appropriately:

1. **Low-level functions**: Throw errors with descriptive messages and codes
2. **Mid-level functions**: Wrap errors with additional context when appropriate
3. **High-level functions**: Handle errors or propagate to global error handler

This pattern ensures that errors contain enough context for debugging while maintaining clean separation of concerns.

### Error Propagation Best Practices

1. **Preserve the Error Chain**: Always pass the original error as the `cause` parameter when wrapping errors:

```typescript
try {
  await someOperation();
} catch (error) {
  throw new ServiceError(
    "Failed to execute operation",
    "OPERATION_ERROR",
    error as Error, // Preserve the error chain
  );
}
```

1. **Avoid Silent Failures**: Never catch an error without either handling it or re-throwing it:

```typescript
// BAD - Silent failure
try {
  await riskyOperation();
} catch (error) {
  console.error("Operation failed:", error);
  // Error is swallowed, caller never knows something went wrong
}

// GOOD - Propagate the error
try {
  await riskyOperation();
} catch (error) {
  throw new ServiceError(
    "Failed to execute risky operation",
    "RISKY_OPERATION_ERROR",
    error as Error,
  );
}
```

1. **Use Appropriate Error Levels**: Handle errors at the appropriate level in your application:

```typescript
// Low-level service - throws errors
class FileService {
  async readFile(path: string): Promise<string> {
    try {
      return await Deno.readTextFile(path);
    } catch (error) {
      throw new ServiceError(
        `Failed to read file: ${path}`,
        "FILE_READ_ERROR",
        error as Error,
      );
    }
  }
}

// Mid-level service - may wrap errors with additional context
class DocumentService {
  constructor(private fileService: FileService) {}

  async loadDocument(documentId: string): Promise<string> {
    try {
      const path = `documents/${documentId}.txt`;
      return await this.fileService.readFile(path);
    } catch (error) {
      if (error instanceof ServiceError) {
        // Re-throw ServiceErrors as-is
        throw error;
      }
      // Wrap unexpected errors
      throw new ServiceError(
        `Failed to load document: ${documentId}`,
        "DOCUMENT_LOAD_ERROR",
        error as Error,
      );
    }
  }
}

// High-level service - handles errors or propagates to global handler
class DocumentController {
  constructor(private documentService: DocumentService) {}

  async getDocument(documentId: string): Promise<void> {
    try {
      const content = await this.documentService.loadDocument(documentId);
      console.log(content);
    } catch (error) {
      // Let global error handler deal with it
      throw error;
    }
  }
}
```

1. **Transform Errors at Service Boundaries**: When crossing service boundaries (e.g., API boundaries), transform errors to hide implementation details:

```typescript
// In an API controller
async handleRequest(request: Request): Promise<Response> {
  try {
    const result = await this.service.processRequest(request);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    // Log the full error for debugging
    console.error('Request processing failed:', error);
    
    // Return a generic error to the client
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500 }
    );
  }
}
```

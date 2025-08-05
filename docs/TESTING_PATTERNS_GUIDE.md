# Testing Patterns Guide

## Overview

The BMAD-METHOD project follows a consistent testing approach using the Deno testing framework with Behavior-Driven Development (BDD) style tests. This guide explains the testing patterns used throughout the project and how to properly implement tests for new code.

## Testing Framework

The project uses the following testing utilities from the Deno standard library:

- `describe`, `it`, `beforeEach`, `afterEach` for BDD-style test organization
- `assertEquals`, `assertExists`, `assertRejects` for assertions
- `stub` for mocking dependencies

These utilities are all imported through the centralized `deps.ts` file.

## Test Structure

Tests in the BMAD-METHOD project follow a consistent structure:

1. Import testing utilities from `deps.ts`
2. Import the component being tested
3. Use `describe` blocks to group related tests
4. Use `beforeEach` for test setup
5. Use `afterEach` for cleanup
6. Use `it` blocks for individual test cases

### Example Test Structure

```typescript
import {
  afterEach,
  assertEquals,
  beforeEach,
  describe,
  it,
  // Component being tested
  MyComponent,
  stub,
} from "deps";

describe("MyComponent", () => {
  let myComponent: MyComponent;
  let stubs: Array<{ restore: () => void }> = [];

  beforeEach(() => {
    // Setup before each test
    myComponent = new MyComponent();
  });

  afterEach(() => {
    // Cleanup after each test
    stubs.forEach((stub) => stub.restore());
    stubs = [];
  });

  it("should do something", () => {
    // Test implementation
    assertEquals(typeof myComponent, "object");
  });
});
```

## Mocking Dependencies

The project uses the `stub` function from `@std/testing/mock` to mock dependencies. This is particularly useful for testing components that interact with the file system or other external services.

### Mocking Methods

```typescript
import { stub } from "deps";

// Mock a method on an object
const myObject = { myMethod: () => "original" };
const myMethodStub = stub(myObject, "myMethod", () => "mocked");

// Restore the original method after the test
myMethodStub.restore();
```

### Mocking External Dependencies

For components that depend on external services (like file system operations), we create mock implementations:

```typescript
import { stub } from "deps";

// Create a mock file manager
const mockFileManager = {
  ensureDir: (_path: string) => Promise.resolve(),
  copy: (_src: string, _dest: string) => Promise.resolve(),
  readTextFile: (_path: string) => Promise.resolve("test content"),
  writeTextFile: (_path: string, _content: string) => Promise.resolve(),
  exists: (_path: string) => Promise.resolve(true),
};

// Stub methods to track calls
const ensureDirStub = stub(
  mockFileManager,
  "ensureDir",
  (_path: string) => Promise.resolve(),
);

// In afterEach, restore all stubs
ensureDirStub.restore();
```

## Testing Services with Dependencies

When testing services that depend on other services, we inject mock dependencies through the constructor:

```typescript
import { stub } from "deps";

// Service under test
let myService: MyService;

// Mock dependencies
let mockDependency: MyDependency;

beforeEach(() => {
  // Create mock dependency
  mockDependency = {
    doSomething: () => Promise.resolve(),
  };

  // Inject mock dependency
  myService = new MyService(mockDependency);
});
```

### Comprehensive Mocking Example

Here's a more comprehensive example showing how to mock multiple dependencies:

```typescript
import { afterEach, assertEquals, beforeEach, describe, it, MyService, stub } from "deps";

import type { IFileManager, ILogger, Stub } from "deps";

describe("MyService", () => {
  let myService: MyService;
  let mockLogger: ILogger;
  let mockFileManager: IFileManager;
  let stubs: Array<{ restore: () => void }> = [];

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      setLevel: () => {},
    };

    // Create mock file manager
    mockFileManager = {
      ensureDir: (_path: string) => Promise.resolve(),
      copy: (_src: string, _dest: string) => Promise.resolve(),
      readTextFile: (_path: string) => Promise.resolve("test content"),
      writeTextFile: (_path: string, _content: string) => Promise.resolve(),
      readDir: (
        _path: string,
      ) => ({ async *[Symbol.asyncIterator]() {} } as AsyncIterable<
        Deno.DirEntry
      >),
      exists: (_path: string) => Promise.resolve(true),
    };

    // Create service with mocked dependencies
    myService = new MyService(mockLogger, mockFileManager);
  });

  afterEach(() => {
    // Restore all stubs
    stubs.forEach((stubInstance) => {
      if (stubInstance.restore) {
        stubInstance.restore();
      }
    });
    stubs = [];
  });

  it("should process file successfully", async () => {
    // Stub file manager methods to return specific values
    const readTextFileStub = stub(
      mockFileManager,
      "readTextFile",
      (_path: string) => Promise.resolve("file content"),
    );

    const writeTextFileStub = stub(
      mockFileManager,
      "writeTextFile",
      (_path: string, _content: string) => Promise.resolve(),
    );

    // Add stubs to cleanup array
    stubs.push(readTextFileStub, writeTextFileStub);

    // Test the service method
    await myService.processFile("/test/input.txt", "output.txt");

    // Verify the stubs were called with expected arguments
    assertEquals(readTextFileStub.calls.length, 1);
    assertEquals(writeTextFileStub.calls.length, 1);
    assertEquals(readTextFileStub.calls[0].args[0], "/test/input.txt");
  });

  it("should handle file not found error", async () => {
    // Stub file manager to throw an error
    const readTextFileStub = stub(
      mockFileManager,
      "readTextFile",
      (_path: string) => Promise.reject(new Deno.errors.NotFound("File not found")),
    );

    // Add stub to cleanup array
    stubs.push(readTextFileStub);

    // Test that the service handles the error appropriately
    const result = await myService.processFile("/nonexistent.txt", "output.txt");

    // Verify the result and that error was handled
    assertEquals(result, false);
  });
});
```

## Testing Async Operations

For testing asynchronous operations, we use async/await in the test functions:

```typescript
it("should handle async operations", async () => {
  const result = await myService.asyncMethod();
  assertEquals(result, expectedValue);
});
```

For testing that a method rejects with an error:

```typescript
import { assertRejects } from "deps";

it("should reject with an error", async () => {
  await assertRejects(
    () => myService.methodThatThrows(),
    Error,
    "Expected error message",
  );
});
```

## Testing Error Conditions

When testing error conditions, we mock dependencies to throw errors:

```typescript
it("should handle file not found errors", async () => {
  // Mock Deno.readTextFile to throw NotFound error
  const readTextFileStub = stub(
    Deno,
    "readTextFile",
    () => Promise.reject(new Deno.errors.NotFound("File not found")),
  );

  // Add stub to cleanup array
  stubs.push(readTextFileStub);

  // Test that the service handles the error appropriately
  const result = await myService.loadConfig();
  assertEquals(result, null);
});
```

## Best Practices

1. **Use descriptive test names**: Test names should clearly describe what is being tested and what the expected outcome is.

2. **Test one thing per test**: Each test should focus on a single behavior or scenario.

3. **Clean up after tests**: Always restore stubs in `afterEach` to prevent test interference.

4. **Use beforeEach/afterEach for setup/teardown**: This ensures consistent test state.

5. **Mock external dependencies**: This makes tests faster and more reliable.

6. **Test edge cases**: Include tests for error conditions and boundary values.

7. **Use appropriate assertion methods**: Use `assertEquals` for value comparison, `assertExists` for existence checks, etc.

## Running Tests

To run tests in the BMAD-METHOD project, use the following command:

```bash
deno test --allow-read --allow-write
```

For watching tests during development:

```bash
deno test --allow-read --allow-write --watch
```

## Integration Testing Approaches

Integration tests in the BMAD-METHOD project focus on testing the interaction between multiple components or services. These tests ensure that the various parts of the system work together correctly.

### Testing with Real Dependencies

For integration tests, we sometimes use real dependencies instead of mocks to ensure realistic behavior:

```typescript
import { assertEquals, ConfigService, describe, it } from "deps";

describe("ConfigService integration", () => {
  it("should load and save configuration", async () => {
    // Use a temporary file for testing
    const tempConfigPath = await Deno.makeTempFile({ suffix: ".json" });

    // Create service with temporary config file
    const configService = new ConfigService(tempConfigPath);

    // Test saving and loading configuration
    configService.set("testKey", "testValue");
    await configService.save();

    // Create a new instance to test loading
    const newConfigService = new ConfigService(tempConfigPath);
    await newConfigService.load();

    assertEquals(newConfigService.get("testKey"), "testValue");

    // Clean up temporary file
    await Deno.remove(tempConfigPath);
  });
});
```

### Testing Service Composition

Integration tests can also verify that services work together correctly:

```typescript
import { assertEquals, ConfigService, DependencyResolver, describe, it } from "deps";

describe("Service composition", () => {
  it("should resolve dependencies using configuration", async () => {
    // Setup config service with test data
    const configService = new ConfigService();
    configService.set("sourceDir", "/test/path");

    // Create dependency resolver using config
    const resolver = new DependencyResolver(configService.get("sourceDir"));

    // Test that services work together
    const dependencies = await resolver.resolveAgentDependencies("test-agent");

    // Verify the result
    assertEquals(typeof dependencies, "object");
    assertEquals(typeof dependencies.agent, "object");
  });
});
```

### Testing CLI Commands

For testing CLI commands, we can execute them and verify their behavior:

```typescript
import { assertEquals, CliService, describe, it } from "deps";

describe("CLI command integration", () => {
  it("should execute command and produce expected output", async () => {
    // Capture console output
    let capturedOutput = "";
    const originalLog = console.log;
    console.log = (message: string) => {
      capturedOutput += message + "\n";
    };

    try {
      // Execute CLI command
      const cliService = new CliService();
      await cliService.execute(["--version"]);

      // Verify output
      assertEquals(capturedOutput.includes("BMAD-METHOD"), true);
    } finally {
      // Restore console.log
      console.log = originalLog;
    }
  });
});
```

## Test Organization

Tests should be colocated with the code they are testing, using a `.test.ts` suffix. For example:

```text
src/
  core/
    services/
      config/
        ConfigService.ts
        ConfigService.test.ts
```

This organization makes it easy to find tests for specific components and ensures that tests are maintained alongside the code they test.

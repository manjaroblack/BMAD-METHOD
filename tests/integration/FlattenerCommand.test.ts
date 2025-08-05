import { afterEach, beforeEach, describe, it } from "../../deps.ts";
import { type Stub as _Stub, stub as _stub } from "../../deps.ts";
import {
  assertEquals as _assertEquals,
  assertThrows as _assertThrows,
} from "jsr:@std/assert@1.0.6";

import { FlattenerCommand } from "../../src/components/flattener/flattener.command.ts";
import { ServiceError as _ServiceError } from "../../src/core/errors/ServiceError.ts";

describe("FlattenerCommand", () => {
  let flattenerCommand: FlattenerCommand;
  let fileDiscovererStub: {
    discoverFiles: (rootDir: string) => Promise<string[]>;
    filterFiles: (files: string[], rootDir: string) => Promise<string[]>;
  };

  beforeEach(() => {
    // Create a mock file discoverer with stubbed methods
    fileDiscovererStub = {
      discoverFiles: (_rootDir: string) => Promise.resolve([]),
      filterFiles: (_files: string[], _rootDir: string) => Promise.resolve([]),
    };

    flattenerCommand = new FlattenerCommand(fileDiscovererStub);
  });

  afterEach(() => {
    // Restore stubs if needed
  });

  it("should execute flatten command successfully", async () => {
    // Mock file discoverer to return test files
    // Reassign methods to return test data
    fileDiscovererStub.discoverFiles = (_rootDir: string) =>
      Promise.resolve(["file1.ts", "file2.ts"]);
    fileDiscovererStub.filterFiles = (_files: string[], _rootDir: string) =>
      Promise.resolve(["file1.ts", "file2.ts"]);

    // Execute command
    await flattenerCommand.execute({ input: "./test", output: "./output.xml" });

    // Assert expected behavior
  });

  it("should handle errors during execution", async () => {
    // Mock file discoverer to throw an error
    fileDiscovererStub.discoverFiles = (_rootDir: string) =>
      Promise.reject(new _ServiceError("Test error", "TEST_ERROR"));

    // Assert that error is properly handled
    let errorCaught = false;
    try {
      await flattenerCommand.execute({ input: "./test", output: "./output.xml" });
    } catch (error) {
      errorCaught = true;
      _assertEquals(error instanceof _ServiceError, true);
    }
    _assertEquals(errorCaught, true);
  });
});

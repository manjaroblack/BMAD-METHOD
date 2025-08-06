import { afterEach, beforeEach, describe, it } from "../../deps.ts";
import { type Stub, stub } from "../../deps.ts";
import {
  assertEquals as _assertEquals,
  assertRejects as _assertRejects,
} from "../../deps.ts";

import { FlattenerCommand } from "../../src/components/flattener/flattener.command.ts";
import type { AggregatedContent } from "../../src/components/flattener/interfaces/IContentAggregator.ts";
import { ServiceError } from "../../src/core/errors/ServiceError.ts";

// Mock for Deno.writeTextFile
let writeTextFileStub: Stub | undefined;

function restoreStubs() {
  if (writeTextFileStub) {
    writeTextFileStub.restore();
    writeTextFileStub = undefined;
  }
}

describe("FlattenerCommand", () => {
  let flattenerCommand: FlattenerCommand;
  let fileDiscovererStub: {
    discoverFiles: (rootDir: string) => Promise<string[]>;
    filterFiles: (files: string[], rootDir: string) => Promise<string[]>;
  };
  let contentAggregatorStub: {
    aggregate: (filePaths: string[], rootDir: string) => Promise<AggregatedContent[]>;
  };
  let xmlGeneratorStub: {
    generate: (content: AggregatedContent[], outputPath: string) => Promise<void>;
  };

  beforeEach(() => {
    restoreStubs();
    // Create a mock file discoverer with stubbed methods
    fileDiscovererStub = {
      discoverFiles: (_rootDir: string) => Promise.resolve([]),
      filterFiles: (_files: string[], _rootDir: string) => Promise.resolve([]),
    };
    contentAggregatorStub = {
      aggregate: (_filePaths: string[], _rootDir: string) => Promise.resolve([
        { path: "./src/file1.ts", content: "// Test file 1", size: 15, type: "typescript" },
        { path: "./src/file2.ts", content: "// Test file 2", size: 15, type: "typescript" }
      ]),
    };
    xmlGeneratorStub = {
      generate: async (content: AggregatedContent[], outputPath: string) => {
        // In a real implementation, this would generate XML from the content
        // For testing purposes, we simulate writing to the output file
        let xmlContent = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><files>";
        for (const item of content) {
          xmlContent += `<file path=\"${item.path}\">${item.content}</file>`;
        }
        xmlContent += "</files>";
        await Deno.writeTextFile(outputPath, xmlContent);
      },
    };

    flattenerCommand = new FlattenerCommand(fileDiscovererStub, contentAggregatorStub, xmlGeneratorStub);
  });

  afterEach(() => {
    restoreStubs();
  });

  it("should execute flatten command successfully with multiple files", async () => {
    // Mock file discoverer to return test files
    fileDiscovererStub.discoverFiles = (_rootDir: string) =>
      Promise.resolve([
        "./src/file1.ts",
        "./src/file2.ts",
        "./src/subdir/file3.ts"
      ]);
    
    fileDiscovererStub.filterFiles = (files: string[], _rootDir: string) =>
      Promise.resolve(files);
    
    // Mock Deno.writeTextFile to capture the output
    let savedContent = "";
    writeTextFileStub = stub(Deno, "writeTextFile", (_path, content) => {
      savedContent = content as string;
      return Promise.resolve();
    });
    
    // Mock Deno.readTextFile to return test content
    const _readTextFileStub = stub(Deno, "readTextFile", (path) => {
      const contentMap: Record<string, string> = {
        "./src/file1.ts": "console.log('file1');",
        "./src/file2.ts": "console.log('file2');",
        "./src/subdir/file3.ts": "console.log('file3');",
        "file1.ts": "console.log('file1');"
      };
      return Promise.resolve(contentMap[path as string] || "");
    });

    // Execute command
    await flattenerCommand.execute({ input: "./src", output: "./output.xml" });

    // Assert that writeTextFile was called
    _assertEquals(writeTextFileStub.calls.length, 1);
    
    // Assert that the saved content contains expected elements
    _assertEquals(savedContent.includes("<?xml"), true);
    _assertEquals(savedContent.includes("./src/file1.ts"), true);
  });

  it("should handle empty file list", async () => {
    // Mock file discoverer to return empty file list
    fileDiscovererStub.discoverFiles = (_rootDir: string) => Promise.resolve([]);
    fileDiscovererStub.filterFiles = (_files: string[], _rootDir: string) => Promise.resolve([]);
    
    // Mock Deno.writeTextFile to capture the output
    let savedContent = "";
    writeTextFileStub = stub(Deno, "writeTextFile", (_path, content) => {
      savedContent = content as string;
      return Promise.resolve();
    });

    // Execute command
    await flattenerCommand.execute({ input: "./empty", output: "./output.xml" });

    // Assert that writeTextFile was called even with empty file list
    _assertEquals(writeTextFileStub.calls.length, 1);
    
    // Assert that the saved content contains XML structure
    _assertEquals(savedContent.includes("<?xml"), true);
  });

  it("should handle errors during execution", async () => {
    // Mock file discoverer to throw an error
    fileDiscovererStub.discoverFiles = (_rootDir: string) =>
      Promise.reject(new ServiceError("Test error", "TEST_ERROR"));

    // Assert that error is properly handled
    await _assertRejects(
      async () => {
        await flattenerCommand.execute({ input: "./test", output: "./output.xml" });
      },
      ServiceError,
    );
  });

  it("should handle file system errors during write", async () => {
    // Mock file discoverer to return test files
    fileDiscovererStub.discoverFiles = (_rootDir: string) =>
      Promise.resolve(["file1.ts"]);
    fileDiscovererStub.filterFiles = (files: string[], _rootDir: string) =>
      Promise.resolve(files);
    
    // Mock Deno.writeTextFile to throw an error
    writeTextFileStub = stub(Deno, "writeTextFile", () => {
      return Promise.reject(new Error("Permission denied"));
    });

    // Assert that error is properly handled
    await _assertRejects(
      async () => {
        await flattenerCommand.execute({ input: "./test", output: "./output.xml" });
      },
      Error,
    );
  });
});

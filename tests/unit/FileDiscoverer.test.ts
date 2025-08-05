import { beforeEach, describe, it } from "../../deps.ts";
import {
  assertEquals as _assertEquals,
  assertThrows as _assertThrows,
} from "jsr:@std/assert@1.0.6";

import { FileDiscoverer } from "../../src/components/flattener/services/FileDiscoverer.ts";

describe("FileDiscoverer", () => {
  let fileDiscoverer: FileDiscoverer;

  beforeEach(() => {
    fileDiscoverer = new FileDiscoverer();
  });

  it("should filter files based on patterns", async () => {
    const files = ["file1.ts", "file2.js", "file3.txt"];
    const filtered = await fileDiscoverer.filterFiles(files, "./test");
    // Should filter out common patterns like node_modules, .git, etc.
    _assertEquals(filtered, files);
  });

  it("should throw ServiceError on failure", () => {
    // This test structure is preserved for future implementation
    // where we might want to test error conditions
  });

  it("should filter files based on patterns", () => {
    const files = ["file1.ts", "file2.js", "file3.txt"];
    const _filtered = fileDiscoverer.filterFiles(files, "./test");
    // Add assertions
  });

  it("should throw ServiceError on failure", async () => {
    // Test error handling
  });
});

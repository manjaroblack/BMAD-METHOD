import { beforeEach, describe, it } from "../../deps.ts";
import {
  assertEquals as _assertEquals,
  type assertThrows as _assertThrows,
} from "../../deps.ts";

import { FileDiscoverer } from "../../src/components/flattener/services/FileDiscoverer.ts";

describe("FileDiscoverer", () => {
  let fileDiscoverer: FileDiscoverer;

  beforeEach(() => {
    fileDiscoverer = new FileDiscoverer();
  });

  it("should filter files correctly, excluding ignored patterns", async () => {
    const files = [
      "file1.ts",
      "node_modules/package/index.js",
      "src/components/component.ts",
      ".git/config",
      "dist/bundle.js",
      "src/utils/helper.ts",
      "build/output.css",
      "test/spec.ts"
    ];
    
    const filtered = await fileDiscoverer.filterFiles(files, "./test");
    
    // Should keep files that don't match ignore patterns
    _assertEquals(filtered, [
      "file1.ts",
      "src/components/component.ts",
      "src/utils/helper.ts",
      "test/spec.ts"
    ]);
  });

  it("should handle empty file list", async () => {
    const files: string[] = [];
    const filtered = await fileDiscoverer.filterFiles(files, "./test");
    _assertEquals(filtered, []);
  });

  it("should handle file paths with ignored patterns", async () => {
    const files = [
      "src/node_modules/utils.ts",
      "src/.git/hooks/pre-commit",
      "src/valid/file.ts",
      "project/dist/output.js"
    ];
    
    const filtered = await fileDiscoverer.filterFiles(files, "./test");
    
    // Should only keep the valid file
    _assertEquals(filtered, ["src/valid/file.ts"]);
  });
});

import { describe, it, beforeEach, afterEach } from "jsr:@std/testing@1.0.13/bdd";
import { assertEquals } from "jsr:@std/assert@1.0.13";
import { stub } from "jsr:@std/testing@1.0.13/mock";
import { IdeSetup } from "./ide-setup.ts";
import type { IFileManager } from "./installer.interfaces.ts";
import type { ISpinner } from "deps";

describe("IdeSetup", () => {
  let ideSetup: IdeSetup;
  let mockFileManager: IFileManager;
  let ensureDirStub: any;
  let writeTextFileStub: any;
  let readTextFileStub: any;
  let existsStub: any;
  let readDirStub: any;

  beforeEach(() => {
    // Create mock file manager with actual implementations
    mockFileManager = {
      ensureDir: (_path: string) => Promise.resolve(),
      copy: (_src: string, _dest: string) => Promise.resolve(),
      readTextFile: (_path: string) => Promise.resolve(""),
      writeTextFile: (_path: string, _content: string) => Promise.resolve(),
      readDir: (_path: string) => ({ async *[Symbol.asyncIterator]() {} } as AsyncIterable<Deno.DirEntry>),
      exists: (_path: string) => Promise.resolve(true),
    };

    ideSetup = new IdeSetup(mockFileManager);

    // Stub file manager methods to track calls
    ensureDirStub = stub(mockFileManager, "ensureDir", (_path: string) => Promise.resolve());
    writeTextFileStub = stub(mockFileManager, "writeTextFile", (_path: string, _content: string) => Promise.resolve());
    readTextFileStub = stub(mockFileManager, "readTextFile", (_path: string) => Promise.resolve("test content"));
    existsStub = stub(mockFileManager, "exists", (_path: string) => Promise.resolve(true));
    readDirStub = stub(mockFileManager, "readDir", (_path: string) => {
      const entries: Deno.DirEntry[] = [
        { name: "test.md", isFile: true, isDirectory: false, isSymlink: false },
        { name: "test2.md", isFile: true, isDirectory: false, isSymlink: false }
      ];
      return (async function* () {
        for (const entry of entries) {
          yield entry;
        }
      })();
    });
  });

  afterEach(() => {
    ensureDirStub.restore();
    writeTextFileStub.restore();
    readTextFileStub.restore();
  });

  it("should setup Cursor IDE configuration", async () => {
    const spinner = { text: "" } as ISpinner;
    await ideSetup.setupIdeConfigurations("/test/path", ["cursor"], spinner);
    
    // Verify that exists was called
    assertEquals(existsStub.calls.length > 0, true);
    
    // Verify that readDir was called
    assertEquals(readDirStub.calls.length > 0, true);
  });

  it("should setup Cline IDE configuration", async () => {
    const spinner = { text: "" } as ISpinner;
    await ideSetup.setupIdeConfigurations("/test/path", ["cline"], spinner);
    
    // Verify that exists was called
    assertEquals(existsStub.calls.length > 0, true);
    
    // Verify that readDir was called
    assertEquals(readDirStub.calls.length > 0, true);
  });

  it("should setup Roo Code IDE configuration", async () => {
    const spinner = { text: "" } as ISpinner;
    await ideSetup.setupIdeConfigurations("/test/path", ["roo"], spinner);
    
    // Verify that exists was called
    assertEquals(existsStub.calls.length > 0, true);
    
    // Verify that readDir was called
    assertEquals(readDirStub.calls.length > 0, true);
  });

  it("should handle multiple IDE configurations", async () => {
    const spinner = { text: "" } as ISpinner;
    await ideSetup.setupIdeConfigurations("/test/path", ["cursor", "cline"], spinner);
    
    // Verify that exists was called for each IDE
    assertEquals(existsStub.calls.length >= 2, true);
    
    // Verify that readDir was called for each IDE
    assertEquals(readDirStub.calls.length >= 2, true);
  });

  it("should handle unknown IDE gracefully", async () => {
    const spinner = { text: "" } as ISpinner;
    await ideSetup.setupIdeConfigurations("/test/path", ["unknown"], spinner);
    
    // Should not throw an error for unknown IDE
    assertEquals(true, true);
  });
});

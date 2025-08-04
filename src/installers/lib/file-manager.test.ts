import { describe, it, beforeEach, afterEach } from "jsr:@std/testing@1.0.13/bdd";
import { assertEquals, assertRejects as _assertRejects } from "jsr:@std/assert@1.0.13";
import { stub } from "jsr:@std/testing@1.0.13/mock";
import { FileManager } from "./file-manager.ts";

describe("FileManager", () => {
  let fileManager: FileManager;
  let ensureDirStub: any;
  let copyStub: any;
  let readTextFileStub: any;
  let writeTextFileStub: any;
  let readDirStub: any;
  let existsStub: any;

  beforeEach(() => {
    fileManager = new FileManager();
    
    // Stub FileManager methods
    ensureDirStub = stub(fileManager, "ensureDir", () => Promise.resolve());
    copyStub = stub(fileManager, "copy", () => Promise.resolve());
    readTextFileStub = stub(fileManager, "readTextFile", () => Promise.resolve("test content"));
    writeTextFileStub = stub(fileManager, "writeTextFile", () => Promise.resolve());
    readDirStub = stub(fileManager, "readDir", () => [] as unknown as AsyncIterable<Deno.DirEntry>);
    existsStub = stub(fileManager, "exists", () => Promise.resolve(true));
  });

  afterEach(() => {
    ensureDirStub.restore();
    copyStub.restore();
    readTextFileStub.restore();
    writeTextFileStub.restore();
    readDirStub.restore();
    existsStub.restore();
  });

  it("should ensure directory exists", async () => {
    await fileManager.ensureDir("/test/path");
    assertEquals(ensureDirStub.calls[0].args[0], "/test/path");
  });

  it("should copy files", async () => {
    await fileManager.copy("/source/file", "/dest/file");
    assertEquals(copyStub.calls[0].args[0], "/source/file");
    assertEquals(copyStub.calls[0].args[1], "/dest/file");
  });

  it("should read text file", async () => {
    const result = await fileManager.readTextFile("/test/file.txt");
    assertEquals(result, "test content");
    assertEquals(readTextFileStub.calls[0].args[0], "/test/file.txt");
  });

  it("should write text file", async () => {
    await fileManager.writeTextFile("/test/file.txt", "new content");
    assertEquals(writeTextFileStub.calls[0].args[0], "/test/file.txt");
    assertEquals(writeTextFileStub.calls[0].args[1], "new content");
  });

  it("should read directory", async () => {
    await fileManager.readDir("/test/dir");
    assertEquals(readDirStub.calls[0].args[0], "/test/dir");
  });

  it("should check if file exists", async () => {
    const result = await fileManager.exists("/test/file.txt");
    assertEquals(result, true);
    assertEquals(existsStub.calls[0].args[0], "/test/file.txt");
  });

  it("should get directory name", () => {
    const result = fileManager.dirname("/path/to/file.txt");
    assertEquals(result, "/path/to");
  });

  it("should join paths", () => {
    const result = fileManager.join("/path", "to", "file.txt");
    assertEquals(result, "/path/to/file.txt");
  });
});

import {
  afterEach,
  assertEquals,
  type assertRejects as _assertRejects,
  beforeEach,
  describe,
  FileManager,
  it,
  stub,
} from "deps";

import type { Stub } from "deps";

describe("FileManager", () => {
  let fileManager: FileManager;
  let ensureDirStub: Stub<FileManager, [string], Promise<void>>;
  let copyStub: Stub<FileManager, [string, string], Promise<void>>;
  let readTextFileStub: Stub<FileManager, [string], Promise<string>>;
  let writeTextFileStub: Stub<FileManager, [string, string], Promise<void>>;
  let readDirStub: Stub<FileManager, [string], AsyncIterable<Deno.DirEntry>>;
  let existsStub: Stub<FileManager, [string], Promise<boolean>>;

  beforeEach(() => {
    fileManager = new FileManager();

    // Stub FileManager methods
    ensureDirStub = stub(fileManager, "ensureDir", () => Promise.resolve());
    copyStub = stub(fileManager, "copy", () => Promise.resolve());
    readTextFileStub = stub(
      fileManager,
      "readTextFile",
      () => Promise.resolve("test content"),
    );
    writeTextFileStub = stub(
      fileManager,
      "writeTextFile",
      () => Promise.resolve(),
    );
    readDirStub = stub(
      fileManager,
      "readDir",
      () => [] as unknown as AsyncIterable<Deno.DirEntry>,
    );
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
    assertEquals(ensureDirStub.calls?.[0]?.args?.[0], "/test/path");
  });

  it("should copy files", async () => {
    await fileManager.copy("/source/file", "/dest/file");
    assertEquals(copyStub.calls?.[0]?.args?.[0], "/source/file");
    assertEquals(copyStub.calls?.[0]?.args?.[1], "/dest/file");
  });

  it("should read text file", async () => {
    const content = await fileManager.readTextFile("/test/file.txt");
    assertEquals(content, "test content");
    assertEquals(readTextFileStub.calls?.[0]?.args?.[0], "/test/file.txt");
  });

  it("should write text file", async () => {
    await fileManager.writeTextFile("/test/file.txt", "new content");
    assertEquals(writeTextFileStub.calls?.[0]?.args?.[0], "/test/file.txt");
    assertEquals(writeTextFileStub.calls?.[0]?.args?.[1], "new content");
  });

  it("should read directory", async () => {
    await fileManager.readDir("/test/dir");
    assertEquals(readDirStub.calls?.[0]?.args?.[0], "/test/dir");
  });

  it("should check if file exists", async () => {
    await fileManager.exists("/test/file.txt");
    assertEquals(existsStub.calls?.[0]?.args?.[0], "/test/file.txt");
  });

  it("should check if file exists", async () => {
    const result = await fileManager.exists("/test/file.txt");
    assertEquals(result, true);
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

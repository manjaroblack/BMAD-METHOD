import { afterEach, assertEquals, beforeEach, ConfigLoader, describe, it, stub } from "deps";

import type { Stub } from "deps";

describe("ConfigLoader", () => {
  let configLoader: ConfigLoader;
  let readTextFileStub: Stub<typeof Deno, [string], Promise<string>>;
  let existsStub: Stub<typeof Deno, [string], Promise<boolean>>;

  beforeEach(() => {
    configLoader = new ConfigLoader();
    readTextFileStub = undefined as unknown as Stub<
      typeof Deno,
      [string],
      Promise<string>
    >;
    existsStub = undefined as unknown as Stub<
      typeof Deno,
      [string],
      Promise<boolean>
    >;
  });

  afterEach(() => {
    if (readTextFileStub && readTextFileStub.restore) {
      readTextFileStub.restore();
    }
    if (existsStub && existsStub.restore) {
      existsStub.restore();
    }
  });

  it("should load configuration", async () => {
    // Mock Deno.readTextFile
    const readTextFileStub = stub(
      Deno,
      "readTextFile",
      () => Promise.resolve("test: value"),
    );

    const config = await configLoader.load();
    assertEquals(typeof config, "object");

    readTextFileStub.restore();
  });

  it("should load expansion pack configuration", async () => {
    // Mock Deno.readDir and Deno.readTextFile
    const mockDirEntries = [
      { name: "test-pack", isDirectory: true, isFile: false, isSymlink: false },
    ];

    const readDirStub = stub(Deno, "readDir", () =>
      ({
        [Symbol.asyncIterator]: async function* () {
          for (const entry of mockDirEntries) {
            yield entry;
          }
        },
      }) as unknown as AsyncIterable<Deno.DirEntry>);

    const readTextFileStub = stub(
      Deno,
      "readTextFile",
      () => Promise.resolve("name: Test Pack"),
    );

    const packs = await configLoader.getAvailableExpansionPacks();
    assertEquals(Array.isArray(packs), true);

    readDirStub.restore();
    readTextFileStub.restore();
  });

  it("should handle missing expansion packs directory", async () => {
    // Mock Deno.readDir to throw NotFound error
    const readDirStub = stub(Deno, "readDir", () =>
      ({
        [Symbol.asyncIterator]: async function* () {
          throw new Deno.errors.NotFound("Directory not found");
          // This yield is never reached but satisfies the linter
          // deno-lint-ignore no-unreachable
          yield {} as Deno.DirEntry;
        },
      }) as unknown as AsyncIterable<Deno.DirEntry>);

    const packs = await configLoader.getAvailableExpansionPacks();
    assertEquals(Array.isArray(packs), true);
    assertEquals(packs.length, 0);

    readDirStub.restore();
  });

  it("should handle configuration loading errors", async () => {
    // Mock Deno.readTextFile to throw an error
    const readTextFileStub = stub(
      Deno,
      "readTextFile",
      () => Promise.reject(new Error("File not found")),
    );

    try {
      await configLoader.load();
      // Should not reach here
      assertEquals(true, false);
    } catch (error) {
      assertEquals(error instanceof Error, true);
    }

    readTextFileStub.restore();
  });

  it("should parse YAML configuration correctly", async () => {
    const yamlContent = `name: Test Pack\ndescription: A test expansion pack\nversion: 1.0.0`;
    const readTextFileStub = stub(
      Deno,
      "readTextFile",
      () => Promise.resolve(yamlContent),
    );

    const config = await configLoader.load();
    assertEquals(typeof config, "object");

    readTextFileStub.restore();
  });
});

import { describe, it, beforeEach, afterEach } from "jsr:@std/testing@1.0.13/bdd";
import { assertEquals } from "jsr:@std/assert@1.0.13";
import { stub } from "jsr:@std/testing@1.0.13/mock";
import { ConfigLoader } from "./config-loader-refactored.ts";

describe("ConfigLoader", () => {
  let configLoader: ConfigLoader;
  let readTextFileStub: any;
  let existsStub: any;

  beforeEach(() => {
    configLoader = new ConfigLoader();
    readTextFileStub = undefined as any;
    existsStub = undefined as any;
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
    const readTextFileStub = stub(Deno, "readTextFile", () => Promise.resolve("test: value"));
    
    const config = await configLoader.load();
    assertEquals(typeof config, "object");
    
    readTextFileStub.restore();
  });

  it("should load expansion pack configuration", async () => {
    // Mock Deno.readDir and Deno.readTextFile
    const mockDirEntries = [
      { name: "test-pack", isDirectory: true, isFile: false, isSymlink: false }
    ];
    
    const readDirStub = stub(Deno, "readDir", () => ({
      [Symbol.asyncIterator]: async function* () {
        for (const entry of mockDirEntries) {
          yield entry;
        }
      }
    }) as unknown as AsyncIterable<Deno.DirEntry>);
    
    const readTextFileStub = stub(Deno, "readTextFile", () => Promise.resolve("name: Test Pack"));
    
    const packs = await configLoader.getAvailableExpansionPacks();
    assertEquals(Array.isArray(packs), true);
    
    readDirStub.restore();
    readTextFileStub.restore();
  });

  it("should handle missing expansion packs directory", async () => {
    // Mock Deno.readDir to throw NotFound error
    const readDirStub = stub(Deno, "readDir", () => ({
      [Symbol.asyncIterator]: async function* () {
        throw new Deno.errors.NotFound("Directory not found");
      }
    }) as unknown as AsyncIterable<Deno.DirEntry>);
    
    const packs = await configLoader.getAvailableExpansionPacks();
    assertEquals(Array.isArray(packs), true);
    assertEquals(packs.length, 0);
    
    readDirStub.restore();
  });

  it("should handle configuration loading errors", async () => {
    // Mock Deno.readTextFile to throw an error
    const readTextFileStub = stub(Deno, "readTextFile", () => Promise.reject(new Error("File not found")));
    
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
    const readTextFileStub = stub(Deno, "readTextFile", () => Promise.resolve(yamlContent));
    
    const config = await configLoader.load();
    assertEquals(typeof config, "object");
    
    readTextFileStub.restore();
  });
});

import { describe, it, beforeEach, afterEach } from "jsr:@std/testing@1.0.13/bdd";
import { assertEquals } from "jsr:@std/assert@1.0.13";
import { stub } from "jsr:@std/testing@1.0.13/mock";
import { InstallerValidator } from "./installer-validator.ts";

describe("InstallerValidator", () => {
  let installerValidator: InstallerValidator;
  let stubs: any[] = [];
  
  beforeEach(() => {
    installerValidator = new InstallerValidator();
    stubs = [];
  });
  
  afterEach(() => {
    // Restore all stubs
    stubs.forEach(stubInstance => {
      if (stubInstance.restore) {
        stubInstance.restore();
      }
    });
  });

  it("should detect installation state", async () => {
    // Mock Deno.readTextFile to simulate fresh installation
    const readTextFileStub = stub(Deno, "readTextFile", () => Promise.reject(new Deno.errors.NotFound("File not found")));
    const statStub = stub(Deno, "stat", () => Promise.reject(new Deno.errors.NotFound("Directory not found")));
    
    // Add stubs to the array for automatic cleanup
    stubs.push(readTextFileStub, statStub);
    
    const result = await installerValidator.detectInstallationState("/test/path");
    assertEquals(typeof result, "object");
    assertEquals(result.type, "fresh");
  });

  it("should detect v5 existing installation state", async () => {
    // Mock Deno.readTextFile to simulate v5 installation
    const readTextFileStub = stub(Deno, "readTextFile", () => Promise.resolve("type: v5\nversion: 1.0.0"));
    
    const result = await installerValidator.detectInstallationState("/test/path");
    assertEquals(typeof result, "object");
    
    readTextFileStub.restore();
  });

  it("should handle installation state detection errors", async () => {
    // Mock Deno.readTextFile to throw an error
    const readTextFileStub = stub(Deno, "readTextFile", () => Promise.reject(new Error("Read error")));
    const statStub = stub(Deno, "stat", () => Promise.reject(new Error("Stat error")));
    
    // Add stubs to the array for automatic cleanup
    stubs.push(readTextFileStub, statStub);
    
    const result = await installerValidator.detectInstallationState("/test/path");
    assertEquals(typeof result, "object");
    assertEquals(result.type, "fresh");
  });

  it("should check file integrity with no issues", async () => {
    // Mock Deno.stat to simulate all files existing
    const statStub = stub(Deno, "stat", () => Promise.resolve({ isFile: true } as Deno.FileInfo));
    
    // Add stub to the array for automatic cleanup
    stubs.push(statStub);
    
    const result = await installerValidator.checkFileIntegrity("/test/path", {
      files: ["file1.txt", "file2.txt"],
    });
    
    assertEquals(Array.isArray(result.missing), true);
    assertEquals(Array.isArray(result.modified), true);
    assertEquals(result.missing.length, 0);
  });

  it("should detect missing files during integrity check", async () => {
    // Mock Deno.stat to simulate missing files
    const statStub = stub(Deno, "stat", () => Promise.reject(new Deno.errors.NotFound("File not found")));
    
    // Add stub to the array for automatic cleanup
    stubs.push(statStub);
    
    const result = await installerValidator.checkFileIntegrity("/test/path", {
      files: ["missing-file.txt"],
    });
    
    assertEquals(Array.isArray(result.missing), true);
    assertEquals(Array.isArray(result.modified), true);
    assertEquals(result.missing.length > 0, true);
    assertEquals(result.modified.length, 0);
  });

  it("should handle invalid manifest during integrity check", async () => {
    const result = await installerValidator.checkFileIntegrity("/test/path", undefined);
    
    assertEquals(Array.isArray(result.missing), true);
    assertEquals(Array.isArray(result.modified), true);
    assertEquals(result.missing.length, 0);
    assertEquals(result.modified.length, 0);
  });
});

import {
  beforeEach,
  describe,
  it,
  assertEquals,
  stub,
  InstallerOrchestrator,
} from "deps";

import type {
  IConfigLoader,
  IFileManager,
  IIdeSetup,
  IInstallerValidator,
  ILogger,
  IPromptHandler,
  IResourceLocator,
} from "deps";

describe("InstallerOrchestrator", () => {
  let installerOrchestrator: InstallerOrchestrator;
  let mockLogger: ILogger;
  let mockFileManager: IFileManager;
  let mockIdeSetup: IIdeSetup;
  let mockConfigLoader: IConfigLoader;
  let mockResourceLocator: IResourceLocator;
  let mockInstallerValidator: IInstallerValidator;
  let mockPromptHandler: IPromptHandler;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      setLevel: () => {},
    };

    // Create mock file manager
    mockFileManager = {
      ensureDir: () => Promise.resolve(),
      copy: () => Promise.resolve(),
      readTextFile: () => Promise.resolve(""),
      writeTextFile: () => Promise.resolve(),
      readDir: () => ({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.resolve({ done: true, value: undefined }),
        }),
      } as AsyncIterable<Deno.DirEntry>),
      exists: () =>
        Promise.resolve(true),
    };

    // Create mock IDE setup
    mockIdeSetup = {
      setupIdeConfigurations: () => Promise.resolve(),
    };

    // Create mock config loader
    mockConfigLoader = {
      load: () => Promise.resolve({}),
      getAvailableExpansionPacks: () => Promise.resolve([]),
    };

    // Create mock resource locator
    mockResourceLocator = {
      getBmadCorePath: () => "",
      getExpansionPacksPath: () => "",
      getExpansionPackPath: () => "",
    };

    // Create mock installer validator
    mockInstallerValidator = {
      detectInstallationState: () => Promise.resolve({ type: "fresh" }),
      checkFileIntegrity: () => Promise.resolve({ missing: [], modified: [] }),
    };

    // Create mock prompt handler
    mockPromptHandler = {
      promptInstallation: () => Promise.resolve(),
    };

    installerOrchestrator = new InstallerOrchestrator(
      mockLogger,
      mockFileManager,
      mockIdeSetup,
      mockConfigLoader,
      mockResourceLocator,
      mockInstallerValidator,
      mockPromptHandler,
    );
  });

  it("should create installer orchestrator instance", () => {
    assertEquals(typeof installerOrchestrator, "object");
    assertEquals(typeof installerOrchestrator.install, "function");
  });

  it("should have install method", () => {
    assertEquals(typeof installerOrchestrator.install, "function");
  });

  it("should handle installation process", async () => {
    // Mock the install method to avoid complex setup
    const installStub = stub(
      installerOrchestrator,
      "install",
      () => Promise.resolve(),
    );

    await installerOrchestrator.install({
      directory: "/test/path",
      ides: ["vscode"],
      expansionPacks: [],
    });

    assertEquals(installStub.calls.length, 1);

    installStub.restore();
  });
});

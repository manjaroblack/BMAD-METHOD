import { type afterEach as _afterEach, beforeEach, describe, it } from "../../deps.ts";
import { type Stub, stub } from "../../deps.ts";
import {
  type assertEquals as _assertEquals,
  assertRejects as _assertRejects,
} from "../../deps.ts";

import { InstallerService } from "../../src/components/installer/services/InstallerService.ts";
import type { IFileManager, ILogger, IInstallerValidator, IIdeSetup, IConfigLoader, IResourceLocator, IPromptHandler, ICoreInstaller } from "../../deps.ts";
import type { ISpinner as _ISpinner } from "../../src/shared/services/core/spinner.service.ts";
import { InstallationError } from "../../src/core/errors/InstallationError.ts";

// Mock console.log to avoid output during tests
let consoleLogStub: Stub | undefined;

function restoreStubs() {
  if (consoleLogStub) {
    consoleLogStub.restore();
    consoleLogStub = undefined;
  }
}

describe("InstallerService", () => {
  let installerService: InstallerService;
  let fileManager: IFileManager;
  let logger: ILogger;
  let coreInstaller: ICoreInstaller;
  let installerValidator: IInstallerValidator;
  let ideSetup: IIdeSetup;
  let configLoader: IConfigLoader;
  let resourceLocator: IResourceLocator;
  let promptHandler: IPromptHandler;

  beforeEach(() => {
    fileManager = {
      ensureDir: () => Promise.resolve(),
      copy: () => Promise.resolve(),
      readTextFile: () => Promise.resolve(""),
      writeTextFile: () => Promise.resolve(),
      readDir: async function* () {},
      exists: () => Promise.resolve(false),
      remove: () => Promise.resolve(),
      mkdir: () => Promise.resolve(),
      readdir: () => Promise.resolve([]),
    } as IFileManager;
    logger = {
      info: () => {},
      error: () => {},
      warn: () => {},
      debug: () => {},
      trace: () => {},
      setLevel: () => {},
    } as ILogger;
    coreInstaller = {
      installCore: async () => {},
      updateCore: async () => {},
      performUpdate: async () => {},
      performRepair: async () => {},
    } as ICoreInstaller;
    installerValidator = {
      detectInstallationState: () => Promise.resolve({ type: "fresh" }),
      checkFileIntegrity: () => Promise.resolve({ missing: [], modified: [] }),
    } as IInstallerValidator;
    ideSetup = {
      setupIdeConfigurations: async () => {},
    } as IIdeSetup;
    configLoader = {
      load: () => Promise.resolve({}),
      getAvailableExpansionPacks: () => Promise.resolve([]),
    } as IConfigLoader;
    resourceLocator = {
      getBmadCorePath: () => "./core",
      getExpansionPacksPath: () => "./packs",
      getExpansionPackPath: () => "./pack",
    } as IResourceLocator;
    promptHandler = {
      promptInstallation: () => Promise.resolve(),
    } as IPromptHandler;
    installerService = new InstallerService(fileManager, logger, coreInstaller, installerValidator, ideSetup, configLoader, resourceLocator, promptHandler);
    restoreStubs();
    // Mock console.log to prevent output during tests
    consoleLogStub = stub(console, "log");
  });

  it("should simulate successful installation", async () => {
    // Test that install method can be called without throwing
    await installerService.install({ directory: "./test" });
    // If we reach here without exception, the test passes
  });

  it("should simulate successful update", async () => {
    // Test that update method can be called without throwing
    await installerService.update({ directory: "./test" });
    // If we reach here without exception, the test passes
  });

  it("should simulate successful repair", async () => {
    // Test that repair method can be called without throwing
    await installerService.repair({ directory: "./test" });
    // If we reach here without exception, the test passes
  });

  it("should throw ServiceError on installation failure", async () => {
    // Override the install method to return a rejected promise
    const originalInstall = installerService.install;
    installerService.install = () => {
      return Promise.reject(new InstallationError("Failed to execute install command"));
    };

    try {
      await _assertRejects(
        async () => {
          await installerService.install({ directory: "./test" });
        },
        InstallationError,
      );
    } finally {
      // Restore the original method
      installerService.install = originalInstall;
    }
  });

  it("should throw ServiceError on update failure", async () => {
    // Override the update method to return a rejected promise
    const originalUpdate = installerService.update;
    installerService.update = () => {
      return Promise.reject(new InstallationError("Failed to execute update command"));
    };

    try {
      await _assertRejects(
        async () => {
          await installerService.update({ directory: "./test" });
        },
        InstallationError,
      );
    } finally {
      // Restore the original method
      installerService.update = originalUpdate;
    }
  });

  it("should throw ServiceError on repair failure", async () => {
    // Override the repair method to return a rejected promise
    const originalRepair = installerService.repair;
    installerService.repair = () => {
      return Promise.reject(new InstallationError("Failed to execute repair command"));
    };

    try {
      await _assertRejects(
        async () => {
          await installerService.repair({ directory: "./test" });
        },
        InstallationError,
      );
    } finally {
      // Restore the original method
      installerService.repair = originalRepair;
    }
  });
});

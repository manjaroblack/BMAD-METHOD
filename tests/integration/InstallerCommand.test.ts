import { afterEach, beforeEach, describe, it } from "../../deps.ts";
import { type Stub, stub } from "../../deps.ts";
import {
  assertEquals as _assertEquals,
  assertRejects as _assertRejects,
} from "../../deps.ts";

import { InstallerCommand } from "../../src/components/installer/installer.command.ts";
import { ServiceError } from "../../src/core/errors/ServiceError.ts";
import type { IInstallerService } from "../../src/components/installer/interfaces/IInstallerService.ts";
import type { IPromptHandler } from "../../deps.ts";

// Mock console.log to avoid output during tests
let consoleLogStub: Stub | undefined;

function restoreStubs() {
  if (consoleLogStub) {
    consoleLogStub.restore();
    consoleLogStub = undefined;
  }
}

describe("InstallerCommand", () => {
  let installerCommand: InstallerCommand;
  let installerServiceStub: IInstallerService;

  beforeEach(() => {
    restoreStubs();
    // Mock console.log to prevent output during tests
    consoleLogStub = stub(console, "log");
    
    // Create a mock installer service
    installerServiceStub = {
      install: () => Promise.resolve(),
      update: () => Promise.resolve(),
      repair: () => Promise.resolve(),
      promptHandler: {} as IPromptHandler,
    };
    
    installerCommand = new InstallerCommand(installerServiceStub);
  });

  afterEach(() => {
    restoreStubs();
  });

  it("should execute install command successfully", async () => {
    // Mock the install method to track calls
    const installStub = stub(installerServiceStub, "install", () => Promise.resolve());
    
    // Execute command
    await installerCommand.execute({ directory: "./test" });

    // Assert that the install method was called
    _assertEquals(installStub.calls.length, 1);
    if (installStub.calls[0]) {
      _assertEquals(installStub.calls[0].args[0], { directory: "./test" });
    }
  });

  it("should handle installation errors gracefully", async () => {
    // Mock the install method to throw an error
    const installStub = stub(installerServiceStub, "install", () => 
      Promise.reject(new Error("Installation failed"))
    );
    
    // Assert that error is properly handled
    await _assertRejects(
      async () => {
        await installerCommand.execute({ directory: "./test" });
      },
      ServiceError,
    );
    
    // Assert that the install method was called
    _assertEquals(installStub.calls.length, 1);
  });

  it("should propagate ServiceError directly", async () => {
    // Mock the install method to throw a ServiceError
    const serviceError = new ServiceError("Service error", "SERVICE_ERROR");
    const installStub = stub(installerServiceStub, "install", () => 
      Promise.reject(serviceError)
    );
    
    // Assert that the ServiceError is propagated directly
    const error = await _assertRejects(
      async () => {
        await installerCommand.execute({ directory: "./test" });
      },
      ServiceError,
    );
    
    // Assert that it's the same error instance
    _assertEquals(error, serviceError);
    
    // Assert that the install method was called
    _assertEquals(installStub.calls.length, 1);
  });
});

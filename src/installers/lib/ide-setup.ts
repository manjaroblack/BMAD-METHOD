// IDE setup service for BMad Method installer
// Implements IIdeSetup interface

import { green, red } from "deps";
import BaseIdeSetup from "./ide-base-setup.ts";
import { FileManager as _FileManager } from "./file-manager.ts";

import type { IIdeSetup } from "./installer.interfaces.ts";
import type { IFileManager } from "./installer.interfaces.ts";

export class IdeSetup implements IIdeSetup {
  private _ideSetup: BaseIdeSetup;

  constructor(fileManager: IFileManager) {
    this._ideSetup = new BaseIdeSetup(fileManager);
  }

  /**
   * Set up IDE configurations
   * @param installDir - Installation directory
   * @param ides - List of IDEs to configure
   * @param spinner - Optional spinner for progress indication
   */
  async setupIdeConfigurations(
    installDir: string,
    ides: string[],
    spinner?: unknown,
  ): Promise<void> {
    if (spinner && typeof spinner === 'object' && spinner !== null) {
      (spinner as { text: string }).text = "Setting up IDE configurations...";
    }
    
    try {
      for (const ide of ides) {
        if (spinner && typeof spinner === 'object' && spinner !== null) {
          (spinner as { text: string }).text = `Setting up ${ide} configuration...`;
        }
        
        const agentIds = await this._ideSetup.getAllAgentIds(installDir);
        const agentPathPromises = agentIds.map((id) =>
          this._ideSetup.findAgentPath(installDir, id)
        );
        const agentPaths = await Promise.all(agentPathPromises);
        
        for (let i = 0; i < agentIds.length; i++) {
          const agentId = agentIds[i] as string;
          const agentPath = agentPaths[i] as string | null;
          
          if (agentPath !== null) {
            await this._ideSetup.createAgentRuleContent(
              agentId,
              agentPath,
              installDir,
            );
          } else {
            console.warn(`Skipping agent ${agentId}: agentPath not found.`);
          }
        }
        
        console.log(green(`✓ ${ide} configuration set up.`));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error(
        red(`Failed to set up IDE configurations: ${errorMessage}`),
      );
      throw error;
    }
  }
}

// Note: The singleton instance has been removed to avoid circular dependencies
// In production code, IdeSetup should be instantiated with a file manager
// For tests, create a new instance as needed

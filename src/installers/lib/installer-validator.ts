// Installer validator service for BMad Method installer
// Implements IInstallerValidator interface

import { join, parseYaml } from "deps";

import type {
  IInstallerValidator,
  InstallationState,
  FileIntegrityResult,
} from "deps";

export class InstallerValidator implements IInstallerValidator {
  /**
   * Detect installation state
   * @param installDir - Installation directory
   */
  async detectInstallationState(installDir: string): Promise<InstallationState> {
    try {
      // Check for .bmad-core directory
      const coreDir = join(installDir, ".bmad-core");
      const coreManifestPath = join(coreDir, "install-manifest.yaml");
      
      // Try to read the manifest file
      try {
        const manifestContent = await Deno.readTextFile(coreManifestPath);
        const manifest = parseYaml(manifestContent) as Record<string, unknown>;
        
        // Check if it's a v5 installation
        if (manifest.type === "v5" || manifest.version) {
          return {
            type: "v5_existing",
            manifest,
            expansionPacks: await this.detectExpansionPacks(installDir),
          };
        }
        
        return {
          type: "unknown",
          manifest,
        };
      } catch (_e) {
        // Manifest file doesn't exist or is invalid
        // Check if .bmad-core directory exists
        try {
          const coreDirInfo = await Deno.stat(coreDir);
          if (coreDirInfo.isDirectory) {
            return {
              type: "unknown",
            };
          }
        } catch (_e2) {
          // .bmad-core directory doesn't exist
        }
        
        return {
          type: "fresh",
        };
      }
    } catch (error) {
      console.error(
        "Error detecting installation state:",
        error instanceof Error ? error.message : String(error),
      );
      
      return {
        type: "unknown",
      };
    }
  }

  /**
   * Check file integrity
   * @param installDir - Installation directory
   * @param manifest - Installation manifest
   */
  async checkFileIntegrity(
    installDir: string,
    manifest: Record<string, unknown> | undefined,
  ): Promise<FileIntegrityResult> {
    const result: FileIntegrityResult = {
      missing: [],
      modified: [],
    };
    
    if (!manifest || !manifest.files || !Array.isArray(manifest.files)) {
      return result;
    }
    
    // Check each file in the manifest
    for (const filePath of manifest.files) {
      const fullPath = join(installDir, filePath);
      
      try {
        // Check if file exists
        const fileInfo = await Deno.stat(fullPath);
        if (!fileInfo.isFile) {
          result.missing.push(filePath);
          continue;
        }
        
        // TODO: Check file integrity (hash comparison)
        // For now, we'll just check existence
        
      } catch (_e) {
        // File doesn't exist
        result.missing.push(filePath);
      }
    }
    
    return result;
  }

  /**
   * Detect expansion packs
   * @param installDir - Installation directory
   */
  private async detectExpansionPacks(
    installDir: string,
  ): Promise<Record<string, unknown>> {
    const expansionPacks: Record<string, unknown> = {};
    
    try {
      const expansionDir = join(installDir, ".bmad-expansions");
      const expansionDirInfo = await Deno.stat(expansionDir);
      
      if (expansionDirInfo.isDirectory) {
        for await (const entry of Deno.readDir(expansionDir)) {
          if (entry.isDirectory) {
            const packId = entry.name;
            const manifestPath = join(expansionDir, packId, "install-manifest.yaml");
            
            try {
              const manifestContent = await Deno.readTextFile(manifestPath);
              const manifest = parseYaml(manifestContent) as Record<string, unknown>;
              expansionPacks[packId] = {
                manifest,
              };
            } catch (_e) {
              // Manifest doesn't exist or is invalid
              expansionPacks[packId] = {};
            }
          }
        }
      }
    } catch (_e) {
      // Expansion directory doesn't exist
    }
    
    return expansionPacks;
  }
}

// Export singleton instance
export const installerValidator = new InstallerValidator();

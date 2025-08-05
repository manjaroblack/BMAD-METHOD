// Refactored config loader service for BMad Method installer
// Implements IConfigLoader interface

import { join, parseYaml, ProjectPaths } from "deps";

import type { ExpansionPack, IConfigLoader } from "deps";

export class ConfigLoader implements IConfigLoader {
  private configPath: string;
  private config: Record<string, unknown> | null = null;

  constructor() {
    this.configPath = join(
      ProjectPaths.src,
      "installers",
      "config",
      "install.config.yaml",
    );
  }

  /**
   * Load configuration
   */
  async load(): Promise<Record<string, unknown>> {
    if (this.config) return this.config;

    try {
      const configContent = await Deno.readTextFile(this.configPath);
      this.config = parseYaml(configContent) as Record<string, unknown>;
      return this.config;
    } catch (error) {
      throw new Error(
        `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get available expansion packs
   */
  async getAvailableExpansionPacks(): Promise<ExpansionPack[]> {
    const expansionPacksDir = ProjectPaths.extensions;
    const packs: ExpansionPack[] = [];

    try {
      // Check if directory exists
      const dirInfo = await Deno.stat(expansionPacksDir);
      if (!dirInfo.isDirectory) {
        return packs;
      }

      for await (const entry of Deno.readDir(expansionPacksDir)) {
        if (entry.isDirectory) {
          const packId = entry.name;
          const configPath = join(expansionPacksDir, packId, "config.yaml");

          try {
            // Check if config file exists
            const fileInfo = await Deno.stat(configPath);
            if (fileInfo.isFile) {
              const configContent = await Deno.readTextFile(configPath);
              const config = parseYaml(configContent) as Record<string, unknown>;

              if (config && typeof config === "object") {
                packs.push({
                  id: packId,
                  shortTitle: typeof config["short-title"] === "string"
                    ? config["short-title"]
                    : packId,
                  version: typeof config.version === "string" ? config.version : "1.0.0",
                  description: typeof config.description === "string"
                    ? config.description
                    : undefined,
                  dependencies: Array.isArray(config.dependencies)
                    ? config.dependencies
                    : undefined,
                });
              }
            }
          } catch (error) {
            console.warn(
              `Failed to parse expansion pack ${packId}:`,
              error instanceof Error ? error.message : String(error),
            );
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist, return empty array
      if (!(error instanceof Deno.errors.NotFound)) {
        console.error(
          "Failed to read expansion packs directory:",
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return packs;
  }
}

// Export singleton instance

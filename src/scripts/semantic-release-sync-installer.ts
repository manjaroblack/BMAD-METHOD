#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * Semantic-release plugin to sync installer deno.json version
 * Migrated from Node.js to Deno
 */

import { join, Deno.stat } from "deps";

// Interface for semantic-release context
interface SemanticReleaseContext {
  nextRelease: {
    version: string;
    type: string;
    channel?: string;
    gitHead?: string;
    gitTag?: string;
    notes?: string;
  };
  logger: {
    log: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
    info: (message: string) => void;
  };
}

// Interface for deno.json structure
interface PackageJson {
  name?: string;
  version: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

// Interface for plugin configuration
interface PluginConfig {
  installerPath?: string;
  [key: string]: unknown;
}

/**
 * Semantic Release Plugin for syncing installer deno.json version
 */
class SemanticReleaseSyncInstaller {
  private defaultInstallerPath = "tools/installer/deno.json";

  /**
   * Prepare step - syncs the installer deno.json version
   */
  async prepare(
    pluginConfig: PluginConfig,
    context: SemanticReleaseContext,
  ): Promise<void> {
    const { nextRelease, logger } = context;

    // Get the installer path from config or use default
    const installerPath = pluginConfig.installerPath || this.defaultInstallerPath;
    const filePath = join(Deno.cwd(), installerPath);

    try {
      // Check if the file exists
      if (!(await Deno.stat(filePath))) {
        logger.log(`Installer deno.json not found at ${filePath}, skipping`);
        return;
      }

      // Read and parse the deno.json file
      const fileContent = await Deno.readTextFile(filePath);
      const pkg: PackageJson = JSON.parse(fileContent);

      // Update the version field with the next release version
      pkg.version = nextRelease.version;

      // Write the updated JSON back to the file
      const updatedContent = JSON.stringify(pkg, null, 2) + "\n";
      await Deno.writeTextFile(filePath, updatedContent);

      // Log success message
      logger.log(`Synced installer deno.json to version ${nextRelease.version}`);
    } catch (error) {
      const errorMessage = `Failed to sync installer deno.json: ${(error as Error).message}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get plugin configuration with defaults
   */
  getConfig(pluginConfig: PluginConfig = {}): PluginConfig {
    return {
      installerPath: this.defaultInstallerPath,
      ...pluginConfig,
    };
  }

  /**
   * Validate plugin configuration
   */
  validateConfig(pluginConfig: PluginConfig): boolean {
    if (pluginConfig.installerPath && typeof pluginConfig.installerPath !== "string") {
      throw new Error("installerPath must be a string");
    }
    return true;
  }
}

// Create plugin instance
const plugin = new SemanticReleaseSyncInstaller();

// Export the prepare function for semantic-release compatibility
export function prepare(
  pluginConfig: PluginConfig,
  context: SemanticReleaseContext,
): Promise<void> {
  return plugin.prepare(pluginConfig, context);
}

// Export the plugin class and instance
export { SemanticReleaseSyncInstaller };
export default plugin;

// CLI support for direct execution
if (import.meta.main) {
  const args = Deno.args;

  if (args.length < 1) {
    console.error("Usage: semantic-release-sync-installer.ts <version>");
    console.error("Example: semantic-release-sync-installer.ts 1.2.3");
    Deno.exit(1);
  }

  const version = args[0];
  if (!version) {
    console.error("Error: Version argument is required");
    Deno.exit(1);
  }

  const installerPath = args[1] || "tools/installer/deno.json";

  // Create mock context for CLI usage
  const mockContext: SemanticReleaseContext = {
    nextRelease: {
      version,
      type: "patch",
    },
    logger: {
      log: (msg: string) => console.log(`[INFO] ${msg}`),
      error: (msg: string) => console.error(`[ERROR] ${msg}`),
      warn: (msg: string) => console.warn(`[WARN] ${msg}`),
      info: (msg: string) => console.info(`[INFO] ${msg}`),
    },
  };

  try {
    await plugin.prepare({ installerPath }, mockContext);
    console.log("✅ Successfully synced installer deno.json version");
  } catch (error) {
    console.error("❌ Failed to sync installer deno.json version:", error);
    Deno.exit(1);
  }
}

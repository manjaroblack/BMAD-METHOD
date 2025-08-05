#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Update expansion pack version script for Deno
 * Updates version in expansion pack config.yaml files
 */

import { dirname, join, parseYaml as parse, stringifyYaml as stringify } from "deps";

interface ExpansionConfig {
  version?: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

class ExpansionVersionUpdater {
  private packId: string;
  private newVersion: string;

  constructor(packId: string, newVersion: string) {
    this.packId = packId;
    this.newVersion = newVersion;
  }

  // Validate version format
  validateVersion(): boolean {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    return versionRegex.test(this.newVersion);
  }

  // Get the path to the expansion pack config
  getConfigPath(): string {
    const currentDir = new URL(".", import.meta.url).pathname;
    return join(
      dirname(currentDir),
      "expansion-packs",
      this.packId,
      "config.yaml",
    );
  }

  // Update the version in config.yaml
  async updateVersion(): Promise<void> {
    try {
      const configPath = this.getConfigPath();

      // Check if expansion pack exists
      if (!(await Deno.stat(configPath))) {
        console.error(`Error: Expansion pack '${this.packId}' not found`);
        console.error(`Expected path: ${configPath}`);
        Deno.exit(1);
      }

      // Read and parse the config file
      const configContent = await Deno.readTextFile(configPath);
      const config = parse(configContent) as ExpansionConfig;
      const oldVersion = config.version || "unknown";

      // Update version
      config.version = this.newVersion;

      // Write back to file
      const updatedYaml = stringify(config, { indent: 2 });
      await Deno.writeTextFile(configPath, updatedYaml);

      // Success messages
      console.log(
        `✓ Updated ${this.packId}/config.yaml: ${oldVersion} → ${this.newVersion}`,
      );
      console.log(`\n✓ Successfully updated ${this.packId} to version ${this.newVersion}`);
      console.log("\nNext steps:");
      console.log("1. Test the changes");
      console.log(
        `2. Commit: git add -A && git commit -m "chore: bump ${this.packId} to v${this.newVersion}"`,
      );
    } catch (error) {
      console.error("Error updating version:", (error as Error).message);
      Deno.exit(1);
    }
  }
}

// Main execution
function main() {
  const args = Deno.args;

  if (args.length < 2) {
    console.log(
      "Usage: deno run --allow-read --allow-write update-expansion-version.ts <expansion-pack-id> <new-version>",
    );
    console.log(
      "Example: deno run --allow-read --allow-write update-expansion-version.ts bmad-creator-tools 1.1.0",
    );
    Deno.exit(1);
  }

  const packId = args[0];
  const newVersion = args[1];

  if (!packId || !newVersion) {
    console.error("Error: Both expansion-pack-id and new-version are required");
    Deno.exit(1);
  }

  // Validate version format
  const updater = new ExpansionVersionUpdater(packId, newVersion);

  if (!updater.validateVersion()) {
    console.error("Error: Version must be in format X.Y.Z (e.g., 1.2.3)");
    Deno.exit(1);
  }

  // Update the version
  updater.updateVersion();
}

if (import.meta.main) {
  main();
}

export default ExpansionVersionUpdater;

#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

// Load required modules
import { dirname, join, parseYaml as parse, ProjectPaths, stringifyYaml as stringify } from "deps";

// Parse CLI arguments
const args = Deno.args;
const packId = args[0];
const bumpType = args[1] || "minor";

// Validate arguments
if (!packId || args.length > 2) {
  console.log(
    "Usage: deno run --allow-read --allow-write bump-expansion-version.ts <expansion-pack-id> [major|minor|patch]",
  );
  console.log("Default: minor");
  console.log(
    "Example: deno run --allow-read --allow-write bump-expansion-version.ts bmad-creator-tools patch",
  );
  Deno.exit(1);
}

if (!["major", "minor", "patch"].includes(bumpType)) {
  console.error("Error: Bump type must be major, minor, or patch");
  Deno.exit(1);
}

// Version bump logic
function bumpVersion(currentVersion: string, type: string): string {
  const parts = currentVersion.split(".").map(Number);
  const [major = 0, minor = 0, patch = 0] = parts;

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      return currentVersion;
  }
}

// Main function to bump version
async function updateVersion(): Promise<void> {
  const currentDir = new URL(".", import.meta.url).pathname;
  const rootDir = join(dirname(currentDir), "..", "..");
  const configPath = join(
    rootDir,
    "extensions",
    packId!,
    "config.yaml",
  );

  // Check if config exists
  if (!(await Deno.stat(configPath))) {
    console.error(`Error: Expansion pack '${packId}' not found`);
    console.log("\nAvailable expansion packs:");

    const packsDir = ProjectPaths.extensions;
    try {
      const entries = [];
      for await (const entry of Deno.readDir(packsDir)) {
        entries.push(entry);
      }

      entries.forEach((entry) => {
        if (entry.isDirectory && !entry.name.startsWith(".")) {
          console.log(`  - ${entry.name}`);
        }
      });
    } catch (error) {
      console.error(
        "Error reading extensions directory:",
        error instanceof Error ? error.message : String(error),
      );
    }

    Deno.exit(1);
  }

  try {
    const configContent = await Deno.readTextFile(configPath);
    const config = parse(configContent) as Record<string, unknown>;

    const oldVersion = (config.version as string) || "1.0.0";
    const newVersion = bumpVersion(oldVersion, bumpType);

    config.version = newVersion;

    const updatedYaml = stringify(config, { indent: 2 });
    await Deno.writeTextFile(configPath, updatedYaml);

    console.log(`✓ ${packId}: ${oldVersion} → ${newVersion}`);
    console.log(
      `\n✓ Successfully bumped ${packId} with ${bumpType} version bump`,
    );
    console.log("\nNext steps:");
    console.log(`1. Test the changes`);
    console.log(
      `2. Commit: git add -A && git commit -m "chore: bump ${packId} version (${bumpType})"`,
    );
  } catch (error) {
    console.error(
      "Error updating version:",
      error instanceof Error ? error.message : String(error),
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await updateVersion();
}

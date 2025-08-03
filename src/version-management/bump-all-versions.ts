#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import {
  dirname,
  join,
  parseYaml as parse,
  ProjectPaths,
  safeExists as existsSync,
  stringifyYaml as stringify,
} from "deps";

const args = Deno.args;
const bumpType = args[0] || "minor"; // default to minor

if (!["major", "minor", "patch"].includes(bumpType)) {
  console.log(
    "Usage: deno run --allow-read --allow-write bump-all-versions.ts [major|minor|patch]",
  );
  console.log("Default: minor");
  Deno.exit(1);
}

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

interface UpdatedItem {
  type: "core" | "expansion";
  name: string;
  oldVersion: string;
  newVersion: string;
}

async function bumpAllVersions(): Promise<void> {
  const updatedItems: UpdatedItem[] = [];
  const currentDir = new URL(".", import.meta.url).pathname;
  const rootDir = join(dirname(currentDir), "..", "..");

  // First, bump the core version (deno.json)
  const packagePath = join(rootDir, "deno.json");
  try {
    const packageContent = await Deno.readTextFile(packagePath);
    const packageJson = JSON.parse(packageContent);
    const oldCoreVersion = packageJson.version || "1.0.0";
    const newCoreVersion = bumpVersion(oldCoreVersion, bumpType);

    packageJson.version = newCoreVersion;

    await Deno.writeTextFile(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

    updatedItems.push({
      type: "core",
      name: "BMad Core",
      oldVersion: oldCoreVersion,
      newVersion: newCoreVersion,
    });
    console.log(
      `✓ BMad Core (deno.json): ${oldCoreVersion} → ${newCoreVersion}`,
    );
  } catch (error) {
    console.error(
      `✗ Failed to update BMad Core: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Then, bump all expansion packs
  const expansionPacksDir = ProjectPaths.extensions;

  try {
    const entries = [];
    for await (const entry of Deno.readDir(expansionPacksDir)) {
      entries.push(entry);
    }

    for (const entry of entries) {
      if (
        entry.isDirectory && !entry.name.startsWith(".") &&
        entry.name !== "README.md"
      ) {
        const packId = entry.name;
        const configPath = join(expansionPacksDir, packId, "config.yaml");

        if (await existsSync(configPath)) {
          try {
            const configContent = await Deno.readTextFile(configPath);
            const config = parse(configContent) as Record<string, unknown>;
            const oldVersion = (config.version as string) || "1.0.0";
            const newVersion = bumpVersion(oldVersion, bumpType);

            config.version = newVersion;

            const updatedYaml = stringify(config, { indent: 2 });
            await Deno.writeTextFile(configPath, updatedYaml);

            updatedItems.push({
              type: "expansion",
              name: packId,
              oldVersion,
              newVersion,
            });
            console.log(`✓ ${packId}: ${oldVersion} → ${newVersion}`);
          } catch (error) {
            console.error(
              `✗ Failed to update ${packId}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }
      }
    }

    if (updatedItems.length > 0) {
      const coreCount = updatedItems.filter((i) => i.type === "core").length;
      const expansionCount = updatedItems.filter((i) => i.type === "expansion").length;

      console.log(
        `\n✓ Successfully bumped ${updatedItems.length} item(s) with ${bumpType} version bump`,
      );
      if (coreCount > 0) console.log(`  - ${coreCount} core`);
      if (expansionCount > 0) {
        console.log(`  - ${expansionCount} expansion pack(s)`);
      }

      console.log("\nNext steps:");
      console.log("1. Test the changes");
      console.log(
        '2. Commit: git add -A && git commit -m "chore: bump all versions (' +
          bumpType + ')"',
      );
    } else {
      console.log("No items found to update");
    }
  } catch (error) {
    console.error(
      "Error reading expansion packs directory:",
      error instanceof Error ? error.message : String(error),
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await bumpAllVersions();
}

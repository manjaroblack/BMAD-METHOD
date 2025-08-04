#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Sync installer deno.json version with main deno.json
 * Used by semantic-release to keep versions in sync
 */

import {
  dirname,
  join,
  ProjectPaths,
} from "deps";

export async function syncInstallerVersion(): Promise<void> {
  const currentDir = new URL(".", import.meta.url).pathname;
  const rootDir = join(dirname(currentDir), "..", "..");

  // Read main deno.json
  const mainPackagePath = join(rootDir, "deno.json");
  const mainPackageContent = await Deno.readTextFile(mainPackagePath);
  const mainPackage = JSON.parse(mainPackageContent);

  // Read installer deno.json
  const installerPackagePath = join(ProjectPaths.tooling, "installers", "deno.json");
  const installerPackageContent = await Deno.readTextFile(installerPackagePath);
  const installerPackage = JSON.parse(installerPackageContent);

  // Update installer version to match main version
  installerPackage.version = mainPackage.version;

  // Write back installer deno.json
  await Deno.writeTextFile(installerPackagePath, JSON.stringify(installerPackage, null, 2) + "\n");

  console.log(`Synced installer version to ${mainPackage.version}`);
}

// Run if called directly
if (import.meta.main) {
  await syncInstallerVersion();
}

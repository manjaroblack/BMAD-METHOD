#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Sync installer package.json version with main package.json
 * Used by semantic-release to keep versions in sync
 */

import { dirname, join } from "deps";

export async function syncInstallerVersion(): Promise<void> {
  const currentDir = new URL(".", import.meta.url).pathname;
  const rootDir = join(dirname(currentDir), "..", "..");

  // Read main package.json
  const mainPackagePath = join(rootDir, "package.json");
  const mainPackageContent = await Deno.readTextFile(mainPackagePath);
  const mainPackage = JSON.parse(mainPackageContent);

  // Read installer package.json
  const installerPackagePath = join(rootDir, "tooling", "installers", "package.json");
  const installerPackageContent = await Deno.readTextFile(installerPackagePath);
  const installerPackage = JSON.parse(installerPackageContent);

  // Update installer version to match main version
  installerPackage.version = mainPackage.version;

  // Write back installer package.json
  await Deno.writeTextFile(installerPackagePath, JSON.stringify(installerPackage, null, 2) + "\n");

  console.log(`Synced installer version to ${mainPackage.version}`);
}

// Run if called directly
if (import.meta.main) {
  await syncInstallerVersion();
}

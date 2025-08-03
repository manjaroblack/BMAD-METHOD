#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

/**
 * BMad Method CLI - Direct execution wrapper for Deno
 * This file ensures proper execution when run via Deno from GitHub or local installation
 */

import { dirname, join, safeExists } from "deps";

// Get command line arguments (excluding the script path)
const args = Deno.args;

// Determine the correct path to the main bmad.ts installer
const currentDir = new URL(".", import.meta.url).pathname;
const bmadScriptPath = join(dirname(currentDir), "..", "installers", "bin", "bmad.ts");

// Check if the installer exists
if (!(await safeExists(bmadScriptPath))) {
  console.error("Error: Could not find bmad.ts at", bmadScriptPath);
  console.error("Current directory:", currentDir);
  Deno.exit(1);
}

try {
  // Execute the main installer with all arguments
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "--allow-run",
      bmadScriptPath,
      ...args,
    ],
    cwd: dirname(dirname(currentDir)), // Set working directory to tooling root
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const { code } = await command.output();
  Deno.exit(code);
} catch (error) {
  console.error("Error executing bmad installer:", error);
  Deno.exit(1);
}

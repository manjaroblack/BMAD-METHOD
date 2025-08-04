#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import {
  Command,
  getVersion,
  initializeInstaller,
  setupCommands,
} from "deps";

// Initialize the installer
await initializeInstaller();

// Create CLI instance
const cli = new Command()
  .name("bmad")
  .version(getVersion())
  .description(
    "BMad Method installer - Universal AI agent framework for any domain",
  );

// Setup all commands
setupCommands(cli);

// Main entry point
if (import.meta.main) {
  try {
    await cli.parse(Deno.args);
  } catch (error) {
    console.error(
      "❌ CLI Error:",
      error instanceof Error ? error.message : String(error),
    );
    Deno.exit(1);
  }

  // Show help if no arguments provided
  if (!Deno.args.length) {
    cli.showHelp();
  }
}

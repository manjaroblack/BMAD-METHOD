#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

// Import reflect-metadata first for InversifyJS decorators
import "./deps.ts";

import { container } from './src/core/container.ts';
import { configureContainer } from './src/core/di.config.ts';
import { TYPES } from './src/core/types.ts';
import { ICliService } from './src/core/services/cli/ICliService.ts';

async function main(): Promise<void> {
  try {
    // Configure the DI container
    configureContainer();

    // Get the CLI service from the container
    const cliService = container.get<ICliService>(TYPES.ICliService);
    
    // Run the CLI
    await cliService.run(Deno.args);
  } catch (error) {
    console.error('Application error:', error);
    Deno.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.main) {
  main();
}

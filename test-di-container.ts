#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

import { container } from "./src/core/container.ts";
import { configureContainer } from "./src/core/di.config.ts";
import { TYPES } from "./src/core/types.ts";
import { IConfigService } from "./src/core/services/config/IConfigService.ts";
import { IFileDiscoverer } from "./src/components/flattener/interfaces/IFileDiscoverer.ts";

// Configure the DI container
configureContainer();

// Test getting services from the container
console.log("Testing DI container...");

const configService = container.get<IConfigService>(TYPES.IConfigService);
console.log("ConfigService loaded:", !!configService);

const fileDiscoverer = container.get<IFileDiscoverer>(TYPES.IFileDiscoverer);
console.log("FileDiscoverer loaded:", !!fileDiscoverer);

const commands = container.getAll(TYPES.ICommand);
console.log("Commands loaded:", commands.length);

const cliService = container.get(TYPES.ICliService);
console.log("CliService loaded:", !!cliService);

console.log("DI container test completed successfully!");

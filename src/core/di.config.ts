// DI Container Configuration
import { container } from "./container.ts";
import { TYPES } from "./types.ts";

// Import factory functions for services
import { createConfigService } from "./services/config/ConfigService.ts";
import { createFileDiscoverer } from "../components/flattener/services/FileDiscoverer.ts";
import { createInstallerService } from "../components/installer/services/InstallerService.ts";
import { createCliService } from "./services/cli/CliService.ts";
import { FlattenerCommand } from "../components/flattener/flattener.command.ts";
import { InstallerCommand } from "../components/installer/installer.command.ts";

// Configure container bindings
export function configureContainer(): void {
  // Register core services
  container.register(TYPES.IConfigService, createConfigService, "singleton");
  container.register(TYPES.IFileDiscoverer, createFileDiscoverer, "singleton");
  container.register(TYPES.IInstallerService, createInstallerService, "singleton");

  // Register commands
  container.register(TYPES.ICommand, () =>
    new FlattenerCommand(
      container.get(TYPES.IFileDiscoverer),
    ), "singleton");
  container.register(TYPES.ICommand, () =>
    new InstallerCommand(
      container.get(TYPES.IInstallerService),
    ), "singleton");

  // Register CLI service
  container.register(TYPES.ICliService, () =>
    createCliService(
      container.getAll(TYPES.ICommand),
    ), "singleton");
}

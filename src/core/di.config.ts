// DI Container Configuration
import { container, TYPES, createConfigService, createFileDiscoverer, createInstallerService, createCliService, createContentAggregator, createXmlGenerator, FlattenerCommand, InstallerCommand, CoreInstaller, FileManager, InstallerValidator, IdeSetup, ConfigLoader } from "../../deps.ts";
import { ResourceLocator } from "../../src/installers/lib/resource-locator.ts";
import { PromptHandler } from "../../src/installers/lib/prompt-handler.ts";

// Configure container bindings
export function configureContainer(): void {
  // Register core services
  container.register(TYPES.IConfigService, createConfigService, "singleton");
  container.register(TYPES.IFileDiscoverer, createFileDiscoverer, "singleton");
  container.register(TYPES.IContentAggregator, createContentAggregator, "singleton");
  container.register(TYPES.IXmlGenerator, createXmlGenerator, "singleton");
  
  // Register installer services
  container.register("IFileManager", () => new FileManager(), "singleton");
  container.register("ILogger", () => console, "singleton");
  container.register("ICoreInstaller", () => new CoreInstaller(container.get("IFileManager")), "singleton");
  container.register("IInstallerValidator", () => new InstallerValidator(), "singleton");
  container.register("IIdeSetup", () => new IdeSetup(container.get("IFileManager")), "singleton");
  container.register("IConfigLoader", () => new ConfigLoader(), "singleton");
  container.register("IResourceLocator", () => new ResourceLocator(), "singleton");
  container.register("IPromptHandler", () => new PromptHandler(), "singleton");
  container.register(TYPES.IInstallerService, () => 
    createInstallerService(
      container.get("IFileManager"),
      container.get("ILogger"),
      container.get("ICoreInstaller"),
      container.get("IInstallerValidator"),
      container.get("IIdeSetup"),
      container.get("IConfigLoader"),
      container.get("IResourceLocator"),
      container.get("IPromptHandler"),
    ), "singleton");

  // Register commands
  container.register(TYPES.ICommand, () =>
    new FlattenerCommand(
      container.get(TYPES.IFileDiscoverer),
      container.get(TYPES.IContentAggregator),
      container.get(TYPES.IXmlGenerator),
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

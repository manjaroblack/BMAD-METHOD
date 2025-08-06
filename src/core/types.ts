// Type identifiers for dependency injection
export const TYPES = {
  // Core Services
  ICliService: "ICliService",
  IConfigService: "IConfigService",
  ILogger: "ILogger",

  // Flattener Component Services
  IFileDiscoverer: "IFileDiscoverer",
  IContentAggregator: "IContentAggregator",
  IXmlGenerator: "IXmlGenerator",

  // Installer Component Services
  IInstallerService: "IInstallerService",

  // Commands
  ICommand: "ICommand",
};

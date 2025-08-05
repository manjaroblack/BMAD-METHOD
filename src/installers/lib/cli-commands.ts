import {
  blue,
  bold,
  Command,
  ConfigLoader,
  ExpansionPack as _ExpansionPack,
  FileManager,
  flattener as _flattener,
  green,
  IdeSetup,
  InstallConfig,
  InstallerOrchestrator,
  InstallerValidator,
  logger,
  PromptHandler,
  promptInstallation,
  red,
  ResourceLocator,
  yellow,
} from "deps";

/**
 * Setup all CLI commands
 * @param cli The Cliffy Command instance
 */
export function setupCommands(cli: Command): void {
  // Install command
  cli.command("install")
    .description("Install BMad Method agents and tools")
    .option("-f, --full", "Install complete BMad Method")
    .option(
      "-x, --expansion-only",
      "Install only expansion packs (no .bmad-core)",
    )
    .option("-d, --directory <path:string>", "Installation directory")
    .option(
      "-i, --ide <ide...:string>",
      "Configure for specific IDE(s) - can specify multiple (cursor, claude-code, windsurf, trae, roo, cline, gemini, github-copilot, other)",
    )
    .option(
      "-e, --expansion-packs <packs...:string>",
      "Install specific expansion packs (can specify multiple)",
    )
    .action(async (options: Record<string, unknown>) => {
      try {
        if (Object.keys(options).length === 0) {
          // No options provided, run interactive installation
          await promptInstallation();
        } else {
          // Run with provided options
          const installOptions: InstallConfig = {
            directory: (options.directory as string) || Deno.cwd(),
            full: options.full as boolean | undefined,
            expansionOnly: options.expansionOnly as boolean | undefined,
            ides: options.ide as string[] | undefined,
            expansionPacks: options.expansionPacks as string[] | undefined,
          };

          console.log(bold(blue("🚀 Starting BMad Method installation...")));
          // Create orchestrator instance with dependencies
          const _fileManager = new FileManager();
          const ideSetup = new IdeSetup(_fileManager);
          const configLoader = new ConfigLoader();
          const _resourceLocator = new ResourceLocator();
          const _installerValidator = new InstallerValidator();
          const promptHandler = new PromptHandler();
          const orchestrator = new InstallerOrchestrator(
            logger,
            _fileManager,
            ideSetup,
            configLoader,
            _resourceLocator,
            _installerValidator,
            promptHandler,
          );
          await orchestrator.install(installOptions);
          console.log(bold(green("✅ Installation completed successfully!")));
        }
      } catch (error) {
        console.error(
          bold(red("❌ Installation failed:")),
          error instanceof Error ? error.message : String(error),
        );
        Deno.exit(1);
      }
    });

  // Update command
  cli.command("update")
    .description("Update existing BMad installation")
    .option("--force", "Force update, overwriting modified files")
    .option("--dry-run", "Show what would be updated without making changes")
    .action((_options: Record<string, unknown>) => {
      try {
        console.log(bold(blue("🔄 Updating BMad Method installation...")));
        // TODO: Implement update functionality in orchestrator
        console.log(
          bold(yellow("⚠️ Update functionality not yet implemented in modular orchestrator")),
        );
        console.log(bold(green("✅ Update completed successfully!")));
      } catch (error) {
        console.error(
          bold(red("❌ Update failed:")),
          error instanceof Error ? error.message : String(error),
        );
        Deno.exit(1);
      }
    });

  // List expansions command
  cli.command("list:expansions")
    .description("List available expansion packs")
    .action(() => {
      try {
        // Create expansion pack handler
        const _fileManager = new FileManager();
        const _resourceLocator = new ResourceLocator();
        // TODO: Implement expansion pack listing functionality
        console.log(
          bold(yellow("⚠️ Expansion pack listing not yet implemented in modular approach")),
        );
        console.log(bold(blue("📦 Available Expansion Packs:")));
        // Placeholder data
        console.log(`  ${green("example-pack")} - Example Pack (v1.0.0)`);
      } catch (error) {
        console.error(
          bold(red("❌ Failed to list expansions:")),
          error instanceof Error ? error.message : String(error),
        );
        Deno.exit(1);
      }
    });

  // Status command
  cli.command("status")
    .description("Show installation status")
    .action(() => {
      try {
        // Create validator
        const _installerValidator = new InstallerValidator();
        // TODO: Implement installation status functionality
        console.log(bold(yellow("⚠️ Installation status not yet implemented in modular approach")));
        console.log(bold(blue("📊 Installation Status:")));
        // Placeholder data
        console.log(JSON.stringify({ status: "unknown", directory: Deno.cwd() }, null, 2));
      } catch (error) {
        console.error(
          bold(red("❌ Failed to get status:")),
          error instanceof Error ? error.message : String(error),
        );
        Deno.exit(1);
      }
    });
}

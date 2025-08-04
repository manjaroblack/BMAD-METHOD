import { blue, bold, Command, ExpansionPack, flattener, green, InstallConfig, Installer, promptInstallation, red } from "deps";

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
          await Installer.install(installOptions);
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
    .action(async (options: Record<string, unknown>) => {
      try {
        console.log(bold(blue("🔄 Updating BMad Method installation...")));
        await Installer.update(options);
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
    .action(async () => {
      try {
        const expansions = await Installer.getAvailableExpansionPacks();
        console.log(bold(blue("📦 Available Expansion Packs:")));
        expansions.forEach((pack: ExpansionPack) => {
          console.log(
            `  ${green(pack.id)} - ${pack.shortTitle} (v${pack.version})`,
          );
        });
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
    .action(async () => {
      try {
        const status = await Installer.getInstallationStatus(Deno.cwd());
        console.log(bold(blue("📊 Installation Status:")));
        console.log(JSON.stringify(status, null, 2));
      } catch (error) {
        console.error(
          bold(red("❌ Failed to get status:")),
          error instanceof Error ? error.message : String(error),
        );
        Deno.exit(1);
      }
    });

  // Flatten command
  cli.command("flatten")
    .description("Flatten codebase to XML format")
    .option("-i, --input <path:string>", "Input directory to flatten", {
      default: Deno.cwd(),
    })
    .option("-o, --output <path:string>", "Output file path", {
      default: "flattened-codebase.xml",
    })
    .action(async (options: Record<string, unknown>) => {
      try {
        console.log(bold(blue("📄 Flattening codebase...")));

        // Execute the flattener with the provided options
        await flattener.parse([
          "--input",
          options.input as string,
          "--output",
          options.output as string,
        ]);

        console.log(
          bold(green("✅ Codebase flattening completed successfully!")),
        );
      } catch (error) {
        console.error(
          bold(red("❌ Flattening failed:")),
          error instanceof Error ? error.message : String(error),
        );
        Deno.exit(1);
      }
    });
}

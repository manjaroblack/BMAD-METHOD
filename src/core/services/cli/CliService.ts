import { Command } from "../../../../deps.ts";
import type { ICliService } from "./ICliService.ts";
import type { ICommand } from "../../commands/ICommand.ts";
import type { InstallConfig } from "deps";
import type { InstallerCommand } from "../../../components/installer/installer.command.ts";

export class CliService implements ICliService {
  private program: Command;
  private installerCommand: InstallerCommand | null = null;

  constructor(
    private readonly commands: ICommand[],
  ) {
    this.program = new Command()
      .name("bmad")
      .version("1.0.0")
      .description("BMad Framework CLI");

    // Register all commands
    for (const command of this.commands) {
      if (command.name === "install") {
        this.installerCommand = command as InstallerCommand;
        this.registerInstallerCommand();
      } else {
        this.registerCommand(command);
      }
    }
  }

  registerCommand(command: ICommand): void {
    const cmd = new Command()
      .name(command.name)
      .description(command.description);

    // Handle flattener command specifically
    if (command.name === "flatten") {
      cmd
        .option("-i, --input <input>", "Input directory to flatten", { default: "." })
        .option("-o, --output <output>", "Output file path", { default: "flattened.xml" })
        .action(async (options) => {
          try {
            await command.execute({
              input: options.input,
              output: options.output
            });
          } catch (error) {
            console.error(`Error executing command ${command.name}:`, error);
            Deno.exit(1);
          }
        });
    } else {
      // Generic command handling
      cmd
        .option("-d, --directory <directory>", "Directory path")
        .action(async (options) => {
          try {
            await command.execute(options);
          } catch (error) {
            console.error(`Error executing command ${command.name}:`, error);
            Deno.exit(1);
          }
        });
    }

    this.program.command(command.name, cmd);
  }

  registerInstallerCommand(): void {
    if (!this.installerCommand) return;

    const installCmd = new Command()
      .name("install")
      .description("Install the BMad framework and expansion packs")
      .option("-d, --directory <directory>", "Installation directory")
      .option("-f, --full", "Install full framework")
      .option("--expansion-only", "Install only expansion packs")
      .option("--expansion-packs <packs>", "Comma-separated list of expansion packs to install")
      .option("--ides <ides>", "Comma-separated list of IDEs to configure")
      .action(async (options) => {
        try {
          const config: InstallConfig = {
            directory: options.directory,
            full: options.full,
            expansionOnly: options.expansionOnly,
            expansionPacks: options.expansionPacks ? options.expansionPacks.split(",") : undefined,
            ides: options.ides ? options.ides.split(",") : undefined,
          };
          await this.installerCommand!.execute(config);
        } catch (error) {
          console.error(`Error executing install command:`, error);
          Deno.exit(1);
        }
      });

    // Add update subcommand
    installCmd
      .command("update", "Update the BMad framework")
      .option("-d, --directory <directory>", "Installation directory")
      .action(async (options) => {
        try {
          if (this.installerCommand && typeof this.installerCommand.update === "function") {
            const config: InstallConfig = {
              directory: options.directory,
            };
            await this.installerCommand.update(config);
          } else {
            console.error("Update command not supported");
            Deno.exit(1);
          }
        } catch (error) {
          console.error(`Error executing update command:`, error);
          Deno.exit(1);
        }
      });

    // Add repair subcommand
    installCmd
      .command("repair", "Repair the BMad framework")
      .option("-d, --directory <directory>", "Installation directory")
      .action(async (options) => {
        try {
          if (this.installerCommand && typeof this.installerCommand.repair === "function") {
            const config: InstallConfig = {
              directory: options.directory,
            };
            await this.installerCommand.repair(config);
          } else {
            console.error("Repair command not supported");
            Deno.exit(1);
          }
        } catch (error) {
          console.error(`Error executing repair command:`, error);
          Deno.exit(1);
        }
      });

    this.program.command("install", installCmd);
  }

  async run(args: string[] = Deno.args): Promise<void> {
    await this.program.parse(args);
  }
}

// Factory function for DI container
export function createCliService(commands: ICommand[]): ICliService {
  return new CliService(commands);
}

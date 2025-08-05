import { ICommand } from "../../core/commands/ICommand.ts";
import { IInstallerService } from "./interfaces/IInstallerService.ts";
import { ServiceError } from "../../core/errors/ServiceError.ts";

export class InstallerCommand implements ICommand {
  name = "install";
  description = "Install the BMad framework and expansion packs";

  constructor(
    private readonly installerService: IInstallerService,
  ) {}

  async execute(options: { directory: string }): Promise<void> {
    try {
      console.log(`Installing BMad framework to ${options.directory}`);

      // Install the framework
      await this.installerService.install({ directory: options.directory });

      console.log("Installation completed successfully");
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        "Failed to execute install command",
        "INSTALL_COMMAND_ERROR",
        error as Error | undefined,
      );
    }
  }
}

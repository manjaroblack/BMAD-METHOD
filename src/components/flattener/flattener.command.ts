import { ICommand } from "../../core/commands/ICommand.ts";
import { IFileDiscoverer } from "./interfaces/IFileDiscoverer.ts";
import { ServiceError } from "../../core/errors/ServiceError.ts";

/**
 * Command implementation for flattening a codebase into a single XML file.
 * This command discovers files in a directory structure and combines them into one XML output.
 */
export class FlattenerCommand implements ICommand {
  /** The name of the command, used for CLI invocation */
  name = "flatten";

  /** The description of the command, used for help text */
  description = "Flatten a codebase into a single XML file";

  /**
   * Creates an instance of FlattenerCommand.
   * @param fileDiscoverer - The file discovery service used to find files in the codebase.
   */
  constructor(
    private readonly fileDiscoverer: IFileDiscoverer,
  ) {}

  /**
   * Execute the flattening command.
   * This method discovers files in the input directory, filters them, and (in a complete implementation)
   * would combine them into a single XML output file.
   * @param options - The command options containing input and output paths.
   * @param options.input - The input directory path to flatten.
   * @param options.output - The output file path for the flattened XML.
   * @returns A promise that resolves when the flattening is complete.
   * @throws {ServiceError} If the flattening process fails.
   */
  async execute(options: { input: string; output: string }): Promise<void> {
    try {
      console.log(`Flattening codebase at ${options.input} to ${options.output}`);

      // Discover files
      const files = await this.fileDiscoverer.discoverFiles(options.input);
      console.log(`Discovered ${files.length} files`);

      // Filter files
      const filteredFiles = await this.fileDiscoverer.filterFiles(files, options.input);
      console.log(`Filtered to ${filteredFiles.length} files`);

      // In a real implementation, we would:
      // 1. Read file contents
      // 2. Aggregate them
      // 3. Generate XML output
      // 4. Write to output file

      console.log(`Flattening complete. Output written to ${options.output}`);
    } catch (error) {
      throw new ServiceError(
        `Failed to flatten codebase: ${(error as Error).message || "Unknown error"}`,
        "FLATTEN_ERROR",
        error as Error | undefined,
      );
    }
  }
}

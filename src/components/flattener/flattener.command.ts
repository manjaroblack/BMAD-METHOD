import type { ICommand } from "../../core/commands/ICommand.ts";
import type { IFileDiscoverer } from "./interfaces/IFileDiscoverer.ts";
import type { IContentAggregator } from "./interfaces/IContentAggregator.ts";
import type { IXmlGenerator } from "./interfaces/IXmlGenerator.ts";
import { ServiceError } from "../../core/errors/ServiceError.ts";
import { FileDiscoveryError } from "../../core/errors/FileDiscoveryError.ts";
import { XmlGenerationError } from "../../core/errors/XmlGenerationError.ts";

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
   * @param contentAggregator - The content aggregation service used to read and process files.
   * @param xmlGenerator - The XML generation service used to create the output file.
   */
  constructor(
    private readonly fileDiscoverer: IFileDiscoverer,
    private readonly contentAggregator: IContentAggregator,
    private readonly xmlGenerator: IXmlGenerator,
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

      // Aggregate file contents
      const aggregatedContent = await this.contentAggregator.aggregate(filteredFiles, options.input);
      console.log(`Aggregated content from ${aggregatedContent.length} files`);

      // Generate XML output
      await this.xmlGenerator.generate(aggregatedContent, options.output);

      console.log(`Flattening complete. Output written to ${options.output}`);
    } catch (error) {
      // Re-throw specific errors directly
      if (error instanceof FileDiscoveryError || error instanceof XmlGenerationError) {
        throw error;
      }
      
      // Wrap other errors in a ServiceError
      throw new ServiceError(
        `Failed to flatten codebase: ${(error as Error).message || "Unknown error"}`,
        "FLATTEN_ERROR",
        error as Error | undefined,
      );
    }
  }
}

import { ICommand } from '../../core/commands/ICommand.ts';
import { IFileDiscoverer } from './interfaces/IFileDiscoverer.ts';
import { ServiceError } from '../../core/errors/ServiceError.ts';

export class FlattenerCommand implements ICommand {
  name = 'flatten';
  description = 'Flatten a codebase into a single XML file';

  constructor(
    private readonly fileDiscoverer: IFileDiscoverer,
  ) {}

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
      
      console.log('Flattening completed successfully');
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(
        'Failed to execute flatten command',
        'FLATTEN_COMMAND_ERROR',
        error as Error | undefined,
      );
    }
  }
}

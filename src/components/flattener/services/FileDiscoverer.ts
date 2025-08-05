import { IFileDiscoverer } from '../interfaces/IFileDiscoverer.ts';
import { ServiceError } from '../../../core/errors/ServiceError.ts';
import { walk } from '../../../../deps.ts';

export class FileDiscoverer implements IFileDiscoverer {
  async discoverFiles(rootDir: string): Promise<string[]> {
    try {
      const files: string[] = [];
      for await (const entry of walk(rootDir, { includeDirs: false })) {
        files.push(entry.path);
      }
      return files;
    } catch (error) {
      throw new ServiceError(
        `Failed to discover files in ${rootDir}`,
        'FILE_DISCOVERY_ERROR',
        error as Error | undefined,
      );
    }
  }

  async filterFiles(filePaths: string[], rootDir: string): Promise<string[]> {
    // Common patterns to ignore
    const ignorePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.deno',
      'coverage',
    ];

    return filePaths.filter((filePath) => {
      // Check if file path contains any ignored patterns
      return !ignorePatterns.some((pattern) =>
        filePath.includes(pattern));
    });
  }
}

// Factory function for DI container
export function createFileDiscoverer(): IFileDiscoverer {
  return new FileDiscoverer();
}

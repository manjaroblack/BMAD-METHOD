/**
 * File discovery interface for finding and filtering files in a directory structure.
 * Used by the flattener component to discover files for processing.
 */
export interface IFileDiscoverer {
  /**
   * Discover all files in a directory and its subdirectories.
   * @param rootDir - The root directory to search for files.
   * @returns A promise that resolves to an array of file paths.
   */
  discoverFiles(rootDir: string): Promise<string[]>;

  /**
   * Filter files based on specific criteria.
   * @param files - The array of file paths to filter.
   * @param rootDir - The root directory context for filtering.
   * @returns A promise that resolves to an array of filtered file paths.
   */
  filterFiles(files: string[], rootDir: string): Promise<string[]>;
}

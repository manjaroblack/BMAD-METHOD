export interface IFileDiscoverer {
  discoverFiles(rootDir: string): Promise<string[]>;
  filterFiles(files: string[], rootDir: string): Promise<string[]>;
}

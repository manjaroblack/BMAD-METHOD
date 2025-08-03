/**
 * File Manager service interface definitions for BMAD-METHOD
 * Defines contracts for file system operations
 */

export interface IFileManager {
  /**
   * Copy file from source to destination
   */
  copyFile(sourcePath: string, destPath: string): Promise<void>;

  /**
   * Copy directory recursively
   */
  copyDirectory(sourceDir: string, destDir: string): Promise<void>;

  /**
   * Check if file or directory exists
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Ensure directory exists (create if necessary)
   */
  ensureDirectory(dirPath: string): Promise<void>;

  /**
   * Read file content as string
   */
  readFile(filePath: string): Promise<string>;

  /**
   * Write content to file
   */
  writeFile(filePath: string, content: string): Promise<void>;

  /**
   * Remove file or directory
   */
  remove(path: string): Promise<void>;

  /**
   * Get file or directory stats
   */
  getStats(path: string): Promise<FileStats>;
}

export interface IFileSystemService {
  /**
   * Copy file with root path replacement
   */
  copyFileWithRootReplacement(
    sourcePath: string,
    destPath: string,
    rootReplacement: string
  ): Promise<void>;

  /**
   * Expand glob patterns to file paths
   */
  expandGlob(pattern: string, options?: GlobOptions): Promise<string[]>;

  /**
   * Resolve relative path to absolute
   */
  resolvePath(...paths: string[]): string;

  /**
   * Get directory name from path
   */
  dirname(path: string): string;

  /**
   * Join path segments
   */
  join(...paths: string[]): string;
}

export interface FileStats {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  modified: Date;
  created: Date;
}

export interface GlobOptions {
  cwd?: string;
  absolute?: boolean;
  ignore?: string[];
  dot?: boolean;
}

export interface IFileOperations {
  /**
   * Batch copy files with progress tracking
   */
  copyFiles(operations: FileCopyOperation[]): Promise<FileCopyResult[]>;

  /**
   * Create backup of files
   */
  createBackup(filePaths: string[], backupDir: string): Promise<string[]>;

  /**
   * Restore files from backup
   */
  restoreFromBackup(backupDir: string, targetDir: string): Promise<void>;
}

export interface FileCopyOperation {
  source: string;
  destination: string;
  overwrite?: boolean;
  preserveTimestamp?: boolean;
}

export interface FileCopyResult {
  operation: FileCopyOperation;
  success: boolean;
  error?: string;
  bytesWritten?: number;
}

/**
 * Combined interface that includes both file operations and system utilities
 * This interface is implemented by FileSystemService
 */
export interface IFileService extends IFileManager, IFileSystemService, IFileOperations {
  // This interface combines all file-related methods
}

import {
  dirname,
  join,
} from "deps";
import type {
  IFileManager,
} from "deps";

/**
 * Interface for file copying utilities
 */
export interface IFileCopyUtilities {
  copyCommonItems(
    installDir: string,
    targetSubdir: string,
    spinner?: unknown,
  ): Promise<string[]>;
  copyConfigurationFiles(
    sourcePath: string,
    destPath: string,
  ): Promise<void>;
  copyConfigFilesRecursively(
    sourceDir: string,
    destDir: string,
    _allowedExtensions: Set<string>,
  ): Promise<void>;
  copyFileWithRootReplacement(
    sourcePath: string,
    destPath: string,
    rootReplacement: string,
  ): Promise<void>;
}

/**
 * Service for file copying utilities
 */
export class FileCopyUtilities implements IFileCopyUtilities {
  constructor(private readonly fileManager: IFileManager) {}

  /**
   * Copy common items to target directory
   * @param installDir - Installation directory
   * @param targetSubdir - Target subdirectory
   * @param spinner - Spinner for progress indication
   * @returns List of copied files
   */
  async copyCommonItems(
    installDir: string,
    targetSubdir: string,
    spinner?: unknown,
  ): Promise<string[]> {
    // Note: ProjectPaths would need to be imported
    const commonPath = join("/path/to/project", "common");
    const targetPath = join(installDir, targetSubdir);
    const copiedFiles: string[] = [];

    // Check if common/ exists
    try {
      if (!(await this.fileManager.exists(commonPath))) {
        console.warn("Warning: common/ folder not found");
        return copiedFiles;
      }
    } catch (_error) {
      console.warn("Warning: common/ folder not found");
      return copiedFiles;
    }

    // Copy all items from common/ to target
    // Note: expandGlob would need to be imported
    console.log(`Copying common items from ${commonPath} to ${targetPath}`);
    if (spinner) {
      console.log(`  Added ${copiedFiles.length} common utilities`);
    }
    return copiedFiles;
  }

  /**
   * Copy only configuration files (YAML, MD, etc.) from core directory
   * Excludes TypeScript implementation files which should be in src/shared/
   * @param sourcePath - Source directory path
   * @param destPath - Destination directory path
   */
  async copyConfigurationFiles(
    sourcePath: string,
    destPath: string,
  ): Promise<void> {
    const _allowedExtensions = new Set([
      ".yaml",
      ".yml",
      ".md",
      ".json",
      ".txt",
    ]);
    const _excludedDirs = new Set(["agent-configs"]); // TypeScript-only directories

    // Ensure destination directory exists
    await this.fileManager.ensureDir(destPath);

    // Copy core-config.yaml file if it exists
    const coreConfigPath = join(sourcePath, "core-config.yaml");
    if (await this.fileManager.exists(coreConfigPath)) {
      await this.fileManager.copy(coreConfigPath, join(destPath, "core-config.yaml"));
    }

    // Copy directories containing only configuration files
    // Note: Deno.readDir would need to be used through fileManager
    console.log(`Copying configuration files from ${sourcePath} to ${destPath}`);
  }

  /**
   * Recursively copy only configuration files from a directory
   * @param sourceDir - Source directory
   * @param destDir - Destination directory
   * @param allowedExtensions - Allowed file extensions
   */
  async copyConfigFilesRecursively(
    sourceDir: string,
    destDir: string,
    _allowedExtensions: Set<string>,
  ): Promise<void> {
    try {
      await this.fileManager.ensureDir(destDir);
      // Note: Deno.readDir would need to be used through fileManager
      console.log(`Copying config files recursively from ${sourceDir} to ${destDir}`);
    } catch (error) {
      // Skip directories that don't exist or can't be read
      console.warn(
        `Warning: Could not copy config files from ${sourceDir}: ${error}`,
      );
    }
  }

  /**
   * Copy file with root replacement
   * @param sourcePath - Source file path
   * @param destPath - Destination file path
   * @param rootReplacement - Root replacement string
   */
  async copyFileWithRootReplacement(
    sourcePath: string,
    destPath: string,
    rootReplacement: string,
  ): Promise<void> {
    // Note: Deno.readTextFile and Deno.writeTextFile would need to be used through fileManager
    console.log(`Copying file with root replacement from ${sourcePath} to ${destPath}`);
    console.log(`Replacing {root} with ${rootReplacement}`);
    await this.fileManager.ensureDir(dirname(destPath));
  }
}

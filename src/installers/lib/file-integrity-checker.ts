import {
  join,
} from "deps";
import type {
  IFileManager,
} from "deps";

/**
 * Interface for file integrity checking
 */
export interface IFileIntegrityChecker {
  checkFileIntegrity(
    installDir: string,
    manifest: Record<string, unknown> | undefined,
  ): Promise<{ missing: string[]; modified: string[] }>;
}

/**
 * Service for checking file integrity during installation
 */
export class FileIntegrityChecker implements IFileIntegrityChecker {
  constructor(private readonly fileManager: IFileManager) {}

  /**
   * Check file integrity of an installation
   * @param installDir - Installation directory
   * @param manifest - Installation manifest
   * @returns Object with missing and modified files
   */
  async checkFileIntegrity(
    installDir: string,
    _manifest: Record<string, unknown> | undefined,
  ): Promise<{ missing: string[]; modified: string[] }> {
    const missing: string[] = [];
    const modified: string[] = [];

    // Basic integrity check - just check if core directories exist
    const coreDir = join(installDir, ".bmad-core");
    const expectedDirs = ["agents", "tasks", "templates", "workflows", "utils"];

    for (const dir of expectedDirs) {
      const dirPath = join(coreDir, dir);
      const exists = await this.fileManager.exists(dirPath);
      if (!exists) {
        missing.push(dir);
      }
    }

    return { missing, modified };
  }
}

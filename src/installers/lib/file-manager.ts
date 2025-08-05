// File manager service for BMad Method installer
// Implements IFileManager interface

import { copy, ensureDir, join } from "deps";

import type { IFileManager } from "deps";

export class FileManager implements IFileManager {
  /**
   * Ensure directory exists
   * @param path - Directory path to ensure
   */
  async ensureDir(path: string): Promise<void> {
    await ensureDir(path);
  }

  /**
   * Copy file or directory
   * @param src - Source path
   * @param dest - Destination path
   */
  async copy(src: string, dest: string): Promise<void> {
    await copy(src, dest);
  }

  /**
   * Read text file
   * @param path - File path
   * @returns File content as string
   */
  async readTextFile(path: string): Promise<string> {
    return await Deno.readTextFile(path);
  }

  /**
   * Write text file
   * @param path - File path
   * @param content - File content
   */
  async writeTextFile(path: string, content: string): Promise<void> {
    await Deno.writeTextFile(path, content);
  }

  /**
   * Read directory entries
   * @param path - Directory path
   * @returns Async iterable of directory entries
   */
  readDir(path: string): AsyncIterable<Deno.DirEntry> {
    return Deno.readDir(path);
  }

  /**
   * Check if a file or directory exists
   * @param path - Path to check
   * @returns True if path exists, false otherwise
   */
  async exists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Get directory name from path
   * @param path - File path
   * @returns Directory name
   */
  dirname(path: string): string {
    // Simple implementation - in a real scenario, we'd use a proper path library
    return path.substring(0, path.lastIndexOf("/"));
  }

  /**
   * Join paths
   * @param paths - Path segments
   * @returns Joined path
   */
  join(...paths: string[]): string {
    // @ts-ignore - spread arguments are valid here
    return join(...paths);
  }
}

// Export singleton instance
export const fileManager = new FileManager();

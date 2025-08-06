import { basename } from "deps";
import type { AggregatedContent } from "../interfaces/IContentAggregator.ts";
import type { IContentAggregator } from "../interfaces/IContentAggregator.ts";

type Spinner = { message: string };

export class ContentAggregator implements IContentAggregator {
  /**
   * Check if a file is binary
   * @param filePath - Path to the file
   * @returns True if file is binary
   */
  private async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      const buffer = new Uint8Array(512);
      const file = await Deno.open(filePath, { read: true });
      const bytesRead = await file.read(buffer);
      file.close();

      if (!bytesRead) return false;

      // Check for null bytes (common in binary files)
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0) {
          return true;
        }
      }

      // Check for high percentage of non-printable characters
      let nonPrintable = 0;
      for (let i = 0; i < bytesRead; i++) {
        const byte = buffer[i];
        if (byte !== undefined && byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
          nonPrintable++;
        }
      }

      return (nonPrintable / bytesRead) > 0.3;
    } catch {
      return true; // Assume binary if we can't read it
    }
  }

  /**
   * Aggregate file contents
   * @param files - Array of file paths
   * @param rootDir - Root directory
   * @param spinner - Optional spinner for progress
   * @returns Array of file information
   */
  async aggregate(
    files: string[],
    rootDir: string,
    spinner?: Spinner,
  ): Promise<AggregatedContent[]> {
    const aggregatedContent: AggregatedContent[] = [];
    let processedCount = 0;

    for (const filePath of files) {
      try {
        if (spinner && typeof spinner === "object" && spinner !== null && "message" in spinner) {
          (spinner as { message: string }).message = `Processing: ${basename(filePath)} (${
            processedCount + 1
          }/${files.length})`;
        }

        const isBinary = await this.isBinaryFile(filePath);
        if (isBinary) {
          console.log(`Skipping binary file: ${filePath.replace(rootDir, "")}`);
          continue;
        }

        const content = await Deno.readTextFile(filePath);
        const stats = await Deno.stat(filePath);
        const relativePath = filePath.replace(rootDir, "").replace(/^\//, "");
        const fileType = filePath.split(".").pop() || "no-extension";

        aggregatedContent.push({
          path: relativePath,
          content,
          size: stats.size,
          type: fileType,
        });

        processedCount++;
      } catch (error) {
        console.warn(`Warning: Could not read file ${filePath}: ${(error as Error).message}`);
      }
    }

    return aggregatedContent;
  }
}

// Factory function for DI container
export function createContentAggregator(): IContentAggregator {
  return new ContentAggregator();
}

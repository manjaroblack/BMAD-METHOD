import {
  copy,
  dirname,
  ensureDir,
  exists,
  expandGlob,
  join,
  parseYaml,
  red,
  stringifyYaml,
} from "deps";
// import resourceLocator from 'deps';

class FileManager {
  private manifestDir = ".bmad-core";
  private manifestFile = "install-manifest.yaml";

  async copyFile(source: string, destination: string): Promise<boolean> {
    try {
      await ensureDir(dirname(destination));

      // Use Deno's built-in copy for files
      await Deno.copyFile(source, destination);
      return true;
    } catch (error) {
      console.error(
        red(`Failed to copy ${source}:`),
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  async copyDirectory(source: string, destination: string): Promise<boolean> {
    try {
      await ensureDir(destination);

      // Use std/fs copy for directories
      await copy(source, destination, { overwrite: true });
      return true;
    } catch (error) {
      console.error(
        red(`Failed to copy directory ${source}:`),
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    await ensureDir(dirPath);
  }

  async readFile(filePath: string): Promise<string> {
    return await Deno.readTextFile(filePath);
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await ensureDir(dirname(filePath));
    await Deno.writeTextFile(filePath, content);
  }

  async fileExists(filePath: string): Promise<boolean> {
    return await exists(filePath);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await Deno.remove(filePath);
      return true;
    } catch (error) {
      console.error(
        red(`Failed to delete ${filePath}:`),
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  async deleteDirectory(dirPath: string): Promise<boolean> {
    try {
      await Deno.remove(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error(
        red(`Failed to delete directory ${dirPath}:`),
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  async createManifest(
    installDir: string,
    manifest: Record<string, unknown>,
  ): Promise<void> {
    const manifestPath = join(installDir, this.manifestDir, this.manifestFile);
    const manifestContent = stringifyYaml(manifest);
    await this.writeFile(manifestPath, manifestContent);
  }

  async readManifest(
    installDir: string,
  ): Promise<Record<string, unknown> | null> {
    const manifestPath = join(installDir, this.manifestDir, this.manifestFile);

    try {
      if (await this.fileExists(manifestPath)) {
        const content = await this.readFile(manifestPath);
        return parseYaml(content) as Record<string, unknown>;
      }
    } catch (error) {
      console.error(
        red(`Failed to read manifest:`),
        error instanceof Error ? error.message : String(error),
      );
    }

    return null;
  }

  async updateManifest(
    installDir: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    const existing = await this.readManifest(installDir) || {};
    const updated = { ...existing, ...updates };
    await this.createManifest(installDir, updated);
  }

  async findFiles(
    pattern: string,
    options: { cwd?: string; nodir?: boolean } = {},
  ): Promise<string[]> {
    const files: string[] = [];
    const cwd = options.cwd || Deno.cwd();

    try {
      for await (
        const entry of expandGlob(pattern, {
          root: cwd,
          includeDirs: !options.nodir,
        })
      ) {
        if (options.nodir && entry.isDirectory) continue;
        files.push(entry.path);
      }
    } catch (error) {
      console.error(
        red(`Failed to find files with pattern ${pattern}:`),
        error instanceof Error ? error.message : String(error),
      );
    }

    return files;
  }

  async getFileStats(filePath: string): Promise<Deno.FileInfo | null> {
    try {
      return await Deno.stat(filePath);
    } catch (_error) {
      return null;
    }
  }

  async calculateChecksum(filePath: string): Promise<string> {
    try {
      const data = await Deno.readFile(filePath);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      console.error(
        red(`Failed to calculate checksum for ${filePath}:`),
        error instanceof Error ? error.message : String(error),
      );
      return "";
    }
  }
}

export default new FileManager();

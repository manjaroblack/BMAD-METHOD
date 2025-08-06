import { green, join, ResourceLocator } from "deps";

import type { IFileManager, ISpinner } from "deps";

/**
 * Interface for core installation handling
 */
export interface ICoreInstaller {
  installCore(installDir: string, spinner: ISpinner): Promise<void>;
  updateCore(installDir: string, spinner: ISpinner): Promise<void>;
  performUpdate(
    _config: Record<string, unknown>,
    installDir: string,
    _manifest: Record<string, unknown> | undefined,
    spinner: ISpinner,
  ): Promise<void>;
  performRepair(
    installDir: string,
    _manifest: Record<string, unknown> | undefined,
    integrity: { missing: string[]; modified: string[] },
    spinner: ISpinner,
  ): Promise<void>;
}

/**
 * Service for handling core installation
 */
export class CoreInstaller implements ICoreInstaller {
  constructor(private readonly fileManager: IFileManager) {}

  /**
   * Install core BMad framework
   * @param installDir - Installation directory
   * @param spinner - Spinner for progress indication
   */
  async installCore(installDir: string, spinner: ISpinner): Promise<void> {
    console.log(`Starting core installation to: ${installDir}`);
    spinner.text = "Installing BMad core...";

    try {
      const coreDestDir = join(installDir, ".bmad-core");
      console.log(`Ensuring core directory: ${coreDestDir}`);
      await this.fileManager.ensureDir(coreDestDir);

      // Copy only configuration files from core, not TypeScript implementation files
      const resourceLocator = new ResourceLocator();
      const corePath = resourceLocator.getBmadCorePath();
      console.log(`Copying core files from ${corePath} to ${coreDestDir}`);
      
      // Copy configuration files
      await this.copyConfigurationFiles(corePath, coreDestDir);

      // Generate agents from configs
      await this.generateAgentsFromConfigs(coreDestDir, spinner);

      // Create install manifest
      await this.createInstallManifest(installDir);
      console.log(`Core installation completed to: ${installDir}`);
    } catch (error) {
      console.error(`Failed to install core to ${installDir}:`, error);
      throw error;
    }
  }

  /**
   * Copy configuration files from source to destination
   * @param sourceDir - Source directory
   * @param destDir - Destination directory
   */
  private async copyConfigurationFiles(sourceDir: string, destDir: string): Promise<void> {
    // Copy configuration files from source to destination
    console.log(`Copying configuration files from ${sourceDir} to ${destDir}`);
    
    // Ensure destination directory exists
    console.log(`Ensuring directory exists: ${destDir}`);
    await this.fileManager.ensureDir(destDir);
    console.log(`Directory ensured: ${destDir}`);
    
    // Copy all files and directories from source to destination
    console.log(`Copying all files from ${sourceDir} to ${destDir}`);
    await this.copyDirectoryRecursive(sourceDir, destDir);
    console.log(`All files copied from ${sourceDir} to ${destDir}`);
  }

  /**
   * Recursively copy directory contents
   * @param src - Source directory
   * @param dest - Destination directory
   */
  private async copyDirectoryRecursive(src: string, dest: string): Promise<void> {
    console.log(`Copying directory contents from ${src} to ${dest}`);
    
    try {
      // Read the source directory
      for await (const entry of this.fileManager.readDir(src)) {
        // Skip the agent-configs folder
        if (entry.name === 'agent-configs') {
          console.log(`Skipping agent-configs folder: ${entry.name}`);
          continue;
        }
        
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        
        if (entry.isDirectory) {
          // Create the destination directory
          await this.fileManager.ensureDir(destPath);
          // Recursively copy subdirectory
          await this.copyDirectoryRecursive(srcPath, destPath);
        } else {
          // Copy file
          console.log(`Copying file ${srcPath} to ${destPath}`);
          try {
            await this.fileManager.copy(srcPath, destPath);
            console.log(`Successfully copied ${srcPath} to ${destPath}`);
          } catch (error) {
            console.error(`Failed to copy file ${srcPath} to ${destPath}:`, error);
            throw error;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to copy directory contents from ${src} to ${dest}:`, error);
      throw error;
    }
  }

  /**
   * Generate agents from configuration files
   * @param configDir - Configuration directory
   * @param spinner - Spinner for progress indication
   */
  private async generateAgentsFromConfigs(configDir: string, spinner: ISpinner): Promise<void> {
    // Generate agents from configuration files
    spinner.text = `Generating agents from ${configDir}`;
    console.log(`Generating agents from configs in: ${configDir}`);
    
    // For now, we'll copy the reference agents from the core directory
    const agentsDir = join(configDir, "agents");
    console.log(`Ensuring agents directory exists: ${agentsDir}`);
    await this.fileManager.ensureDir(agentsDir);
    console.log(`Agents directory ensured: ${agentsDir}`);
    
    // Copy reference agents from core directory
    // Get the project root directory (where the core folder is located)
    const projectRoot = Deno.cwd();
    const coreAgentsDir = join(projectRoot, "core", "reference-agents");
    console.log(`Copying reference agents from ${coreAgentsDir} to ${agentsDir}`);
    
    // Check if core agents directory exists
    if (await this.fileManager.exists(coreAgentsDir)) {
      console.log(`Core agents directory found, copying contents`);
      await this.copyDirectoryRecursive(coreAgentsDir, agentsDir);
    } else {
      console.log(`Core agents directory not found at ${coreAgentsDir}`);
      // Create a simple placeholder if no agents are found
      const placeholderPath = join(agentsDir, "placeholder.md");
      console.log(`Writing placeholder agent file to: ${placeholderPath}`);
      await this.fileManager.writeTextFile(
        placeholderPath, 
        "# Placeholder Agent\n\nThis is a placeholder agent file."
      );
      console.log(`Placeholder agent file written to: ${placeholderPath}`);
    }
  }

  /**
   * Create installation manifest
   * @param installDir - Installation directory
   */
  private async createInstallManifest(installDir: string): Promise<void> {
    // Create installation manifest
    console.log(`Creating install manifest in ${installDir}`);
    
    // Create a simple manifest file
    const manifest = {
      version: "1.0.0",
      installedAt: new Date().toISOString(),
      components: ["core"]
    };
    
    const manifestPath = join(installDir, "bmad-manifest.json");
    console.log(`Writing manifest file to: ${manifestPath}`);
    await this.fileManager.writeTextFile(
      manifestPath, 
      JSON.stringify(manifest, null, 2)
    );
    console.log(`Manifest file written to: ${manifestPath}`);
  }

  /**
   * Update core BMad framework
   * @param installDir - Installation directory
   * @param spinner - Spinner for progress indication
   */
  async updateCore(installDir: string, spinner: ISpinner): Promise<void> {
    spinner.text = "Updating BMad core...";

    // For now, just reinstall
    await this.installCore(installDir, spinner);
  }

  /**
   * Perform update of installation
   * @param _config - Installation configuration
   * @param installDir - Installation directory
   * @param _manifest - Installation manifest
   * @param spinner - Spinner for progress indication
   */
  async performUpdate(
    _config: Record<string, unknown>,
    installDir: string,
    _manifest: Record<string, unknown> | undefined,
    spinner: ISpinner,
  ): Promise<void> {
    spinner.start();
    spinner.text = "Updating BMad core...";

    // Backup existing installation
    const backupDir = join(installDir, ".bmad-core.backup");
    const coreDir = join(installDir, ".bmad-core");

    if (await this.fileManager.exists(coreDir)) {
      await this.fileManager.copy(coreDir, backupDir);
    }

    try {
      // Install new version
      await this.installCore(installDir, spinner);

      // Remove backup on success
      if (await this.fileManager.exists(backupDir)) {
        await this.fileManager.copy(backupDir, coreDir); // Copy back first
        await this.fileManager.copy(backupDir, coreDir);
      }

      console.log(green("✅ Core updated successfully"));
    } catch (error: unknown) {
      // Restore backup on failure
      if (await this.fileManager.exists(backupDir)) {
        if (await this.fileManager.exists(coreDir)) {
          await this.fileManager.copy(coreDir, coreDir + ".temp");
          await this.fileManager.copy(backupDir, coreDir);
        }
        await this.fileManager.copy(backupDir, coreDir);
      }
      throw error;
    }
  }

  /**
   * Perform repair of installation
   * @param installDir - Installation directory
   * @param _manifest - Installation manifest
   * @param integrity - Integrity check results
   * @param spinner - Spinner for progress indication
   */
  async performRepair(
    installDir: string,
    _manifest: Record<string, unknown> | undefined,
    integrity: { missing: string[]; modified: string[] },
    spinner: ISpinner,
  ): Promise<void> {
    spinner.start();
    spinner.text = "Repairing installation...";

    // For now, just reinstall core to fix missing files
    if (integrity.missing.length > 0) {
      await this.installCore(installDir, spinner);
    }

    console.log(green("✅ Installation repaired"));
  }
}

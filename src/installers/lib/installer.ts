import {
  blue,
  copy,
  cyan,
  dirname,
  ensureDir,
  exists,
  expandGlob,
  green,
  join,
  parseYaml,
  red,
  resolve,
  stringifyYaml,
  yellow,
  ProjectPaths,
  resourceLocator,
  configLoader,
} from "deps";

// Spinner interface for consistent typing
interface Spinner {
  text: string;
  start(): void;
  stop(): void;
  succeed(text?: string): void;
  fail(text?: string): void;
}

// Utility function to extract YAML frontmatter from agent files
function extractYamlFromAgent(content: string): string | null {
  const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  return yamlMatch ? (yamlMatch[1] || null) : null;
}
// import fileManager from 'deps'; // Currently unused
import BaseIdeSetup from './ide-base-setup.ts';
import { IntegrityChecker } from 'deps';
class Logger {
  log(message: string): void {
    console.log(message);
  }
}
// class ValidationError extends Error {} // Currently unused
class PerformanceMonitor {
  start(): void {}
  end(): void {}
}

export interface InstallConfig {
  directory?: string;
  selectedPacks?: string[];
  ides?: string[];
  full?: boolean;
  expansionOnly?: boolean;
  expansionPacks?: string[];
}

export interface InstallationState {
  type: string;
  manifest?: Record<string, unknown>;
  expansionPacks?: Record<string, unknown>;
  integrity?: Record<string, unknown>;
}

export interface ExpansionPack {
  id: string;
  shortTitle: string;
  version: string;
  description?: string;
  dependencies?: string[];
}

export interface ExpansionPackInfo {
  manifest?: {
    version?: string;
    shortTitle?: string;
  };
  version?: string;
  shortTitle?: string;
}

class Installer {
  private validator: typeof IntegrityChecker;
  private logger: Logger;
  private monitor: PerformanceMonitor;
  private _ideSetup: BaseIdeSetup;

  constructor() {
    this.validator = IntegrityChecker;
    this.logger = new Logger();
    this.monitor = new PerformanceMonitor();
    this._ideSetup = new BaseIdeSetup();
  }

  getCoreVersion(): string {
    try {
      // Always use package.json version
      const packagePath = join(ProjectPaths.root, "package.json");
      const packageContent = Deno.readTextFileSync(packagePath);
      const packageJson = JSON.parse(packageContent);
      return packageJson.version;
    } catch (_error) {
      console.warn("Could not read version from package.json, using 'unknown'");
      return "unknown";
    }
  }

  async generateAgentsFromConfigs(
    bmadCoreDestDir: string,
    spinner?: Spinner,
  ): Promise<string[]> {
    try {
      const agentConfigsDir = join(
        resourceLocator.getBmadCorePath(),
        "agent-configs",
      );
      const agentsDir = join(bmadCoreDestDir, "agents");
      const templatesDir = join(
        resourceLocator.getBmadCorePath(),
        "templates",
      );

      // Ensure agents directory exists
      await ensureDir(agentsDir);

      // Load base template
      const baseTemplatePath = join(templatesDir, "agent-base-tmpl.yaml");
      const baseTemplateContent = await Deno.readTextFile(baseTemplatePath);
      const baseTemplate = parseYaml(baseTemplateContent) as Record<
        string,
        unknown
      >;

      // Get all agent config files
      const configFiles: string[] = [];
      for await (const entry of Deno.readDir(agentConfigsDir)) {
        if (entry.isFile && entry.name.endsWith("-config.yaml")) {
          configFiles.push(entry.name);
        }
      }

      // Load all agent configurations for bmad-master aggregation
      const allAgentConfigs: Record<string, unknown> = {};
      for (const configFile of configFiles) {
        const agentName = configFile.replace("-config.yaml", "");
        const configPath = join(agentConfigsDir, configFile);
        const agentConfigContent = await Deno.readTextFile(configPath);
        allAgentConfigs[agentName] = parseYaml(agentConfigContent);
      }

      const generatedFiles: string[] = [];

      for (const configFile of configFiles) {
        const agentName = configFile.replace("-config.yaml", "");
        const outputPath = join(agentsDir, `${agentName}.md`);

        if (spinner) {
          spinner.text = `Generating ${agentName} agent...`;
        }

        let agentConfig = allAgentConfigs[agentName] as Record<string, unknown>;

        // Special handling for bmad-master: aggregate dependencies from other agents
        if (agentName === "bmad-master") {
          agentConfig = this.buildBmadMasterConfig(
            agentConfig,
            allAgentConfigs,
          );
        }

        // Generate agent file content
        const content = this.generateAgentFileContent(
          baseTemplate,
          agentConfig,
        );

        // Write agent file
        await Deno.writeTextFile(outputPath, content);
        generatedFiles.push(`agents/${agentName}.md`);
      }

      return generatedFiles;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        red("Failed to generate agents from configs:"),
        errorMessage,
      );
      throw error;
    }
  }

  buildBmadMasterConfig(
    bmadMasterConfig: Record<string, unknown>,
    allAgentConfigs: Record<string, unknown>,
  ): Record<string, unknown> {
    // Aggregate dependencies from all other agents
    const aggregatedDependencies: Record<string, unknown[]> = {};

    for (const [agentName, config] of Object.entries(allAgentConfigs)) {
      if (
        agentName !== "bmad-master" &&
        config &&
        typeof config === "object" &&
        "dependencies" in config &&
        config.dependencies &&
        typeof config.dependencies === "object"
      ) {
        for (
          const [depType, deps] of Object.entries(config.dependencies as Record<string, unknown>)
        ) {
          if (!aggregatedDependencies[depType]) {
            aggregatedDependencies[depType] = [];
          }
          if (Array.isArray(deps)) {
            aggregatedDependencies[depType].push(...deps);
          }
        }
      }
    }

    // Remove duplicates and merge with existing bmad-master dependencies
    for (const [depType, deps] of Object.entries(aggregatedDependencies)) {
      if (Array.isArray(deps)) {
        const uniqueDeps = [...new Set(deps)];

        // Ensure bmadMasterConfig.dependencies exists and is an object
        if (!bmadMasterConfig.dependencies || typeof bmadMasterConfig.dependencies !== "object") {
          bmadMasterConfig.dependencies = {};
        }

        const dependencies = bmadMasterConfig.dependencies as Record<string, unknown>;

        if (dependencies[depType] && Array.isArray(dependencies[depType])) {
          dependencies[depType] = [
            ...new Set([
              ...(dependencies[depType] as unknown[]),
              ...uniqueDeps,
            ]),
          ];
        } else {
          dependencies[depType] = uniqueDeps;
        }
      }
    }

    return bmadMasterConfig;
  }

  generateAgentFileContent(
    baseTemplate: Record<string, unknown>,
    agentConfig: Record<string, unknown>,
  ): string {
    // Create a deep copy of the base template
    const template = JSON.parse(JSON.stringify(baseTemplate));

    // Merge agent config into template
    Object.assign(template, agentConfig);

    // Convert to YAML and wrap in markdown
    const yamlContent = stringifyYaml(template);

    return `---\n${yamlContent}---\n\n# ${template.title || template.id}\n\n${
      template.description || ""
    }`;
  }

  async install(config: InstallConfig): Promise<void> {
    if (!config.directory) {
      throw new Error("Installation directory is required");
    }
    const installDir = resolve(config.directory);

    console.log(blue(`🚀 Installing to: ${installDir}`));

    // Create a simple spinner replacement
    const spinner = {
      text: "Starting installation...",
      start: () => console.log("⏳ Starting..."),
      succeed: (msg?: string) => console.log(green(`✅ ${msg || "Success"}`)),
      fail: (msg?: string) => console.log(red(`❌ ${msg || "Failed"}`)),
      stop: () => {},
    };

    try {
      spinner.start();

      // Detect existing installation state
      const state = await this.detectInstallationState(installDir);

      if (state.type === "fresh") {
        await this.performFreshInstall(config, installDir, spinner);
      } else if (state.type === "v5_existing") {
        await this.handleExistingV5Installation(
          config,
          installDir,
          state,
          spinner,
        );
      } else {
        await this.handleUnknownInstallation(
          config,
          installDir,
          state,
          spinner,
        );
      }

      spinner.succeed("Installation completed successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(
        `Installation failed: ${errorMessage}`,
      );
      throw error;
    }
  }

  async detectInstallationState(
    installDir: string,
  ): Promise<InstallationState> {
    const manifestPath = join(
      installDir,
      ".bmad-core",
      "install-manifest.yaml",
    );

    try {
      if (await exists(manifestPath)) {
        const manifestContent = await Deno.readTextFile(manifestPath);
        const manifest = parseYaml(manifestContent) as Record<string, unknown>;

        return {
          type: "v5_existing",
          manifest,
          expansionPacks: await this.detectExpansionPacks(installDir),
        };
      }
    } catch (_error) {
      // Manifest exists but is corrupted
    }

    // Check for other installation types
    const bmadCoreDir = join(installDir, ".bmad-core");
    if (await exists(bmadCoreDir)) {
      return {
        type: "unknown_existing",
        expansionPacks: await this.detectExpansionPacks(installDir),
      };
    }

    return { type: "fresh" };
  }

  async performFreshInstall(
    config: InstallConfig,
    installDir: string,
    spinner: Spinner,
  ): Promise<void> {
    spinner.text = "Performing fresh installation...";

    // Ensure install directory exists
    await ensureDir(installDir);

    // Install core if selected
    if (config.selectedPacks?.includes(".bmad-core") || config.full) {
      await this.installCore(installDir, spinner);
    }

    // Install expansion packs if selected
    const expansionPacks = config.selectedPacks?.filter((pack) => pack !== ".bmad-core") || [];
    if (expansionPacks.length > 0) {
      await this.installExpansionPacks(
        installDir,
        expansionPacks,
        spinner,
        config,
      );
    }

    // Setup IDE configurations
    if (config.ides && config.ides.length > 0) {
      await this.setupIdeConfigurations(installDir, config.ides, spinner);
    }
  }

  async handleExistingV5Installation(
    config: InstallConfig,
    installDir: string,
    state: InstallationState,
    spinner: Spinner,
  ): Promise<void> {
    spinner.stop();

    const currentVersion = typeof state.manifest?.version === "string"
      ? state.manifest.version
      : "unknown";
    const newVersion = this.getCoreVersion();
    const versionCompare = this.compareVersions(currentVersion, newVersion);

    console.log(yellow("\n🔍 Found existing BMad v5 installation"));
    console.log(`   Directory: ${installDir}`);
    console.log(`   Current version: ${currentVersion}`);
    console.log(`   Available version: ${newVersion}`);
    console.log(
      `   Installed: ${
        state.manifest?.installedAt &&
          (typeof state.manifest.installedAt === "string" ||
            typeof state.manifest.installedAt === "number" ||
            state.manifest.installedAt instanceof Date)
          ? new Date(state.manifest.installedAt as string | number | Date).toLocaleDateString()
          : "unknown"
      }`,
    );

    // Check file integrity (simplified for now)
    spinner.start();
    spinner.text = "Checking installation integrity...";
    const integrity = await this.checkFileIntegrity(installDir, state.manifest);
    spinner.stop();

    const hasMissingFiles = integrity.missing.length > 0;
    const hasModifiedFiles = integrity.modified.length > 0;
    const hasIntegrityIssues = hasMissingFiles || hasModifiedFiles;

    if (hasIntegrityIssues) {
      console.log("\n⚠️  Installation issues detected:");
      if (hasMissingFiles) {
        console.log(`   Missing files: ${integrity.missing.length}`);
        if (integrity.missing.length <= 5) {
          integrity.missing.forEach((file: string) => console.log(`     - ${file}`));
        }
      }
      if (hasModifiedFiles) {
        console.log(
          yellow(`   Modified files: ${integrity.modified.length}`),
        );
        if (integrity.modified.length <= 5) {
          integrity.modified.forEach((file: string) => console.log(`     - ${file}`));
        }
      }
    }

    // Show existing expansion packs
    if (state.expansionPacks && Object.keys(state.expansionPacks).length > 0) {
      console.log(cyan("\n📦 Installed expansion packs:"));
      for (const [packId, packInfo] of Object.entries(state.expansionPacks)) {
        const info = packInfo as ExpansionPackInfo;
        if (info.manifest) {
          console.log(
            `   - ${packId} (v${info.manifest.version || "unknown"})`,
          );
        } else {
          console.log(`   - ${packId} (no manifest)`);
        }
      }
    }

    // For now, just perform a simple upgrade/reinstall
    if (versionCompare < 0) {
      console.log(cyan("\n⬆️  Upgrade available for BMad core"));
      await this.performUpdate(config, installDir, state.manifest, spinner);
    } else if (versionCompare === 0) {
      if (hasIntegrityIssues) {
        console.log("\n🔧 Repairing installation...");
        await this.performRepair(
          installDir,
          state.manifest,
          integrity,
          spinner,
        );
      } else {
        console.log(yellow("\n⚠️  Same version already installed - skipping"));
      }
    } else {
      console.log(
        yellow("\n⬇️  Installed version is newer than available - skipping"),
      );
    }

    // Update/install expansion packs
    const expansionPacks = config.selectedPacks?.filter((pack) => pack !== ".bmad-core") || [];
    if (expansionPacks.length > 0) {
      await this.installExpansionPacks(
        installDir,
        expansionPacks,
        spinner,
        config,
      );
    }
  }

  compareVersions(version1: string, version2: string): number {
    if (version1 === "unknown" || version2 === "unknown") {
      return 0; // Treat unknown versions as equal
    }

    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }

  async detectExpansionPacks(installDir: string): Promise<Record<string, unknown>> {
    const expansionPacks: Record<string, unknown> = {};

    try {
      for await (const entry of Deno.readDir(installDir)) {
        if (
          entry.isDirectory && entry.name.startsWith(".") &&
          entry.name !== ".bmad-core"
        ) {
          const packId = entry.name.substring(1); // Remove leading dot
          const configPath = join(installDir, entry.name, "config.yaml");

          if (await exists(configPath)) {
            try {
              const configContent = await Deno.readTextFile(configPath);
              const config = parseYaml(configContent) as Record<string, unknown>;
              expansionPacks[packId] = {
                manifest: config,
                path: join(installDir, entry.name),
              };
            } catch (_error) {
              // Invalid config, skip
            }
          }
        }
      }
    } catch (_error) {
      // Directory doesn't exist or can't be read
    }

    return expansionPacks;
  }

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
      if (!(await exists(dirPath))) {
        missing.push(dir);
      }
    }

    return { missing, modified };
  }

  async performUpdate(
    _config: InstallConfig,
    installDir: string,
    _manifest: Record<string, unknown> | undefined,
    spinner: Spinner,
  ): Promise<void> {
    spinner.start();
    spinner.text = "Updating BMad core...";

    // Backup existing installation
    const backupDir = join(installDir, ".bmad-core.backup");
    const coreDir = join(installDir, ".bmad-core");

    if (await exists(coreDir)) {
      await copy(coreDir, backupDir, { overwrite: true });
    }

    try {
      // Install new version
      await this.installCore(installDir, spinner);

      // Remove backup on success
      if (await exists(backupDir)) {
        await Deno.remove(backupDir, { recursive: true });
      }

      console.log(green("✅ Core updated successfully"));
    } catch (error: unknown) {
      // Restore backup on failure
      if (await exists(backupDir)) {
        if (await exists(coreDir)) {
          await Deno.remove(coreDir, { recursive: true });
        }
        await copy(backupDir, coreDir, { overwrite: true });
        await Deno.remove(backupDir, { recursive: true });
      }
      throw error;
    }
  }

  async performRepair(
    installDir: string,
    _manifest: Record<string, unknown> | undefined,
    integrity: { missing: string[]; modified: string[] },
    spinner: Spinner,
  ): Promise<void> {
    spinner.start();
    spinner.text = "Repairing installation...";

    // For now, just reinstall core to fix missing files
    if (integrity.missing.length > 0) {
      await this.installCore(installDir, spinner);
    }

    console.log(green("✅ Installation repaired"));
  }

  async handleUnknownInstallation(
    config: InstallConfig,
    installDir: string,
    _state: InstallationState,
    spinner: Spinner,
  ): Promise<void> {
    spinner.text = "Handling unknown installation...";

    // For now, treat as fresh install
    await this.performFreshInstall(config, installDir, spinner);
  }

  async installCore(installDir: string, spinner: Spinner): Promise<void> {
    spinner.text = "Installing BMad core...";

    const coreDestDir = join(installDir, ".bmad-core");
    await ensureDir(coreDestDir);

    // Copy core files
    const corePath = resourceLocator.getBmadCorePath();
    await copy(corePath, coreDestDir, { overwrite: true });

    // Generate agents from configs
    await this.generateAgentsFromConfigs(coreDestDir, spinner);

    // Create install manifest
    await this.createInstallManifest(installDir);
  }

  async updateCore(installDir: string, spinner: Spinner): Promise<void> {
    spinner.text = "Updating BMad core...";

    // For now, just reinstall
    await this.installCore(installDir, spinner);
  }

  async installExpansionPacks(
    installDir: string,
    selectedPacks: string[],
    spinner: Spinner,
    _config: InstallConfig = {},
  ): Promise<string[]> {
    const installedFiles: string[] = [];

    for (const packId of selectedPacks) {
      spinner.text = `Installing expansion pack: ${packId}...`;

      const packDestDir = join(installDir, `.${packId}`);
      await ensureDir(packDestDir);

      // Get expansion pack source
      const packPath = resourceLocator.getExpansionPackPath(packId);
      if (await exists(packPath)) {
        await copy(packPath, packDestDir, { overwrite: true });

        // Copy common items to expansion pack
        const commonFiles = await this.copyCommonItems(
          installDir,
          `.${packId}`,
          spinner,
        );
        installedFiles.push(...commonFiles);

        // Resolve core dependencies for expansion pack
        const pack = { path: packPath, name: packId };
        await this.resolveExpansionPackCoreDependencies(
          packDestDir,
          packId,
          pack,
          spinner,
        );

        installedFiles.push(`.${packId}/**/*`);
      } else {
        console.warn(yellow(`Expansion pack ${packId} not found, skipping...`));
      }
    }

    return installedFiles;
  }

  async setupIdeConfigurations(
    installDir: string,
    ides: string[],
    spinner: Spinner,
  ): Promise<void> {
    spinner.text = "Setting up IDE configurations...";
    try {
      for (const ide of ides) {
        spinner.text = `Setting up ${ide} configuration...`;
        const agentIds = await this._ideSetup.getAllAgentIds(installDir);
        const agentPathPromises = agentIds.map((id) =>
          this._ideSetup.findAgentPath(installDir, id)
        );
        const agentPaths = await Promise.all(agentPathPromises);
        for (let i = 0; i < agentIds.length; i++) {
          const agentId = agentIds[i] as string;
          const agentPath = agentPaths[i] as string | null;
          if (agentPath !== null) {
            await this._ideSetup.createAgentRuleContent(agentId, agentPath, installDir);
          } else {
            console.warn(`Skipping agent ${agentId}: agentPath not found.`);
          }
        }
        console.log(green(`✓ ${ide} configuration set up.`));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        red(`Failed to set up IDE configurations: ${errorMessage}`),
      );
      throw error;
    }
  }

  async getAvailableExpansionPacks(): Promise<ExpansionPack[]> {
    return await configLoader.getAvailableExpansionPacks();
  }

  // TODO: Implement this method properly
  private async createInstallManifest(installDir: string): Promise<void> {
    console.log("createInstallManifest called");
    const manifestPath = join(
      installDir,
      ".bmad-core",
      "install-manifest.yaml",
    );

    const manifest = {
      version: this.getCoreVersion(),
      installedAt: new Date().toISOString(),
      type: "v5",
      components: {
        core: true,
      },
    };

    const manifestContent = stringifyYaml(manifest);
    await Deno.writeTextFile(manifestPath, manifestContent);
  }



  async getInstallationStatus(directory: string): Promise<Record<string, unknown>> {
    const state = await this.detectInstallationState(directory);

    return {
      type: state.type,
      coreInstalled: state.manifest ? true : false,
      coreVersion: state.manifest?.version || null,
      expansionPacks: Object.keys(state.expansionPacks || {}),
      directory,
    };
  }

  async update(_options: Record<string, unknown> = {}): Promise<void> {
    console.log(blue("🔄 Updating BMad installation..."));

    // Find existing installation
    const installDir = await this.findInstallation();
    if (!installDir) {
      throw new Error("No BMad installation found");
    }

    // Perform update
    const config: InstallConfig = {
      directory: installDir,
      selectedPacks: [".bmad-core"], // Update core by default
    };

    await this.install(config);
  }

  async findInstallation(): Promise<string | null> {
    // Check current directory first
    const currentDir = Deno.cwd();
    const state = await this.detectInstallationState(currentDir);

    if (state.type !== "fresh") {
      return currentDir;
    }

    // Could implement more sophisticated search logic here
    return null;
  }

  showSuccessMessage(
    config: InstallConfig,
    installDir: string,
    _options: Record<string, unknown> = {},
  ): void {
    console.log(green("\n✓ BMad Method installed successfully!\n"));

    const ides = config.ides || [];
    if (ides.length > 0) {
      for (const ide of ides) {
        console.log(`✓ IDE configuration set up for: ${ide}`);
      }
    } else {
      console.log(yellow("No IDE configuration was set up."));
      console.log(
        "You can manually configure your IDE using the agent files in:",
        installDir,
      );
    }

    // Information about installation components
    console.log("\n🎯 Installation Summary:");
    if (config.expansionOnly !== true) {
      console.log(
        green(
          "✓ .bmad-core framework installed with all agents and workflows",
        ),
      );
    }

    if (config.expansionPacks && config.expansionPacks.length > 0) {
      console.log(green(`✓ Expansion packs installed:`));
      for (const packId of config.expansionPacks) {
        console.log(green(`  - ${packId} → .${packId}/`));
      }
    }

    if (ides.length > 0) {
      const ideNames = ides.join(", ");
      console.log(
        green(`✓ IDE rules and configurations set up for: ${ideNames}`),
      );
    }

    // Important notice to read the user guide
    console.log(
      "\n📖 IMPORTANT: Please read the user guide installed at .bmad-core/user-guide.md",
    );
    console.log(
      "This guide contains essential information about the BMad workflow and how to use the agents effectively.",
    );
  }

  async flatten(options: Record<string, unknown>): Promise<void> {
    try {
      const flattenerModule = await import(
        join(ProjectPaths.tooling, "user-tools", "flattener", "main.ts")
      );

      // Use the flattener with provided options
      const inputDir = typeof options.input === "string"
        ? options.input
        : typeof options.directory === "string"
        ? options.directory
        : Deno.cwd();
      const outputFile = typeof options.output === "string"
        ? options.output
        : "flattened-codebase.xml";

      console.log(green(`🔄 Flattening codebase from: ${inputDir}`));
      console.log(green(`📄 Output file: ${outputFile}`));

      // Execute the flattener
      await flattenerModule.default.parse([
        "--input",
        inputDir,
        "--output",
        outputFile,
      ]);

      console.log(green(`✅ Codebase flattened successfully to ${outputFile}`));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        red(
          `❌ Failed to flatten codebase: ${errorMessage}`,
        ),
      );
      throw error;
    }
  }

  async copyCommonItems(
    installDir: string,
    targetSubdir: string,
    spinner?: Spinner,
  ): Promise<string[]> {
    const commonPath = join(ProjectPaths.root, "common");
    const targetPath = join(installDir, targetSubdir);
    const copiedFiles: string[] = [];

    // Check if common/ exists
    if (!(await exists(commonPath))) {
      console.warn("Warning: common/ folder not found");
      return copiedFiles;
    }

    // Copy all items from common/ to target
    for await (
      const entry of expandGlob("**/*", {
        root: commonPath,
        includeDirs: false,
      })
    ) {
      const relativePath = entry.path.replace(commonPath + "/", "");
      const sourcePath = entry.path;
      const destPath = join(targetPath, relativePath);

      // Read the file content
      const content = await Deno.readTextFile(sourcePath);

      // Replace {root} with the target subdirectory
      const updatedContent = content.replace(/\{root\}/g, targetSubdir);

      // Ensure directory exists
      await ensureDir(dirname(destPath));

      // Write the updated content
      await Deno.writeTextFile(destPath, updatedContent);
      copiedFiles.push(join(targetSubdir, relativePath));
    }

    if (spinner) {
      console.log(cyan(`  Added ${copiedFiles.length} common utilities`));
    }
    return copiedFiles;
  }

  async resolveExpansionPackCoreDependencies(
    expansionDotFolder: string,
    packId: string,
    pack: { path: string; name: string },
    spinner: Spinner,
  ): Promise<void> {
    // Find all agent files in the expansion pack
    for await (
      const entry of expandGlob("agents/*.md", { root: expansionDotFolder })
    ) {
      const agentContent = await Deno.readTextFile(entry.path);

      // Extract YAML frontmatter to check dependencies
      const yamlContent = extractYamlFromAgent(agentContent);
      if (yamlContent) {
        try {
          const agentConfig = parseYaml(yamlContent) as Record<string, unknown>;
          const dependencies = (agentConfig.dependencies as Record<string, unknown>) || {};

          // Check for core dependencies (those that don't exist in the expansion pack)
          for (
            const depType of [
              "tasks",
              "templates",
              "checklists",
              "workflows",
              "utils",
              "data",
            ]
          ) {
            const deps = (dependencies[depType] as string[]) || [];

            for (const dep of deps) {
              const depFileName = dep.endsWith(".md") || dep.endsWith(".yaml")
                ? dep
                : depType === "templates"
                ? `${dep}.yaml`
                : `${dep}.md`;
              const expansionDepPath = join(
                expansionDotFolder,
                depType,
                depFileName,
              );

              // Check if dependency exists in expansion pack dot folder
              if (!(await exists(expansionDepPath))) {
                // Try to find it in expansion pack source
                const sourceDepPath = join(pack.path, depType, depFileName);

                if (await exists(sourceDepPath)) {
                  // Copy from expansion pack source
                  spinner.text = `Copying ${packId} dependency ${dep}...`;
                  const destPath = join(
                    expansionDotFolder,
                    depType,
                    depFileName,
                  );
                  await this.copyFileWithRootReplacement(
                    sourceDepPath,
                    destPath,
                    `.${packId}`,
                  );
                  console.log(
                    cyan(
                      `  Added ${packId} dependency: ${depType}/${depFileName}`,
                    ),
                  );
                } else {
                  // Try to find it in core
                  const coreDepPath = join(
                    resourceLocator.getBmadCorePath(),
                    depType,
                    depFileName,
                  );

                  if (await exists(coreDepPath)) {
                    spinner.text = `Copying core dependency ${dep} for ${packId}...`;
                    const destPath = join(
                      expansionDotFolder,
                      depType,
                      depFileName,
                    );
                    await this.copyFileWithRootReplacement(
                      coreDepPath,
                      destPath,
                      `.${packId}`,
                    );
                    console.log(
                      cyan(
                        `  Added core dependency: ${depType}/${depFileName}`,
                      ),
                    );
                  } else {
                    console.warn(
                      yellow(
                        `Warning: Dependency ${depType}/${depFileName} not found for ${packId}`,
                      ),
                    );
                  }
                }
              }
            }
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(
            yellow(
              `Warning: Could not parse YAML in ${entry.path}: ${errorMessage}`,
            ),
          );
        }
      }
    }
  }

  async copyFileWithRootReplacement(
    sourcePath: string,
    destPath: string,
    rootReplacement: string,
  ): Promise<void> {
    const content = await Deno.readTextFile(sourcePath);
    const updatedContent = content.replace(/\{root\}/g, rootReplacement);
    await ensureDir(dirname(destPath));
    await Deno.writeTextFile(destPath, updatedContent);
  }
}

export default new Installer();

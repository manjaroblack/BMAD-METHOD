import {
  blue,
  configLoader,
  copy,
  cyan,
  dirname,
  ensureDir,
  expandGlob,
  green,
  join,
  parseYaml,
  ProjectPaths,
  red,
  resolve,
  resourceLocator,
  stringifyYaml,
  yellow,
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
import BaseIdeSetup from "./ide-base-setup.ts";
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
  private logger: Logger;
  private monitor: PerformanceMonitor;
  private _ideSetup: BaseIdeSetup;

  constructor() {
    this.logger = new Logger();
    this.monitor = new PerformanceMonitor();
    this._ideSetup = new BaseIdeSetup();
  }

  getCoreVersion(): string {
    try {
      // Always use deno.json version
      const denoJsonPath = join(ProjectPaths.root, "deno.json");
      const denoJsonContent = Deno.readTextFileSync(denoJsonPath);
      const denoJson = JSON.parse(denoJsonContent);
      return denoJson.version;
    } catch (_error) {
      console.warn("Could not read version from deno.json, using 'unknown'");
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

      // Ensure agents directory exists
      await ensureDir(agentsDir);

      // Load base template from source directory
      const baseTemplatePath = join(agentConfigsDir, "agent-base-tmpl.yaml");
      let baseTemplateContent: string;
      try {
        baseTemplateContent = await Deno.readTextFile(baseTemplatePath);
      } catch (error) {
        throw new Error(
          `Failed to read base template file at ${baseTemplatePath}: ${
            (error as Error).message
          }`,
        );
      }
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

      // Load all agent configurations
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

        const agentConfig = allAgentConfigs[agentName] as Record<
          string,
          unknown
        >;

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
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error(
        red("Failed to generate agents from configs:"),
        errorMessage,
      );
      throw error;
    }
  }
  generateAgentFileContent(
    baseTemplate: Record<string, unknown>,
    agentConfig: Record<string, unknown>,
  ): string {
    // Build the markdown content
    let content = `# ${
      agentConfig.id
        ? String(agentConfig.id).toUpperCase()
        : (agentConfig.name || "Agent")
    }\n\n`;

    // Add activation notice
    if (baseTemplate.activation_notice) {
      content += `${baseTemplate.activation_notice}\n---\n\n`;
    }

    // Add config section
    content += "## Config\n\n";

    const configSection = baseTemplate.config as
      | { requests?: string[]; files?: string[]; activation?: string[] }
      | undefined;

    // Files section

    if (configSection?.files && Array.isArray(configSection.files)) {
      content += "**Files:**\n\n";
      for (const file of configSection.files) {
        content += `* ${file}\n`;
      }
      content += "\n";
    }

    // Requests section

    if (configSection?.requests && Array.isArray(configSection.requests)) {
      content += "**Requests:**\n\n";
      for (const request of configSection.requests) {
        content += `* ${request}\n`;
      }
      content += "\n";
    }

    // Activation section
    if (configSection?.activation && Array.isArray(configSection.activation)) {
      content += "**Activation:**\n\n";
      for (let i = 0; i < configSection.activation.length; i++) {
        content += `${i + 1}. ${configSection.activation[i]}\n`;
      }
      content += "\n";
    }

    // Additional Activation section
    const additionalActivationSection = agentConfig
      .additional_activation_instructions as string[] | undefined;
    if (
      additionalActivationSection && Array.isArray(additionalActivationSection)
    ) {
      content += "**Additional Activation:**\n\n";
      for (const line of additionalActivationSection) {
        content += `* ${line}\n`;
      }
      content += "\n";
    }

    // Add persona section
    content += "## Persona\n\n";

    const agent = agentConfig.agent as {
      name: string;
      title: string;
      icon: string;
      whenToUse: string;
    };

    // Agent subsection
    content += "**Agent:**\n\n";
    if (agent.name) {
      content += `* **Name:** ${agent.name}\n`;
    }
    if (agent.title) {
      const titleWithIcon = agent.icon
        ? `${agent.title} ${agent.icon}`
        : agent.title;
      content += `* **Title:** ${titleWithIcon}\n`;
    }
    if (agent.whenToUse) {
      content += `* **Use:** ${agent.whenToUse}\n`;
    }
    content += "\n";

    // Persona subsection
    const persona = agentConfig.persona as {
      role: string;
      style: string;
      identity: string;
      focus: string;
      core_principles: string[];
    };
    content += "**Persona:**\n\n";
    if (persona.role) {
      content += `* **Role:** ${persona.role}\n`;
    }
    if (persona.style) {
      content += `* **Style:** ${persona.style}\n`;
    }
    if (persona.identity) {
      content += `* **Identity:** ${persona.identity}\n`;
    }
    if (persona.focus) {
      content += `* **Focus:** ${persona.focus}\n`;
    }

    // Core principles
    if (persona.core_principles && Array.isArray(persona.core_principles)) {
      content += "* **Principles:**";
      for (let i = 0; i < persona.core_principles.length; i++) {
        const principle = persona.core_principles[i];
        if (i === 0) {
          content += ` ${principle}`;
        } else {
          content += `, ${principle}`;
        }
      }
      content += "\n\n";
    }

    // Additional permissions
    const additionalPermissions = agentConfig.additional_permissions as
      | string[]
      | undefined;
    if (
      additionalPermissions &&
      Array.isArray(additionalPermissions)
    ) {
      for (const permission of additionalPermissions) {
        content += `* **Permissions:** ${permission}\n`;
      }
      content += "\n";
    }

    // Add commands & dependencies section header
    content += "## Commands & Dependencies\n\n";
    const defaultPrefixNotice = "*`*` prefix on all commands*";
    content += `${defaultPrefixNotice}\n\n`;

    const standardCommands =
      baseTemplate.standard_commands as Record<string, unknown> || {};
    const includeStandardCommands =
      agentConfig.include_standard_commands as string[] || [];
    const commands = agentConfig.commands as Record<string, unknown> || {};

    // Build combined commands object
    const allCommands: Record<string, unknown> = { ...commands };

    // Add included standard commands
    for (const cmd of includeStandardCommands) {
      if (standardCommands[cmd]) {
        allCommands[cmd] = standardCommands[cmd];
      }
    }

    // Add all commands
    if (Object.keys(allCommands).length > 0) {
      content += "**Commands:**\n\n";
      for (const [command, description] of Object.entries(allCommands)) {
        // Handle multi-line descriptions with special formatting
        if (
          typeof description === "string" &&
          (description.includes("\n") || description.includes(":"))
        ) {
          content += `* **${command}:**\n`;
          const lines = description.split("\n");
          for (const line of lines) {
            const parts = line.trim().split(":");
            if (parts.length >= 2 && parts[0]) {
              content += `  * **${parts[0].trim()}:** ${
                parts.slice(1).join(":").trim()
              }\n`;
            }
          }
        } else {
          content += `* **${command}:** ${description}\n`;
        }
      }
      content += "\n";
    }

    const dependencies = agentConfig.dependencies as Record<string, unknown>;

    // Add dependencies section if present
    if (Object.keys(dependencies).length > 0) {
      content += "**Dependencies:**\n\n";
      for (
        const [depType, depList] of Object.entries(dependencies)
      ) {
        if (Array.isArray(depList) && depList.length > 0) {
          content += `* **${
            depType.charAt(0).toUpperCase() + depType.slice(1)
          }:** ${depList.map((dep: string) => `\`${dep}\``).join(", ")}\n`;
        }
      }
      content += "\n";
    }

    // Ensure single trailing newline
    content = content.trimEnd() + "\n";

    return content;
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
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
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
      // Check if the manifest file exists
      const manifestExists = await Deno.stat(manifestPath);

      if (manifestExists) {
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
    const coreDirExists = await Deno.stat(bmadCoreDir);

    if (coreDirExists) {
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
    const expansionPacks =
      config.selectedPacks?.filter((pack) => pack !== ".bmad-core") || [];
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
          ? new Date(state.manifest.installedAt as string | number | Date)
            .toLocaleDateString()
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
          integrity.missing.forEach((file: string) =>
            console.log(`     - ${file}`)
          );
        }
      }
      if (hasModifiedFiles) {
        console.log(
          yellow(`   Modified files: ${integrity.modified.length}`),
        );
        if (integrity.modified.length <= 5) {
          integrity.modified.forEach((file: string) =>
            console.log(`     - ${file}`)
          );
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
    const expansionPacks =
      config.selectedPacks?.filter((pack) => pack !== ".bmad-core") || [];
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

  async detectExpansionPacks(
    installDir: string,
  ): Promise<Record<string, unknown>> {
    const expansionPacks: Record<string, unknown> = {};

    try {
      // Check if install directory exists before trying to read it
      if (!(await Deno.stat(installDir))) {
        return expansionPacks;
      }

      for await (const entry of Deno.readDir(installDir)) {
        if (
          entry.isDirectory && entry.name.startsWith(".") &&
          entry.name !== ".bmad-core"
        ) {
          const packId = entry.name.substring(1); // Remove leading dot
          const configPath = join(installDir, entry.name, "config.yaml");

          if (await Deno.stat(configPath)) {
            try {
              const configContent = await Deno.readTextFile(configPath);
              const config = parseYaml(configContent) as Record<
                string,
                unknown
              >;
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
      if (!(await Deno.stat(dirPath))) {
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

    if (await Deno.stat(coreDir)) {
      await copy(coreDir, backupDir, { overwrite: true });
    }

    try {
      // Install new version
      await this.installCore(installDir, spinner);

      // Remove backup on success
      if (await Deno.stat(backupDir)) {
        await Deno.remove(backupDir, { recursive: true });
      }

      console.log(green("✅ Core updated successfully"));
    } catch (error: unknown) {
      // Restore backup on failure
      if (await Deno.stat(backupDir)) {
        if (await Deno.stat(coreDir)) {
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

    // Copy only configuration files from core, not TypeScript implementation files
    const corePath = resourceLocator.getBmadCorePath();
    await this.copyConfigurationFiles(corePath, coreDestDir);

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
      if (await Deno.stat(packPath)) {
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
            await this._ideSetup.createAgentRuleContent(
              agentId,
              agentPath,
              installDir,
            );
          } else {
            console.warn(`Skipping agent ${agentId}: agentPath not found.`);
          }
        }
        console.log(green(`✓ ${ide} configuration set up.`));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
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

  async getInstallationStatus(
    directory: string,
  ): Promise<Record<string, unknown>> {
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
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
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
    if (!(await Deno.stat(commonPath))) {
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
          const dependencies =
            (agentConfig.dependencies as Record<string, unknown>) || {};

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
              if (!(await Deno.stat(expansionDepPath))) {
                // Try to find it in expansion pack source
                const sourceDepPath = join(pack.path, depType, depFileName);

                if (await Deno.stat(sourceDepPath)) {
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

                  if (await Deno.stat(coreDepPath)) {
                    spinner.text =
                      `Copying core dependency ${dep} for ${packId}...`;
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
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          console.warn(
            yellow(
              `Warning: Could not parse YAML in ${entry.path}: ${errorMessage}`,
            ),
          );
        }
      }
    }
  }

  /**
   * Copy only configuration files (YAML, MD, etc.) from core directory
   * Excludes TypeScript implementation files which should be in src/shared/
   */
  async copyConfigurationFiles(
    sourcePath: string,
    destPath: string,
  ): Promise<void> {
    const allowedExtensions = new Set([
      ".yaml",
      ".yml",
      ".md",
      ".json",
      ".txt",
    ]);
    const excludedDirs = new Set(["agent-configs"]); // TypeScript-only directories

    // Ensure destination directory exists
    await ensureDir(destPath);

    // Copy core-config.yaml file if it exists
    const coreConfigPath = join(sourcePath, "core-config.yaml");
    if (await Deno.stat(coreConfigPath)) {
      await copy(coreConfigPath, join(destPath, "core-config.yaml"), {
        overwrite: true,
      });
    }

    // Copy directories containing only configuration files
    for await (const entry of Deno.readDir(sourcePath)) {
      if (entry.isDirectory && !excludedDirs.has(entry.name)) {
        const sourceDir = join(sourcePath, entry.name);
        const destDir = join(destPath, entry.name);

        await this.copyConfigFilesRecursively(
          sourceDir,
          destDir,
          allowedExtensions,
        );
      } else if (entry.isFile) {
        const ext = entry.name.substring(entry.name.lastIndexOf("."));
        if (allowedExtensions.has(ext)) {
          await copy(
            join(sourcePath, entry.name),
            join(destPath, entry.name),
            { overwrite: true },
          );
        }
      }
    }
  }

  /**
   * Recursively copy only configuration files from a directory
   */
  private async copyConfigFilesRecursively(
    sourceDir: string,
    destDir: string,
    allowedExtensions: Set<string>,
  ): Promise<void> {
    try {
      await ensureDir(destDir);

      for await (const entry of Deno.readDir(sourceDir)) {
        const sourcePath = join(sourceDir, entry.name);
        const destPath = join(destDir, entry.name);

        if (entry.isDirectory) {
          await this.copyConfigFilesRecursively(
            sourcePath,
            destPath,
            allowedExtensions,
          );
        } else if (entry.isFile) {
          const ext = entry.name.substring(entry.name.lastIndexOf("."));
          if (allowedExtensions.has(ext)) {
            await copy(sourcePath, destPath, { overwrite: true });
          }
        }
      }
    } catch (error) {
      // Skip directories that don't exist or can't be read
      console.warn(
        `Warning: Could not copy config files from ${sourceDir}: ${error}`,
      );
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

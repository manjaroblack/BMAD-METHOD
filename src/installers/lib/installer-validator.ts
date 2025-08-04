import { green, join, parseYaml, red, yellow } from "deps";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface InstallationStructure {
  requiredFiles: string[];
  requiredDirectories: string[];
  optionalFiles: string[];
  configFiles: string[];
}

class InstallerValidator {
  private readonly expectedStructure: InstallationStructure = {
    requiredFiles: [
      "deno.json",
      ".bmad-core/config/install.config.yaml",
      ".bmad-core/agents/bmad-master.md",
    ],
    requiredDirectories: [
      ".bmad-core",
      ".bmad-core/agents",
      ".bmad-core/config",
      ".bmad-core/resources",
    ],
    optionalFiles: [
      ".bmad-core/config/team.yaml",
      ".bmad-core/config/ide.yaml",
      "README.md",
      ".gitignore",
    ],
    configFiles: [
      ".bmad-core/config/install.config.yaml",
    ],
  };

  async validateInstallation(installDir: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    console.log(`Validating BMad installation at: ${installDir}`);

    // Check if installation directory exists
    if (!(await Deno.stat(installDir))) {
      result.errors.push(
        `Installation directory does not exist: ${installDir}`,
      );
      result.isValid = false;
      return result;
    }

    // Validate required directories
    await this.validateDirectories(installDir, result);

    // Validate required files
    await this.validateFiles(installDir, result);

    // Validate configuration files
    await this.validateConfigFiles(installDir, result);

    // Validate agents
    await this.validateAgents(installDir, result);

    // Check for optional files and warn if missing
    await this.checkOptionalFiles(installDir, result);

    return result;
  }

  private async validateDirectories(
    installDir: string,
    result: ValidationResult,
  ): Promise<void> {
    for (const dir of this.expectedStructure.requiredDirectories) {
      const fullPath = join(installDir, dir);
      if (!(await Deno.stat(fullPath))) {
        result.errors.push(`Required directory missing: ${dir}`);
        result.isValid = false;
      }
    }
  }

  private async validateFiles(
    installDir: string,
    result: ValidationResult,
  ): Promise<void> {
    for (const file of this.expectedStructure.requiredFiles) {
      const fullPath = join(installDir, file);
      if (!(await Deno.stat(fullPath))) {
        result.errors.push(`Required file missing: ${file}`);
        result.isValid = false;
      }
    }
  }

  private async validateConfigFiles(
    installDir: string,
    result: ValidationResult,
  ): Promise<void> {
    for (const configFile of this.expectedStructure.configFiles) {
      const fullPath = join(installDir, configFile);

      if (!(await Deno.stat(fullPath))) {
        result.errors.push(`Configuration file missing: ${configFile}`);
        result.isValid = false;
        continue;
      }

      try {
        const content = await Deno.readTextFile(fullPath);
        const config = parseYaml(content) as Record<string, unknown>;

        // Validate install.config.yaml structure
        if (configFile.includes("install.config.yaml")) {
          await this.validateInstallConfig(config, result);
        }
      } catch (error) {
        result.errors.push(
          `Invalid YAML in ${configFile}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        result.isValid = false;
      }
    }
  }

  private validateInstallConfig(
    config: Record<string, unknown>,
    result: ValidationResult,
  ): void {
    const requiredFields = ["version", "installation"];

    for (const field of requiredFields) {
      if (!(field in config)) {
        result.errors.push(
          `Missing required field in install.config.yaml: ${field}`,
        );
        result.isValid = false;
      }
    }

    // Validate installation section
    if (typeof config === "object" && config !== null && config.installation) {
      const installation = config.installation;
      const requiredInstallFields = ["directory", "timestamp"];

      for (const field of requiredInstallFields) {
        if (
          typeof installation !== "object" || installation === null ||
          !(field in installation)
        ) {
          result.warnings.push(
            `Missing recommended field in installation config: ${field}`,
          );
        }
      }
    }
  }

  private async validateAgents(
    installDir: string,
    result: ValidationResult,
  ): Promise<void> {
    const agentsDir = join(installDir, ".bmad-core/agents");

    if (!(await Deno.stat(agentsDir))) {
      result.errors.push("Agents directory missing");
      result.isValid = false;
      return;
    }

    try {
      const agents = [];
      for await (const entry of Deno.readDir(agentsDir)) {
        if (entry.isFile && entry.name.endsWith(".md")) {
          agents.push(entry.name);
        }
      }

      if (agents.length === 0) {
        result.warnings.push("No agent files found in agents directory");
      }

      // Check for bmad-master.md specifically
      if (!agents.includes("bmad-master.md")) {
        result.errors.push("bmad-master.md agent file is missing");
        result.isValid = false;
      }

      // Validate agent file structure
      for (const agent of agents) {
        await this.validateAgentFile(join(agentsDir, agent), result);
      }
    } catch (error) {
      result.errors.push(
        `Failed to read agents directory: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      result.isValid = false;
    }
  }

  private async validateAgentFile(
    agentPath: string,
    result: ValidationResult,
  ): Promise<void> {
    try {
      const content = await Deno.readTextFile(agentPath);

      // Check for YAML frontmatter
      if (!content.startsWith("---")) {
        result.warnings.push(
          `Agent file ${agentPath} missing YAML frontmatter`,
        );
        return;
      }

      // Extract and validate YAML frontmatter
      const yamlEnd = content.indexOf("---", 3);
      if (yamlEnd === -1) {
        result.warnings.push(
          `Agent file ${agentPath} has malformed YAML frontmatter`,
        );
        return;
      }

      const yamlContent = content.substring(3, yamlEnd).trim();
      const metadata = parseYaml(yamlContent) as Record<string, unknown>;

      // Check for required metadata fields
      const requiredFields = ["title", "description"];
      for (const field of requiredFields) {
        if (!(field in metadata)) {
          result.warnings.push(
            `Agent file ${agentPath} missing required field: ${field}`,
          );
        }
      }
    } catch (error) {
      result.warnings.push(
        `Failed to validate agent file ${agentPath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async checkOptionalFiles(
    installDir: string,
    result: ValidationResult,
  ): Promise<void> {
    for (const file of this.expectedStructure.optionalFiles) {
      const fullPath = join(installDir, file);
      if (!(await Deno.stat(fullPath))) {
        result.warnings.push(`Optional file missing: ${file}`);
      }
    }
  }

  async validateExpansionPack(packPath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    console.log(`Validating expansion pack at: ${packPath}`);

    // Check if pack directory exists
    if (!(await Deno.stat(packPath))) {
      result.errors.push(
        `Expansion pack directory does not exist: ${packPath}`,
      );
      result.isValid = false;
      return result;
    }

    // Check for required expansion pack files
    const requiredFiles = ["deno.json", "config.yaml"];
    for (const file of requiredFiles) {
      const fullPath = join(packPath, file);
      if (!(await Deno.stat(fullPath))) {
        result.errors.push(`Required expansion pack file missing: ${file}`);
        result.isValid = false;
      }
    }

    // Validate deno.json
    await this.validateDenoJson(packPath, result);

    // Validate config.yaml
    await this.validateExpansionConfig(packPath, result);

    return result;
  }

  private async validateDenoJson(
    packPath: string,
    result: ValidationResult,
  ): Promise<void> {
    const denoJsonPath = join(packPath, "deno.json");

    if (!(await Deno.stat(denoJsonPath))) {
      return; // Already handled in validateExpansionPack
    }

    try {
      const content = await Deno.readTextFile(denoJsonPath);
      const denoJson = JSON.parse(content);

      const requiredFields = ["name", "version", "description"];
      for (const field of requiredFields) {
        if (!(field in denoJson)) {
          result.errors.push(
            `Missing required field in deno.json: ${field}`,
          );
          result.isValid = false;
        }
      }
    } catch (error) {
      result.errors.push(
        `Invalid JSON in deno.json: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      result.isValid = false;
    }
  }

  private async validateExpansionConfig(
    packPath: string,
    result: ValidationResult,
  ): Promise<void> {
    const configPath = join(packPath, "config.yaml");

    if (!(await Deno.stat(configPath))) {
      return; // Already handled in validateExpansionPack
    }

    try {
      const content = await Deno.readTextFile(configPath);
      const config = parseYaml(content) as Record<string, unknown>;

      const requiredFields = ["name", "version", "agents"];
      for (const field of requiredFields) {
        if (!(field in config)) {
          result.errors.push(`Missing required field in config.yaml: ${field}`);
          result.isValid = false;
        }
      }
    } catch (error) {
      result.errors.push(
        `Invalid YAML in config.yaml: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      result.isValid = false;
    }
  }

  displayValidationResults(result: ValidationResult): void {
    if (result.isValid) {
      console.log(green("✅ Validation passed"));
    } else {
      console.log(red("❌ Validation failed"));
    }

    if (result.errors.length > 0) {
      console.log(red("\nErrors:"));
      result.errors.forEach((error) => console.log(red(`  • ${error}`)));
    }

    if (result.warnings.length > 0) {
      console.log(yellow("\nWarnings:"));
      result.warnings.forEach((warning) =>
        console.log(yellow(`  • ${warning}`))
      );
    }
  }

  async quickHealthCheck(installDir: string): Promise<boolean> {
    const coreFiles = [
      ".bmad-core/config/install.config.yaml",
      ".bmad-core/agents/bmad-master.md",
    ];

    for (const file of coreFiles) {
      const fullPath = join(installDir, file);
      if (!(await Deno.stat(fullPath))) {
        return false;
      }
    }

    return true;
  }
}

export default new InstallerValidator();

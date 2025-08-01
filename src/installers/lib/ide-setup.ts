import { ensureDir, exists, green, join, red, stringifyYaml, yellow } from "deps";

interface IdeConfig {
  name: string;
  configFiles: Array<{
    path: string;
    content: Record<string, unknown>;
    format: "json" | "yaml";
  }>;
  instructions?: string[];
}

class IdeSetup {
  private supportedIdes = [
    "cursor",
    "claude-code",
    "windsurf",
    "trae",
    "roo",
    "cline",
    "gemini",
    "github-copilot",
    "other",
  ];

  async configure(installDir: string, ide: string): Promise<void> {
    if (!this.supportedIdes.includes(ide)) {
      console.warn(
        yellow(
          `IDE '${ide}' is not officially supported, skipping configuration.`,
        ),
      );
      return;
    }

    console.log(`Configuring ${ide} IDE...`);

    try {
      const config = await this.getIdeConfig(ide);
      if (!config) {
        console.warn(
          yellow(`No configuration found for IDE '${ide}', skipping.`),
        );
        return;
      }

      await this.applyIdeConfig(installDir, config);
      console.log(green(`✅ ${ide} configuration applied successfully`));
    } catch (error) {
      console.error(
        red(`Failed to configure ${ide}:`),
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private getIdeConfig(ide: string): IdeConfig | null {
    // For now, return basic configurations for supported IDEs
    // In a full implementation, these would be loaded from config files

    const configs: Record<string, IdeConfig> = {
      "cursor": {
        name: "Cursor",
        configFiles: [
          {
            path: ".cursor/settings.json",
            content: {
              "bmad.enabled": true,
              "bmad.agentsPath": ".bmad-core/agents",
              "bmad.autoLoad": true,
            },
            format: "json",
          },
        ],
        instructions: [
          "BMad agents are now available in the .bmad-core/agents directory",
          "Use the BMad extension for enhanced AI agent functionality",
        ],
      },
      "claude-code": {
        name: "Claude Code",
        configFiles: [
          {
            path: ".claude/config.json",
            content: {
              "bmad": {
                "enabled": true,
                "agentsPath": ".bmad-core/agents",
              },
            },
            format: "json",
          },
        ],
      },
      "windsurf": {
        name: "Windsurf",
        configFiles: [
          {
            path: ".windsurf/settings.json",
            content: {
              "bmad.integration": true,
              "bmad.agentsDirectory": ".bmad-core/agents",
            },
            format: "json",
          },
        ],
      },
      "trae": {
        name: "Trae AI",
        configFiles: [
          {
            path: ".trae/bmad.yaml",
            content: {
              "bmad": {
                "enabled": true,
                "agents_path": ".bmad-core/agents",
                "auto_load": true,
              },
            },
            format: "yaml",
          },
        ],
      },
      "roo": {
        name: "Roo Cline",
        configFiles: [
          {
            path: ".roo/config.json",
            content: {
              "bmad": {
                "enabled": true,
                "agentsPath": ".bmad-core/agents",
              },
            },
            format: "json",
          },
        ],
      },
      "cline": {
        name: "Cline",
        configFiles: [
          {
            path: ".cline/bmad.json",
            content: {
              "bmadEnabled": true,
              "agentsDirectory": ".bmad-core/agents",
              "autoLoadAgents": true,
            },
            format: "json",
          },
        ],
      },
      "github-copilot": {
        name: "GitHub Copilot",
        configFiles: [
          {
            path: ".github/copilot/bmad.yml",
            content: {
              "bmad": {
                "enabled": true,
                "agents_directory": ".bmad-core/agents",
                "integration_mode": "enhanced",
              },
            },
            format: "yaml",
          },
        ],
      },
    };

    return configs[ide] || null;
  }

  private async applyIdeConfig(
    installDir: string,
    config: IdeConfig,
  ): Promise<void> {
    for (const configFile of config.configFiles) {
      const fullPath = join(installDir, configFile.path);

      // Ensure directory exists
      await ensureDir(join(fullPath, ".."));

      // Write config file
      let content: string;
      if (configFile.format === "json") {
        content = JSON.stringify(configFile.content, null, 2);
      } else {
        content = stringifyYaml(configFile.content);
      }

      await Deno.writeTextFile(fullPath, content);
      console.log(`Created ${configFile.path}`);
    }

    // Display instructions if any
    if (config.instructions) {
      console.log(`\n${config.name} Setup Instructions:`);
      config.instructions.forEach((instruction, index) => {
        console.log(`  ${index + 1}. ${instruction}`);
      });
    }
  }

  async detectInstalledIdes(installDir: string): Promise<string[]> {
    const detectedIdes: string[] = [];

    // Check for common IDE configuration directories
    const ideIndicators = [
      { ide: "cursor", paths: [".cursor", ".vscode"] },
      { ide: "claude-code", paths: [".claude"] },
      { ide: "windsurf", paths: [".windsurf"] },
      { ide: "trae", paths: [".trae"] },
      { ide: "roo", paths: [".roo"] },
      { ide: "cline", paths: [".cline"] },
      { ide: "github-copilot", paths: [".github"] },
    ];

    for (const indicator of ideIndicators) {
      for (const path of indicator.paths) {
        const fullPath = join(installDir, path);
        if (await exists(fullPath)) {
          detectedIdes.push(indicator.ide);
          break;
        }
      }
    }

    return detectedIdes;
  }

  getSupportedIdes(): string[] {
    return [...this.supportedIdes];
  }

  async validateIdeConfig(installDir: string, ide: string): Promise<boolean> {
    const config = await this.getIdeConfig(ide);
    if (!config) return false;

    // Check if all required config files exist
    for (const configFile of config.configFiles) {
      const fullPath = join(installDir, configFile.path);
      if (!(await exists(fullPath))) {
        return false;
      }
    }

    return true;
  }
}

export default new IdeSetup();

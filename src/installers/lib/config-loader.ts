import { exists, extractYamlFromAgent, join, parseYaml, ProjectPaths } from "deps";

interface ExpansionPack {
  id: string;
  shortTitle: string;
  version: string;
  description?: string;
  dependencies?: string[];
}

interface Agent {
  id: string;
  title: string;
  description?: string;
  dependencies?: Record<string, unknown>;
}

interface TeamConfig {
  title?: string;
  description?: string;
  agents?: string[];
}

class ConfigLoader {
  private configPath: string;
  private config: Record<string, unknown> | null = null;

  constructor() {
    this.configPath = join(
      ProjectPaths.src,
      "installers",
      "config",
      "install.config.yaml",
    );
  }

  async load(): Promise<Record<string, unknown>> {
    if (this.config) return this.config;

    try {
      const configContent = await Deno.readTextFile(this.configPath);
      this.config = parseYaml(configContent) as Record<string, unknown>;
      return this.config;
    } catch (error) {
      throw new Error(
        `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getInstallationOptions(): Promise<Record<string, unknown>> {
    const config = await this.load();
    return (config["installation-options"] as Record<string, unknown>) ||
      {} as Record<string, unknown>;
  }

  async getAvailableAgents(): Promise<Agent[]> {
    const agentsDir = join(ProjectPaths.core, "agents");
    const agents: Agent[] = [];

    try {
      if (await exists(agentsDir)) {
        for await (const entry of Deno.readDir(agentsDir)) {
          if (entry.isFile && entry.name.endsWith(".md")) {
            const agentPath = join(agentsDir, entry.name);
            const agentId = entry.name.replace(".md", "");

            try {
              const agentContent = await Deno.readTextFile(agentPath);
              const yamlString = extractYamlFromAgent(agentContent);

              if (yamlString) {
                const agentConfig = parseYaml(yamlString) as Record<
                  string,
                  unknown
                >;
                if (agentConfig && typeof agentConfig === "object") {
                  agents.push({
                    id: agentId,
                    title: typeof agentConfig.title === "string" ? agentConfig.title : agentId,
                    description: typeof agentConfig.description === "string"
                      ? agentConfig.description
                      : undefined,
                    dependencies:
                      agentConfig.dependencies && typeof agentConfig.dependencies === "object"
                        ? agentConfig.dependencies as Record<string, unknown>
                        : undefined,
                  });
                }
              }
            } catch (error) {
              console.warn(
                `Failed to parse agent ${agentId}:`,
                error instanceof Error ? error.message : String(error),
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(
        "Failed to read agents directory:",
        error instanceof Error ? error.message : String(error),
      );
    }

    return agents;
  }

  async getAvailableExpansionPacks(): Promise<ExpansionPack[]> {
    const expansionPacksDir = ProjectPaths.extensions;
    const packs: ExpansionPack[] = [];

    try {
      if (await exists(expansionPacksDir)) {
        for await (const entry of Deno.readDir(expansionPacksDir)) {
          if (entry.isDirectory) {
            const packId = entry.name;
            const configPath = join(expansionPacksDir, packId, "config.yaml");

            try {
              if (await exists(configPath)) {
                const configContent = await Deno.readTextFile(configPath);
                const config = parseYaml(configContent) as Record<string, unknown>;

                if (config && typeof config === "object") {
                  packs.push({
                    id: packId,
                    shortTitle: typeof config["short-title"] === "string"
                      ? config["short-title"]
                      : packId,
                    version: typeof config.version === "string" ? config.version : "1.0.0",
                    description: typeof config.description === "string"
                      ? config.description
                      : undefined,
                    dependencies: Array.isArray(config.dependencies)
                      ? config.dependencies
                      : undefined,
                  });
                }
              }
            } catch (error) {
              console.warn(
                `Failed to parse expansion pack ${packId}:`,
                error instanceof Error ? error.message : String(error),
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(
        "Failed to read expansion packs directory:",
        error instanceof Error ? error.message : String(error),
      );
    }

    return packs;
  }

  async getAgentDependencies(
    agentId: string,
  ): Promise<Record<string, unknown> | null> {
    const agentPath = this.getAgentPath(agentId);

    try {
      if (await exists(agentPath)) {
        const agentContent = await Deno.readTextFile(agentPath);
        const yamlString = extractYamlFromAgent(agentContent);

        if (yamlString) {
          const agentConfig = parseYaml(yamlString) as Record<string, unknown>;
          if (
            agentConfig && typeof agentConfig === "object" && agentConfig.dependencies &&
            typeof agentConfig.dependencies === "object"
          ) {
            return agentConfig.dependencies as Record<string, unknown>;
          }
          return null;
        }
      }
    } catch (error) {
      console.error(
        `Failed to get dependencies for agent ${agentId}:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    return null;
  }

  async getIdeConfiguration(ide: string): Promise<Record<string, unknown> | null> {
    const config = await this.load();
    const ides = config.ides as Record<string, unknown> | undefined;
    return ides?.[ide] as Record<string, unknown> || null;
  }



  getDistPath(): string {
    return join(ProjectPaths.root, "dist");
  }

  getAgentPath(agentId: string): string {
    return ProjectPaths.getAgentPath(agentId);
  }

  async getAvailableTeams(): Promise<
    Array<{ id: string; title: string; description?: string; agents: string[] }>
  > {
    const teamsDir = join(ProjectPaths.core, "teams");
    const teams: Array<
      { id: string; title: string; description?: string; agents: string[] }
    > = [];

    try {
      if (await exists(teamsDir)) {
        for await (const entry of Deno.readDir(teamsDir)) {
          if (entry.isFile && entry.name.endsWith(".yaml")) {
            const teamId = entry.name.replace(".yaml", "");
            const teamPath = join(teamsDir, entry.name);

            try {
              const teamContent = await Deno.readTextFile(teamPath);
              const teamConfig = parseYaml(teamContent) as TeamConfig;

              teams.push({
                id: teamId,
                title: teamConfig.title || teamId,
                description: teamConfig.description,
                agents: teamConfig.agents || [],
              });
            } catch (error) {
              console.warn(
                `Failed to parse team ${teamId}:`,
                error instanceof Error ? error.message : String(error),
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(
        "Failed to read teams directory:",
        error instanceof Error ? error.message : String(error),
      );
    }

    return teams;
  }

  getTeamPath(teamId: string): string {
    return join(ProjectPaths.core, "teams", `${teamId}.yaml`);
  }

  async getTeamDependencies(
    teamId: string,
  ): Promise<Record<string, unknown> | null> {
    const teamPath = this.getTeamPath(teamId);

    try {
      if (await exists(teamPath)) {
        const teamContent = await Deno.readTextFile(teamPath);
        const teamConfig = parseYaml(teamContent) as TeamConfig;

        // Aggregate dependencies from all agents in the team
        const aggregatedDeps: Record<string, unknown[]> = {};

        if (teamConfig.agents && Array.isArray(teamConfig.agents)) {
          for (const agentId of teamConfig.agents) {
            const agentDeps = await this.getAgentDependencies(agentId);
            if (agentDeps) {
              for (const [depType, deps] of Object.entries(agentDeps)) {
                if (!aggregatedDeps[depType]) {
                  aggregatedDeps[depType] = [];
                }
                if (Array.isArray(deps)) {
                  aggregatedDeps[depType].push(...deps);
                }
              }
            }
          }
        }

        // Remove duplicates
        for (const [depType, deps] of Object.entries(aggregatedDeps)) {
          if (Array.isArray(deps)) {
            aggregatedDeps[depType] = [...new Set(deps)];
          }
        }

        return aggregatedDeps;
      }
    } catch (error) {
      console.error(
        `Failed to get dependencies for team ${teamId}:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    return null;
  }
}

export default new ConfigLoader();

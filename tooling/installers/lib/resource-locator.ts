/**
 * Resource Locator - Centralized file path resolution and caching
 * Reduces duplicate file system operations and memory usage
 */

import { dirname, exists, expandGlob, extractYamlFromAgent, join, parseYaml } from "deps";

interface Agent {
  id: string;
  title: string;
  description?: string;
  dependencies?: Record<string, unknown>;
}

interface ExpansionPack {
  id: string;
  shortTitle: string;
  version: string;
  description?: string;
  dependencies?: string[];
}

class ResourceLocator {
  private _pathCache = new Map<string, string>();
  private _globCache = new Map<string, string[]>();
  private _bmadCorePath: string | null = null;
  private _expansionPacksPath: string | null = null;

  /**
   * Get the base path for src/core
   */
  getBmadCorePath(): string {
    if (!this._bmadCorePath) {
      const currentDir = new URL(".", import.meta.url).pathname;
      this._bmadCorePath = join(
        dirname(currentDir),
        "..",
        "..",
        "src",
        "core",
      );
    }
    return this._bmadCorePath;
  }

  /**
   * Get the base path for expansion packs
   */
  getExpansionPacksPath(): string {
    if (!this._expansionPacksPath) {
      const currentDir = new URL(".", import.meta.url).pathname;
      this._expansionPacksPath = join(
        dirname(currentDir),
        "..",
        "..",
        "..",
        "expansion-packs",
      );
    }
    return this._expansionPacksPath;
  }

  /**
   * Get the path for a specific expansion pack
   */
  getExpansionPackPath(packId: string): string {
    return join(this.getExpansionPacksPath(), packId);
  }

  /**
   * Find all files matching a pattern, with caching
   */
  async findFiles(
    pattern: string,
    options: { cwd?: string; nodir?: boolean } = {},
  ): Promise<string[]> {
    const cacheKey = `${pattern}:${JSON.stringify(options)}`;
    if (this._globCache.has(cacheKey)) {
      return this._globCache.get(cacheKey)!;
    }

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
        `Failed to find files with pattern ${pattern}:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    this._globCache.set(cacheKey, files);
    return files;
  }

  /**
   * Get the path for a specific agent
   */
  async getAgentPath(agentId: string): Promise<string | null> {
    const cacheKey = `agent:${agentId}`;
    if (this._pathCache.has(cacheKey)) {
      return this._pathCache.get(cacheKey)!;
    }

    const agentsDir = join(this.getBmadCorePath(), "agents");
    const agentPath = join(agentsDir, `${agentId}.md`);

    if (await exists(agentPath)) {
      this._pathCache.set(cacheKey, agentPath);
      return agentPath;
    }

    return null;
  }

  /**
   * Get all available agents
   */
  async getAvailableAgents(): Promise<Agent[]> {
    const agentsDir = join(this.getBmadCorePath(), "agents");
    const agents: Agent[] = [];

    try {
      for await (const entry of Deno.readDir(agentsDir)) {
        if (entry.isFile && entry.name.endsWith(".md")) {
          const agentId = entry.name.replace(".md", "");
          const agentPath = join(agentsDir, entry.name);

          try {
            const content = await Deno.readTextFile(agentPath);
            const yamlString = extractYamlFromAgent(content);

            if (yamlString) {
              const yamlData = parseYaml(yamlString) as Record<string, unknown>;
              if (yamlData && typeof yamlData === "object") {
                agents.push({
                  id: agentId,
                  title: typeof yamlData.title === "string" ? yamlData.title : agentId,
                  description: typeof yamlData.description === "string"
                    ? yamlData.description
                    : undefined,
                  dependencies: yamlData.dependencies && typeof yamlData.dependencies === "object"
                    ? yamlData.dependencies as Record<string, unknown>
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
    } catch (error) {
      console.error(
        "Failed to read agents directory:",
        error instanceof Error ? error.message : String(error),
      );
    }

    return agents;
  }

  /**
   * Get all available expansion packs
   */
  async getExpansionPacks(): Promise<ExpansionPack[]> {
    const expansionPacksDir = this.getExpansionPacksPath();
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

  /**
   * Get team configuration
   */
  async getTeamConfig(teamId: string): Promise<Record<string, unknown> | null> {
    const teamsDir = join(this.getBmadCorePath(), "teams");
    const teamPath = join(teamsDir, `${teamId}.yaml`);

    try {
      if (await exists(teamPath)) {
        const content = await Deno.readTextFile(teamPath);
        return parseYaml(content) as Record<string, unknown>;
      }
    } catch (error) {
      console.error(
        `Failed to read team config ${teamId}:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    return null;
  }

  /**
   * Get agent dependencies
   */
  async getAgentDependencies(
    agentId: string,
  ): Promise<Record<string, unknown> | null> {
    const agentPath = await this.getAgentPath(agentId);
    if (!agentPath) return null;

    try {
      const content = await Deno.readTextFile(agentPath);
      const yamlString = extractYamlFromAgent(content);
      if (yamlString) {
        const yamlData = parseYaml(yamlString) as Record<string, unknown>;
        if (
          yamlData && typeof yamlData === "object" && yamlData.dependencies &&
          typeof yamlData.dependencies === "object"
        ) {
          return yamlData.dependencies as Record<string, unknown>;
        }
        return null;
      }
      return null;
    } catch (error) {
      console.error(
        `Failed to get dependencies for agent ${agentId}:`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this._pathCache.clear();
    this._globCache.clear();
  }

  /**
   * Get IDE configuration
   */
  async getIdeConfig(ideId: string): Promise<Record<string, unknown> | null> {
    const ideConfigsDir = join(this.getBmadCorePath(), "ide-configs");
    const ideConfigPath = join(ideConfigsDir, `${ideId}.yaml`);

    try {
      if (await exists(ideConfigPath)) {
        const content = await Deno.readTextFile(ideConfigPath);
        return parseYaml(content) as Record<string, unknown>;
      }
    } catch (error) {
      console.error(
        `Failed to read IDE config ${ideId}:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    return null;
  }
}

const resourceLocator = new ResourceLocator();

export default resourceLocator;

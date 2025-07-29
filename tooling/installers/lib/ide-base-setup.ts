/**
 * Base IDE Setup - Common functionality for all IDE setups
 * Reduces duplication and provides shared methods
 */

import { exists, extractYamlFromAgent, join, parseYaml } from "deps";

interface ExpansionPack {
  id: string;
  name: string;
  version: string;
  path: string;
  agents?: string[];
}

interface AgentMetadata {
  title?: string;
  description?: string;
  dependencies?: string[];
  [key: string]: unknown;
}

class BaseIdeSetup {
  private _agentCache: Map<string, unknown>;
  private _pathCache: Map<string, string>;

  constructor() {
    this._agentCache = new Map();
    this._pathCache = new Map();
  }

  /**
   * Get all agent IDs with caching
   */
  async getAllAgentIds(installDir: string): Promise<string[]> {
    const cacheKey = `all-agents:${installDir}`;
    if (this._agentCache.has(cacheKey)) {
      return this._agentCache.get(cacheKey) as string[];
    }

    const allAgents = new Set<string>();

    // Get core agents
    const coreAgents = await this.getCoreAgentIds(installDir);
    coreAgents.forEach((id) => allAgents.add(id));

    // Get expansion pack agents
    const expansionPacks = await this.getInstalledExpansionPacks(installDir);
    for (const pack of expansionPacks) {
      const packAgents = await this.getExpansionPackAgents(pack.path);
      packAgents.forEach((id) => allAgents.add(id));
    }

    const result = Array.from(allAgents);
    this._agentCache.set(cacheKey, result as unknown);
    return result;
  }

  /**
   * Get core agent IDs
   */
  async getCoreAgentIds(installDir: string): Promise<string[]> {
    const coreAgents: string[] = [];
    const corePaths = [
      join(installDir, ".bmad-core/agents"),
      join(installDir, "src/core/agents"),
    ];

    for (const agentsPath of corePaths) {
      if (await exists(agentsPath)) {
        try {
          for await (const entry of Deno.readDir(agentsPath)) {
            if (entry.isFile && entry.name.endsWith(".md")) {
              const agentId = entry.name.replace(".md", "");
              coreAgents.push(agentId);
            }
          }
        } catch (error) {
          console.warn(`Failed to read agents from ${agentsPath}:`, error);
        }
      }
    }

    return coreAgents;
  }

  /**
   * Find the path to a specific agent
   */
  async findAgentPath(
    agentId: string,
    installDir: string,
  ): Promise<string | null> {
    const cacheKey = `agent-path:${agentId}:${installDir}`;
    if (this._pathCache.has(cacheKey)) {
      return this._pathCache.get(cacheKey) || null;
    }

    const searchPaths = [
      join(installDir, ".bmad-core/agents", `${agentId}.md`),
      join(installDir, "src/core/agents", `${agentId}.md`),
    ];

    // Also check expansion packs
    const expansionPacks = await this.getInstalledExpansionPacks(installDir);
    for (const pack of expansionPacks) {
      searchPaths.push(join(pack.path, "agents", `${agentId}.md`));
    }

    for (const path of searchPaths) {
      if (await exists(path)) {
        this._pathCache.set(cacheKey, path);
        return path;
      }
    }

    return null;
  }

  /**
   * Get agent title from metadata
   */
  async getAgentTitle(agentId: string, installDir: string): Promise<string> {
    const agentPath = await this.findAgentPath(agentId, installDir);
    if (!agentPath) {
      return agentId; // Fallback to ID if not found
    }

    try {
      const content = await Deno.readTextFile(agentPath);
      const yamlContent = extractYamlFromAgent(content);
      if (yamlContent) {
        const metadata = parseYaml(yamlContent) as AgentMetadata;
        return metadata.title || agentId;
      }
    } catch (error) {
      console.warn(`Failed to extract title from ${agentPath}:`, error);
    }

    return agentId;
  }

  /**
   * Get installed expansion packs
   */
  async getInstalledExpansionPacks(
    installDir: string,
  ): Promise<ExpansionPack[]> {
    const expansionPacks: ExpansionPack[] = [];
    const expansionPacksPath = join(installDir, ".bmad-core/expansion-packs");

    if (!(await exists(expansionPacksPath))) {
      return expansionPacks;
    }

    try {
      for await (const entry of Deno.readDir(expansionPacksPath)) {
        if (entry.isDirectory) {
          const packPath = join(expansionPacksPath, entry.name);
          const configPath = join(packPath, "config.yaml");
          const packageJsonPath = join(packPath, "package.json");

          const packInfo: ExpansionPack = {
            id: entry.name,
            name: entry.name,
            version: "1.0.0",
            path: packPath,
          };

          // Try to read config.yaml first
          if (await exists(configPath)) {
            try {
              const configContent = await Deno.readTextFile(configPath);
              const config = parseYaml(configContent) as Record<string, unknown>;
              packInfo.name = typeof config.name === "string" ? config.name : entry.name;
              packInfo.version = typeof config.version === "string" ? config.version : "1.0.0";
            } catch (error) {
              console.warn(
                `Failed to read config for pack ${entry.name}:`,
                error,
              );
            }
          } // Fallback to package.json
          else if (await exists(packageJsonPath)) {
            try {
              const packageContent = await Deno.readTextFile(packageJsonPath);
              const packageJson = JSON.parse(packageContent);
              packInfo.name = packageJson.name || entry.name;
              packInfo.version = packageJson.version || "1.0.0";
            } catch (error) {
              console.warn(
                `Failed to read package.json for pack ${entry.name}:`,
                error,
              );
            }
          }

          expansionPacks.push(packInfo);
        }
      }
    } catch (error) {
      console.warn(
        `Failed to read expansion packs from ${expansionPacksPath}:`,
        error,
      );
    }

    return expansionPacks;
  }

  /**
   * Get agents from an expansion pack
   */
  async getExpansionPackAgents(packPath: string): Promise<string[]> {
    const agents: string[] = [];
    const agentsPath = join(packPath, "agents");

    if (await exists(agentsPath)) {
      try {
        for await (const entry of Deno.readDir(agentsPath)) {
          if (entry.isFile && entry.name.endsWith(".md")) {
            const agentId = entry.name.replace(".md", "");
            agents.push(agentId);
          }
        }
      } catch (error) {
        console.warn(`Failed to read agents from ${agentsPath}:`, error);
      }
    }

    return agents;
  }

  /**
   * Create agent rule content for IDE configuration
   */
  async createAgentRuleContent(
    agentId: string,
    agentPath: string,
    installDir: string,
    format = "mdc",
  ): Promise<string> {
    try {
      const content = await Deno.readTextFile(agentPath);
      const yamlContent = extractYamlFromAgent(content);
      let metadata: AgentMetadata = {};

      if (yamlContent) {
        metadata = parseYaml(yamlContent) as AgentMetadata;
      }

      const title = metadata.title || agentId;
      const description = metadata.description || `Agent: ${agentId}`;
      const relativePath = agentPath.replace(installDir, "").replace(/^\//, "");

      if (format === "mdc") {
        return `{
  "name": "${agentId}",
  "description": "${description}",
  "path": "${relativePath}",
  "title": "${title}"
}`;
      } else if (format === "yaml") {
        return `name: ${agentId}
description: "${description}"
path: "${relativePath}"
title: "${title}"`;
      } else {
        // Default JSON format
        return JSON.stringify(
          {
            name: agentId,
            description,
            path: relativePath,
            title,
          },
          null,
          2,
        );
      }
    } catch (error) {
      console.warn(`Failed to create rule content for ${agentId}:`, error);
      return `{
  "name": "${agentId}",
  "description": "Agent: ${agentId}",
  "path": "agents/${agentId}.md",
  "title": "${agentId}"
}`;
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this._agentCache.clear();
    this._pathCache.clear();
  }
}

export default BaseIdeSetup;

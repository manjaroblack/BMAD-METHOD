import { join, parseYaml } from "deps";

interface AgentConfig {
  dependencies?: {
    [key: string]: string[];
  };
  agents?: string[];
  [key: string]: unknown;
}

interface Resource {
  type: string;
  id: string;
  path: string;
  content: string;
}

interface Agent {
  id: string;
  path: string;
  content: string;
  config: AgentConfig;
}

interface AgentDependencies {
  agent: Agent;
  resources: Resource[];
}

interface TeamDependencies {
  team: Agent;
  agents: Agent[];
  resources: Map<string, Resource>;
}

export class DependencyResolver {
  private rootDir: string;
  private srcCore: string;
  private srcAgents: string;
  private common: string;
  private cache: Map<string, unknown>;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.srcCore = join(rootDir, "src", "core");
    this.srcAgents = join(rootDir, "src", "agents");
    this.common = join(rootDir, "common");
    this.cache = new Map();
  }

  async resolveAgentDependencies(agentId: string): Promise<AgentDependencies> {
    const agentPath = join(this.srcAgents, `${agentId}.yaml`);
    const agentContent = await Deno.readTextFile(agentPath);

    // Load YAML content directly since agents are now .yaml files
    const agentConfig = parseYaml(agentContent) as AgentConfig;

    const dependencies: AgentDependencies = {
      agent: {
        id: agentId,
        path: agentPath,
        content: agentContent,
        config: agentConfig,
      },
      resources: [],
    };

    // Personas are now embedded in agent configs, no need to resolve separately

    // Resolve other dependencies
    const depTypes = ["tasks", "templates", "checklists", "data", "utils"];
    for (const depType of depTypes) {
      const deps = agentConfig.dependencies?.[depType] || [];
      for (const depId of deps) {
        const resource = await this.loadResource(depType, depId);
        if (resource) dependencies.resources.push(resource);
      }
    }

    return dependencies;
  }

  async resolveTeamDependencies(teamId: string): Promise<TeamDependencies> {
    const teamPath = join(this.srcAgents, "teams", `${teamId}.yaml`);
    const teamContent = await Deno.readTextFile(teamPath);
    const teamConfig = parseYaml(teamContent) as AgentConfig;

    const dependencies: TeamDependencies = {
      team: {
        id: teamId,
        path: teamPath,
        content: teamContent,
        config: teamConfig,
      },
      agents: [],
      resources: new Map(), // Use Map to deduplicate resources
    };

    // Always add bmad-orchestrator-config agent first if it's a team
    const bmadAgent = await this.resolveAgentDependencies(
      "bmad-orchestrator-config",
    );
    dependencies.agents.push(bmadAgent.agent);
    bmadAgent.resources.forEach((res) => {
      dependencies.resources.set(res.path, res);
    });

    // Resolve all agents in the team
    let agentsToResolve = teamConfig.agents || [];

    // Handle wildcard "*" - include all agents except bmad-master
    if (agentsToResolve.includes("*")) {
      const allAgents = await this.listAgents();
      // Remove wildcard and add all agents except those already in the list and bmad-master-config
      agentsToResolve = agentsToResolve.filter((a) => a !== "*");
      for (const agent of allAgents) {
        if (
          !agentsToResolve.includes(agent) && agent !== "bmad-master-config"
        ) {
          agentsToResolve.push(agent);
        }
      }
    }

    for (const agentId of agentsToResolve) {
      if (agentId === "bmad-orchestrator" || agentId === "bmad-master") {
        continue; // Already added or excluded
      }
      const agentDeps = await this.resolveAgentDependencies(agentId);
      dependencies.agents.push(agentDeps.agent);

      // Add resources with deduplication
      agentDeps.resources.forEach((res) => {
        dependencies.resources.set(res.path, res);
      });
    }

    // Convert Map values back to array
    return {
      ...dependencies,
      resources: dependencies.resources,
    };
  }

  async loadResource(type: string, id: string): Promise<Resource | null> {
    const cacheKey = `${type}:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as Resource | null;
    }

    try {
      let resourcePath: string;

      // Determine the correct path based on resource type
      switch (type) {
        case "tasks":
        case "templates":
        case "checklists":
          resourcePath = join(this.srcCore, type, `${id}.md`);
          break;
        case "data":
          resourcePath = join(this.common, "data", `${id}.yaml`);
          break;
        case "utils":
          resourcePath = join(this.common, "utils", `${id}.md`);
          break;
        default:
          console.warn(`Unknown resource type: ${type}`);
          return null;
      }

      const content = await Deno.readTextFile(resourcePath);
      const resource: Resource = {
        type,
        id,
        path: resourcePath,
        content,
      };

      this.cache.set(cacheKey, resource);
      return resource;
    } catch (error) {
      console.warn(`Failed to load ${type} resource '${id}':`, (error as Error).message);
      return null;
    }
  }

  async listAgents(): Promise<string[]> {
    try {
      const agents: string[] = [];
      for await (const entry of Deno.readDir(this.srcAgents)) {
        if (entry.isFile && entry.name.endsWith(".yaml")) {
          agents.push(entry.name.replace(".yaml", ""));
        }
      }
      return agents.sort();
    } catch (error) {
      console.warn("Failed to list agents:", (error as Error).message);
      return [];
    }
  }

  async listTeams(): Promise<string[]> {
    try {
      const teamsDir = join(this.srcAgents, "teams");
      const teams: string[] = [];
      for await (const entry of Deno.readDir(teamsDir)) {
        if (entry.isFile && entry.name.endsWith(".yaml")) {
          teams.push(entry.name.replace(".yaml", ""));
        }
      }
      return teams.sort();
    } catch (error) {
      console.warn("Failed to list teams:", (error as Error).message);
      return [];
    }
  }
}

import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml";

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.srcCore = path.join(rootDir, "src", "core");
    this.srcAgents = path.join(rootDir, "src", "agents");
    this.common = path.join(rootDir, "common");
    this.cache = new Map();
  }

  async resolveAgentDependencies(agentId) {
    const agentPath = path.join(this.srcAgents, `${agentId}.yaml`);
    const agentContent = await fs.readFile(agentPath, "utf8");

    // Load YAML content directly since agents are now .yaml files
    const agentConfig = yaml.load(agentContent);

    const dependencies = {
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

  async resolveTeamDependencies(teamId) {
    const teamPath = path.join(this.srcAgents, "teams", `${teamId}.yaml`);
    const teamContent = await fs.readFile(teamPath, "utf8");
    const teamConfig = yaml.load(teamContent);

    const dependencies = {
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

    // Resolve workflows
    for (const workflowId of teamConfig.workflows || []) {
      const resource = await this.loadResource("workflows", workflowId);
      if (resource) dependencies.resources.set(resource.path, resource);
    }

    // Convert Map back to array
    dependencies.resources = Array.from(dependencies.resources.values());

    return dependencies;
  }

  async loadResource(type, id) {
    const cacheKey = `${type}#${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let content = null;
      let filePath = null;

      // First try src/core
      try {
        filePath = path.join(this.srcCore, type, id);
        content = await fs.readFile(filePath, "utf8");
      } catch (_error) {
        // If not found in src/core, try common folder
        try {
          filePath = path.join(this.common, type, id);
          content = await fs.readFile(filePath, "utf8");
        } catch (_error) {
          // File not found in either location
        }
      }

      if (!content) {
        console.warn(`Resource not found: ${type}/${id}`);
        return null;
      }

      const resource = {
        type,
        id,
        path: filePath,
        content,
      };

      this.cache.set(cacheKey, resource);
      return resource;
    } catch (error) {
      console.error(`Error loading resource ${type}/${id}:`, error.message);
      return null;
    }
  }

  async listAgents() {
    try {
      const files = await fs.readdir(this.srcAgents);
      return files
        .filter((f) => f.endsWith(".yaml"))
        .map((f) => f.replace(".yaml", ""));
    } catch (_error) {
      return [];
    }
  }

  async listTeams() {
    try {
      const files = await fs.readdir(path.join(this.srcAgents, "teams"));
      return files
        .filter((f) => f.endsWith(".yaml"))
        .map((f) => f.replace(".yaml", ""));
    } catch (_error) {
      return [];
    }
  }
}

export default DependencyResolver;

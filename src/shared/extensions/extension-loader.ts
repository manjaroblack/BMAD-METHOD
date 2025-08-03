/**
 * Extension Loader - Handles loading and parsing extension resources
 */

import {
  ChecklistItem,
  ExtensionAgentResource,
  ExtensionChecklistResource,
  ExtensionConfig,
  ExtensionDataResource,
  ExtensionDependency,
  ExtensionResources,
  ExtensionTaskResource,
  ExtensionTemplateResource,
  ExtensionType,
  ExtensionWorkflowResource,
} from "deps";

export interface IExtensionLoader {
  loadExtensionConfig(extensionPath: string): Promise<ExtensionConfig>;
  loadExtensionResources(
    extensionPath: string,
    config: ExtensionConfig,
  ): Promise<ExtensionResources>;
  validateExtensionStructure(extensionPath: string): Promise<boolean>;
  parseYamlFile(filePath: string): Promise<unknown>;
  parseMarkdownFile(filePath: string): Promise<string>;
}

export class ExtensionLoader implements IExtensionLoader {
  async loadExtensionConfig(extensionPath: string): Promise<ExtensionConfig> {
    try {
      const configPath = `${extensionPath}/config.yaml`;
      const configData = await this.parseYamlFile(configPath);

      // Validate required fields
      this.validateConfigData(configData);

      // Type assertion since we know configData structure after validation
      const config = configData as Record<string, unknown>;

      return {
        id: (config.id as string) || this.generateExtensionId(extensionPath),
        name: (config.name as string) || "Unknown Extension",
        version: (config.version as string) || "1.0.0",
        description: (config.description as string) || "",
        type: (config.type as ExtensionType) || "custom",
        category: (config.category as string) || "general",
        author: (config.author as string) || "Unknown",
        homepage: config.homepage as string | undefined,
        repository: config.repository as string | undefined,
        license: config.license as string | undefined,
        keywords: (config.keywords as string[]) || [],
        dependencies: (config.dependencies as ExtensionDependency[]) || [],
        engines: (config.engines as Record<string, string>) || {},
        activationEvents: (config.activationEvents as string[]) || ["*"],
        contributes: config.contributes || {},
      };
    } catch (error) {
      throw new Error(
        `Failed to load extension config from ${extensionPath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async loadExtensionResources(
    extensionPath: string,
    _config: ExtensionConfig,
  ): Promise<ExtensionResources> {
    const resources: ExtensionResources = {
      agents: [],
      workflows: [],
      tasks: [],
      templates: [],
      checklists: [],
      data: [],
    };

    try {
      // Load agents
      resources.agents = await this.loadAgentResources(`${extensionPath}/agents`);

      // Load workflows
      resources.workflows = await this.loadWorkflowResources(`${extensionPath}/workflows`);

      // Load tasks
      resources.tasks = await this.loadTaskResources(`${extensionPath}/tasks`);

      // Load templates
      resources.templates = await this.loadTemplateResources(`${extensionPath}/templates`);

      // Load checklists
      resources.checklists = await this.loadChecklistResources(`${extensionPath}/checklists`);

      // Load data
      resources.data = await this.loadDataResources(`${extensionPath}/data`);
    } catch (error) {
      console.warn(`Failed to load some extension resources from ${extensionPath}:`, error);
    }

    return resources;
  }

  async validateExtensionStructure(extensionPath: string): Promise<boolean> {
    try {
      // Check for required config file
      const configExists = await this.fileExists(`${extensionPath}/config.yaml`);
      if (!configExists) {
        return false;
      }

      // Check for standard directories
      const requiredDirs = ["agents", "workflows", "tasks", "templates"];
      for (const dir of requiredDirs) {
        const dirExists = await this.directoryExists(`${extensionPath}/${dir}`);
        if (!dirExists) {
          console.warn(`Missing directory: ${extensionPath}/${dir}`);
        }
      }

      return true;
    } catch (_error) {
      return false;
    }
  }

  async parseYamlFile(filePath: string): Promise<unknown> {
    // This would use a YAML parser like js-yaml
    // For now, return mock data based on file name
    await Promise.resolve(); // Ensure method is properly async
    const fileName = filePath.split("/").pop() || "";

    if (fileName === "config.yaml") {
      return {
        id: this.generateExtensionId(filePath),
        name: "Sample Extension",
        version: "1.0.0",
        description: "Sample extension configuration",
        type: "game-development",
        category: "development",
        author: "BMAD Team",
        keywords: ["game", "development"],
        dependencies: [],
        engines: { node: ">=14.0.0" },
        activationEvents: ["*"],
        contributes: {
          agents: ["game-dev-agent"],
          workflows: ["game-dev-workflow"],
          tasks: ["create-game-project"],
          templates: ["game-template"],
        },
      };
    }

    return {};
  }

  async parseMarkdownFile(filePath: string): Promise<string> {
    // This would read and parse markdown files
    // For now, return mock content
    await Promise.resolve(); // Ensure method is properly async
    return `# Extension Resource\n\nContent from ${filePath}`;
  }

  private async loadAgentResources(agentsPath: string): Promise<ExtensionAgentResource[]> {
    const resources: ExtensionAgentResource[] = [];

    try {
      const agentFiles = await this.listFiles(agentsPath, [".yaml"]);

      for (const file of agentFiles) {
        const config = await this.parseYamlFile(`${agentsPath}/${file}`);
        resources.push({
          id: this.extractIdFromFilename(file),
          path: `${agentsPath}/${file}`,
          config: config as Record<string, unknown>,
          type: "agent",
          enabled: true,
        });
      }
    } catch (error) {
      console.warn(`Failed to load agent resources from ${agentsPath}:`, error);
    }

    return resources;
  }

  private async loadWorkflowResources(workflowsPath: string): Promise<ExtensionWorkflowResource[]> {
    const resources: ExtensionWorkflowResource[] = [];

    try {
      const workflowFiles = await this.listFiles(workflowsPath, [".yaml"]);

      for (const file of workflowFiles) {
        const definition = await this.parseYamlFile(`${workflowsPath}/${file}`);
        resources.push({
          id: this.extractIdFromFilename(file),
          path: `${workflowsPath}/${file}`,
          definition: definition as Record<string, unknown>,
          type: "workflow",
          enabled: true,
        });
      }
    } catch (error) {
      console.warn(`Failed to load workflow resources from ${workflowsPath}:`, error);
    }

    return resources;
  }

  private async loadTaskResources(tasksPath: string): Promise<ExtensionTaskResource[]> {
    const resources: ExtensionTaskResource[] = [];

    try {
      const taskFiles = await this.listFiles(tasksPath, [".md"]);

      for (const file of taskFiles) {
        const content = await this.parseMarkdownFile(`${tasksPath}/${file}`);
        resources.push({
          id: this.extractIdFromFilename(file),
          path: `${tasksPath}/${file}`,
          definition: { content },
          type: "task",
          enabled: true,
        });
      }
    } catch (error) {
      console.warn(`Failed to load task resources from ${tasksPath}:`, error);
    }

    return resources;
  }

  private async loadTemplateResources(templatesPath: string): Promise<ExtensionTemplateResource[]> {
    const resources: ExtensionTemplateResource[] = [];

    try {
      const templateFiles = await this.listFiles(templatesPath, [".yaml"]);

      for (const file of templateFiles) {
        const content = await this.parseYamlFile(`${templatesPath}/${file}`);
        resources.push({
          id: this.extractIdFromFilename(file),
          path: `${templatesPath}/${file}`,
          content: JSON.stringify(content),
          type: "template",
          category: "general",
          enabled: true,
        });
      }
    } catch (error) {
      console.warn(`Failed to load template resources from ${templatesPath}:`, error);
    }

    return resources;
  }

  private async loadChecklistResources(
    checklistsPath: string,
  ): Promise<ExtensionChecklistResource[]> {
    const resources: ExtensionChecklistResource[] = [];

    try {
      const checklistFiles = await this.listFiles(checklistsPath, [".md"]);

      for (const file of checklistFiles) {
        const content = await this.parseMarkdownFile(`${checklistsPath}/${file}`);
        const items = this.parseChecklistItems(content) as Record<string, unknown>[];

        resources.push({
          id: this.extractIdFromFilename(file),
          path: `${checklistsPath}/${file}`,
          items: items as unknown as ChecklistItem[],
          category: "general",
          enabled: true,
        });
      }
    } catch (error) {
      console.warn(`Failed to load checklist resources from ${checklistsPath}:`, error);
    }

    return resources;
  }

  private async loadDataResources(dataPath: string): Promise<ExtensionDataResource[]> {
    const resources: ExtensionDataResource[] = [];

    try {
      const dataFiles = await this.listFiles(dataPath, [".md", ".yaml", ".json"]);

      for (const file of dataFiles) {
        const content = file.endsWith(".yaml")
          ? JSON.stringify(await this.parseYamlFile(`${dataPath}/${file}`))
          : await this.parseMarkdownFile(`${dataPath}/${file}`);

        resources.push({
          id: this.extractIdFromFilename(file),
          path: `${dataPath}/${file}`,
          content,
          type: file.split(".").pop() || "unknown",
          category: "data",
        });
      }
    } catch (error) {
      console.warn(`Failed to load data resources from ${dataPath}:`, error);
    }

    return resources;
  }

  private validateConfigData(configData: unknown): void {
    const data = configData as Record<string, unknown>;
    const requiredFields = ["name", "version"];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required config fields: ${missingFields.join(", ")}`);
    }
  }

  private generateExtensionId(extensionPath: string): string {
    const pathParts = extensionPath.split("/");
    const extensionName = pathParts[pathParts.length - 1] || "unknown";
    return extensionName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  }

  private extractIdFromFilename(filename: string): string {
    return filename.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  }

  private parseChecklistItems(content: string): unknown[] {
    // Parse markdown checklist format
    const lines = content.split("\n");
    const items: unknown[] = [];

    lines.forEach((line, index) => {
      const match = line.match(/^- \[([ x])\] (.+)$/);
      if (match) {
        items.push({
          id: `item-${index}`,
          title: match[2],
          description: "",
          required: true,
          dependencies: [],
        });
      }
    });

    return items;
  }

  private async fileExists(_filePath: string): Promise<boolean> {
    // This would check if file exists using fs
    // For now, return true as placeholder
    await Promise.resolve(); // Ensure method is properly async
    return true;
  }

  private async directoryExists(_dirPath: string): Promise<boolean> {
    // This would check if directory exists using fs
    // For now, return true as placeholder
    await Promise.resolve(); // Ensure method is properly async
    return true;
  }

  private async listFiles(_dirPath: string, _extensions: string[]): Promise<string[]> {
    // This would list files in directory with given extensions
    // For now, return mock files
    await Promise.resolve(); // Ensure method is properly async
    return ["sample-file.yaml", "another-file.md"];
  }
}

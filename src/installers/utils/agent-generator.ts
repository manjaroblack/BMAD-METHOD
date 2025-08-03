/**
 * Agent Generator Utility for BMAD-METHOD
 * Generates agent configurations and scripts during installation
 */

import { ensureDir, join, safeExists } from "deps";
import type { IFileSystemService, ILogger } from "deps";

// Manifest data interfaces
export interface ManifestData {
  version?: string;
  workflows?: WorkflowData[];
  checklists?: ChecklistData[];
  tasks?: TaskData[];
  templates?: TemplateData[];
}

export interface WorkflowData {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface ChecklistData {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface TaskData {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface TemplateData {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface AgentConfig {
  name: string;
  type: "workflow" | "checklist" | "task" | "template";
  description: string;
  category?: string;
  tags?: string[];
  version?: string;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

export interface AgentGenerationOptions {
  outputDir: string;
  templateDir?: string;
  overwrite?: boolean;
  validate?: boolean;
  generateDocs?: boolean;
}

export interface AgentTemplate {
  id: string;
  name: string;
  type: AgentConfig["type"];
  template: string;
  placeholders: string[];
  requiredFields: string[];
  defaultValues?: Record<string, unknown>;
}

export class AgentGenerator {
  private predefinedTemplates: Map<string, AgentTemplate> = new Map();

  constructor(
    private fileSystem: IFileSystemService,
    private logger?: ILogger,
  ) {
    this.initializePredefinedTemplates();
  }

  /**
   * Generate agent from configuration
   */
  async generateAgent(
    config: AgentConfig,
    options: AgentGenerationOptions,
  ): Promise<string> {
    this.logger?.info("Generating agent", {
      agent: config.name,
      type: config.type,
      outputDir: options.outputDir,
    });

    try {
      // Validate configuration
      if (options.validate) {
        this.validateAgentConfig(config);
      }

      // Get template
      const template = this.getTemplate(config.type);

      // Generate agent content
      const agentContent = this.renderTemplate(template, config);

      // Determine output path
      const fileName = this.generateFileName(config);
      const outputPath = join(options.outputDir, fileName);

      // Check if file exists and handle overwrite
      if (!options.overwrite && await safeExists(outputPath)) {
        throw new Error(`Agent file already exists: ${outputPath}`);
      }

      // Ensure output directory exists
      await ensureDir(options.outputDir);

      // Write agent file
      await Deno.writeTextFile(outputPath, agentContent);

      // Generate documentation if requested
      if (options.generateDocs) {
        await this.generateAgentDocumentation(config, options.outputDir);
      }

      this.logger?.info("Agent generated successfully", {
        agent: config.name,
        type: config.type,
        outputPath,
      });

      return outputPath;
    } catch (error) {
      this.logger?.error("Failed to generate agent", error as Error, {
        agent: config.name,
        type: config.type,
      });
      throw error;
    }
  }

  /**
   * Generate multiple agents from configurations
   */
  async generateAgents(
    configs: AgentConfig[],
    options: AgentGenerationOptions,
  ): Promise<string[]> {
    this.logger?.info("Generating multiple agents", {
      agentCount: configs.length,
      outputDir: options.outputDir,
    });

    const generatedPaths: string[] = [];

    try {
      for (const config of configs) {
        try {
          const path = await this.generateAgent(config, options);
          generatedPaths.push(path);
        } catch (error) {
          this.logger?.warn("Failed to generate individual agent", {
            agent: config.name,
            error: (error as Error).message,
          });

          // Continue with other agents unless configured to fail fast
          if (options.validate) {
            throw error;
          }
        }
      }

      this.logger?.info("Multiple agents generation completed", {
        requestedCount: configs.length,
        generatedCount: generatedPaths.length,
        outputDir: options.outputDir,
      });

      return generatedPaths;
    } catch (error) {
      this.logger?.error("Failed to generate agents", error as Error, {
        requestedCount: configs.length,
        generatedCount: generatedPaths.length,
      });
      throw error;
    }
  }

  /**
   * Generate agents from expansion pack manifest
   */
  async generateFromManifest(
    manifestPath: string,
    options: AgentGenerationOptions,
  ): Promise<string[]> {
    this.logger?.info("Generating agents from manifest", {
      manifestPath,
      outputDir: options.outputDir,
    });

    try {
      // Read manifest file
      const manifestContent = await Deno.readTextFile(manifestPath);
      const manifest = JSON.parse(manifestContent) as ManifestData;

      // Extract agent configurations
      const agentConfigs: AgentConfig[] = [];

      // Parse different agent types from manifest
      if (manifest.workflows) {
        manifest.workflows.forEach((workflow: WorkflowData) => {
          agentConfigs.push({
            name: workflow.name,
            type: "workflow",
            description: workflow.description || "",
            category: workflow.category,
            tags: workflow.tags,
            version: manifest.version,
            metadata: workflow,
          });
        });
      }

      if (manifest.checklists) {
        manifest.checklists.forEach((checklist: ChecklistData) => {
          agentConfigs.push({
            name: checklist.name,
            type: "checklist",
            description: checklist.description || "",
            category: checklist.category,
            tags: checklist.tags,
            version: manifest.version,
            metadata: checklist,
          });
        });
      }

      if (manifest.tasks) {
        manifest.tasks.forEach((task: TaskData) => {
          agentConfigs.push({
            name: task.name,
            type: "task",
            description: task.description || "",
            category: task.category,
            tags: task.tags,
            version: manifest.version,
            metadata: task,
          });
        });
      }

      if (manifest.templates) {
        manifest.templates.forEach((template: TemplateData) => {
          agentConfigs.push({
            name: template.name,
            type: "template",
            description: template.description || "",
            category: template.category,
            tags: template.tags,
            version: manifest.version,
            metadata: template,
          });
        });
      }

      // Generate agents
      const generatedPaths = await this.generateAgents(agentConfigs, options);

      this.logger?.info("Agents generated from manifest", {
        manifestPath,
        agentCount: agentConfigs.length,
        generatedCount: generatedPaths.length,
      });

      return generatedPaths;
    } catch (error) {
      this.logger?.error(
        "Failed to generate agents from manifest",
        error as Error,
        {
          manifestPath,
        },
      );
      throw error;
    }
  }

  /**
   * Validate agent configuration
   */
  private validateAgentConfig(config: AgentConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim() === "") {
      errors.push("Agent name is required");
    }

    if (!config.type) {
      errors.push("Agent type is required");
    }

    if (!["workflow", "checklist", "task", "template"].includes(config.type)) {
      errors.push(`Invalid agent type: ${config.type}`);
    }

    if (!config.description || config.description.trim() === "") {
      errors.push("Agent description is required");
    }

    // Validate name format (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(config.name)) {
      errors.push(
        "Agent name must contain only alphanumeric characters, hyphens, and underscores",
      );
    }

    if (errors.length > 0) {
      throw new Error(
        `Agent configuration validation failed:\n${errors.join("\n")}`,
      );
    }
  }

  /**
   * Get template for agent type
   */
  private getTemplate(type: AgentConfig["type"]): AgentTemplate {
    const template = this.predefinedTemplates.get(type);
    if (!template) {
      throw new Error(`No template found for agent type: ${type}`);
    }
    return template;
  }

  /**
   * Render template with configuration values
   */
  private renderTemplate(template: AgentTemplate, config: AgentConfig): string {
    let content = template.template;

    // Replace basic placeholders
    content = content.replace(/\{\{name\}\}/g, config.name);
    content = content.replace(/\{\{type\}\}/g, config.type);
    content = content.replace(/\{\{description\}\}/g, config.description);
    content = content.replace(/\{\{version\}\}/g, config.version || "1.0.0");
    content = content.replace(
      /\{\{category\}\}/g,
      config.category || "general",
    );

    // Replace tags
    const tagsJson = config.tags ? JSON.stringify(config.tags, null, 2) : "[]";
    content = content.replace(/\{\{tags\}\}/g, tagsJson);

    // Replace dependencies
    const depsJson = config.dependencies
      ? JSON.stringify(config.dependencies, null, 2)
      : "[]";
    content = content.replace(/\{\{dependencies\}\}/g, depsJson);

    // Replace metadata
    const metadataJson = config.metadata
      ? JSON.stringify(config.metadata, null, 2)
      : "{}";
    content = content.replace(/\{\{metadata\}\}/g, metadataJson);

    // Replace timestamp
    content = content.replace(/\{\{timestamp\}\}/g, new Date().toISOString());

    return content;
  }

  /**
   * Generate appropriate filename for agent
   */
  private generateFileName(config: AgentConfig): string {
    const sanitizedName = config.name.toLowerCase().replace(
      /[^a-z0-9_-]/g,
      "-",
    );
    const extension = this.getFileExtension(config.type);
    return `${sanitizedName}${extension}`;
  }

  /**
   * Get file extension for agent type
   */
  private getFileExtension(type: AgentConfig["type"]): string {
    switch (type) {
      case "workflow":
        return ".workflow.ts";
      case "checklist":
        return ".checklist.ts";
      case "task":
        return ".task.ts";
      case "template":
        return ".template.ts";
      default:
        return ".ts";
    }
  }

  /**
   * Generate documentation for agent
   */
  private async generateAgentDocumentation(
    config: AgentConfig,
    outputDir: string,
  ): Promise<void> {
    const docContent = `# ${config.name}

## Description
${config.description}

## Type
${config.type}

## Category
${config.category || "general"}

## Version
${config.version || "1.0.0"}

## Tags
${config.tags ? config.tags.join(", ") : "None"}

## Dependencies
${config.dependencies ? config.dependencies.join(", ") : "None"}

## Generated
${new Date().toISOString()}

## Metadata
\`\`\`json
${JSON.stringify(config.metadata || {}, null, 2)}
\`\`\`
`;

    const docPath = join(outputDir, `${config.name}.md`);
    await Deno.writeTextFile(docPath, docContent);
  }

  /**
   * Initialize predefined templates
   */
  private initializePredefinedTemplates(): void {
    // Workflow template
    this.predefinedTemplates.set("workflow", {
      id: "workflow",
      name: "Workflow Template",
      type: "workflow",
      placeholders: [
        "name",
        "description",
        "version",
        "category",
        "tags",
        "metadata",
      ],
      requiredFields: ["name", "description"],
      template: `/**
 * {{name}} Workflow
 * {{description}}
 * Generated: {{timestamp}}
 */

export interface {{name}}WorkflowConfig {
  name: string;
  version: string;
  category: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export class {{name}}Workflow {
  private config: {{name}}WorkflowConfig;

  constructor(config: {{name}}WorkflowConfig) {
    this.config = config;
  }

  async execute(): Promise<void> {
    // TODO: Implement workflow logic
    console.log(\`Executing workflow: \${this.config.name}\`);
  }

  getConfig(): {{name}}WorkflowConfig {
    return { ...this.config };
  }
}

// Default configuration
export const default{{name}}Config: {{name}}WorkflowConfig = {
  name: "{{name}}",
  version: "{{version}}",
  category: "{{category}}",
  tags: {{tags}},
  metadata: {{metadata}}
};

// Export workflow instance
export const {{name}}WorkflowInstance = new {{name}}Workflow(default{{name}}Config);
`,
    });

    // Checklist template
    this.predefinedTemplates.set("checklist", {
      id: "checklist",
      name: "Checklist Template",
      type: "checklist",
      placeholders: [
        "name",
        "description",
        "version",
        "category",
        "tags",
        "metadata",
      ],
      requiredFields: ["name", "description"],
      template: `/**
 * {{name}} Checklist
 * {{description}}
 * Generated: {{timestamp}}
 */

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  required: boolean;
  dependencies?: string[];
}

export interface {{name}}ChecklistConfig {
  name: string;
  version: string;
  category: string;
  tags: string[];
  metadata: Record<string, unknown>;
  items: ChecklistItem[];
}

export class {{name}}Checklist {
  private config: {{name}}ChecklistConfig;

  constructor(config: {{name}}ChecklistConfig) {
    this.config = config;
  }

  getItems(): ChecklistItem[] {
    return [...this.config.items];
  }

  markCompleted(itemId: string): void {
    const item = this.config.items.find(i => i.id === itemId);
    if (item) {
      item.completed = true;
    }
  }

  getProgress(): { completed: number; total: number; percentage: number } {
    const completed = this.config.items.filter(i => i.completed).length;
    const total = this.config.items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  }

  validate(): boolean {
    const requiredItems = this.config.items.filter(i => i.required);
    return requiredItems.every(i => i.completed);
  }
}

// Default configuration
export const default{{name}}Config: {{name}}ChecklistConfig = {
  name: "{{name}}",
  version: "{{version}}",
  category: "{{category}}",
  tags: {{tags}},
  metadata: {{metadata}},
  items: [
    // TODO: Add checklist items
  ]
};

// Export checklist instance
export const {{name}}ChecklistInstance = new {{name}}Checklist(default{{name}}Config);
`,
    });

    // Task template
    this.predefinedTemplates.set("task", {
      id: "task",
      name: "Task Template",
      type: "task",
      placeholders: [
        "name",
        "description",
        "version",
        "category",
        "tags",
        "metadata",
      ],
      requiredFields: ["name", "description"],
      template: `/**
 * {{name}} Task
 * {{description}}
 * Generated: {{timestamp}}
 */

export interface {{name}}TaskConfig {
  name: string;
  version: string;
  category: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface TaskResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: Error;
}

export class {{name}}Task {
  private config: {{name}}TaskConfig;

  constructor(config: {{name}}TaskConfig) {
    this.config = config;
  }

  async execute(): Promise<TaskResult> {
    try {
      // TODO: Implement task logic
      console.log(\`Executing task: \${this.config.name}\`);
      
      return {
        success: true,
        message: \`Task \${this.config.name} completed successfully\`
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: \`Task \${this.config.name} failed: \${(error as Error).message}\`
      };
    }
  }

  getConfig(): {{name}}TaskConfig {
    return { ...this.config };
  }
}

// Default configuration
export const default{{name}}Config: {{name}}TaskConfig = {
  name: "{{name}}",
  version: "{{version}}",
  category: "{{category}}",
  tags: {{tags}},
  metadata: {{metadata}}
};

// Export task instance
export const {{name}}TaskInstance = new {{name}}Task(default{{name}}Config);
`,
    });

    // Template template (meta!)
    this.predefinedTemplates.set("template", {
      id: "template",
      name: "Template Template",
      type: "template",
      placeholders: [
        "name",
        "description",
        "version",
        "category",
        "tags",
        "metadata",
      ],
      requiredFields: ["name", "description"],
      template: `/**
 * {{name}} Template
 * {{description}}
 * Generated: {{timestamp}}
 */

export interface {{name}}TemplateConfig {
  name: string;
  version: string;
  category: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface TemplateContext {
  [key: string]: unknown;
}

export class {{name}}Template {
  private config: {{name}}TemplateConfig;
  private template: string;

  constructor(config: {{name}}TemplateConfig, template: string = '') {
    this.config = config;
    this.template = template;
  }

  render(context: TemplateContext): string {
    let result = this.template;
    
    // Replace placeholders with context values
    for (const [key, value] of Object.entries(context)) {
      const placeholder = new RegExp(\`\\\\{\\\\{\\\\s*\${key}\\\\s*\\\\}\\\\}\`, 'g');
      result = result.replace(placeholder, String(value));
    }
    
    return result;
  }

  setTemplate(template: string): void {
    this.template = template;
  }

  getTemplate(): string {
    return this.template;
  }

  getConfig(): {{name}}TemplateConfig {
    return { ...this.config };
  }
}

// Default configuration
export const default{{name}}Config: {{name}}TemplateConfig = {
  name: "{{name}}",
  version: "{{version}}",
  category: "{{category}}",
  tags: {{tags}},
  metadata: {{metadata}}
};

// Export template instance
export const {{name}}TemplateInstance = new {{name}}Template(default{{name}}Config);
`,
    });
  }
}

// Export factory function
export function createAgentGenerator(
  fileSystem: IFileSystemService,
  logger?: ILogger,
): AgentGenerator {
  return new AgentGenerator(fileSystem, logger);
}

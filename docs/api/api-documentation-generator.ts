/**
 * API Documentation Generator - Automatic documentation generation for BMAD-METHOD APIs
 */

import { dirname, ensureDir, join, ProjectPaths } from "deps";

export interface APIEndpoint {
  name: string;
  description: string;
  method: string;
  path: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  examples: APIExample[];
  module: string;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: unknown;
  validation?: string;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema: unknown;
  example?: unknown;
}

export interface APIExample {
  title: string;
  description: string;
  request: unknown;
  response: unknown;
}

export interface ModuleDocumentation {
  name: string;
  description: string;
  version: string;
  interfaces: InterfaceDocumentation[];
  classes: ClassDocumentation[];
  functions: FunctionDocumentation[];
  types: TypeDocumentation[];
}

export interface InterfaceDocumentation {
  name: string;
  description: string;
  properties: PropertyDocumentation[];
  methods: MethodDocumentation[];
  extends?: string[];
}

export interface ClassDocumentation {
  name: string;
  description: string;
  constructor: MethodDocumentation;
  methods: MethodDocumentation[];
  properties: PropertyDocumentation[];
  extends?: string;
  implements?: string[];
}

export interface FunctionDocumentation {
  name: string;
  description: string;
  parameters: ParameterDocumentation[];
  returns: ReturnDocumentation;
  examples: CodeExample[];
}

export interface MethodDocumentation {
  name: string;
  description: string;
  parameters: ParameterDocumentation[];
  returns: ReturnDocumentation;
  accessibility: "public" | "private" | "protected";
  static?: boolean;
}

export interface PropertyDocumentation {
  name: string;
  type: string;
  description: string;
  accessibility: "public" | "private" | "protected";
  readonly?: boolean;
  static?: boolean;
}

export interface ParameterDocumentation {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
  default?: unknown;
}

export interface ReturnDocumentation {
  type: string;
  description: string;
}

export interface TypeDocumentation {
  name: string;
  description: string;
  definition: string;
  examples: string[];
}

export interface CodeExample {
  title: string;
  description: string;
  code: string;
  language: string;
}

export class APIDocumentationGenerator {
  private outputPath: string;
  private moduleDocuments: Map<string, ModuleDocumentation> = new Map();

  constructor(outputPath: string = join(ProjectPaths.docs, "api")) {
    this.outputPath = outputPath;
  }

  async generateFullDocumentation(): Promise<void> {
    console.log("🔍 Generating comprehensive API documentation...\n");

    // Generate core module documentation
    await this.generateCoreModulesDocs();

    // Generate extension module documentation
    await this.generateExtensionModulesDocs();

    // Generate tooling documentation
    await this.generateToolingDocs();

    // Generate overview and navigation
    await this.generateNavigationDocs();

    console.log("📚 API documentation generation completed!\n");
  }

  private async generateCoreModulesDocs(): Promise<void> {
    const coreModules = [
      {
        name: "Agent System",
        path: ProjectPaths.getAgentPath(""), // Placeholder, actual agent ID will be passed later
        description: "Agent management, registry, and execution system",
      },
      {
        name: "Workflow Engine",
        path: ProjectPaths.getWorkflowPath(""), // Placeholder, actual workflow ID will be passed later
        description: "Workflow orchestration and execution engine",
      },
      {
        name: "Task System",
        path: ProjectPaths.getTaskPath(""), // Placeholder, actual task ID will be passed later
        description: "Task scheduling, execution, and state management",
      },
      {
        name: "Extension Framework",
        path: ProjectPaths.core,
        description: "Extension loading, management, and lifecycle",
      },
    ];

    for (const module of coreModules) {
      await this.generateModuleDocumentation(module);
    }
  }

  private async generateExtensionModulesDocs(): Promise<void> {
    const extensionModules = [
      {
        name: "Game Development Extensions",
        path: ProjectPaths.extensions,
        description: "Phaser, Unity, and game development tools",
      },
      {
        name: "Infrastructure Extensions",
        path: ProjectPaths.extensions,
        description: "DevOps, deployment, and infrastructure automation",
      },
    ];

    for (const module of extensionModules) {
      await this.generateExtensionDocumentation(module);
    }
  }

  private async generateToolingDocs(): Promise<void> {
    const toolingModules = [
      {
        name: "CLI Framework",
        path: join(ProjectPaths.src, "cli"),
        description: "Command-line interface framework and plugins",
      },
      {
        name: "Build System",
        path: ProjectPaths.tooling,
        description: "Build tools and automation",
      },
    ];

    for (const module of toolingModules) {
      await this.generateToolingModuleDocumentation(module);
    }
  }

  private async generateModuleDocumentation(
    module: { name: string; path: string; description: string },
  ): Promise<void> {
    const documentation: ModuleDocumentation = {
      name: module.name,
      description: module.description,
      version: "1.0.0",
      interfaces: await this.extractInterfaces(module.path),
      classes: await this.extractClasses(module.path),
      functions: await this.extractFunctions(module.path),
      types: await this.extractTypes(module.path),
    };

    await this.writeModuleDocumentation(module.name, documentation);
  }

  private async generateExtensionDocumentation(
    module: { name: string; path: string; description: string },
  ): Promise<void> {
    const extensionDoc = `# ${module.name}

${module.description}

## Extension Structure

### Game Development Extensions

#### Phaser Game Development
- **Path**: \`extensions/bmad-2d-phaser-game-dev/\`
- **Agents**: Game development specialists with Phaser expertise
- **Templates**: Game project templates and boilerplates
- **Workflows**: Game development lifecycle management
- **Tasks**: Game-specific development and testing tasks

#### Unity Game Development
- **Path**: \`extensions/bmad-2d-unity-game-dev/\`
- **Agents**: Unity specialists for 2D game development
- **Templates**: Unity project templates and prefabs
- **Workflows**: Unity development and deployment workflows
- **Tasks**: Unity-specific build and testing tasks

### Infrastructure Extensions

#### DevOps Infrastructure
- **Path**: \`extensions/bmad-infrastructure-devops/\`
- **Agents**: Infrastructure and DevOps specialists
- **Templates**: Infrastructure as Code templates
- **Workflows**: Deployment and monitoring workflows
- **Tasks**: Infrastructure automation and monitoring tasks

## Extension API

### Extension Configuration

\`\`\`yaml
# config.yaml
id: extension-id
name: Extension Name
version: 1.0.0
description: Extension description
type: game-development | infrastructure | custom
bmad_version: ">=1.0.0"
dependencies: []
\`\`\`

### Extension Lifecycle

1. **Loading**: Extension resources are loaded and validated
2. **Activation**: Extension is activated and services are started
3. **Runtime**: Extension provides agents, workflows, and tasks
4. **Deactivation**: Extension is gracefully shut down

### Extension Resources

- **Agents**: YAML agent definitions with capabilities
- **Teams**: Agent team compositions and roles
- **Workflows**: YAML workflow definitions
- **Tasks**: Markdown task definitions
- **Templates**: Project and code templates
- **Data**: Reference data and configurations

## Usage Examples

### Loading an Extension

\`\`\`typescript
import { ExtensionManager } from '@bmad/core/extensions';

const manager = new ExtensionManager();
const result = await manager.loadExtension('/path/to/extension');

if (result.success) {
  await manager.activateExtension(result.extension.config.id);
}
\`\`\`

### Using Extension Agents

\`\`\`typescript
import { AgentManager } from '@bmad/core/services';

const agentManager = new AgentManager();
const gameDevAgent = await agentManager.getAgent('phaser-game-dev');
await gameDevAgent.executeTask('create-game-project', { 
  projectName: 'my-game',
  template: 'platformer'
});
\`\`\`
`;

    await this.writeDocumentationFile(
      `${module.name.toLowerCase().replace(/\s+/g, "-")}.md`,
      extensionDoc,
    );
  }

  private async generateToolingModuleDocumentation(
    module: { name: string; path: string; description: string },
  ): Promise<void> {
    const toolingDoc = `# ${module.name}

${module.description}

## CLI Framework Architecture

### Core Components

#### CLIFramework Class
The main CLI framework class providing plugin management and command execution.

\`\`\`typescript
interface ICLIFramework {
  registerPlugin(plugin: CLIPlugin): Promise<void>;
  executeCommand(command: string, args: string[], options: any): Promise<CLIResult>;
  getCommands(): CLICommand[];
  getMetrics(): CLIMetrics;
}
\`\`\`

#### Plugin System
Extensible plugin architecture for command implementations.

\`\`\`typescript
interface CLIPlugin {
  name: string;
  version: string;
  commands: CLICommand[];
  
  initialize(context: CLIContext): Promise<void>;
  cleanup(): Promise<void>;
}
\`\`\`

### Available Commands

#### Build Commands
- \`build\` - Build agents, teams, or extensions
- \`clean\` - Clean build artifacts
- \`optimize\` - Optimize build output

#### Version Management Commands
- \`bump\` - Bump version numbers
- \`sync\` - Synchronize versions across modules
- \`check\` - Check version consistency
- \`release\` - Prepare release packages

### Usage Examples

#### Building Agents
\`\`\`bash
# Build all agents
bmad build --agents

# Build specific agent
bmad build --agents --name developer-agent

# Build with optimization
bmad build --agents --optimize

# Dry run
bmad build --agents --dry-run
\`\`\`

#### Version Management
\`\`\`bash
# Bump patch version
bmad bump patch

# Bump minor version with changelog
bmad bump minor --changelog

# Synchronize versions
bmad sync --target 1.2.0

# Check version consistency
bmad check --format json
\`\`\`

## Plugin Development

### Creating a CLI Plugin

\`\`\`typescript
import { CLIPlugin, CLICommand } from '@bmad/cli/types';

export class MyPlugin implements CLIPlugin {
  name = 'my-plugin';
  version = '1.0.0';
  
  commands: CLICommand[] = [
    {
      name: 'my-command',
      description: 'My custom command',
      options: [
        {
          name: 'option',
          description: 'Command option',
          type: 'string',
          required: false
        }
      ],
      handler: this.handleCommand.bind(this)
    }
  ];

  async initialize(context: CLIContext): Promise<void> {
    // Plugin initialization
  }

  async handleCommand(args: string[], options: any): Promise<CLIResult> {
    // Command implementation
    return { success: true, message: 'Command executed' };
  }

  async cleanup(): Promise<void> {
    // Plugin cleanup
  }
}
\`\`\`

### Registering a Plugin

\`\`\`typescript
import { CLIFramework } from '@bmad/cli/core';
import { MyPlugin } from 'deps';

const cli = new CLIFramework();
await cli.registerPlugin(new MyPlugin());
\`\`\`
`;

    await this.writeDocumentationFile(
      `${module.name.toLowerCase().replace(/\s+/g, "-")}.md`,
      toolingDoc,
    );
  }

  private async generateNavigationDocs(): Promise<void> {
    const navigationDoc = `# BMAD-METHOD API Documentation

## Overview

Complete API documentation for the BMAD-METHOD modular architecture system.

## Core Modules

### 🤖 [Agent System](./agent-system.md)
- Agent types and interfaces
- Agent registry and management
- Base agent implementation
- Agent lifecycle management

### 🔄 [Workflow Engine](./workflow-engine.md)
- Workflow definitions and types
- Workflow execution engine
- Step management and validation
- Event handling and metrics

### 📋 [Task System](./task-system.md)
- Task types and scheduling
- Task execution framework
- Queue management
- State tracking and persistence

### 🔌 [Extension Framework](./extension-framework.md)
- Extension loading and management
- Resource parsing and validation
- Dependency management
- Extension lifecycle

## Tooling

### 💻 [CLI Framework](./cli-framework.md)
- Command-line interface system
- Plugin architecture
- Build and deployment tools
- Version management

### 🛠️ [Build System](./build-system.md)
- Agent and team building
- Extension bundling
- Optimization tools
- Watch mode and incremental builds

## Extensions

### 🎮 [Game Development Extensions](./game-development-extensions.md)
- Phaser game development
- Unity 2D development
- Game project templates
- Development workflows

### 🏗️ [Infrastructure Extensions](./infrastructure-extensions.md)  
- DevOps automation
- Infrastructure as Code
- Deployment pipelines
- Monitoring and alerting

## Development Guides

### Getting Started
1. [Architecture Overview](../architecture/README.md)
2. [Development Setup](./development-setup.md)
3. [Module Development](./module-development.md)
4. [Testing Guidelines](./testing-guidelines.md)

### Integration
1. [Agent Integration](./agent-integration.md)
2. [Extension Development](./extension-development.md)
3. [CLI Plugin Development](./cli-plugin-development.md)
4. [Workflow Creation](./workflow-creation.md)

## API Reference

### Core Types
- [Agent Types](./types/agent-types.md)
- [Workflow Types](./types/workflow-types.md)
- [Task Types](./types/task-types.md)
- [Extension Types](./types/extension-types.md)
- [CLI Types](./types/cli-types.md)

### Interfaces
- [IAgentManager](./interfaces/agent-manager.md)
- [IWorkflowEngine](./interfaces/workflow-engine.md)
- [ITaskScheduler](./interfaces/task-scheduler.md)
- [IExtensionManager](./interfaces/extension-manager.md)

## Examples and Tutorials

### Quick Start Examples
- [Creating Your First Agent](./examples/first-agent.md)
- [Building a Custom Workflow](./examples/custom-workflow.md)
- [Developing an Extension](./examples/custom-extension.md)
- [CLI Plugin Tutorial](./examples/cli-plugin.md)

### Advanced Examples
- [Multi-Agent Workflows](./examples/multi-agent-workflows.md)
- [Extension Dependencies](./examples/extension-dependencies.md)
- [Custom Task Executors](./examples/custom-executors.md)
- [Performance Optimization](./examples/performance.md)

## Migration and Compatibility

### Upgrading
- [Migration from Legacy System](./migration/legacy-migration.md)
- [Version Compatibility](./migration/version-compatibility.md)
- [Breaking Changes](./migration/breaking-changes.md)

### Best Practices
- [Code Organization](./best-practices/code-organization.md)
- [Error Handling](./best-practices/error-handling.md)
- [Performance Guidelines](./best-practices/performance.md)
- [Security Considerations](./best-practices/security.md)

---

**Generated**: ${new Date().toISOString()}  
**Version**: 1.0.0  
**BMAD-METHOD**: Comprehensive Modular Architecture
`;

    await this.writeDocumentationFile("README.md", navigationDoc);
  }

  private async extractInterfaces(_modulePath: string): Promise<InterfaceDocumentation[]> {
    // Mock implementation - in real system would parse TypeScript AST
    await Promise.resolve(); // Ensure method is properly async

    return [
      {
        name: "IModuleInterface",
        description: "Core module interface definition",
        properties: [],
        methods: [],
      },
    ];
  }

  private async extractClasses(_modulePath: string): Promise<ClassDocumentation[]> {
    // Mock implementation - in real system would parse TypeScript AST
    await Promise.resolve(); // Ensure method is properly async

    return [
      {
        name: "ModuleClass",
        description: "Core module class implementation",
        constructor: {
          name: "constructor",
          description: "Module constructor",
          parameters: [],
          returns: { type: "void", description: "" },
          accessibility: "public",
        },
        methods: [],
        properties: [],
      },
    ];
  }

  private async extractFunctions(_modulePath: string): Promise<FunctionDocumentation[]> {
    // Mock implementation
    await Promise.resolve(); // Ensure method is properly async
    return [];
  }

  private async extractTypes(_modulePath: string): Promise<TypeDocumentation[]> {
    // Mock implementation
    await Promise.resolve(); // Ensure method is properly async
    return [];
  }

  private async writeModuleDocumentation(
    moduleName: string,
    documentation: ModuleDocumentation,
  ): Promise<void> {
    const filename = `${moduleName.toLowerCase().replace(/\s+/g, "-")}.md`;
    const content = this.formatModuleDocumentation(documentation);
    await this.writeDocumentationFile(filename, content);
  }

  private formatModuleDocumentation(doc: ModuleDocumentation): string {
    return `# ${doc.name}

${doc.description}

**Version**: ${doc.version}

## Interfaces

${
      doc.interfaces.map((iface) =>
        `### ${iface.name}
${iface.description}

${
          iface.properties.length > 0
            ? `**Properties**:
${iface.properties.map((p) => `- \`${p.name}: ${p.type}\` - ${p.description}`).join("\n")}`
            : ""
        }

${
          iface.methods.length > 0
            ? `**Methods**:
${
              iface.methods.map((m) =>
                `- \`${m.name}(${
                  m.parameters.map((p) => `${p.name}: ${p.type}`).join(", ")
                }): ${m.returns.type}\` - ${m.description}`
              ).join("\n")
            }`
            : ""
        }
`
      ).join("\n")
    }

## Classes

${
      doc.classes.map((cls) =>
        `### ${cls.name}
${cls.description}

**Constructor**: \`${cls.constructor.name}(${
          cls.constructor.parameters.map((p) => `${p.name}: ${p.type}`).join(", ")
        })\`

${
          cls.methods.length > 0
            ? `**Methods**:
${
              cls.methods.map((m) =>
                `- \`${m.accessibility} ${m.name}(${
                  m.parameters.map((p) => `${p.name}: ${p.type}`).join(", ")
                }): ${m.returns.type}\` - ${m.description}`
              ).join("\n")
            }`
            : ""
        }

${
          cls.properties.length > 0
            ? `**Properties**:
${
              cls.properties.map((p) =>
                `- \`${p.accessibility} ${p.name}: ${p.type}\` - ${p.description}`
              ).join("\n")
            }`
            : ""
        }
`
      ).join("\n")
    }

${
      doc.functions.length > 0
        ? `## Functions

${
          doc.functions.map((fn) =>
            `### ${fn.name}
${fn.description}

**Parameters**:
${fn.parameters.map((p) => `- \`${p.name}: ${p.type}\` - ${p.description}`).join("\n")}

**Returns**: \`${fn.returns.type}\` - ${fn.returns.description}

${
              fn.examples.length > 0
                ? `**Examples**:
${
                  fn.examples.map((ex) =>
                    `#### ${ex.title}
${ex.description}

\`\`\`${ex.language}
${ex.code}
\`\`\`
`
                  ).join("\n")
                }`
                : ""
            }
`
          ).join("\n")
        }`
        : ""
    }

${
      doc.types.length > 0
        ? `## Types

${
          doc.types.map((type) =>
            `### ${type.name}
${type.description}

\`\`\`typescript
${type.definition}
\`\`\`

${
              type.examples.length > 0
                ? `**Examples**:
${
                  type.examples.map((ex) =>
                    `\`\`\`typescript
${ex}
\`\`\``
                  ).join("\n")
                }`
                : ""
            }
`
          ).join("\n")
        }`
        : ""
    }
`;
  }

  private async writeDocumentationFile(filename: string, content: string): Promise<void> {
    const fullPath = join(this.outputPath, filename);

    // Ensure directory exists
    await ensureDir(dirname(fullPath));

    // Write file
    await Deno.writeTextFile(fullPath, content);
    console.log(`📝 Generated: ${filename}`);
  }
}

// Export generator function
export async function generateAPIDocumentation(): Promise<void> {
  const generator = new APIDocumentationGenerator();
  await generator.generateFullDocumentation();
}

// CLI execution support
if (import.meta.main) {
  generateAPIDocumentation().catch((error) => {
    console.error("API documentation generation failed:", error);
    Deno.exit(1);
  });
}

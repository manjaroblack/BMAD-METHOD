# Game Development Extensions

Phaser, Unity, and game development tools

## Extension Structure

### Game Development Extensions

#### Phaser Game Development

- **Path**: `extensions/bmad-2d-phaser-game-dev/`
- **Agents**: Game development specialists with Phaser expertise
- **Templates**: Game project templates and boilerplates
- **Workflows**: Game development lifecycle management
- **Tasks**: Game-specific development and testing tasks

#### Unity Game Development

- **Path**: `extensions/bmad-2d-unity-game-dev/`
- **Agents**: Unity specialists for 2D game development
- **Templates**: Unity project templates and prefabs
- **Workflows**: Unity development and deployment workflows
- **Tasks**: Unity-specific build and testing tasks

### Infrastructure Extensions

#### DevOps Infrastructure

- **Path**: `extensions/bmad-infrastructure-devops/`
- **Agents**: Infrastructure and DevOps specialists
- **Templates**: Infrastructure as Code templates
- **Workflows**: Deployment and monitoring workflows
- **Tasks**: Infrastructure automation and monitoring tasks

## Extension API

### Extension Configuration

```yaml
# config.yaml
id: extension-id
name: Extension Name
version: 1.0.0
description: Extension description
type: game-development | infrastructure | custom
bmad_version: ">=1.0.0"
dependencies: []
```

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

```typescript
import { ExtensionManager } from "@bmad/core/extensions";

const manager = new ExtensionManager();
const result = await manager.loadExtension("/path/to/extension");

if (result.success) {
  await manager.activateExtension(result.extension.config.id);
}
```

### Using Extension Agents

```typescript
import { AgentManager } from "@bmad/core/services";

const agentManager = new AgentManager();
const gameDevAgent = await agentManager.getAgent("phaser-game-dev");
await gameDevAgent.executeTask("create-game-project", {
  projectName: "my-game",
  template: "platformer",
});
```

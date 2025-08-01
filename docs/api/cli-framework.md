# CLI Framework

Command-line interface framework and plugins

## CLI Framework Architecture

### Core Components

#### CLIFramework Class

The main CLI framework class providing plugin management and command execution.

```typescript
interface ICLIFramework {
  registerPlugin(plugin: CLIPlugin): Promise<void>;
  executeCommand(command: string, args: string[], options: any): Promise<CLIResult>;
  getCommands(): CLICommand[];
  getMetrics(): CLIMetrics;
}
```

#### Plugin System

Extensible plugin architecture for command implementations.

```typescript
interface CLIPlugin {
  name: string;
  version: string;
  commands: CLICommand[];
  
  initialize(context: CLIContext): Promise<void>;
  cleanup(): Promise<void>;
}
```

### Available Commands

#### Build Commands

- `build` - Build agents, teams, or extensions
- `clean` - Clean build artifacts
- `optimize` - Optimize build output

#### Version Management Commands

- `bump` - Bump version numbers
- `sync` - Synchronize versions across modules
- `check` - Check version consistency
- `release` - Prepare release packages

### Usage Examples

#### Building Agents

```bash
# Build all agents
bmad build --agents

# Build specific agent
bmad build --agents --name developer-agent

# Build with optimization
bmad build --agents --optimize

# Dry run
bmad build --agents --dry-run
```

#### Version Management

```bash
# Bump patch version
bmad bump patch

# Bump minor version with changelog
bmad bump minor --changelog

# Synchronize versions
bmad sync --target 1.2.0

# Check version consistency
bmad check --format json
```

## Plugin Development

### Creating a CLI Plugin

```typescript
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
```

### Registering a Plugin

```typescript
import { CLIFramework } from '@bmad/cli/core';
import { MyPlugin } from 'deps';

const cli = new CLIFramework();
await cli.registerPlugin(new MyPlugin());
```

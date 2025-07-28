# Agent Refactoring Documentation

This document explains the refactored agent architecture that extracts boilerplate code into reusable templates and configurations.

## Overview

The agent files have been refactored to eliminate duplication and improve maintainability by:

1. **Base Template**: Common boilerplate extracted to `templates/agent-base-tmpl.yaml`
2. **Agent Configurations**: Agent-specific settings in `agent-configs/`
3. **Generation Script**: Utility to combine template + config into final agent files

## Directory Structure

```
bmad-core/
├── agents/                     # Generated agent files (final output)
│   ├── backup/                 # Backup of original agent files
│   ├── analyst.md
│   ├── architect.md
│   ├── dev.md
│   ├── pm.md
│   ├── qa.md
│   ├── po.md
│   ├── sm.md
│   └── ux-expert.md
├── agent-configs/              # Agent-specific configurations
│   ├── analyst-config.yaml
│   ├── architect-config.yaml
│   ├── dev-config.yaml
│   ├── pm-config.yaml
│   ├── qa-config.yaml
│   ├── po-config.yaml
│   ├── sm-config.yaml
│   └── ux-expert-config.yaml
├── templates/
│   └── agent-base-tmpl.yaml    # Base template with common boilerplate
└── utils/
    └── generate-agent.js       # Script to generate agent files
```

## How It Works

### 1. Base Template (`templates/agent-base-tmpl.yaml`)

Contains all common boilerplate:
- Standard activation notice
- IDE file resolution patterns
- Request resolution template
- Core activation instructions
- Standard commands (help, yolo, doc_out, exit)

### 2. Agent Configurations (`agent-configs/*.yaml`)

Each agent has a configuration file defining:
- Request resolution examples
- Agent definition (name, ID, title, icon, whenToUse)
- Persona details (role, style, identity, focus, core principles)
- Agent-specific commands
- Standard commands to include
- Dependencies (tasks, templates, checklists, data)
- Additional sections (if needed)

### 3. Generation Script (`utils/generate-agent.js`)

Combines the base template with agent-specific configuration to generate the final agent file.

## Usage

### Generating Agent Files

```bash
# Generate a single agent
node utils/generate-agent.js <agent-name> <output-path>

# Examples:
node utils/generate-agent.js analyst agents/analyst.md
node utils/generate-agent.js dev agents/dev.md
```

### Regenerating All Agents

```bash
# From bmad-core directory
node utils/generate-agent.js analyst agents/analyst.md
node utils/generate-agent.js architect agents/architect.md
node utils/generate-agent.js dev agents/dev.md
node utils/generate-agent.js pm agents/pm.md
node utils/generate-agent.js qa agents/qa.md
node utils/generate-agent.js po agents/po.md
node utils/generate-agent.js sm agents/sm.md
node utils/generate-agent.js ux-expert agents/ux-expert.md
```

## Making Changes

### Modifying Common Elements

1. Edit `templates/agent-base-tmpl.yaml`
2. Regenerate all affected agent files

### Modifying Agent-Specific Elements

1. Edit the appropriate `agent-configs/<agent>-config.yaml` file
2. Regenerate that specific agent file

### Adding New Agents

1. Create a new configuration file in `agent-configs/`
2. Use the generation script to create the agent file

## Benefits

1. **DRY Principle**: No more duplicated boilerplate code
2. **Consistency**: All agents follow the same structure
3. **Maintainability**: Changes to common elements only need to be made once
4. **Scalability**: Easy to add new agents
5. **Version Control**: Cleaner diffs when making changes

## Configuration File Structure

Each agent configuration file follows this structure:

```yaml
# Request resolution examples
request_resolution_examples:
  example_request: "example request"
  example_command: "*example-command"
  example_request_2: "another request"
  example_task: "example-task.md"

# Agent definition
agent:
  name: AgentName
  id: agent-id
  title: Agent Title
  icon: 🔧
  whenToUse: "Description of when to use this agent"
  customization: null

# Persona definition
persona:
  role: Agent Role
  style: Communication style
  identity: Agent identity
  focus: Primary focus area
  core_principles:
    - Principle 1
    - Principle 2

# Agent-specific commands
commands:
  command-name: "Command description"

# Standard commands to include
include_standard_commands:
  - yolo
  - doc_out

# Dependencies
dependencies:
  tasks:
    - task1.md
  templates:
    - template1.yaml
  checklists:
    - checklist1.md
```

## Backup

Original agent files are backed up in `agents/backup/` before being replaced with generated versions.
# Core Domain Services

This directory contains the core business logic services for the BMAD-METHOD system.

## Service Architecture

### Core Services

- `agent-manager.service.ts` - Manages agent lifecycle and orchestration
- `workflow-orchestrator.service.ts` - Orchestrates workflow execution
- `task-manager.service.ts` - Manages task scheduling and execution
- `template-processor.service.ts` - Processes and renders templates
- `checklist-manager.service.ts` - Manages checklist execution and validation
- `data-manager.service.ts` - Manages system data and knowledge base

### Design Principles

- Interface-based design for dependency injection
- Single Responsibility Principle
- Service composition over inheritance
- Type-safe operations with strict typing
- Error handling with custom error types

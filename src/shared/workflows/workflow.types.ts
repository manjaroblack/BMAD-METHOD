/**
 * Core workflow types and interfaces for the BMAD-METHOD workflow system
 */

export enum WorkflowType {
  GREENFIELD_FULLSTACK = 'greenfield-fullstack',
  GREENFIELD_SERVICE = 'greenfield-service',
  GREENFIELD_UI = 'greenfield-ui',
  BROWNFIELD_FULLSTACK = 'brownfield-fullstack',
  BROWNFIELD_SERVICE = 'brownfield-service',
  BROWNFIELD_UI = 'brownfield-ui'
}

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: string;
  agent?: string;
  dependencies?: string[];
  conditions?: WorkflowCondition[];
  parameters: Record<string, unknown>;
  timeout?: number;
  retryAttempts?: number;
  onSuccess?: WorkflowAction[];
  onFailure?: WorkflowAction[];
}

export interface WorkflowCondition {
  type: 'expression' | 'agent_available' | 'resource_ready' | 'custom';
  expression?: string;
  agent?: string;
  resource?: string;
  customValidator?: string;
}

export interface WorkflowAction {
  type: 'notify' | 'execute_task' | 'update_context' | 'trigger_workflow' | 'custom';
  target?: string;
  parameters?: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  type: WorkflowType;
  version: string;
  steps: WorkflowStep[];
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timeout?: number;
  maxRetries?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  context: Record<string, unknown>;
  stepExecutions: StepExecution[];
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface StepExecution {
  stepId: string;
  status: StepStatus;
  startTime?: Date;
  endTime?: Date;
  result?: unknown;
  error?: string;
  attempts: number;
  logs: string[];
}

export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  variables: Record<string, unknown>;
  stepResults: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface WorkflowEvent {
  type: 'step_started' | 'step_completed' | 'step_failed' | 'workflow_completed' | 'workflow_failed';
  executionId: string;
  stepId?: string;
  timestamp: Date;
  data?: unknown;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  steps: Partial<WorkflowStep>[];
  defaultVariables?: Record<string, unknown>;
  requiredParameters: string[];
}

export interface WorkflowMetrics {
  executionId: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  executionTime: number;
  avgStepTime: number;
  successRate: number;
}

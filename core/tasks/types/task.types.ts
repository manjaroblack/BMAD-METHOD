/**
 * Core task types and interfaces for the BMAD-METHOD task system
 */

export enum TaskType {
  ADVANCED_ELICITATION = 'advanced-elicitation',
  BROWNFIELD_CREATE_EPIC = 'brownfield-create-epic',
  BROWNFIELD_CREATE_STORY = 'brownfield-create-story',
  CORRECT_COURSE = 'correct-course',
  CREATE_BROWNFIELD_STORY = 'create-brownfield-story',
  CREATE_DEEP_RESEARCH_PROMPT = 'create-deep-research-prompt',
  CREATE_DOC = 'create-doc',
  CREATE_NEXT_STORY = 'create-next-story',
  DOCUMENT_PROJECT = 'document-project',
  EXECUTE_CHECKLIST = 'execute-checklist',
  FACILITATE_BRAINSTORMING = 'facilitate-brainstorming-session',
  GENERATE_AI_FRONTEND_PROMPT = 'generate-ai-frontend-prompt',
  INDEX_DOCS = 'index-docs',
  KB_MODE_INTERACTION = 'kb-mode-interaction',
  REVIEW_STORY = 'review-story',
  SHARD_DOC = 'shard-doc',
  VALIDATE_NEXT_STORY = 'validate-next-story'
}

export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying'
}

export enum TaskPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5
}

export interface TaskDefinition {
  id: string;
  type: TaskType;
  name: string;
  description: string;
  category: string;
  requiredCapabilities: string[];
  estimatedDuration: number; // in milliseconds
  maxRetries: number;
  timeout: number; // in milliseconds
  parameters: TaskParameterDefinition[];
  outputs: TaskOutputDefinition[];
  dependencies?: string[];
  tags?: string[];
}

export interface TaskParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: unknown;
  validation?: ValidationRule[];
}

export interface TaskOutputDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'regex' | 'enum' | 'custom';
  value?: unknown;
  message: string;
}

export interface Task {
  id: string;
  definitionId: string;
  type: TaskType;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgent?: string;
  assignedTeam?: string;
  parameters: Record<string, unknown>;
  result?: TaskResult;
  error?: TaskError;
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  parentTask?: string;
  childTasks?: string[];
  dependencies?: string[];
  metadata: Record<string, unknown>;
  tags?: string[];
  attempts: number;
  maxRetries: number;
}

export interface TaskResult {
  success: boolean;
  outputs: Record<string, unknown>;
  artifacts?: TaskArtifact[];
  metrics?: TaskMetrics;
  logs?: string[];
}

export interface TaskError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  retryable: boolean;
}

export interface TaskArtifact {
  id: string;
  name: string;
  type: string;
  path?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskMetrics {
  executionTime: number;
  memoryUsage?: number;
  resourcesUsed?: string[];
  agentUtilization?: number;
  quality?: number;
}

export interface TaskSchedule {
  taskId: string;
  scheduledAt: Date;
  priority: TaskPriority;
  assignedResource?: string;
  estimatedDuration: number;
  dependencies: string[];
}

export interface TaskQueue {
  id: string;
  name: string;
  tasks: Task[];
  capacity: number;
  processingStrategy: 'FIFO' | 'LIFO' | 'PRIORITY' | 'CUSTOM';
  filters?: TaskFilter[];
}

export interface TaskFilter {
  type: 'priority' | 'agent' | 'category' | 'tag' | 'custom';
  value: unknown;
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'custom';
}

export interface TaskExecution {
  taskId: string;
  executionId: string;
  status: TaskStatus;
  assignedAgent: string;
  startTime: Date;
  endTime?: Date;
  progress: number; // 0-100
  checkpoints: TaskCheckpoint[];
  logs: TaskLog[];
}

export interface TaskCheckpoint {
  id: string;
  timestamp: Date;
  description: string;
  progress: number;
  data?: Record<string, unknown>;
}

export interface TaskLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  taskDefinitions: Partial<TaskDefinition>[];
  defaultParameters: Record<string, unknown>;
  workflow?: string;
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string;
  type: 'blocking' | 'optional' | 'conditional';
  condition?: string;
}

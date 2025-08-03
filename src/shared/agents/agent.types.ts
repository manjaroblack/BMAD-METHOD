/**
 * Core agent types and interfaces for the BMAD-METHOD agent system
 */

export enum AgentRole {
  ANALYST = 'analyst',
  ARCHITECT = 'architect',
  BMAD_MASTER = 'bmad-master',
  BMAD_ORCHESTRATOR = 'bmad-orchestrator',
  DEVELOPER = 'dev',
  PROJECT_MANAGER = 'pm',
  PRODUCT_OWNER = 'po',
  QA = 'qa',
  SCRUM_MASTER = 'sm',
  UX_EXPERT = 'ux-expert'
}

export enum AgentStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  BUSY = 'busy',
  ERROR = 'error',
  OFFLINE = 'offline'
}

export interface AgentConfig {
  role: AgentRole;
  name: string;
  description: string;
  capabilities: string[];
  dependencies?: AgentRole[];
  maxConcurrentTasks: number;
  timeoutMs: number;
  retryAttempts: number;
}

export interface AgentState {
  id: string;
  role: AgentRole;
  status: AgentStatus;
  currentTasks: string[];
  lastActivity: Date;
  metadata: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  type: string;
  priority: number;
  payload: Record<string, unknown>;
  assignedAgent: string;
  createdAt: Date;
  deadline?: Date;
  dependencies?: string[];
}

export interface AgentResponse {
  taskId: string;
  agentId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
  timestamp: Date;
}

export interface AgentTeam {
  id: string;
  name: string;
  members: AgentRole[];
  leader: AgentRole;
  purpose: string;
  workflow: string;
}

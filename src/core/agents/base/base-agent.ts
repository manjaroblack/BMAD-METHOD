/**
 * Base agent implementation providing common functionality for all BMAD agents
 */

import { AgentConfig, AgentState, AgentStatus, AgentTask, AgentResponse, AgentRole } from 'deps';

export interface IAgent {
  getId(): string;
  getRole(): AgentRole;
  getStatus(): AgentStatus;
  getState(): AgentState;
  executeTask(task: AgentTask): Promise<AgentResponse>;
  canExecuteTask(task: AgentTask): boolean;
  updateStatus(status: AgentStatus): void;
}

export abstract class BaseAgent implements IAgent {
  protected readonly id: string;
  protected readonly config: AgentConfig;
  protected state: AgentState;

  constructor(id: string, config: AgentConfig) {
    this.id = id;
    this.config = config;
    this.state = {
      id,
      role: config.role,
      status: AgentStatus.IDLE,
      currentTasks: [],
      lastActivity: new Date(),
      metadata: {}
    };
  }

  getId(): string {
    return this.id;
  }

  getRole(): AgentRole {
    return this.config.role;
  }

  getStatus(): AgentStatus {
    return this.state.status;
  }

  getState(): AgentState {
    return { ...this.state };
  }

  updateStatus(status: AgentStatus): void {
    this.state.status = status;
    this.state.lastActivity = new Date();
  }

  canExecuteTask(task: AgentTask): boolean {
    // Check if agent is available
    if (this.state.status === AgentStatus.OFFLINE || this.state.status === AgentStatus.ERROR) {
      return false;
    }

    // Check if agent has capacity
    if (this.state.currentTasks.length >= this.config.maxConcurrentTasks) {
      return false;
    }

    // Check if agent has required capabilities
    return this.hasRequiredCapabilities(task);
  }

  async executeTask(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.canExecuteTask(task)) {
        throw new Error(`Agent ${this.id} cannot execute task ${task.id}`);
      }

      this.updateStatus(AgentStatus.BUSY);
      this.state.currentTasks.push(task.id);

      const result = await this.performTask(task);

      const response: AgentResponse = {
        taskId: task.id,
        agentId: this.id,
        success: true,
        result,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      };

      this.completeTask(task.id);
      return response;

    } catch (error) {
      this.updateStatus(AgentStatus.ERROR);
      this.removeTask(task.id);

      return {
        taskId: task.id,
        agentId: this.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  protected abstract performTask(task: AgentTask): Promise<unknown>;

  protected hasRequiredCapabilities(_task: AgentTask): boolean {
    // Override in derived classes for specific capability checks
    return true;
  }

  private completeTask(taskId: string): void {
    this.removeTask(taskId);
    this.updateStatus(this.state.currentTasks.length > 0 ? AgentStatus.BUSY : AgentStatus.IDLE);
  }

  private removeTask(taskId: string): void {
    this.state.currentTasks = this.state.currentTasks.filter(id => id !== taskId);
  }
}

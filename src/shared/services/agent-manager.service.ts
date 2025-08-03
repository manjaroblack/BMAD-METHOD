/**
 * Agent Manager Service - Manages agent lifecycle, task assignment, and orchestration
 */

import { 
  AgentRegistry,
  AgentStatus
} from 'deps';
import type { IAgent, IAgentRegistry, AgentConfig, AgentRole, AgentTask, AgentResponse, AgentTeam } from 'deps';

export interface IAgentManager {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  createAgent(config: AgentConfig): Promise<IAgent>;
  assignTask(task: AgentTask, preferredRole?: AgentRole): Promise<AgentResponse>;
  getAgentStatus(agentId: string): AgentStatus | undefined;
  getSystemStatus(): AgentSystemStatus;
  createTeam(team: AgentTeam): Promise<void>;
  executeTeamWorkflow(teamId: string, workflow: string, context: Record<string, unknown>): Promise<TeamWorkflowResult>;
}

export interface AgentSystemStatus {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  busyAgents: number;
  errorAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number;
}

export interface TeamWorkflowResult {
  teamId: string;
  workflow: string;
  success: boolean;
  results: Record<string, unknown>;
  executionTime: number;
  participatingAgents: string[];
  errors?: string[];
}

export class AgentManager implements IAgentManager {
  private registry: IAgentRegistry;
  private taskHistory: Map<string, AgentResponse> = new Map();
  private agentFactories: Map<AgentRole, (config: AgentConfig) => Promise<IAgent>> = new Map();
  private isInitialized = false;

  constructor(registry?: IAgentRegistry) {
    this.registry = registry || new AgentRegistry();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Agent Manager is already initialized');
    }

    try {
      // Load agent configurations from YAML files
      await this.loadAgentConfigurations();
      
      // Initialize default agents
      await this.initializeDefaultAgents();
      
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Agent Manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    // Gracefully shutdown all agents
    const agents = this.registry.getAllAgents();
    await Promise.all(agents.map(agent => this.shutdownAgent(agent)));
    
    this.isInitialized = false;
  }

  async createAgent(config: AgentConfig): Promise<IAgent> {
    this.ensureInitialized();
    
    const factory = this.agentFactories.get(config.role);
    if (!factory) {
      throw new Error(`No factory registered for agent role: ${config.role}`);
    }

    const agent = await factory(config);
    this.registry.registerAgent(agent);
    
    return agent;
  }

  async assignTask(task: AgentTask, preferredRole?: AgentRole): Promise<AgentResponse> {
    this.ensureInitialized();
    
    let agent: IAgent | undefined;
    
    if (preferredRole) {
      // Find the first available agent with the preferred role
      const agentsWithRole = this.registry.getAgentsByRole(preferredRole);
      const availableAgents = this.registry.getAvailableAgents();
      agent = agentsWithRole.find(a => availableAgents.includes(a));
    }
    
    if (!agent) {
      // Find any available agent that can handle the task
      agent = this.findBestAgentForTask(task);
    }
    
    if (!agent) {
      throw new Error(`No available agent found for task: ${task.id}`);
    }

    const response = await agent.executeTask(task);
    this.taskHistory.set(task.id, response);
    
    return response;
  }

  getAgentStatus(agentId: string): AgentStatus | undefined {
    const agent = this.registry.getAgent(agentId);
    return agent?.getStatus();
  }

  getSystemStatus(): AgentSystemStatus {
    const agents = this.registry.getAllAgents();
    const states = agents.map(agent => agent.getState());
    const responses = Array.from(this.taskHistory.values());
    
    const statusCounts = states.reduce((acc, state) => {
      acc[state.status] = (acc[state.status] || 0) + 1;
      return acc;
    }, {} as Record<AgentStatus, number>);

    const successfulTasks = responses.filter(r => r.success).length;
    const failedTasks = responses.filter(r => !r.success).length;
    const avgResponseTime = responses.length > 0 
      ? responses.reduce((sum, r) => sum + r.executionTime, 0) / responses.length 
      : 0;

    return {
      totalAgents: agents.length,
      activeAgents: statusCounts[AgentStatus.ACTIVE] || 0,
      idleAgents: statusCounts[AgentStatus.IDLE] || 0,
      busyAgents: statusCounts[AgentStatus.BUSY] || 0,
      errorAgents: statusCounts[AgentStatus.ERROR] || 0,
      totalTasks: responses.length,
      completedTasks: successfulTasks,
      failedTasks: failedTasks,
      averageResponseTime: avgResponseTime
    };
  }

  async createTeam(team: AgentTeam): Promise<void> {
    this.ensureInitialized();
    this.registry.createTeam(team);
    await Promise.resolve(); // Ensure method is properly async
  }

  async executeTeamWorkflow(teamId: string, workflow: string, _context: Record<string, unknown>): Promise<TeamWorkflowResult> {
    this.ensureInitialized();
    
    const team = this.registry.getTeam(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const startTime = Date.now();
    const participatingAgents: string[] = [];
    const results: Record<string, unknown> = {};
    const errors: string[] = [];

    try {
      // Load workflow definition and execute team collaboration
      // This would integrate with the workflow orchestrator
      
      // For now, simulate team workflow execution
      await Promise.resolve(); // Ensure method is properly async
      for (const role of team.members) {
        const agents = this.registry.getAgentsByRole(role);
        if (agents.length > 0 && agents[0]) {
          participatingAgents.push(agents[0].getId());
          results[role] = `Executed ${workflow} for ${role}`;
        }
      }

      return {
        teamId,
        workflow,
        success: true,
        results,
        executionTime: Date.now() - startTime,
        participatingAgents,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        teamId,
        workflow,
        success: false,
        results,
        executionTime: Date.now() - startTime,
        participatingAgents,
        errors
      };
    }
  }

  private async loadAgentConfigurations(): Promise<void> {
    // Load configurations from YAML files in src/core/agents/
    // This would parse the existing YAML configs
  }

  private async initializeDefaultAgents(): Promise<void> {
    // Initialize default agents based on configurations
    // This would create instances of each agent type
  }

  private async shutdownAgent(agent: IAgent): Promise<void> {
    agent.updateStatus(AgentStatus.OFFLINE);
    await Promise.resolve(); // Ensure method is properly async
  }

  private findBestAgentForTask(task: AgentTask): IAgent | undefined {
    const availableAgents = this.registry.getAvailableAgents();
    
    return availableAgents.find(agent => agent.canExecuteTask(task));
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Agent Manager is not initialized. Call initialize() first.');
    }
  }

  /**
   * Register an agent factory for a specific role
   */
  registerAgentFactory(role: AgentRole, factory: (config: AgentConfig) => Promise<IAgent>): void {
    this.agentFactories.set(role, factory);
  }
}

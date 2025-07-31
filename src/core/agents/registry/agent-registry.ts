/**
 * Agent registry for managing agent instances and their lifecycle
 */

import { IAgent, AgentRole, AgentState, AgentStatus, AgentTeam } from 'deps';

export interface IAgentRegistry {
  registerAgent(agent: IAgent): void;
  unregisterAgent(agentId: string): void;
  getAgent(agentId: string): IAgent | undefined;
  getAgentsByRole(role: AgentRole): IAgent[];
  getAvailableAgents(): IAgent[];
  getAllAgents(): IAgent[];
  getAgentStates(): AgentState[];
  createTeam(team: AgentTeam): void;
  getTeam(teamId: string): AgentTeam | undefined;
  getTeams(): AgentTeam[];
}

export class AgentRegistry implements IAgentRegistry {
  private agents: Map<string, IAgent> = new Map();
  private teams: Map<string, AgentTeam> = new Map();
  private roleIndex: Map<AgentRole, Set<string>> = new Map();

  constructor() {
    // Initialize role index
    Object.values(AgentRole).forEach(role => {
      this.roleIndex.set(role, new Set());
    });
  }

  registerAgent(agent: IAgent): void {
    const agentId = agent.getId();
    const role = agent.getRole();

    if (this.agents.has(agentId)) {
      throw new Error(`Agent with ID ${agentId} is already registered`);
    }

    this.agents.set(agentId, agent);
    this.roleIndex.get(role)?.add(agentId);
  }

  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} is not registered`);
    }

    const role = agent.getRole();
    this.agents.delete(agentId);
    this.roleIndex.get(role)?.delete(agentId);
  }

  getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }

  getAgentsByRole(role: AgentRole): IAgent[] {
    const agentIds = this.roleIndex.get(role) || new Set();
    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((agent): agent is IAgent => agent !== undefined);
  }

  getAvailableAgents(): IAgent[] {
    return this.getAllAgents().filter(agent => {
      const status = agent.getStatus();
      return status === AgentStatus.IDLE || status === AgentStatus.ACTIVE;
    });
  }

  getAllAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentStates(): AgentState[] {
    return this.getAllAgents().map(agent => agent.getState());
  }

  createTeam(team: AgentTeam): void {
    if (this.teams.has(team.id)) {
      throw new Error(`Team with ID ${team.id} already exists`);
    }

    // Validate that all team members are registered
    const missingMembers = team.members.filter(role => {
      const agents = this.getAgentsByRole(role);
      return agents.length === 0;
    });

    if (missingMembers.length > 0) {
      throw new Error(`Cannot create team: missing agents for roles: ${missingMembers.join(', ')}`);
    }

    this.teams.set(team.id, team);
  }

  getTeam(teamId: string): AgentTeam | undefined {
    return this.teams.get(teamId);
  }

  getTeams(): AgentTeam[] {
    return Array.from(this.teams.values());
  }

  /**
   * Find the best available agent for a specific role
   */
  findBestAgent(role: AgentRole): IAgent | undefined {
    const candidates = this.getAgentsByRole(role).filter(agent => {
      const status = agent.getStatus();
      return status === AgentStatus.IDLE || status === AgentStatus.ACTIVE;
    });

    if (candidates.length === 0) {
      return undefined;
    }

    // Prefer idle agents over active ones
    const idleAgents = candidates.filter(agent => agent.getStatus() === AgentStatus.IDLE);
    if (idleAgents.length > 0) {
      return idleAgents[0];
    }

    // Return the first active agent with capacity
    return candidates.find(agent => {
      const state = agent.getState();
      return state.currentTasks.length < 3; // Assuming max 3 concurrent tasks
    });
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const stats = {
      totalAgents: this.agents.size,
      totalTeams: this.teams.size,
      agentsByRole: {} as Record<AgentRole, number>,
      agentsByStatus: {} as Record<AgentStatus, number>
    };

    // Count agents by role
    Object.values(AgentRole).forEach(role => {
      stats.agentsByRole[role] = this.getAgentsByRole(role).length;
    });

    // Count agents by status
    Object.values(AgentStatus).forEach(status => {
      stats.agentsByStatus[status] = 0;
    });

    this.getAllAgents().forEach(agent => {
      const status = agent.getStatus();
      stats.agentsByStatus[status]++;
    });

    return stats;
  }
}

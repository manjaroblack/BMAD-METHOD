/**
 * Workflow Engine - Executes workflows and manages workflow lifecycle
 */

import { 
  WorkflowDefinition, 
  WorkflowExecution, 
  WorkflowStatus, 
  WorkflowStep, 
  StepStatus, 
  WorkflowContext,
  WorkflowEvent,
  WorkflowMetrics 
} from '../types/workflow.types.ts';

export interface IWorkflowEngine {
  executeWorkflow(definition: WorkflowDefinition, context?: Record<string, unknown>): Promise<WorkflowExecution>;
  pauseWorkflow(executionId: string): Promise<void>;
  resumeWorkflow(executionId: string): Promise<void>;
  cancelWorkflow(executionId: string): Promise<void>;
  getExecution(executionId: string): WorkflowExecution | undefined;
  getActiveExecutions(): WorkflowExecution[];
  getMetrics(executionId: string): WorkflowMetrics | undefined;
}

export class WorkflowEngine implements IWorkflowEngine {
  private executions: Map<string, WorkflowExecution> = new Map();
  private eventHandlers: Map<string, (event: WorkflowEvent) => void> = new Map();

  async executeWorkflow(definition: WorkflowDefinition, context: Record<string, unknown> = {}): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: definition.id,
      status: WorkflowStatus.RUNNING,
      startTime: new Date(),
      context: { ...context },
      stepExecutions: definition.steps.map(step => ({
        stepId: step.id,
        status: StepStatus.PENDING,
        attempts: 0,
        logs: []
      }))
    };

    this.executions.set(executionId, execution);

    try {
      await this.executeSteps(definition, execution);
      execution.status = WorkflowStatus.COMPLETED;
      execution.endTime = new Date();
      
      this.emitEvent({
        type: 'workflow_completed',
        executionId,
        timestamp: new Date(),
        data: { execution }
      });

    } catch (error) {
      execution.status = WorkflowStatus.FAILED;
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.emitEvent({
        type: 'workflow_failed',
        executionId,
        timestamp: new Date(),
        data: { error: execution.error }
      });
    }

    return execution;
  }

  async pauseWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Workflow execution not found: ${executionId}`);
    }

    if (execution.status !== WorkflowStatus.RUNNING) {
      throw new Error(`Cannot pause workflow in status: ${execution.status}`);
    }

    execution.status = WorkflowStatus.PAUSED;
    await Promise.resolve(); // Ensure method is properly async
  }

  async resumeWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Workflow execution not found: ${executionId}`);
    }

    if (execution.status !== WorkflowStatus.PAUSED) {
      throw new Error(`Cannot resume workflow in status: ${execution.status}`);
    }

    execution.status = WorkflowStatus.RUNNING;
    // Continue execution from where it left off
    await Promise.resolve(); // Ensure method is properly async
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Workflow execution not found: ${executionId}`);
    }

    execution.status = WorkflowStatus.CANCELLED;
    execution.endTime = new Date();
    await Promise.resolve(); // Ensure method is properly async
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(
      execution => execution.status === WorkflowStatus.RUNNING || execution.status === WorkflowStatus.PAUSED
    );
  }

  getMetrics(executionId: string): WorkflowMetrics | undefined {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return undefined;
    }

    const totalSteps = execution.stepExecutions.length;
    const completedSteps = execution.stepExecutions.filter(s => s.status === StepStatus.COMPLETED).length;
    const failedSteps = execution.stepExecutions.filter(s => s.status === StepStatus.FAILED).length;
    const skippedSteps = execution.stepExecutions.filter(s => s.status === StepStatus.SKIPPED).length;

    const executionTime = execution.endTime 
      ? execution.endTime.getTime() - execution.startTime.getTime()
      : Date.now() - execution.startTime.getTime();

    const stepTimes = execution.stepExecutions
      .filter(s => s.startTime && s.endTime)
      .map(s => s.endTime!.getTime() - s.startTime!.getTime());
    
    const avgStepTime = stepTimes.length > 0 ? stepTimes.reduce((a, b) => a + b, 0) / stepTimes.length : 0;
    const successRate = totalSteps > 0 ? completedSteps / totalSteps : 0;

    return {
      executionId,
      totalSteps,
      completedSteps,
      failedSteps,
      skippedSteps,
      executionTime,
      avgStepTime,
      successRate
    };
  }

  private async executeSteps(definition: WorkflowDefinition, execution: WorkflowExecution): Promise<void> {
    const context: WorkflowContext = {
      workflowId: definition.id,
      executionId: execution.id,
      variables: { ...definition.variables, ...execution.context },
      stepResults: {},
      metadata: execution.metadata || {}
    };

    // Execute steps based on dependencies and conditions
    const executedSteps = new Set<string>();
    const pendingSteps = new Set(definition.steps.map(s => s.id));

    while (pendingSteps.size > 0 && execution.status === WorkflowStatus.RUNNING) {
      let progressMade = false;

      for (const step of definition.steps) {
        if (executedSteps.has(step.id) || !pendingSteps.has(step.id)) {
          continue;
        }

        // Check if dependencies are satisfied
        if (this.areDependenciesSatisfied(step, executedSteps)) {
          // Check if conditions are met
          if (await this.areConditionsMet(step, context)) {
            await this.executeStep(step, execution, context);
            executedSteps.add(step.id);
            pendingSteps.delete(step.id);
            progressMade = true;
          }
        }
      }

      if (!progressMade) {
        throw new Error('Workflow execution stalled - no steps can be executed');
      }
    }
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution, context: WorkflowContext): Promise<void> {
    const stepExecution = execution.stepExecutions.find(s => s.stepId === step.id);
    if (!stepExecution) {
      throw new Error(`Step execution not found: ${step.id}`);
    }

    stepExecution.status = StepStatus.RUNNING;
    stepExecution.startTime = new Date();
    stepExecution.attempts++;

    this.emitEvent({
      type: 'step_started',
      executionId: execution.id,
      stepId: step.id,
      timestamp: new Date()
    });

    try {
      // Execute the step based on its type
      const result = await this.performStepExecution(step, context);
      
      stepExecution.status = StepStatus.COMPLETED;
      stepExecution.endTime = new Date();
      stepExecution.result = result;
      
      // Store result in context for subsequent steps
      context.stepResults[step.id] = result;

      this.emitEvent({
        type: 'step_completed',
        executionId: execution.id,
        stepId: step.id,
        timestamp: new Date(),
        data: { result }
      });

      // Execute success actions
      if (step.onSuccess) {
        await this.executeActions(step.onSuccess, context);
      }

    } catch (error) {
      stepExecution.status = StepStatus.FAILED;
      stepExecution.endTime = new Date();
      stepExecution.error = error instanceof Error ? error.message : 'Unknown error';

      this.emitEvent({
        type: 'step_failed',
        executionId: execution.id,
        stepId: step.id,
        timestamp: new Date(),
        data: { error: stepExecution.error }
      });

      // Execute failure actions
      if (step.onFailure) {
        await this.executeActions(step.onFailure, context);
      }

      // Determine if we should retry or fail the workflow
      if (stepExecution.attempts < (step.retryAttempts || 1)) {
        // Retry the step
        await this.executeStep(step, execution, context);
      } else {
        throw error;
      }
    }
  }

  private async performStepExecution(step: WorkflowStep, context: WorkflowContext): Promise<unknown> {
    // This would integrate with the agent manager or task executor
    // For now, simulate step execution
    await Promise.resolve(); // Ensure method is properly async
    return { stepId: step.id, executed: true, context: context.variables };
  }

  private areDependenciesSatisfied(step: WorkflowStep, executedSteps: Set<string>): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    return step.dependencies.every(dep => executedSteps.has(dep));
  }

  private async areConditionsMet(step: WorkflowStep, context: WorkflowContext): Promise<boolean> {
    if (!step.conditions || step.conditions.length === 0) {
      return true;
    }

    // Evaluate all conditions - all must be true
    for (const condition of step.conditions) {
      if (!await this.evaluateCondition(condition, context)) {
        return false;
      }
    }

    return true;
  }

  private async evaluateCondition(_condition: unknown, _context: WorkflowContext): Promise<boolean> {
    // Implement condition evaluation logic
    await Promise.resolve(); // Ensure method is properly async
    return true;
  }

  private async executeActions(_actions: unknown[], _context: WorkflowContext): Promise<void> {
    // Implement action execution logic
    await Promise.resolve(); // Ensure method is properly async
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private emitEvent(event: WorkflowEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in workflow event handler:', error);
      }
    });
  }

  /**
   * Register an event handler
   */
  onEvent(handlerId: string, handler: (event: WorkflowEvent) => void): void {
    this.eventHandlers.set(handlerId, handler);
  }

  /**
   * Unregister an event handler
   */
  offEvent(handlerId: string): void {
    this.eventHandlers.delete(handlerId);
  }
}

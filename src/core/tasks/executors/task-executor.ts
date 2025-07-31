/**
 * Task Executor - Executes tasks and manages task lifecycle
 */

import { 
  Task, 
  TaskStatus, 
  TaskResult, 
  TaskError, 
  TaskExecution, 
  TaskCheckpoint, 
  TaskLog,
  TaskDefinition 
} from '../types/task.types.ts';

export interface ITaskExecutor {
  executeTask(task: Task): Promise<TaskResult>;
  pauseTask(taskId: string): Promise<void>;
  resumeTask(taskId: string): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  getExecution(taskId: string): TaskExecution | undefined;
  getActiveExecutions(): TaskExecution[];
  addCheckpoint(taskId: string, checkpoint: TaskCheckpoint): void;
  logMessage(taskId: string, level: string, message: string, data?: unknown): void;
}

export class TaskExecutor implements ITaskExecutor {
  private executions: Map<string, TaskExecution> = new Map();
  private taskDefinitions: Map<string, TaskDefinition> = new Map();
  private executorStrategies: Map<string, TaskExecutorStrategy> = new Map();

  constructor() {
    this.initializeExecutorStrategies();
  }

  async executeTask(task: Task): Promise<TaskResult> {
    const executionId = this.generateExecutionId();
    
    const execution: TaskExecution = {
      taskId: task.id,
      executionId,
      status: TaskStatus.RUNNING,
      assignedAgent: task.assignedAgent || 'system',
      startTime: new Date(),
      progress: 0,
      checkpoints: [],
      logs: []
    };

    this.executions.set(task.id, execution);
    task.status = TaskStatus.RUNNING;
    task.startedAt = new Date();

    try {
      this.logMessage(task.id, 'info', `Starting task execution: ${task.name}`);
      
      // Get the appropriate executor strategy
      const strategy = this.getExecutorStrategy(task.type);
      if (!strategy) {
        throw new Error(`No executor strategy found for task type: ${task.type}`);
      }

      // Execute the task using the strategy
      const result = await strategy.execute(task, execution, this);
      
      execution.status = TaskStatus.COMPLETED;
      execution.endTime = new Date();
      execution.progress = 100;
      
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      task.result = result;

      this.logMessage(task.id, 'info', `Task completed successfully: ${task.name}`);
      
      return result;

    } catch (error) {
      const taskError: TaskError = {
        code: 'EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { taskId: task.id, executionId },
        retryable: this.isRetryableError(error)
      };

      execution.status = TaskStatus.FAILED;
      execution.endTime = new Date();
      
      task.status = TaskStatus.FAILED;
      task.error = taskError;

      this.logMessage(task.id, 'error', `Task failed: ${taskError.message}`, { error: taskError });

      return {
        success: false,
        outputs: {},
        logs: execution.logs.map(log => `[${log.level.toUpperCase()}] ${log.message}`)
      };
    }
  }

  async pauseTask(taskId: string): Promise<void> {
    const execution = this.executions.get(taskId);
    if (!execution) {
      throw new Error(`Task execution not found: ${taskId}`);
    }

    if (execution.status !== TaskStatus.RUNNING) {
      throw new Error(`Cannot pause task in status: ${execution.status}`);
    }

    execution.status = TaskStatus.PAUSED;
    this.logMessage(taskId, 'info', 'Task paused');
    await Promise.resolve(); // Ensure method is properly async
  }

  async resumeTask(taskId: string): Promise<void> {
    const execution = this.executions.get(taskId);
    if (!execution) {
      throw new Error(`Task execution not found: ${taskId}`);
    }

    if (execution.status !== TaskStatus.PAUSED) {
      throw new Error(`Cannot resume task in status: ${execution.status}`);
    }

    execution.status = TaskStatus.RUNNING;
    this.logMessage(taskId, 'info', 'Task resumed');
    await Promise.resolve(); // Ensure method is properly async
  }

  async cancelTask(taskId: string): Promise<void> {
    const execution = this.executions.get(taskId);
    if (!execution) {
      throw new Error(`Task execution not found: ${taskId}`);
    }

    execution.status = TaskStatus.CANCELLED;
    execution.endTime = new Date();
    this.logMessage(taskId, 'info', 'Task cancelled');
    await Promise.resolve(); // Ensure method is properly async
  }

  getExecution(taskId: string): TaskExecution | undefined {
    return this.executions.get(taskId);
  }

  getActiveExecutions(): TaskExecution[] {
    return Array.from(this.executions.values()).filter(
      execution => execution.status === TaskStatus.RUNNING || execution.status === TaskStatus.PAUSED
    );
  }

  addCheckpoint(taskId: string, checkpoint: TaskCheckpoint): void {
    const execution = this.executions.get(taskId);
    if (execution) {
      execution.checkpoints.push(checkpoint);
      execution.progress = checkpoint.progress;
      this.logMessage(taskId, 'info', `Checkpoint: ${checkpoint.description} (${checkpoint.progress}%)`);
    }
  }

  logMessage(taskId: string, level: string, message: string, data?: Record<string, unknown>): void {
    const execution = this.executions.get(taskId);
    if (execution) {
      const log: TaskLog = {
        timestamp: new Date(),
        level: level as 'debug' | 'info' | 'warn' | 'error',
        message,
        data
      };
      execution.logs.push(log);
      
      // Also log to console for debugging
      console.log(`[${taskId}] [${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  private getExecutorStrategy(taskType: string): TaskExecutorStrategy | undefined {
    return this.executorStrategies.get(taskType) || this.executorStrategies.get('default');
  }

  private isRetryableError(error: unknown): boolean {
    // Determine if the error is retryable based on error type or message
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /unavailable/i
    ];

    const errorMessage = error instanceof Error ? error.message : String(error);
    return retryablePatterns.some(pattern => pattern.test(errorMessage));
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeExecutorStrategies(): void {
    // Register default strategy
    this.executorStrategies.set('default', new DefaultTaskExecutorStrategy());
    
    // Register specific strategies for different task types
    this.executorStrategies.set('create-doc', new DocumentCreationStrategy());
    this.executorStrategies.set('execute-checklist', new ChecklistExecutionStrategy());
    this.executorStrategies.set('review-story', new StoryReviewStrategy());
  }

  /**
   * Register a custom executor strategy
   */
  registerStrategy(taskType: string, strategy: TaskExecutorStrategy): void {
    this.executorStrategies.set(taskType, strategy);
  }
}

/**
 * Task executor strategy interface
 */
export interface TaskExecutorStrategy {
  execute(task: Task, execution: TaskExecution, executor: ITaskExecutor): Promise<TaskResult>;
}

/**
 * Default task executor strategy
 */
export class DefaultTaskExecutorStrategy implements TaskExecutorStrategy {
  async execute(task: Task, _execution: TaskExecution, executor: ITaskExecutor): Promise<TaskResult> {
    // Add progress checkpoints
    executor.addCheckpoint(task.id, {
      id: 'start',
      timestamp: new Date(),
      description: 'Task started',
      progress: 0
    });

    // Simulate task execution
    await this.delay(1000);
    
    executor.addCheckpoint(task.id, {
      id: 'processing',
      timestamp: new Date(),
      description: 'Processing task',
      progress: 50
    });

    await this.delay(1000);

    executor.addCheckpoint(task.id, {
      id: 'complete',
      timestamp: new Date(),
      description: 'Task completed',
      progress: 100
    });

    return {
      success: true,
      outputs: {
        result: `Executed task: ${task.name}`,
        timestamp: new Date().toISOString()
      },
      metrics: {
        executionTime: Date.now() - execution.startTime.getTime()
      }
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Document creation strategy
 */
export class DocumentCreationStrategy implements TaskExecutorStrategy {
  async execute(task: Task, _execution: TaskExecution, executor: ITaskExecutor): Promise<TaskResult> {
    executor.addCheckpoint(task.id, {
      id: 'analyze',
      timestamp: new Date(),
      description: 'Analyzing requirements',
      progress: 25
    });

    executor.addCheckpoint(task.id, {
      id: 'generate',
      timestamp: new Date(),
      description: 'Generating document',
      progress: 75
    });

    executor.addCheckpoint(task.id, {
      id: 'finalize',
      timestamp: new Date(),
      description: 'Finalizing document',
      progress: 100
    });

    await Promise.resolve(); // Ensure method is properly async

    const parameters = task.parameters as Record<string, unknown>;
    
    return {
      success: true,
      outputs: {
        documentId: `doc_${Date.now()}`,
        title: (parameters.title as string) || 'Generated Document',
        content: (parameters.content as string) || 'Document content generated successfully'
      },
      artifacts: [{
        id: `artifact_${Date.now()}`,
        name: 'Generated Document',
        type: 'document',
        content: (parameters.content as string) || 'Document content'
      }]
    };
  }
}

/**
 * Checklist execution strategy
 */
export class ChecklistExecutionStrategy implements TaskExecutorStrategy {
  async execute(task: Task, _execution: TaskExecution, executor: ITaskExecutor): Promise<TaskResult> {
    const parameters = task.parameters as Record<string, unknown>;
    const checklist = (parameters.checklist as unknown[]) || [];
    const results: Record<string, boolean> = {};
    
    for (let i = 0; i < checklist.length; i++) {
      const item = checklist[i];
      const progress = Math.round(((i + 1) / checklist.length) * 100);
      
      executor.addCheckpoint(task.id, {
        id: `item_${i}`,
        timestamp: new Date(),
        description: `Processing: ${item}`,
        progress
      });

      // Simulate checklist item execution
      results[item as string] = Math.random() > 0.1; // 90% success rate
    }

    const completedItems = Object.values(results).filter(Boolean).length;
    const totalItems = checklist.length;

    await Promise.resolve(); // Ensure method is properly async

    return {
      success: completedItems === totalItems,
      outputs: {
        completedItems,
        totalItems,
        successRate: completedItems / totalItems,
        results
      }
    };
  }
}

/**
 * Story review strategy
 */
export class StoryReviewStrategy implements TaskExecutorStrategy {
  async execute(task: Task, _execution: TaskExecution, executor: ITaskExecutor): Promise<TaskResult> {
    const parameters = task.parameters as Record<string, unknown>;
    const story = parameters.story as Record<string, unknown>;
    
    executor.addCheckpoint(task.id, {
      id: 'validate',
      timestamp: new Date(),
      description: 'Validating story structure',
      progress: 33
    });

    executor.addCheckpoint(task.id, {
      id: 'analyze',
      timestamp: new Date(),
      description: 'Analyzing story content',
      progress: 66
    });

    executor.addCheckpoint(task.id, {
      id: 'recommend',
      timestamp: new Date(),
      description: 'Generating recommendations',
      progress: 100
    });

    await Promise.resolve(); // Ensure method is properly async

    return {
      success: true,
      outputs: {
        storyId: story?.id || 'unknown',
        status: 'reviewed',
        score: Math.round(Math.random() * 100),
        recommendations: [
          'Add acceptance criteria',
          'Clarify user persona',
          'Define definition of done'
        ]
      }
    };
  }
}

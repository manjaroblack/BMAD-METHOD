/**
 * Task Scheduler - Manages task scheduling, queuing, and resource allocation
 */

import { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  TaskSchedule, 
  TaskQueue, 
  TaskFilter,
  TaskDependency 
} from '../types/task.types.ts';

export interface ITaskScheduler {
  scheduleTask(task: Task): Promise<TaskSchedule>;
  cancelTask(taskId: string): Promise<void>;
  rescheduleTask(taskId: string, newScheduledAt: Date): Promise<void>;
  getScheduledTasks(): TaskSchedule[];
  getTaskSchedule(taskId: string): TaskSchedule | undefined;
  createQueue(queue: TaskQueue): void;
  getQueue(queueId: string): TaskQueue | undefined;
  assignTaskToQueue(taskId: string, queueId: string): Promise<void>;
  getNextTask(queueId?: string): Task | undefined;
  updateTaskPriority(taskId: string, priority: TaskPriority): Promise<void>;
}

export class TaskScheduler implements ITaskScheduler {
  private schedules: Map<string, TaskSchedule> = new Map();
  private queues: Map<string, TaskQueue> = new Map();
  private dependencies: Map<string, TaskDependency[]> = new Map();
  private schedulingStrategy: SchedulingStrategy;

  constructor(strategy: SchedulingStrategy = new PrioritySchedulingStrategy()) {
    this.schedulingStrategy = strategy;
    
    // Create default queues
    this.createDefaultQueues();
  }

  async scheduleTask(task: Task): Promise<TaskSchedule> {
    // Check dependencies
    const blockedBy = await this.checkDependencies(task);
    if (blockedBy.length > 0) {
      task.status = TaskStatus.PENDING;
    }

    const schedule: TaskSchedule = {
      taskId: task.id,
      scheduledAt: task.scheduledAt || this.calculateScheduleTime(task),
      priority: task.priority,
      estimatedDuration: this.estimateDuration(task),
      dependencies: blockedBy
    };

    this.schedules.set(task.id, schedule);
    
    // Add to appropriate queue
    const queueId = this.determineQueue(task);
    await this.assignTaskToQueue(task.id, queueId);

    return schedule;
  }

  async cancelTask(taskId: string): Promise<void> {
    const schedule = this.schedules.get(taskId);
    if (!schedule) {
      throw new Error(`Task schedule not found: ${taskId}`);
    }

    // Remove from schedule
    this.schedules.delete(taskId);

    // Remove from all queues
    for (const queue of this.queues.values()) {
      queue.tasks = queue.tasks.filter(task => task.id !== taskId);
    }
    await Promise.resolve(); // Ensure method is properly async
  }

  async rescheduleTask(taskId: string, newScheduledAt: Date): Promise<void> {
    const schedule = this.schedules.get(taskId);
    if (!schedule) {
      throw new Error(`Task schedule not found: ${taskId}`);
    }

    schedule.scheduledAt = newScheduledAt;
    
    // Re-sort queues if necessary
    this.reorderQueues();
    await Promise.resolve(); // Ensure method is properly async
  }

  getScheduledTasks(): TaskSchedule[] {
    return Array.from(this.schedules.values()).sort((a, b) => 
      a.scheduledAt.getTime() - b.scheduledAt.getTime()
    );
  }

  getTaskSchedule(taskId: string): TaskSchedule | undefined {
    return this.schedules.get(taskId);
  }

  createQueue(queue: TaskQueue): void {
    this.queues.set(queue.id, queue);
  }

  getQueue(queueId: string): TaskQueue | undefined {
    return this.queues.get(queueId);
  }

  async assignTaskToQueue(taskId: string, queueId: string): Promise<void> {
    const queue = this.queues.get(queueId);
    if (!queue) {
      throw new Error(`Queue not found: ${queueId}`);
    }

    // Find the task (this would integrate with task manager)
    // For now, we'll assume the task is available
    const task = this.findTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Check queue capacity
    if (queue.tasks.length >= queue.capacity) {
      throw new Error(`Queue ${queueId} is at capacity`);
    }

    // Check filters
    if (!this.matchesQueueFilters(task, queue.filters || [])) {
      throw new Error(`Task ${taskId} does not match queue ${queueId} filters`);
    }

    queue.tasks.push(task);
    this.sortQueue(queue);
    await Promise.resolve(); // Ensure method is properly async
  }

  getNextTask(queueId?: string): Task | undefined {
    if (queueId) {
      const queue = this.queues.get(queueId);
      return queue && queue.tasks.length > 0 ? queue.tasks[0] : undefined;
    }

    // Find next task across all queues
    let nextTask: Task | undefined;
    let earliestTime = Infinity;

    for (const queue of this.queues.values()) {
      if (queue.tasks.length > 0) {
        const task = queue.tasks[0];
        if (!task) continue;
        const schedule = this.schedules.get(task.id);
        const scheduledTime = schedule?.scheduledAt.getTime() || 0;

        if (scheduledTime < earliestTime) {
          earliestTime = scheduledTime;
          nextTask = task;
        }
      }
    }

    return nextTask;
  }

  async updateTaskPriority(taskId: string, priority: TaskPriority): Promise<void> {
    const schedule = this.schedules.get(taskId);
    if (!schedule) {
      throw new Error(`Task schedule not found: ${taskId}`);
    }

    schedule.priority = priority;
    
    // Find and update task in queues
    for (const queue of this.queues.values()) {
      const taskIndex = queue.tasks.findIndex(task => task.id === taskId);
      if (taskIndex !== -1 && queue.tasks[taskIndex]) {
        queue.tasks[taskIndex]!.priority = priority;
        this.sortQueue(queue);
        break;
      }
    }
    await Promise.resolve(); // Ensure method is properly async
  }

  private async checkDependencies(task: Task): Promise<string[]> {
    if (!task.dependencies || task.dependencies.length === 0) {
      return [];
    }

    const blockedBy: string[] = [];
    
    for (const depTaskId of task.dependencies) {
      const depTask = this.findTask(depTaskId);
      if (depTask && depTask.status !== TaskStatus.COMPLETED) {
        blockedBy.push(depTaskId);
      }
    }

    await Promise.resolve(); // Ensure method is properly async
    return blockedBy;
  }

  private calculateScheduleTime(task: Task): Date {
    return this.schedulingStrategy.calculateScheduleTime(task, this.schedules);
  }

  private estimateDuration(_task: Task): number {
    // This would use historical data or task definition estimates
    return 300000; // 5 minutes default
  }

  private determineQueue(task: Task): string {
    // Route task to appropriate queue based on priority and type
    if (task.priority >= TaskPriority.URGENT) {
      return 'high-priority';
    } else if (task.priority >= TaskPriority.HIGH) {
      return 'normal-priority';
    } else {
      return 'low-priority';
    }
  }

  private findTask(_taskId: string): Task | undefined {
    // This would integrate with the task manager to find tasks
    // For now, return undefined as placeholder
    return undefined;
  }

  private matchesQueueFilters(task: Task, filters: TaskFilter[]): boolean {
    return filters.every(filter => this.evaluateFilter(task, filter));
  }

  private evaluateFilter(task: Task, filter: TaskFilter): boolean {
    let value: string | number | string[] | undefined;
    
    switch (filter.type) {
      case 'priority':
        value = task.priority;
        break;
      case 'agent':
        value = task.assignedAgent;
        break;
      case 'category':
        value = task.type;
        break;
      case 'tag':
        value = task.tags;
        break;
      default:
        return true;
    }

    return this.compareValues(value, filter.value, filter.operator);
  }

  private compareValues(actual: string | number | string[] | undefined, expected: string | number | string[] | undefined, operator: string): boolean {
    // Handle undefined values
    if (actual === undefined || expected === undefined) {
      return operator === 'equals' ? actual === expected : false;
    }

    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater':
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
      case 'less':
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
      case 'contains':
        return Array.isArray(actual) && typeof expected === 'string' && actual.includes(expected);
      default:
        return false;
    }
  }

  private sortQueue(queue: TaskQueue): void {
    switch (queue.processingStrategy) {
      case 'PRIORITY':
        queue.tasks.sort((a, b) => b.priority - a.priority);
        break;
      case 'LIFO':
        queue.tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'FIFO':
      default:
        queue.tasks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
    }
  }

  private reorderQueues(): void {
    for (const queue of this.queues.values()) {
      this.sortQueue(queue);
    }
  }

  private createDefaultQueues(): void {
    const queues: TaskQueue[] = [
      {
        id: 'high-priority',
        name: 'High Priority Tasks',
        tasks: [],
        capacity: 10,
        processingStrategy: 'PRIORITY',
        filters: [{ type: 'priority', value: TaskPriority.HIGH, operator: 'greater' }]
      },
      {
        id: 'normal-priority',
        name: 'Normal Priority Tasks',
        tasks: [],
        capacity: 50,
        processingStrategy: 'FIFO'
      },
      {
        id: 'low-priority',
        name: 'Low Priority Tasks',
        tasks: [],
        capacity: 100,
        processingStrategy: 'FIFO'
      }
    ];

    queues.forEach(queue => this.createQueue(queue));
  }
}

/**
 * Scheduling strategy interface
 */
export interface SchedulingStrategy {
  calculateScheduleTime(task: Task, existingSchedules: Map<string, TaskSchedule>): Date;
}

/**
 * Priority-based scheduling strategy
 */
export class PrioritySchedulingStrategy implements SchedulingStrategy {
  calculateScheduleTime(task: Task, _existingSchedules: Map<string, TaskSchedule>): Date {
    const now = new Date();
    
    // High priority tasks get immediate scheduling
    if (task.priority >= TaskPriority.HIGH) {
      return now;
    }
    
    // Normal priority tasks get scheduled with some delay
    const delayMinutes = (TaskPriority.CRITICAL - task.priority) * 5;
    return new Date(now.getTime() + delayMinutes * 60 * 1000);
  }
}

/**
 * Load balancing scheduling strategy
 */
export class LoadBalancingSchedulingStrategy implements SchedulingStrategy {
  calculateScheduleTime(_task: Task, existingSchedules: Map<string, TaskSchedule>): Date {
    const now = new Date();
    const schedules = Array.from(existingSchedules.values());
    
    // Find the least busy time slot
    const timeSlots = new Map<number, number>();
    
    schedules.forEach(schedule => {
      const timeSlot = Math.floor(schedule.scheduledAt.getTime() / (5 * 60 * 1000)); // 5-minute slots
      timeSlots.set(timeSlot, (timeSlots.get(timeSlot) || 0) + 1);
    });
    
    // Find the first available slot with minimum load
    let bestSlot = Math.floor(now.getTime() / (5 * 60 * 1000));
    let minLoad = timeSlots.get(bestSlot) || 0;
    
    for (let i = 0; i < 24; i++) { // Check next 2 hours
      const slot = bestSlot + i;
      const load = timeSlots.get(slot) || 0;
      if (load < minLoad) {
        minLoad = load;
        bestSlot = slot;
      }
    }
    
    return new Date(bestSlot * 5 * 60 * 1000);
  }
}

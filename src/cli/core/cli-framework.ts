/**
 * CLI Framework - Core implementation for modular command-line interface
 */

import {
  ICLI,
  CommandDefinition,
  CommandContext,
  CommandResult,
  CLIConfig,
  CLILogger,
  CLIPlugin,
  CLIMiddleware,
  CLIEventType,
  CLIEvent,
  CLIEventListener,
  CLIMetrics,
  CLIHelp,
  CLIValidation
} from 'deps';

export class CLIFramework implements ICLI {
  private commands: Map<string, CommandDefinition> = new Map();
  private plugins: Map<string, CLIPlugin> = new Map();
  private middlewares: CLIMiddleware[] = [];
  private eventListeners: Map<CLIEventType, CLIEventListener[]> = new Map();
  private config: CLIConfig;
  private logger: CLILogger;
  private metrics: CLIMetrics;
  private help: CLIHelp;
  private validation: CLIValidation;

  constructor(config?: Partial<CLIConfig>) {
    this.config = {
      rootDir: Deno.cwd(),
      outputDir: './dist',
      tempDir: './tmp',
      logLevel: 'info',
      verbose: false,
      dryRun: false,
      concurrency: 4,
      ...config
    };

    this.logger = this.createLogger();
    this.metrics = this.initializeMetrics();
    this.help = this.createHelpSystem();
    this.validation = this.createValidationSystem();

    // Register core commands
    this.registerCoreCommands();
  }

  registerCommand(command: CommandDefinition): void {
    // Validate command before registration
    const validation = this.validation.validateCommand(command);
    if (!validation.valid) {
      throw new Error(`Invalid command definition: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.commands.set(command.name, command);
    
    // Register aliases
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.commands.set(alias, command);
      });
    }

    this.emitEvent({
      type: CLIEventType.COMMAND_START,
      timestamp: new Date(),
      data: { commandName: command.name }
    });
  }

  async registerPlugin(plugin: CLIPlugin): Promise<void> {
    try {
      // Initialize plugin if needed
      if (plugin.initialize) {
        await plugin.initialize(this);
      }

      // Register plugin commands
      plugin.commands.forEach(command => {
        this.registerCommand({
          ...command,
          category: command.category || plugin.name
        });
      });

      this.plugins.set(plugin.name, plugin);
      
      this.emitEvent({
        type: CLIEventType.PLUGIN_LOADED,
        timestamp: new Date(),
        data: { pluginName: plugin.name, pluginVersion: plugin.version }
      });

      this.logger.info(`Plugin loaded: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      this.logger.error(`Failed to register plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async executeCommand(commandName: string, args: string[], options: Record<string, unknown>): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      const command = this.getCommand(commandName);
      if (!command) {
        return {
          success: false,
          message: `Command '${commandName}' not found`,
          exitCode: 1
        };
      }

      // Validate arguments and options
      const argsValidation = this.validation.validateArgs(args, command);
      const optionsValidation = this.validation.validateOptions(options, command.options);

      if (!argsValidation.valid || !optionsValidation.valid) {
        const errors = [...argsValidation.errors, ...optionsValidation.errors];
        return {
          success: false,
          message: `Validation failed: ${errors.map(e => e.message).join(', ')}`,
          exitCode: 1
        };
      }

      // Create command context
      const context: CommandContext = {
        args,
        options,
        workingDir: this.config.rootDir,
        config: this.config,
        logger: this.logger
      };

      this.emitEvent({
        type: CLIEventType.COMMAND_START,
        timestamp: new Date(),
        data: { commandName, args, options }
      });

      // Execute middleware chain
      const result = await this.executeWithMiddleware(command, context);

      // Update metrics
      this.updateMetrics(commandName, result.success, Date.now() - startTime);

      const eventType = result.success ? CLIEventType.COMMAND_SUCCESS : CLIEventType.COMMAND_FAILURE;
      this.emitEvent({
        type: eventType,
        timestamp: new Date(),
        data: { commandName, result, executionTime: Date.now() - startTime }
      });

      return result;

    } catch (error) {
      const result: CommandResult = {
        success: false,
        message: `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        exitCode: 1
      };

      this.updateMetrics(commandName, false, Date.now() - startTime);

      this.emitEvent({
        type: CLIEventType.COMMAND_FAILURE,
        timestamp: new Date(),
        data: { commandName, error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return result;
    } finally {
      this.emitEvent({
        type: CLIEventType.COMMAND_END,
        timestamp: new Date(),
        data: { commandName, executionTime: Date.now() - startTime }
      });
    }
  }

  getCommands(): CommandDefinition[] {
    const uniqueCommands = new Map<string, CommandDefinition>();
    
    this.commands.forEach((command, name) => {
      if (name === command.name) { // Only include primary name, not aliases
        uniqueCommands.set(name, command);
      }
    });

    return Array.from(uniqueCommands.values());
  }

  getCommand(name: string): CommandDefinition | undefined {
    return this.commands.get(name);
  }

  configure(config: Partial<CLIConfig>): void {
    this.config = { ...this.config, ...config };
    
    this.emitEvent({
      type: CLIEventType.CONFIG_CHANGED,
      timestamp: new Date(),
      data: { config: this.config }
    });
  }

  getConfig(): CLIConfig {
    return { ...this.config };
  }

  private async executeWithMiddleware(command: CommandDefinition, context: CommandContext): Promise<CommandResult> {
    const sortedMiddlewares = [...this.middlewares].sort((a, b) => a.priority - b.priority);
    let index = 0;

    const next = async (): Promise<CommandResult> => {
      if (index >= sortedMiddlewares.length) {
        // Execute the actual command
        return await command.handler(context);
      }

      const middleware = sortedMiddlewares[index++];
      if (!middleware) {
        throw new Error('Middleware not found at index');
      }
      return await middleware.execute(context, next);
    };

    return await next();
  }

  private updateMetrics(commandName: string, success: boolean, executionTime: number): void {
    this.metrics.commandsExecuted++;
    if (success) {
      this.metrics.successfulCommands++;
    } else {
      this.metrics.failedCommands++;
    }

    // Update average execution time
    const totalTime = this.metrics.averageExecutionTime * (this.metrics.commandsExecuted - 1) + executionTime;
    this.metrics.averageExecutionTime = totalTime / this.metrics.commandsExecuted;

    // Track most used command (simplified)
    if (!this.metrics.mostUsedCommand) {
      this.metrics.mostUsedCommand = commandName;
    }
  }

  private emitEvent(event: CLIEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.logger.error(`Error in event listener for ${event.type}:`, error);
      }
    });
  }

  private createLogger(): CLILogger {
    return {
      debug: (message: string, ...args: unknown[]) => {
        if (this.config.logLevel === 'debug') {
          console.debug(`[DEBUG] ${message}`, ...args);
        }
      },
      info: (message: string, ...args: unknown[]) => {
        if (['debug', 'info'].includes(this.config.logLevel)) {
          console.log(`[INFO] ${message}`, ...args);
        }
      },
      warn: (message: string, ...args: unknown[]) => {
        if (['debug', 'info', 'warn'].includes(this.config.logLevel)) {
          console.warn(`[WARN] ${message}`, ...args);
        }
      },
      error: (message: string, ...args: unknown[]) => {
        console.error(`[ERROR] ${message}`, ...args);
      },
      success: (message: string, ...args: unknown[]) => {
        console.log(`✅ ${message}`, ...args);
      }
    };
  }

  private initializeMetrics(): CLIMetrics {
    return {
      commandsExecuted: 0,
      successfulCommands: 0,
      failedCommands: 0,
      averageExecutionTime: 0,
      mostUsedCommand: '',
      pluginsLoaded: 0
    };
  }

  private createHelpSystem(): CLIHelp {
    return {
      generateCommandHelp: (command: CommandDefinition): string => {
        let help = `${command.name} - ${command.description}\n\n`;
        
        if (command.options.length > 0) {
          help += 'Options:\n';
          command.options.forEach(option => {
            const shortFlag = option.short ? `-${option.short}, ` : '';
            help += `  ${shortFlag}--${option.name}  ${option.description}\n`;
          });
          help += '\n';
        }

        if (command.examples && command.examples.length > 0) {
          help += 'Examples:\n';
          command.examples.forEach(example => {
            help += `  ${example.description}\n  $ ${example.command}\n\n`;
          });
        }

        return help;
      },
      generateOverviewHelp: (commands: CommandDefinition[]): string => {
        let help = 'BMAD-METHOD CLI Tool\n\n';
        help += 'Available commands:\n\n';

        const categories = new Map<string, CommandDefinition[]>();
        commands.forEach(command => {
          const category = command.category || 'General';
          if (!categories.has(category)) {
            categories.set(category, []);
          }
          categories.get(category)!.push(command);
        });

        categories.forEach((cmds, category) => {
          help += `${category}:\n`;
          cmds.forEach(command => {
            help += `  ${command.name.padEnd(20)} ${command.description}\n`;
          });
          help += '\n';
        });

        return help;
      },
      generatePluginHelp: (plugin: CLIPlugin): string => {
        let help = `${plugin.name} v${plugin.version}\n`;
        help += `${plugin.description}\n\n`;
        help += 'Commands provided by this plugin:\n';
        
        plugin.commands.forEach(command => {
          help += `  ${command.name.padEnd(20)} ${command.description}\n`;
        });

        return help;
      }
    };
  }

  private createValidationSystem(): CLIValidation {
    return {
      validateCommand: (command: CommandDefinition) => {
        const errors: { message: string; code: string }[] = [];
        const warnings: { message: string; code: string }[] = [];

        if (!command.name || command.name.trim().length === 0) {
          errors.push({ message: 'Command name is required', code: 'MISSING_NAME' });
        }

        if (!command.description || command.description.trim().length === 0) {
          warnings.push({ message: 'Command description is recommended', code: 'MISSING_DESCRIPTION' });
        }

        if (!command.handler) {
          errors.push({ message: 'Command handler is required', code: 'MISSING_HANDLER' });
        }

        return { valid: errors.length === 0, errors, warnings };
      },
      validateOptions: (options: Record<string, unknown>, definitions: { name: string; required?: boolean; validator?: (value: unknown) => boolean | string }[]) => {
        const errors: { field: string; message: string; code: string }[] = [];
        const warnings: { field: string; message: string; code: string }[] = [];

        definitions.forEach(def => {
          const value = options[def.name];
          
          if (def.required && (value === undefined || value === null)) {
            errors.push({ field: def.name, message: `Option --${def.name} is required`, code: 'REQUIRED_OPTION' });
          }

          if (value !== undefined && def.validator) {
            const validation = def.validator(value);
            if (validation !== true) {
              errors.push({ field: def.name, message: typeof validation === 'string' ? validation : `Invalid value for --${def.name}`, code: 'VALIDATION_FAILED' });
            }
          }
        });

        return { valid: errors.length === 0, errors, warnings };
      },
      validateArgs: (_args: string[], _command: CommandDefinition) => {
        // Basic argument validation - can be extended
        return { valid: true, errors: [], warnings: [] };
      }
    };
  }

  private registerCoreCommands(): void {
    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Show help information',
      options: [
        {
          name: 'command',
          description: 'Show help for specific command',
          type: 'string'
        }
      ],
      handler: (context: CommandContext): Promise<CommandResult> => {
        const commandName = context.options.command;
        
        if (commandName) {
          const command = this.getCommand(commandName);
          if (!command) {
            return Promise.resolve({
              success: false,
              message: `Command '${commandName}' not found`,
              exitCode: 1
            });
          }
          
          console.log(this.help.generateCommandHelp(command));
        } else {
          console.log(this.help.generateOverviewHelp(this.getCommands()));
        }

        return Promise.resolve({ success: true, exitCode: 0 });
      },
      category: 'Core'
    });

    // Version command
    this.registerCommand({
      name: 'version',
      description: 'Show version information',
      aliases: ['v'],
      options: [],
      handler: (): Promise<CommandResult> => {
        console.log('BMAD-METHOD CLI v5.0.0');
        return Promise.resolve({ success: true, exitCode: 0 });
      },
      category: 'Core'
    });
  }

  /**
   * Register middleware for command execution
   */
  registerMiddleware(middleware: CLIMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Register event listener
   */
  addEventListener(type: CLIEventType, listener: CLIEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * Get CLI metrics
   */
  getMetrics(): CLIMetrics {
    return { ...this.metrics };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup plugins
    for (const plugin of this.plugins.values()) {
      if (plugin.cleanup) {
        try {
          await plugin.cleanup();
        } catch (error) {
          this.logger.error(`Error cleaning up plugin ${plugin.name}:`, error);
        }
      }
    }

    // Clear event listeners
    this.eventListeners.clear();
  }
}

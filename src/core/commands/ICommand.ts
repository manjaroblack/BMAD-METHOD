/**
 * Command interface for executable commands in the CLI application.
 * All commands must implement this interface to be registered and executed.
 */
export interface ICommand {
  /** The name of the command, used for CLI invocation */
  name: string;

  /** The description of the command, used for help text */
  description: string;

  /**
   * Execute the command with the provided arguments.
   * @param args - Variable number of arguments passed to the command.
   * @returns A promise that resolves when the command execution is complete, or void for synchronous execution.
   */
  execute(...args: unknown[]): Promise<void> | void;
}

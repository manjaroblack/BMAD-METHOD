import { Command } from '../../../../deps.ts';
import { ICliService } from './ICliService.ts';
import { ICommand } from '../../commands/ICommand.ts';

export class CliService implements ICliService {
  private program: Command;
  
  constructor(
    private readonly commands: ICommand[],
  ) {
    this.program = new Command()
      .name('bmad')
      .version('1.0.0')
      .description('BMad Framework CLI');
      
    // Register all commands
    for (const command of this.commands) {
      this.registerCommand(command);
    }
  }

  registerCommand(command: ICommand): void {
    const cmd = new Command()
      .name(command.name)
      .description(command.description)
      .action(async () => {
        try {
          await command.execute({});
        } catch (error) {
          console.error(`Error executing command ${command.name}:`, error);
          Deno.exit(1);
        }
      });
      
    this.program.command(command.name, cmd);
  }

  async run(args: string[] = Deno.args): Promise<void> {
    await this.program.parse(args);
  }
}

// Factory function for DI container
export function createCliService(commands: ICommand[]): ICliService {
  return new CliService(commands);
}

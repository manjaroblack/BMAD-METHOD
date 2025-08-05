import { ICommand } from '../../commands/ICommand.ts';

export interface ICliService {
  registerCommand(command: ICommand): void;
  run(): Promise<void>;
}

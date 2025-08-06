import type { ICommand } from "../../commands/ICommand.ts";

export interface ICliService {
  registerCommand(command: ICommand): void;
  run(args?: string[]): Promise<void>;
}

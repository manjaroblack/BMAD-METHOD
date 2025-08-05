export interface ICommand {
  name: string;
  description: string;
  execute(...args: unknown[]): Promise<void> | void;
}

import type { InstallConfig, IPromptHandler } from "deps";

export interface IInstallerService {
  install(config: InstallConfig): Promise<void>;
  update(config: InstallConfig): Promise<void>;
  repair(config: InstallConfig): Promise<void>;
  promptHandler: IPromptHandler;
}

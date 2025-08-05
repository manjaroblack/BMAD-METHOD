export interface IInstallerService {
  install(options: { directory: string }): Promise<void>;
  update(options: { directory: string }): Promise<void>;
  repair(options: { directory: string }): Promise<void>;
}

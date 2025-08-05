export interface IConfigService {
  load(): Promise<unknown>;
  get<T>(key: string, defaultValue?: T): T;
  set<T>(key: string, value: T): void;
  save(): Promise<void>;
}

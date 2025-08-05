import { IConfigService } from "./IConfigService.ts";
import { ServiceError } from "../../errors/ServiceError.ts";
import { existsSync } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { join as _join } from "https://deno.land/std@0.224.0/path/mod.ts";

export class ConfigService implements IConfigService {
  private config: Record<string, unknown> = {};
  private configPath: string = "./config.jsonc";

  async load(): Promise<unknown> {
    try {
      if (existsSync(this.configPath)) {
        const text = await Deno.readTextFile(this.configPath);
        this.config = JSON.parse(text) as Record<string, unknown>;
      } else {
        this.config = {};
      }
      return this.config;
    } catch (error) {
      throw new ServiceError(
        `Failed to load config from ${this.configPath}`,
        "CONFIG_LOAD_ERROR",
        error as Error | undefined,
      );
    }
  }

  get<T>(key: string, defaultValue?: T): T {
    return (this.config[key] as T) ?? (defaultValue as T);
  }

  set<T>(key: string, value: T): void {
    this.config[key] = value;
  }

  async save(): Promise<void> {
    try {
      const text = JSON.stringify(this.config, null, 2);
      await Deno.writeTextFile(this.configPath, text);
    } catch (error) {
      throw new ServiceError(
        "Failed to save config",
        "CONFIG_SAVE_ERROR",
        error as Error | undefined,
      );
    }
  }
}

// Factory function for DI container
export function createConfigService(): IConfigService {
  return new ConfigService();
}

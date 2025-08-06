import type { IConfigService } from "./IConfigService.ts";
import { ConfigLoadError } from "../../errors/ConfigLoadError.ts";
import { ServiceError } from "../../errors/ServiceError.ts";
import { existsSync } from "deps";
import type { join as _join } from "deps";

export class ConfigService implements IConfigService {
  private config: Record<string, unknown> = {};
  private configPath: string = "./config.jsonc";

  async load(sources?: string[]): Promise<unknown> {
    try {
      // Reset config
      this.config = {};
      
      // Default sources if none provided
      const configSources = sources && sources.length > 0 
        ? sources 
        : [this.configPath];
      
      // Load from each source in order
      for (const source of configSources) {
        if (source.startsWith('env:')) {
          // Load from environment variable
          const envKey = source.substring(4); // Remove 'env:' prefix
          const envValue = Deno.env.get(envKey);
          if (envValue) {
            try {
              const parsedValue = JSON.parse(envValue);
              this.mergeConfig(parsedValue);
            } catch {
              // If not valid JSON, treat as string
              this.set(envKey, envValue);
            }
          }
        } else {
          // Load from file
          if (existsSync(source)) {
            const text = await Deno.readTextFile(source);
            const fileConfig = JSON.parse(text) as Record<string, unknown>;
            this.mergeConfig(fileConfig);
          }
        }
      }
      
      // Apply environment variable overrides
      this.applyEnvOverrides();
      
      return this.config;
    } catch (error) {
      throw new ConfigLoadError(
        `Failed to load config from sources: ${sources?.join(', ') || this.configPath}`,
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

  /**
   * Merge configuration from another source into the current config.
   * @param sourceConfig - The configuration to merge.
   */
  private mergeConfig(sourceConfig: Record<string, unknown>): void {
    this.config = { ...this.config, ...sourceConfig };
  }

  /**
   * Apply environment variable overrides with highest precedence.
   * Environment variables in the format BMAD_CONFIG_KEY will override config values.
   */
  private applyEnvOverrides(): void {
    const envPrefix = "BMAD_CONFIG_";
    
    for (const [key, value] of Object.entries(Deno.env.toObject())) {
      if (key.startsWith(envPrefix)) {
        const configKey = key.substring(envPrefix.length).toLowerCase();
        
        // Try to parse as JSON, otherwise treat as string
        try {
          this.config[configKey] = JSON.parse(value as string);
        } catch {
          this.config[configKey] = value;
        }
      }
    }
  }
}

// Factory function for DI container
export function createConfigService(): IConfigService {
  return new ConfigService();
}

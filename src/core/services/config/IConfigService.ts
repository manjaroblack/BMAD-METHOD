/**
 * Configuration service interface for managing application configuration.
 * Provides methods for loading, getting, setting, and saving configuration values.
 */
export interface IConfigService {
  /**
   * Load configuration from the configuration file.
   * @returns A promise that resolves when the configuration is loaded.
   */
  load(): Promise<unknown>;

  /**
   * Get a configuration value by key.
   * @template T - The expected type of the configuration value.
   * @param key - The configuration key to retrieve.
   * @param defaultValue - Optional default value to return if the key is not found.
   * @returns The configuration value or default value.
   */
  get<T>(key: string, defaultValue?: T): T;

  /**
   * Set a configuration value by key.
   * @template T - The type of the configuration value.
   * @param key - The configuration key to set.
   * @param value - The configuration value to set.
   */
  set<T>(key: string, value: T): void;

  /**
   * Save the current configuration to the configuration file.
   * @returns A promise that resolves when the configuration is saved.
   */
  save(): Promise<void>;
}

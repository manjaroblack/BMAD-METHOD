// Simple DI Container without decorators
export type ServiceIdentifier<T> = string;

export interface ServiceMetadata<T> {
  id: ServiceIdentifier<T>;
  type: "singleton" | "transient";
  factory: () => T;
}

/**
 * A simple dependency injection container that manages service registration and retrieval.
 * Supports both singleton and transient service lifetimes.
 */
export class Container {
  private services = new Map<ServiceIdentifier<unknown>, ServiceMetadata<unknown>[]>();
  private instances = new Map<ServiceIdentifier<unknown>, unknown[]>();

  /**
   * Register a service with the container.
   * @template T - The type of the service being registered.
   * @param id - The service identifier string.
   * @param factory - A factory function that creates instances of the service.
   * @param type - The service lifetime type ('singleton' or 'transient'). Defaults to 'singleton'.
   */
  register<T>(
    id: ServiceIdentifier<T>,
    factory: () => T,
    type: "singleton" | "transient" = "singleton",
  ): void {
    if (!this.services.has(id)) {
      this.services.set(id, []);
      this.instances.set(id, []);
    }

    const metadata = this.services.get(id)!;
    metadata.push({ id, factory, type });
  }

  /**
   * Retrieve a service instance from the container.
   * For singleton services, returns the same instance on subsequent calls.
   * For transient services, creates a new instance on each call.
   * @template T - The type of the service being retrieved.
   * @param id - The service identifier string.
   * @returns The service instance.
   * @throws {Error} If no service is registered with the given identifier.
   */
  get<T>(id: ServiceIdentifier<T>): T {
    const metadataList = this.services.get(id);
    if (!metadataList || metadataList.length === 0) {
      throw new Error(`Service ${id} not registered`);
    }

    // Return the first registered service
    const metadata = metadataList[0] as ServiceMetadata<T>;

    if (metadata.type === "singleton") {
      const instanceList = this.instances.get(id)!;
      if (instanceList.length === 0 || instanceList[0] === undefined) {
        const instance = metadata.factory();
        instanceList[0] = instance;
        return instance as T;
      }
      return instanceList[0] as T;
    } else {
      return metadata.factory();
    }
  }

  /**
   * Retrieve all registered service instances for a given identifier.
   * Useful when multiple implementations of the same service type are registered.
   * @template T - The type of the services being retrieved.
   * @param id - The service identifier string.
   * @returns An array of service instances.
   */
  getAll<T>(id: ServiceIdentifier<T>): T[] {
    const metadataList = this.services.get(id);
    if (!metadataList || metadataList.length === 0) {
      return [];
    }

    const instances: T[] = [];
    for (let i = 0; i < metadataList.length; i++) {
      const metadata = metadataList[i] as ServiceMetadata<T>;

      if (metadata.type === "singleton") {
        const instanceList = this.instances.get(id)!;
        // Ensure instanceList has enough slots
        while (instanceList.length <= i) {
          instanceList.push(undefined);
        }

        if (instanceList[i] === undefined) {
          const instance = metadata.factory();
          instanceList[i] = instance;
          instances.push(instance as T);
        } else {
          instances.push(instanceList[i] as T);
        }
      } else {
        instances.push(metadata.factory());
      }
    }

    return instances;
  }
}

// Global container instance
export const container = new Container();

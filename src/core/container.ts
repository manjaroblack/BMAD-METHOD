// Simple DI Container without decorators
export type ServiceIdentifier<T> = string;

export interface ServiceMetadata<T> {
  id: ServiceIdentifier<T>;
  type: 'singleton' | 'transient';
  factory: () => T;
}

export class Container {
  private services = new Map<ServiceIdentifier<unknown>, ServiceMetadata<unknown>[]>();
  private instances = new Map<ServiceIdentifier<unknown>, unknown[]>();
  
  register<T>(id: ServiceIdentifier<T>, factory: () => T, type: 'singleton' | 'transient' = 'singleton'): void {
    if (!this.services.has(id)) {
      this.services.set(id, []);
      this.instances.set(id, []);
    }
    
    const metadata = this.services.get(id)!;
    metadata.push({ id, factory, type });
  }
  
  get<T>(id: ServiceIdentifier<T>): T {
    const metadataList = this.services.get(id);
    if (!metadataList || metadataList.length === 0) {
      throw new Error(`Service ${id} not registered`);
    }
    
    // Return the first registered service
    const metadata = metadataList[0] as ServiceMetadata<T>;
    
    if (metadata.type === 'singleton') {
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
  
  getAll<T>(id: ServiceIdentifier<T>): T[] {
    const metadataList = this.services.get(id);
    if (!metadataList || metadataList.length === 0) {
      return [];
    }
    
    const instances: T[] = [];
    for (let i = 0; i < metadataList.length; i++) {
      const metadata = metadataList[i] as ServiceMetadata<T>;
      
      if (metadata.type === 'singleton') {
        const instanceList = this.instances.get(id)!;
        if (instanceList.length <= i || instanceList[i] === undefined) {
          const instance = metadata.factory();
          instanceList[i] = instance;
          instances.push(instance);
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

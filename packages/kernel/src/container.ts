import { IContainer } from '@atlas/contracts';
import { ApplicationError } from '@atlas/errors';

export class Container implements IContainer {
  private instances: Map<string, any> = new Map();
  private factories: Map<string, (container: IContainer) => any> = new Map();

  public register<T>(name: string, instance: T): void {
    if (this.instances.has(name)) {
      throw new ApplicationError(`Dependency "${name}" is already registered as an instance.`, 'DUPLICATE_REGISTRATION');
    }
    this.instances.set(name, instance);
  }

  public registerFactory<T>(name: string, factory: (container: IContainer) => T): void {
    if (this.factories.has(name)) {
      throw new ApplicationError(`Dependency "${name}" is already registered as a factory.`, 'DUPLICATE_REGISTRATION');
    }
    this.factories.set(name, factory);
  }

  public resolve<T>(name: string): T {
    // 1. Return instance if resolved
    if (this.instances.has(name)) {
      return this.instances.get(name) as T;
    }

    // 2. Resolve factory if registered
    if (this.factories.has(name)) {
      const factory = this.factories.get(name)!;
      try {
        const instance = factory(this);
        this.instances.set(name, instance); // Cache as singleton instance
        return instance;
      } catch (err: any) {
        throw new ApplicationError(`Failed to resolve dependency factory for "${name}".`, 'RESOLUTION_FAILED', {}, err);
      }
    }

    throw new ApplicationError(`Dependency "${name}" could not be resolved from the container.`, 'DEPENDENCY_MISSING');
  }

  public has(name: string): boolean {
    return this.instances.has(name) || this.factories.has(name);
  }

  public clear(): void {
    this.instances.clear();
    this.factories.clear();
  }
}

import { IServiceRegistry, IAppService, ServiceHealth, ServiceStatus } from '@atlas/contracts';
import { ApplicationError } from '@atlas/errors';

export class ServiceRegistry implements IServiceRegistry {
  private currentStatus: ServiceStatus = 'uninitialized';
  private services: Map<string, IAppService> = new Map();
  private registrationOrder: string[] = [];

  public register(name: string, service: IAppService): void {
    if (this.services.has(name)) {
      throw new ApplicationError(`Service "${name}" is already registered.`, 'DUPLICATE_SERVICE');
    }
    this.services.set(name, service);
    this.registrationOrder.push(name);
  }

  public resolve(name: string): IAppService {
    const service = this.services.get(name);
    if (!service) {
      throw new ApplicationError(`Service "${name}" not found in registry.`, 'SERVICE_MISSING');
    }
    return service;
  }

  public listServices(): string[] {
    return [...this.registrationOrder];
  }

  async initialize(): Promise<void> {
    this.currentStatus = 'initializing';
    
    for (const name of this.registrationOrder) {
      const service = this.services.get(name)!;
      if (service.status() === 'uninitialized') {
        try {
          await service.initialize();
        } catch (err: any) {
          this.currentStatus = 'failed';
          throw new ApplicationError(`Failed to initialize service "${name}".`, 'SERVICE_INIT_FAILED', {}, err);
        }
      }
    }
    
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.currentStatus = 'shutting_down';
    
    // Shutdown in reverse order of registration
    const reverseOrder = [...this.registrationOrder].reverse();
    for (const name of reverseOrder) {
      const service = this.services.get(name)!;
      if (service.ready()) {
        try {
          await service.shutdown();
        } catch (err: any) {
          // Log but continue shutdown to avoid leaving services dangling
          console.error(`Error shutting down service "${name}":`, err);
        }
      }
    }

    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    const details: Record<string, any> = {};
    let isDegraded = false;
    let isUnhealthy = false;

    for (const [name, service] of this.services.entries()) {
      try {
        const sh = await service.health();
        details[name] = sh;
        if (sh.status === 'degraded') isDegraded = true;
        if (sh.status === 'unhealthy') isUnhealthy = true;
      } catch (err: any) {
        details[name] = { status: 'unhealthy', error: err.message };
        isUnhealthy = true;
      }
    }

    const status = isUnhealthy ? 'unhealthy' : isDegraded ? 'degraded' : 'healthy';

    return {
      status,
      details,
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }
}

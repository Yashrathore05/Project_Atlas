import { IKernel, IContainer, IServiceRegistry, ServiceHealth, ServiceStatus } from '@atlas/contracts';
import { Container } from './container';
import { ServiceRegistry } from './registry';
import { EventBus } from './event-bus';

export class Kernel implements IKernel {
  private currentStatus: ServiceStatus = 'uninitialized';
  private container: IContainer;
  private registry: IServiceRegistry;

  constructor() {
    this.container = new Container();
    this.registry = new ServiceRegistry();

    // Self register core components
    this.container.register('IContainer', this.container);
    this.container.register('IServiceRegistry', this.registry);
    this.container.register('IKernel', this);

    // Register EventBus
    const eventBus = new EventBus();
    this.container.register('IEventBus', eventBus);
    this.registry.register('EventBus', eventBus);
  }

  public getContainer(): IContainer {
    return this.container;
  }

  public getServiceRegistry(): IServiceRegistry {
    return this.registry;
  }

  async initialize(): Promise<void> {
    this.currentStatus = 'initializing';

    try {
      // Initialize all registered services
      await this.registry.initialize();
      this.currentStatus = 'ready';
    } catch (err) {
      this.currentStatus = 'failed';
      throw err;
    }
  }

  async shutdown(): Promise<void> {
    this.currentStatus = 'shutting_down';
    await this.registry.shutdown();
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    const registryHealth = await this.registry.health();
    return {
      status: registryHealth.status,
      details: {
        kernelStatus: this.currentStatus,
        services: registryHealth.details
      },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  public enableSignalTraps(): void {
    const handleSignal = async (signal: string) => {
      console.log(`[Kernel] Received signal ${signal}. Starting graceful shutdown...`);
      try {
        await this.shutdown();
        console.log('[Kernel] Graceful shutdown completed.');
        process.exit(0);
      } catch (err) {
        console.error('[Kernel] Error during signal-driven shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => handleSignal('SIGTERM'));
    process.on('SIGINT', () => handleSignal('SIGINT'));
  }
}

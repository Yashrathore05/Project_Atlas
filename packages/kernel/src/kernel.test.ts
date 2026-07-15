import { describe, it, expect, vi } from 'vitest';
import { Kernel } from './kernel';
import { IAppService, ServiceHealth, ServiceStatus } from '@atlas/contracts';

class DummyService implements IAppService {
  public initOrder: number | null = null;
  public shutdownOrder: number | null = null;
  private currentStatus: ServiceStatus = 'uninitialized';

  constructor(private orderLogger: { initCount: number; shutdownCount: number }) {}

  async initialize(): Promise<void> {
    this.currentStatus = 'initializing';
    this.orderLogger.initCount++;
    this.initOrder = this.orderLogger.initCount;
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.currentStatus = 'shutting_down';
    this.orderLogger.shutdownCount++;
    this.shutdownOrder = this.orderLogger.shutdownCount;
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return { status: 'healthy', timestamp: new Date() };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }
}

describe('Application Kernel Engine', () => {
  it('should register and initialize all services in order, and shut them down in reverse order', async () => {
    const kernel = new Kernel();
    const orderLogger = { initCount: 0, shutdownCount: 0 };

    const firstService = new DummyService(orderLogger);
    const secondService = new DummyService(orderLogger);

    const registry = kernel.getServiceRegistry();
    registry.register('FirstService', firstService);
    registry.register('SecondService', secondService);

    expect(kernel.status()).toBe('uninitialized');
    expect(kernel.ready()).toBe(false);

    await kernel.initialize();

    expect(kernel.status()).toBe('ready');
    expect(kernel.ready()).toBe(true);

    expect(firstService.initOrder).toBe(1);
    expect(secondService.initOrder).toBe(2);

    const health = await kernel.health();
    expect(health.status).toBe('healthy');
    expect(health.details.services.FirstService.status).toBe('healthy');

    await kernel.shutdown();

    expect(kernel.status()).toBe('uninitialized');
    expect(firstService.shutdownOrder).toBe(2);
    expect(secondService.shutdownOrder).toBe(1);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { ProviderHealth } from './health';
import { IEventBus } from '@atlas/contracts';

describe('Provider Health Service', () => {
  it('should initialize and check status/health', async () => {
    const health = new ProviderHealth();
    expect(health.status()).toBe('uninitialized');

    await health.initialize();
    expect(health.status()).toBe('ready');
  });

  it('should calculate latency rolling average and success rates', async () => {
    const health = new ProviderHealth();
    await health.initialize();

    health.trackRequest('openai', 100, true);
    health.trackRequest('openai', 200, true);

    const record = health.getProviderHealth('openai');
    expect(record).not.toBeNull();
    expect(record!.successCount).toBe(2);
    expect(record!.failureCount).toBe(0);
    expect(record!.status).toBe('healthy');
    // Latency averages: 1st request = 100ms. 2nd request = 100*0.7 + 200*0.3 = 70+60 = 130ms.
    expect(record!.latencyMs).toBe(130);
  });

  it('should degrade health and emit events when failure rate rises', async () => {
    const eventBusMock: IEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      initialize: vi.fn(),
      shutdown: vi.fn(),
      health: vi.fn(),
      status: vi.fn(),
      ready: vi.fn()
    };

    const health = new ProviderHealth(eventBusMock);
    await health.initialize();

    // Track a successful request
    health.trackRequest('openai', 100, true);
    expect(health.getProviderHealth('openai')!.status).toBe('healthy');

    // Track a failed request -> failure rate = 0.5 -> unhealthy
    health.trackRequest('openai', 0, false);
    
    const record = health.getProviderHealth('openai');
    expect(record!.status).toBe('unhealthy');
    expect(record!.failureCount).toBe(1);

    expect(eventBusMock.publish).toHaveBeenCalledOnce();
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ProviderHealthChanged',
        payload: expect.objectContaining({
          providerId: 'openai',
          oldStatus: 'healthy',
          newStatus: 'unhealthy'
        })
      })
    );
  });
});

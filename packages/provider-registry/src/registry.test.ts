import { describe, it, expect, vi } from 'vitest';
import { ProviderRegistry } from './registry';
import { IEventBus } from '@atlas/contracts';
import { ProviderType } from '@atlas/domain';

describe('Provider Registry Service', () => {
  it('should initialize and check status/health', async () => {
    const registry = new ProviderRegistry();
    expect(registry.status()).toBe('uninitialized');

    await registry.initialize();
    expect(registry.status()).toBe('ready');

    const health = await registry.health();
    expect(health.status).toBe('healthy');
  });

  it('should register, enable, disable, and list providers', async () => {
    const registry = new ProviderRegistry();
    await registry.initialize();

    const mockConfig = {
      id: 'openai' as ProviderType,
      name: 'OpenAI',
      enabled: true,
      apiKey: 'sk-mock'
    };

    const mockMetadata = {
      id: 'openai',
      name: 'OpenAI',
      version: '1.0.0',
      enabled: true,
      capabilities: ['text', 'embeddings']
    };

    registry.registerProvider(mockConfig, mockMetadata);

    const match = registry.getProvider('openai');
    expect(match).not.toBeNull();
    expect(match!.metadata.version).toBe('1.0.0');

    registry.disableProvider('openai');
    expect(registry.getProvider('openai')!.config.enabled).toBe(false);

    registry.enableProvider('openai');
    expect(registry.getProvider('openai')!.config.enabled).toBe(true);

    const list = registry.listProviders();
    expect(list.length).toBe(1);
    expect(list[0].config.id).toBe('openai');
  });

  it('should publish events on event bus when registering or removing providers', async () => {
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

    const registry = new ProviderRegistry(eventBusMock);
    await registry.initialize();

    const mockConfig = {
      id: 'openai' as ProviderType,
      name: 'OpenAI',
      enabled: true,
      apiKey: 'sk-mock'
    };

    const mockMetadata = {
      id: 'openai',
      name: 'OpenAI',
      version: '1.0.0',
      enabled: true,
      capabilities: ['text']
    };

    registry.registerProvider(mockConfig, mockMetadata);
    expect(eventBusMock.publish).toHaveBeenCalledOnce();
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ProviderRegistered' })
    );

    registry.unregisterProvider('openai');
    expect(eventBusMock.publish).toHaveBeenCalledTimes(2);
    expect(eventBusMock.publish).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'ProviderRemoved' })
    );
  });
});

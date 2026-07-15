import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderRouter } from './router';
import { MockAdapter } from '@atlas/provider-adapters';
import { ModelRegistry } from '@atlas/model-registry';
import { ProviderRegistry } from '@atlas/provider-registry';
import { ProviderHealth } from '@atlas/provider-health';
import { ProviderCache } from '@atlas/provider-cache';
import { IEventBus, ILogger, IMetrics } from '@atlas/contracts';

describe('Provider Router Service', () => {
  let providerRegistry: ProviderRegistry;
  let modelRegistry: ModelRegistry;
  let healthTracker: ProviderHealth;
  let cache: ProviderCache;
  let eventBusMock: IEventBus;
  let loggerMock: ILogger;
  let metricsMock: IMetrics;

  beforeEach(async () => {
    eventBusMock = {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      initialize: vi.fn(),
      shutdown: vi.fn(),
      health: vi.fn(),
      status: vi.fn(),
      ready: vi.fn()
    };

    loggerMock = {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      initialize: vi.fn(),
      shutdown: vi.fn(),
      health: vi.fn(),
      status: vi.fn(),
      ready: vi.fn()
    };

    metricsMock = {
      incrementCounter: vi.fn(),
      recordGauge: vi.fn(),
      recordHistogram: vi.fn(),
      startTimer: vi.fn().mockReturnValue({ stop: vi.fn() }),
      initialize: vi.fn(),
      shutdown: vi.fn(),
      health: vi.fn(),
      status: vi.fn(),
      ready: vi.fn()
    };

    providerRegistry = new ProviderRegistry(eventBusMock);
    await providerRegistry.initialize();

    modelRegistry = new ModelRegistry();
    await modelRegistry.initialize();

    healthTracker = new ProviderHealth(eventBusMock);
    await healthTracker.initialize();

    cache = new ProviderCache();
    await cache.initialize();
  });

  it('should initialize and check status/health', async () => {
    const router = new ProviderRouter(
      providerRegistry,
      modelRegistry,
      healthTracker,
      cache,
      eventBusMock,
      loggerMock,
      metricsMock
    );
    expect(router.status()).toBe('uninitialized');

    await router.initialize();
    expect(router.status()).toBe('ready');
  });

  it('should execute basic completions and record cost/metrics', async () => {
    const router = new ProviderRouter(
      providerRegistry,
      modelRegistry,
      healthTracker,
      cache,
      eventBusMock,
      loggerMock,
      metricsMock
    );
    await router.initialize();

    const mockAdapter = new MockAdapter({ delayMs: 0 });
    router.registerAdapter('openai', mockAdapter);

    const response = await router.routeRequest('openai', 'gpt-4o', 'Hello router');
    expect(response.content).toContain('Hello router');

    // Metrics should have been triggered
    expect(metricsMock.incrementCounter).toHaveBeenCalledWith('provider.requests.total', 1, expect.any(Object));
    expect(metricsMock.incrementCounter).toHaveBeenCalledWith('provider.tokens.prompt', expect.any(Number), expect.any(Object));

    // Cache should now have the item
    const cachedItem = await cache.get('Hello router', 'gpt-4o');
    expect(cachedItem).not.toBeNull();
    expect(cachedItem!.content).toBe(response.content);
  });

  it('should retry on recoverable errors and failover to fallback models', async () => {
    const router = new ProviderRouter(
      providerRegistry,
      modelRegistry,
      healthTracker,
      cache,
      eventBusMock,
      loggerMock,
      metricsMock
    );
    await router.initialize();

    // 1. Primary adapter (OpenAI) fails
    const primaryAdapter = new MockAdapter({ shouldFail: true, errorCode: 'RATE_LIMIT_ERROR', delayMs: 0 });
    // 2. Secondary adapter (Anthropic) succeeds
    const secondaryAdapter = new MockAdapter({ delayMs: 0 });

    router.registerAdapter('openai', primaryAdapter);
    router.registerAdapter('anthropic', secondaryAdapter);

    // Register fallback route: if "gpt-4o" fails, route to "anthropic/claude-3-5-sonnet"
    router.registerFallback('gpt-4o', ['anthropic/claude-3-5-sonnet']);

    const response = await router.routeRequest('openai', 'gpt-4o', 'Help me');
    expect(response.content).toContain('Help me');

    // Health tracker should record failures for openai and success for anthropic
    expect(healthTracker.getProviderHealth('openai')!.failureCount).toBeGreaterThanOrEqual(1);
    expect(healthTracker.getProviderHealth('anthropic')!.successCount).toBe(1);

    // Event bus should publish fallback trigger
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ProviderFallbackTriggered' })
    );
  });

  it('should fail over to models whose slug contains slashes', async () => {
    const router = new ProviderRouter(
      providerRegistry,
      modelRegistry,
      healthTracker,
      cache,
      eventBusMock,
      loggerMock,
      metricsMock
    );
    await router.initialize();

    router.registerAdapter('openai', new MockAdapter({ shouldFail: true, errorCode: 'RATE_LIMIT_ERROR', delayMs: 0 }));
    router.registerAdapter('openrouter', new MockAdapter({ delayMs: 0 }));
    router.registerFallback('gpt-4o', ['openrouter/openrouter/auto']);

    const response = await router.routeRequest('openai', 'gpt-4o', 'Use fallback');
    expect(response.content).toContain('Use fallback');
    expect(healthTracker.getProviderHealth('openrouter')!.successCount).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { ProviderCache } from './cache';

describe('Provider Cache Service', () => {
  it('should initialize and check status/health', async () => {
    const cache = new ProviderCache();
    expect(cache.status()).toBe('uninitialized');

    await cache.initialize();
    expect(cache.status()).toBe('ready');
  });

  it('should store, retrieve, and invalidate cached LlmResponses', async () => {
    const cache = new ProviderCache();
    await cache.initialize();

    const prompt = 'Tell me a joke';
    const model = 'gpt-4o';
    const responsePayload = {
      content: 'Why did the chicken cross the road? To get to the other side.',
      usage: { promptTokens: 4, completionTokens: 14, totalTokens: 18 }
    };

    const miss = await cache.get(prompt, model);
    expect(miss).toBeNull();

    await cache.set(prompt, model, responsePayload);

    const hit = await cache.get(prompt, model);
    expect(hit).toEqual(responsePayload);

    await cache.invalidate(prompt, model);
    const postInvalidate = await cache.get(prompt, model);
    expect(postInvalidate).toBeNull();
  });

  it('should expire cached values after TTL interval passes', async () => {
    const cache = new ProviderCache();
    await cache.initialize();

    const responsePayload = {
      content: 'Fast reply',
      usage: { promptTokens: 2, completionTokens: 2, totalTokens: 4 }
    };

    // Set TTL = 0.05 seconds (50ms)
    await cache.set('Hi', 'gpt-4o', responsePayload, 0.05);

    const hitBefore = await cache.get('Hi', 'gpt-4o');
    expect(hitBefore).toEqual(responsePayload);

    // Wait 60ms
    await new Promise(resolve => setTimeout(resolve, 60));

    const hitAfter = await cache.get('Hi', 'gpt-4o');
    expect(hitAfter).toBeNull();
  });
});

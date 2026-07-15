import { describe, it, expect } from 'vitest';
import { IntelligenceRouter } from './router';
import { ModelRegistry } from '@atlas/model-registry';
import { ProviderHealth } from '@atlas/provider-health';

describe('Intelligence Router Service', () => {
  it('should resolve the best coding model', async () => {
    const modelRegistry = new ModelRegistry();
    await modelRegistry.initialize();

    const router = new IntelligenceRouter(modelRegistry);
    await router.initialize();

    const codingModel = await router.selectModel('I need to write a Python script to parse logs');
    expect(codingModel.name).toBe('claude-3-5-sonnet');
  });

  it('should resolve the cheapest model', async () => {
    const modelRegistry = new ModelRegistry();
    await modelRegistry.initialize();

    const router = new IntelligenceRouter(modelRegistry);
    await router.initialize();

    const cheapModel = await router.selectModel('Tell me a short story, keep it cheap and budget friendly');
    expect(cheapModel.name).toBe('llama3-70b-8192');
  });

  it('should resolve large context models when requested', async () => {
    const modelRegistry = new ModelRegistry();
    await modelRegistry.initialize();

    const router = new IntelligenceRouter(modelRegistry);
    await router.initialize();

    const longModel = await router.selectModel('Summarize this massive 100k line document context');
    expect(longModel.name).toBe('gemini-1.5-pro');
  });

  it('should respect manual regex overrides', async () => {
    const modelRegistry = new ModelRegistry();
    await modelRegistry.initialize();

    const router = new IntelligenceRouter(modelRegistry);
    await router.initialize();

    // Route anything containing "secret_override" to gpt-4o
    router.registerOverride('secret_override', 'openai', 'gpt-4o');

    const matched = await router.selectModel('Please trigger secret_override process');
    expect(matched.name).toBe('gpt-4o');
  });

  it('should filter out models from unhealthy providers', async () => {
    const modelRegistry = new ModelRegistry();
    await modelRegistry.initialize();

    const healthTracker = new ProviderHealth();
    await healthTracker.initialize();

    // Force openai into unhealthy state
    healthTracker.trackRequest('openai', 0, false);

    const router = new IntelligenceRouter(modelRegistry, healthTracker);
    await router.initialize();

    // Default premium choice normally is gpt-4o, but since it is unhealthy, it should choose claude-3-5-sonnet
    const chosen = await router.selectModel('Generic prompt');
    expect(chosen.providerId).not.toBe('openai');
    expect(chosen.name).toBe('claude-3-5-sonnet');
  });

  it('should throw error if budget constraint cannot be met', async () => {
    const modelRegistry = new ModelRegistry();
    await modelRegistry.initialize();

    const router = new IntelligenceRouter(modelRegistry);
    await router.initialize();

    // Under $0.1/M tokens -> none exist (cheapest is llama3 at $0.59)
    await expect(router.selectModel('Hi', 0.1)).rejects.toThrow('No models found under the budget limit');
  });
});

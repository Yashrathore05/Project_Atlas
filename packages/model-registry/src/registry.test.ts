import { describe, it, expect } from 'vitest';
import { ModelRegistry } from './registry';

describe('Model Registry Service', () => {
  it('should initialize and pre-seed standard models', async () => {
    const registry = new ModelRegistry();
    await registry.initialize();

    expect(registry.status()).toBe('ready');
    const health = await registry.health();
    expect(health.details.totalModels).toBeGreaterThanOrEqual(4);

    const gpt4o = registry.getModel('openai', 'gpt-4o');
    expect(gpt4o).not.toBeNull();
    expect(gpt4o!.contextWindow).toBe(128000);
    expect(gpt4o!.visionSupport).toBe(true);

    const openRouterAuto = registry.getModel('openrouter', 'openrouter/auto');
    expect(openRouterAuto).not.toBeNull();
    expect(openRouterAuto!.capabilities).toContain('router');
  });

  it('should filter registered models by capability, provider, and tags', async () => {
    const registry = new ModelRegistry();
    await registry.initialize();

    // 1. Filter by providerId
    const openaiModels = registry.listModels({ providerId: 'openai' });
    expect(openaiModels.every(m => m.providerId === 'openai')).toBe(true);

    // 2. Filter by capability
    const visionModels = registry.listModels({ capability: 'vision' });
    expect(visionModels.length).toBeGreaterThanOrEqual(2);
    expect(visionModels.some(m => m.name === 'gpt-4o')).toBe(true);
    expect(visionModels.some(m => m.name === 'claude-3-5-sonnet')).toBe(true);

    // 3. Filter by tag
    const cheapModels = registry.listModels({ tags: ['cheap'] });
    expect(cheapModels.length).toBe(1);
    expect(cheapModels[0].name).toBe('llama3-70b-8192');
  });

  it('should allow registering and unregistering custom models', async () => {
    const registry = new ModelRegistry();
    await registry.initialize();

    registry.registerModel({
      providerId: 'deepseek',
      name: 'deepseek-coder-v2',
      contextWindow: 128000,
      visionSupport: false,
      imageGeneration: false,
      audioSupport: false,
      streamingSupport: true,
      toolCalling: true,
      jsonMode: true,
      inputPricePerM: 0.14,
      outputPricePerM: 0.28,
      reasoningSupport: false,
      embeddingSupport: false,
      latencyScore: 7,
      reliabilityScore: 0.98,
      maxTokens: 4096,
      capabilities: ['text', 'coding'],
      tags: ['coding', 'cheap']
    });

    const model = registry.getModel('deepseek', 'deepseek-coder-v2');
    expect(model).not.toBeNull();
    expect(model!.inputPricePerM).toBe(0.14);

    registry.unregisterModel('deepseek', 'deepseek-coder-v2');
    expect(registry.getModel('deepseek', 'deepseek-coder-v2')).toBeNull();
  });
});

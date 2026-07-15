import { describe, it, expect } from 'vitest';
import { MockAdapter, OpenaiAdapter, AnthropicAdapter, OpenRouterAdapter } from './index';
import { StreamChunk } from '@atlas/contracts';

describe('Provider Adapters Package', () => {
  it('should run basic completions and mock responses', async () => {
    const adapter = new MockAdapter({ delayMs: 0 });
    const response = await adapter.execute('Hello world', {});
    expect(response.content).toContain('Mock response for prompt');
    expect(response.usage.promptTokens).toBeGreaterThan(0);
  });

  it('should return valid JSON when jsonMode is enabled', async () => {
    const adapter = new MockAdapter({ delayMs: 0 });
    const response = await adapter.execute('Create JSON profile', { jsonMode: true });
    const parsed = JSON.parse(response.content);
    expect(parsed.result).toBe('success');
  });

  it('should support streaming token events sequentially', async () => {
    const adapter = new MockAdapter({ delayMs: 0 });
    const chunks: StreamChunk[] = [];
    
    await adapter.execute('Stream this prompt', {
      streamCallback: (chunk) => {
        chunks.push(chunk);
      }
    });

    expect(chunks[0].type).toBe('StreamStarted');
    expect(chunks[1].type).toBe('ReasoningChunk');
    expect(chunks[chunks.length - 1].type).toBe('Finished');
    expect(chunks[chunks.length - 1].usage).toBeDefined();
  });

  it('should simulate failures and throw ProviderError', async () => {
    const adapter = new MockAdapter({ shouldFail: true, errorCode: 'RATE_LIMIT_ERROR', delayMs: 0 });
    await expect(adapter.execute('Test request', {})).rejects.toThrow('RATE_LIMIT_ERROR');
  });

  it('should verify concrete adapter wrappers execute properly', async () => {
    const openai = new OpenaiAdapter({ delayMs: 0 });
    const response = await openai.execute('Hello from OpenAI', {});
    expect(response.content).toContain('Hello from OpenAI');

    const anthropic = new AnthropicAdapter({ delayMs: 0 });
    await expect(anthropic.embed('Try to embed')).rejects.toThrow();
  });

  it('should expose OpenRouter through the adapter package', async () => {
    const openRouter = new OpenRouterAdapter({ delayMs: 0 });
    const response = await openRouter.execute('Route this request', {});
    expect(response.content).toContain('Route this request');
  });
});

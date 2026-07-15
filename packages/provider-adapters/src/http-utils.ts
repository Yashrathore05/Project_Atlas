import { LlmRequestOptions, LlmResponse, StreamChunk } from '@atlas/contracts';
import { ProviderError } from '@atlas/errors';
import { MockAdapter } from './mock.adapter';

export interface HttpAdapterOptions {
  apiKey?: string;
  baseUrl?: string;
  shouldFail?: boolean;
  errorCode?: string;
  response?: LlmResponse;
  delayMs?: number;
}

export const hasUsableApiKey = (apiKey?: string): apiKey is string =>
  !!apiKey && apiKey.trim().length > 0;

export const createMockDelegate = (options?: HttpAdapterOptions): MockAdapter =>
  new MockAdapter({
    shouldFail: options?.shouldFail,
    errorCode: options?.errorCode,
    response: options?.response,
    delayMs: options?.delayMs
  });

export const estimateTokens = (text: string): number => Math.max(1, Math.ceil(text.length / 4));

export const streamFullResponse = async (
  response: LlmResponse,
  callback?: (chunk: StreamChunk) => void | Promise<void>
): Promise<void> => {
  if (!callback) return;

  await callback({ type: 'StreamStarted' });
  for (const token of response.content.split(/\s+/)) {
    if (token.length > 0) {
      await callback({ type: 'Token', content: `${token} ` });
    }
  }
  await callback({ type: 'Finished', usage: response.usage });
};

export const assertOk = async (res: Response, provider: string): Promise<void> => {
  if (res.ok) return;

  let body = '';
  try {
    body = await res.text();
  } catch {
    body = res.statusText;
  }

  const normalized = body || res.statusText || `HTTP ${res.status}`;
  throw new ProviderError(`${provider} request failed: ${normalized}`, `HTTP_${res.status}`);
};

export const normalizeOpenAiChatResponse = (data: any, prompt: string): LlmResponse => {
  const content = data?.choices?.[0]?.message?.content ?? '';
  const promptTokens = data?.usage?.prompt_tokens ?? estimateTokens(prompt);
  const completionTokens = data?.usage?.completion_tokens ?? estimateTokens(content);

  return {
    content,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: data?.usage?.total_tokens ?? promptTokens + completionTokens
    },
    toolCalls: data?.choices?.[0]?.message?.tool_calls?.map((call: any) => ({
      id: call.id,
      name: call.function?.name ?? call.name ?? 'tool',
      arguments: call.function?.arguments ?? call.arguments ?? '{}'
    }))
  };
};

export const buildChatBody = (model: string, prompt: string, options: LlmRequestOptions): Record<string, unknown> => ({
  model,
  messages: [{ role: 'user', content: prompt }],
  temperature: options.temperature,
  max_tokens: options.maxTokens,
  response_format: options.jsonMode ? { type: 'json_object' } : undefined,
  tools: options.tools
});

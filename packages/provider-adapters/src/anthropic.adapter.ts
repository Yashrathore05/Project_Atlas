import { ILlmAdapter, LlmRequestOptions, LlmResponse } from '@atlas/contracts';
import {
  assertOk,
  createMockDelegate,
  estimateTokens,
  hasUsableApiKey,
  HttpAdapterOptions,
  streamFullResponse
} from './http-utils';

export class AnthropicAdapter implements ILlmAdapter {
  private delegate: ReturnType<typeof createMockDelegate>;

  constructor(private options?: HttpAdapterOptions) {
    this.delegate = createMockDelegate(options);
  }

  public setFailure(shouldFail: boolean, errorCode?: string): void {
    this.delegate.setFailure(shouldFail, errorCode);
  }

  public async execute(prompt: string, options: LlmRequestOptions): Promise<LlmResponse> {
    if (!hasUsableApiKey(this.options?.apiKey)) {
      return this.delegate.execute(prompt, options);
    }

    const baseUrl = this.options?.baseUrl || 'https://api.anthropic.com/v1';
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.options.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.modelName || 'claude-3-5-sonnet',
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    await assertOk(res, 'Anthropic');
    const data: any = await res.json();
    const content = (data?.content || [])
      .map((part: any) => part?.type === 'text' ? part.text : '')
      .join('');
    const promptTokens = data?.usage?.input_tokens ?? estimateTokens(prompt);
    const completionTokens = data?.usage?.output_tokens ?? estimateTokens(content);
    const response: LlmResponse = {
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      }
    };

    await streamFullResponse(response, options.streamCallback);
    return response;
  }

  public async embed(_text: string): Promise<number[]> {
    throw new Error('Embeddings not supported by Anthropic adapter.');
  }
}

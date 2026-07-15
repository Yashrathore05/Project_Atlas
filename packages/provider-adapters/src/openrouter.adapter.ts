import { ILlmAdapter, LlmRequestOptions, LlmResponse } from '@atlas/contracts';
import {
  assertOk,
  buildChatBody,
  createMockDelegate,
  hasUsableApiKey,
  HttpAdapterOptions,
  normalizeOpenAiChatResponse,
  streamFullResponse
} from './http-utils';

export class OpenRouterAdapter implements ILlmAdapter {
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

    const baseUrl = this.options?.baseUrl || 'https://openrouter.ai/api/v1';
    const model = options.modelName || 'openrouter/auto';
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://atlas.local',
        'X-OpenRouter-Title': 'Atlas AI Workspace'
      },
      body: JSON.stringify(buildChatBody(model, prompt, options))
    });

    await assertOk(res, 'OpenRouter');
    const data: any = await res.json();
    const response = normalizeOpenAiChatResponse(data, prompt);
    await streamFullResponse(response, options.streamCallback);
    return response;
  }
}

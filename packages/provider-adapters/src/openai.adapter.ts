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

export class OpenaiAdapter implements ILlmAdapter {
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

    const baseUrl = this.options?.baseUrl || 'https://api.openai.com/v1';
    const model = options.modelName || 'gpt-4o';
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildChatBody(model, prompt, options))
    });

    await assertOk(res, 'OpenAI');
    const data: any = await res.json();
    const response = normalizeOpenAiChatResponse(data, prompt);
    await streamFullResponse(response, options.streamCallback);
    return response;
  }

  public async embed(text: string): Promise<number[]> {
    if (!hasUsableApiKey(this.options?.apiKey)) {
      return this.delegate.embed(text);
    }

    const baseUrl = this.options?.baseUrl || 'https://api.openai.com/v1';
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: 'text-embedding-3-large', input: text })
    });

    await assertOk(res, 'OpenAI embeddings');
    const data: any = await res.json();
    return data?.data?.[0]?.embedding ?? [];
  }
}

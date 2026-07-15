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

export class GroqAdapter implements ILlmAdapter {
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

    const baseUrl = this.options?.baseUrl || 'https://api.groq.com/openai/v1';
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildChatBody(options.modelName || 'llama3-70b-8192', prompt, options))
    });

    await assertOk(res, 'Groq');
    const data: any = await res.json();
    const response = normalizeOpenAiChatResponse(data, prompt);
    await streamFullResponse(response, options.streamCallback);
    return response;
  }
}

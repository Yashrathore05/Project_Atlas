import { ILlmAdapter, LlmRequestOptions, LlmResponse } from '@atlas/contracts';
import { MockAdapter } from './mock.adapter';

export class GoogleAdapter implements ILlmAdapter {
  private delegate: MockAdapter;

  constructor(options?: { shouldFail?: boolean; errorCode?: string; response?: LlmResponse; delayMs?: number }) {
    this.delegate = new MockAdapter(options);
  }

  public setFailure(shouldFail: boolean, errorCode?: string): void {
    this.delegate.setFailure(shouldFail, errorCode);
  }

  public async execute(prompt: string, options: LlmRequestOptions): Promise<LlmResponse> {
    return this.delegate.execute(prompt, options);
  }

  public async embed(text: string): Promise<number[]> {
    return this.delegate.embed(text);
  }
}

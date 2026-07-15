import { ILlmAdapter, LlmRequestOptions, LlmResponse, StreamChunk } from '@atlas/contracts';
import { ProviderError } from '@atlas/errors';

export class MockAdapter implements ILlmAdapter {
  private shouldFail = false;
  private errorCode = 'API_ERROR';
  private customResponse: LlmResponse | null = null;
  private delayMs = 10;

  constructor(options?: { shouldFail?: boolean; errorCode?: string; response?: LlmResponse; delayMs?: number }) {
    if (options?.shouldFail !== undefined) this.shouldFail = options.shouldFail;
    if (options?.errorCode) this.errorCode = options.errorCode;
    if (options?.response) this.customResponse = options.response;
    if (options?.delayMs !== undefined) this.delayMs = options.delayMs;
  }

  public setFailure(shouldFail: boolean, errorCode = 'API_ERROR'): void {
    this.shouldFail = shouldFail;
    this.errorCode = errorCode;
  }

  public setResponse(response: LlmResponse): void {
    this.customResponse = response;
  }

  public async execute(prompt: string, options: LlmRequestOptions): Promise<LlmResponse> {
    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }

    if (this.shouldFail) {
      throw new ProviderError(`Provider request failed: ${this.errorCode}`, this.errorCode);
    }

    // Default output if none is provided
    let response: LlmResponse = this.customResponse || {
      content: `Mock response for prompt: "${prompt}"`,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: 20,
        totalTokens: Math.ceil(prompt.length / 4) + 20
      }
    };

    // If options.jsonMode is true, return a valid JSON structure
    if (options.jsonMode && !this.customResponse) {
      response = {
        content: JSON.stringify({ result: 'success', message: `Mock response for: ${prompt}` }),
        usage: response.usage
      };
    }

    // If tool calls are requested
    if (options.tools && options.tools.length > 0 && !this.customResponse) {
      response = {
        content: 'I will call a tool to help with this request.',
        usage: response.usage,
        toolCalls: [
          {
            id: 'call_mock_123',
            name: options.tools[0].name || 'mock_tool',
            arguments: JSON.stringify({ query: prompt })
          }
        ]
      };
    }

    // If stream callback is provided, invoke streaming lifecycle
    if (options.streamCallback) {
      await this.simulateStreaming(response, options.streamCallback);
    }

    return response;
  }

  public async embed(_text: string): Promise<number[]> {
    if (this.shouldFail) {
      throw new ProviderError(`Provider request failed: ${this.errorCode}`, this.errorCode);
    }
    // Generate a mock float array of size 1536
    const arr = new Array(1536).fill(0).map(() => Math.random());
    return arr;
  }

  private async simulateStreaming(response: LlmResponse, callback: (chunk: StreamChunk) => void | Promise<void>): Promise<void> {
    // 1. StreamStarted
    await callback({ type: 'StreamStarted' });

    // 2. Optional ReasoningChunk
    await callback({ type: 'ReasoningChunk', content: '<thinking>Processing prompt...</thinking>' });

    if (response.toolCalls && response.toolCalls.length > 0) {
      // 3. ToolCall stream
      for (const call of response.toolCalls) {
        await callback({
          type: 'ToolCall',
          toolCall: call
        });
      }
    } else {
      // 4. Token stream
      const tokens = response.content.split(' ');
      for (const token of tokens) {
        await callback({ type: 'Token', content: token + ' ' });
        await new Promise(resolve => setTimeout(resolve, 2));
      }
    }

    // 5. Finished
    await callback({
      type: 'Finished',
      usage: response.usage
    });
  }
}
export default MockAdapter;

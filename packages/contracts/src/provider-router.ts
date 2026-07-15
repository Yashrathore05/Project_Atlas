import { IAppService } from './lifecycle';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  cachedTokens?: number;
  reasoningTokens?: number;
  totalTokens: number;
}

export interface StreamChunk {
  type: 'StreamStarted' | 'Token' | 'ToolCall' | 'ToolResult' | 'ReasoningChunk' | 'Finished';
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: string;
  };
  usage?: TokenUsage;
}

export interface LlmRequestOptions {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  tools?: any[];
  structuredOutputSchema?: Record<string, any>;
  streamCallback?: (chunk: StreamChunk) => void | Promise<void>;
  requestId?: string;
  correlationId?: string;
}

export interface LlmResponse {
  content: string;
  usage: TokenUsage;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
}

export interface ILlmAdapter {
  execute(prompt: string, options: LlmRequestOptions): Promise<LlmResponse>;
  embed?(text: string): Promise<number[]>;
}

export interface IProviderRouter extends IAppService {
  routeRequest(providerId: string, model: string, prompt: string, options?: LlmRequestOptions): Promise<LlmResponse>;
  routeEmbedding(providerId: string, model: string, text: string): Promise<number[]>;
  registerFallback(model: string, fallbackModels: string[]): void;
}

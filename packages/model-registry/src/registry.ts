import { IModelRegistry, ModelMetadata, ServiceHealth, ServiceStatus } from '@atlas/contracts';
import { ValidationError } from '@atlas/errors';

export class ModelRegistry implements IModelRegistry {
  private currentStatus: ServiceStatus = 'uninitialized';
  private models: Map<string, ModelMetadata> = new Map();

  async initialize(): Promise<void> {
    this.seedDefaultModels();
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.models.clear();
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      details: { totalModels: this.models.size },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  public registerModel(model: ModelMetadata): void {
    if (!model.providerId || !model.name) {
      throw new ValidationError('Provider ID and Model name are required.', 'INVALID_MODEL_METADATA');
    }
    const key = `${model.providerId}/${model.name}`;
    this.models.set(key, model);
  }

  public unregisterModel(providerId: string, modelName: string): void {
    const key = `${providerId}/${modelName}`;
    this.models.delete(key);
  }

  public getModel(providerId: string, modelName: string): ModelMetadata | null {
    const key = `${providerId}/${modelName}`;
    return this.models.get(key) || null;
  }

  public listModels(query?: { tags?: string[]; capability?: string; providerId?: string }): ModelMetadata[] {
    let result = Array.from(this.models.values());

    if (query) {
      if (query.providerId) {
        result = result.filter(m => m.providerId === query.providerId);
      }
      if (query.capability) {
        result = result.filter(m => m.capabilities.includes(query.capability!));
      }
      if (query.tags && query.tags.length > 0) {
        result = result.filter(m => query.tags!.every(t => m.tags.includes(t)));
      }
    }

    return result;
  }

  private seedDefaultModels(): void {
    // 1. OpenAI GPT-4o
    this.registerModel({
      providerId: 'openai',
      name: 'gpt-4o',
      contextWindow: 128000,
      visionSupport: true,
      imageGeneration: false,
      audioSupport: false,
      streamingSupport: true,
      toolCalling: true,
      jsonMode: true,
      inputPricePerM: 5.00,
      outputPricePerM: 15.00,
      cachedTokenPricePerM: 2.50,
      reasoningSupport: false,
      embeddingSupport: false,
      latencyScore: 8,
      reliabilityScore: 0.99,
      maxTokens: 4096,
      capabilities: ['text', 'vision', 'tool_calling', 'json'],
      tags: ['premium', 'general', 'vision']
    });

    // 2. Anthropic Claude 3.5 Sonnet
    this.registerModel({
      providerId: 'anthropic',
      name: 'claude-3-5-sonnet',
      contextWindow: 200000,
      visionSupport: true,
      imageGeneration: false,
      audioSupport: false,
      streamingSupport: true,
      toolCalling: true,
      jsonMode: true,
      inputPricePerM: 3.00,
      outputPricePerM: 15.00,
      cachedTokenPricePerM: 0.30,
      reasoningSupport: false,
      embeddingSupport: false,
      latencyScore: 7,
      reliabilityScore: 0.98,
      maxTokens: 8192,
      capabilities: ['text', 'vision', 'tool_calling', 'json', 'coding'],
      tags: ['premium', 'coding', 'vision']
    });

    // 3. Google Gemini 1.5 Pro
    this.registerModel({
      providerId: 'google',
      name: 'gemini-1.5-pro',
      contextWindow: 2000000,
      visionSupport: true,
      imageGeneration: false,
      audioSupport: true,
      streamingSupport: true,
      toolCalling: true,
      jsonMode: true,
      inputPricePerM: 3.50,
      outputPricePerM: 10.50,
      cachedTokenPricePerM: 0.875,
      reasoningSupport: false,
      embeddingSupport: false,
      latencyScore: 6,
      reliabilityScore: 0.95,
      maxTokens: 8192,
      capabilities: ['text', 'vision', 'audio', 'tool_calling', 'json'],
      tags: ['premium', 'large_context', 'multimodal']
    });

    // 4. Groq Llama 3 70B
    this.registerModel({
      providerId: 'groq',
      name: 'llama3-70b-8192',
      contextWindow: 8192,
      visionSupport: false,
      imageGeneration: false,
      audioSupport: false,
      streamingSupport: true,
      toolCalling: true,
      jsonMode: true,
      inputPricePerM: 0.59,
      outputPricePerM: 0.79,
      reasoningSupport: false,
      embeddingSupport: false,
      latencyScore: 9,
      reliabilityScore: 0.97,
      maxTokens: 4096,
      capabilities: ['text', 'tool_calling', 'json'],
      tags: ['fast', 'cheap']
    });

    // 5. OpenAI Text Embedding 3 Large
    this.registerModel({
      providerId: 'openai',
      name: 'text-embedding-3-large',
      contextWindow: 8191,
      visionSupport: false,
      imageGeneration: false,
      audioSupport: false,
      streamingSupport: false,
      toolCalling: false,
      jsonMode: false,
      inputPricePerM: 0.13,
      outputPricePerM: 0.00,
      reasoningSupport: false,
      embeddingSupport: true,
      latencyScore: 9,
      reliabilityScore: 0.99,
      maxTokens: 0,
      capabilities: ['embeddings'],
      tags: ['embeddings']
    });

    // 6. OpenRouter Auto Router
    this.registerModel({
      providerId: 'openrouter',
      name: 'openrouter/auto',
      contextWindow: 128000,
      visionSupport: true,
      imageGeneration: false,
      audioSupport: false,
      streamingSupport: true,
      toolCalling: true,
      jsonMode: true,
      inputPricePerM: 0.0,
      outputPricePerM: 0.0,
      reasoningSupport: true,
      embeddingSupport: false,
      latencyScore: 8,
      reliabilityScore: 0.98,
      maxTokens: 8192,
      capabilities: ['text', 'vision', 'tool_calling', 'json', 'coding', 'router'],
      tags: ['router', 'fallback', 'auto']
    });

    // 7. OpenRouter latest OpenAI model alias
    this.registerModel({
      providerId: 'openrouter',
      name: '~openai/gpt-latest',
      contextWindow: 128000,
      visionSupport: true,
      imageGeneration: false,
      audioSupport: false,
      streamingSupport: true,
      toolCalling: true,
      jsonMode: true,
      inputPricePerM: 0.0,
      outputPricePerM: 0.0,
      reasoningSupport: true,
      embeddingSupport: false,
      latencyScore: 8,
      reliabilityScore: 0.98,
      maxTokens: 8192,
      capabilities: ['text', 'vision', 'tool_calling', 'json', 'coding', 'router'],
      tags: ['router', 'latest', 'openai']
    });
  }
}

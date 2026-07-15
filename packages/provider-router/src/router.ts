import {
  IProviderRouter,
  ILlmAdapter,
  LlmRequestOptions,
  LlmResponse,
  IProviderRegistry,
  IModelRegistry,
  IProviderHealth,
  IProviderCache,
  IEventBus,
  ILogger,
  IMetrics,
  ServiceHealth,
  ServiceStatus,
  StreamChunk
} from '@atlas/contracts';
import { ProviderError, ValidationError } from '@atlas/errors';
// Browser & Node compatible UUID generation
const randomUUID = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class ProviderRouter implements IProviderRouter {
  private currentStatus: ServiceStatus = 'uninitialized';
  private adapters: Map<string, ILlmAdapter> = new Map();
  private fallbacks: Map<string, string[]> = new Map();

  constructor(
    private providerRegistry: IProviderRegistry,
    private modelRegistry: IModelRegistry,
    private healthTracker: IProviderHealth,
    private cache: IProviderCache,
    private eventBus: IEventBus,
    private logger: ILogger,
    private metrics: IMetrics
  ) {}

  async initialize(): Promise<void> {
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.adapters.clear();
    this.fallbacks.clear();
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      details: {
        activeAdapters: this.adapters.size,
        registeredFallbacks: this.fallbacks.size,
        registeredProviders: this.providerRegistry.listProviders().length,
        registeredModels: this.modelRegistry.listModels().length
      },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  public registerAdapter(providerId: string, adapter: ILlmAdapter): void {
    this.adapters.set(providerId, adapter);
  }

  public registerFallback(modelName: string, fallbackModels: string[]): void {
    this.fallbacks.set(modelName, fallbackModels);
  }

  public async routeRequest(
    providerId: string,
    modelName: string,
    prompt: string,
    options?: LlmRequestOptions
  ): Promise<LlmResponse> {
    const requestId = options?.requestId || randomUUID();
    const correlationId = options?.correlationId || randomUUID();
    const startTime = Date.now();

    this.logger.info(`Routing request ${requestId} to ${providerId}/${modelName}`, {
      providerId,
      modelName,
      correlationId
    });

    // 1. Emit Request Started Event
    await this.publishEvent('ProviderRequestStarted', { requestId, correlationId, providerId, model: modelName });

    // 2. Cache Lookup
    const cacheHit = await this.cache.get(prompt, modelName, options);
    if (cacheHit) {
      this.logger.info(`Cache HIT for prompt on model ${modelName}`);
      
      // Simulate streaming if cache hit requested stream callback
      if (options?.streamCallback) {
        await options.streamCallback({ type: 'StreamStarted' });
        await options.streamCallback({ type: 'Token', content: cacheHit.content });
        await options.streamCallback({ type: 'Finished', usage: cacheHit.usage });
      }

      await this.publishEvent('ProviderRequestFinished', {
        requestId,
        correlationId,
        providerId,
        model: modelName,
          cached: true,
          usage: cacheHit.usage,
          durationMs: Date.now() - startTime
        });

      return cacheHit;
    }

    // 3. Resolve Adapter
    let currentProviderId = providerId;
    let currentModelName = modelName;
    let adapter = this.adapters.get(currentProviderId);

    if (!adapter) {
      // Fallback lookup or error
      const fallbackList = this.fallbacks.get(modelName) || [];
      if (fallbackList.length > 0) {
        const next = fallbackList[0]; // e.g. "openai/gpt-4o"
        const [nextProvider, nextModel] = this.parseProviderModel(next);
        currentProviderId = nextProvider;
        currentModelName = nextModel;
        adapter = this.adapters.get(currentProviderId);

        await this.publishEvent('ProviderFallbackTriggered', {
          requestId,
          correlationId,
          originalModel: modelName,
          fallbackModel: next,
          reason: 'Primary adapter not registered'
        });
      }
    }

    if (!adapter) {
      const err = new ValidationError(`No adapter found for provider: ${currentProviderId}`, 'ADAPTER_NOT_FOUND');
      await this.publishEvent('ProviderRequestFailed', { requestId, correlationId, error: err.message });
      throw err;
    }

    // 4. Execute request with retries and exponential backoff
    let response: LlmResponse | null = null;
    let attempt = 0;
    const maxAttempts = 3;
    let backoffMs = 50;

    while (attempt < maxAttempts) {
      attempt++;
      const requestStart = Date.now();

      try {
        // Intercept streaming events if callback is passed
        let streamDurationMs = 0;
        const streamStart = Date.now();
        const interceptedOptions: LlmRequestOptions = {
          ...options,
          modelName: currentModelName,
          requestId,
          correlationId,
          streamCallback: options?.streamCallback
            ? async (chunk: StreamChunk) => {
                if (chunk.type === 'StreamStarted') {
                  await this.publishEvent('StreamingStarted', { requestId, correlationId });
                } else if (chunk.type === 'Finished') {
                  streamDurationMs = Date.now() - streamStart;
                  await this.publishEvent('StreamingFinished', { requestId, correlationId, durationMs: streamDurationMs });
                }
                if (options.streamCallback) {
                  await options.streamCallback(chunk);
                }
              }
            : undefined
        };

        response = await adapter.execute(prompt, interceptedOptions);
        const duration = Date.now() - requestStart;

        // Track Health Success
        this.healthTracker.trackRequest(currentProviderId, duration, true);

        // Record Cache
        await this.cache.set(prompt, currentModelName, response, undefined, options);

        // Calculate Cost & Telemetry Metrics
        const cost = this.calculateCost(currentProviderId, currentModelName, response);
        this.recordMetrics(currentProviderId, currentModelName, response, duration, cost, streamDurationMs);

        // Log Success
        this.logger.info(`Request ${requestId} completed in ${duration}ms`, {
          providerId: currentProviderId,
          modelName: currentModelName,
          cost,
          usage: response.usage
        });

        await this.publishEvent('ProviderRequestFinished', {
          requestId,
          correlationId,
          providerId: currentProviderId,
          model: currentModelName,
          cached: false,
          cost,
          usage: response.usage,
          durationMs: Date.now() - startTime
        });

        return response;
      } catch (err: any) {
        const duration = Date.now() - requestStart;
        this.healthTracker.trackRequest(currentProviderId, duration, false);

        this.logger.warn(`Attempt ${attempt} failed on ${currentProviderId} in ${duration}ms: ${err.message}`);

        // Check if error is fatal (non-retryable)
        const isFatal = this.isFatalError(err);
        if (isFatal || attempt >= maxAttempts) {
          // Attempt Failover to Fallbacks
          const fallbackModels = this.fallbacks.get(modelName) || [];
          if (fallbackModels.length > 0) {
            const nextFallback = fallbackModels[0];
            const [fallbackProvider, fallbackModel] = this.parseProviderModel(nextFallback);
            
            this.logger.info(`Failing over to ${nextFallback}`);
            await this.publishEvent('ProviderFallbackTriggered', {
              requestId,
              correlationId,
              originalModel: modelName,
              fallbackModel: nextFallback,
              reason: err.message
            });

            // Recurse using fallback
            return this.routeRequest(fallbackProvider, fallbackModel, prompt, options);
          }

          // No fallbacks left, bubble up error
          await this.publishEvent('ProviderRequestFailed', {
            requestId,
            correlationId,
            providerId: currentProviderId,
            model: currentModelName,
            error: err.message,
            durationMs: Date.now() - startTime
          });
          throw err;
        }

        // Retry and backoff
        await this.publishEvent('ProviderRetryTriggered', {
          requestId,
          correlationId,
          providerId: currentProviderId,
          model: currentModelName,
          attempt,
          error: err.message
        });

        await new Promise(resolve => setTimeout(resolve, backoffMs));
        backoffMs *= 2;
      }
    }

    throw new ProviderError('Request failed after maximum retries', 'MAX_RETRIES_EXCEEDED');
  }

  public async routeEmbedding(providerId: string, _modelName: string, text: string): Promise<number[]> {
    const adapter = this.adapters.get(providerId);
    if (!adapter || !adapter.embed) {
      throw new ValidationError(`No embedding adapter found for provider: ${providerId}`, 'EMBEDDING_ADAPTER_NOT_FOUND');
    }

    let attempt = 0;
    const maxAttempts = 3;
    let backoffMs = 50;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        return await adapter.embed(text);
      } catch (err: any) {
        if (attempt >= maxAttempts) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        backoffMs *= 2;
      }
    }

    throw new ProviderError('Embedding generation failed after maximum retries', 'MAX_RETRIES_EXCEEDED');
  }

  private calculateCost(providerId: string, modelName: string, response: LlmResponse): number {
    const meta = this.modelRegistry.getModel(providerId, modelName);
    if (!meta) return 0.0;

    const inputCost = (response.usage.promptTokens / 1000000) * meta.inputPricePerM;
    const outputCost = (response.usage.completionTokens / 1000000) * meta.outputPricePerM;
    return inputCost + outputCost;
  }

  private parseProviderModel(value: string): [string, string] {
    const separatorIndex = value.indexOf('/');
    if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
      throw new ValidationError(`Invalid provider/model fallback: ${value}`, 'INVALID_FALLBACK_MODEL');
    }

    return [value.slice(0, separatorIndex), value.slice(separatorIndex + 1)];
  }

  private recordMetrics(
    providerId: string,
    modelName: string,
    response: LlmResponse,
    durationMs: number,
    cost: number,
    streamDurationMs: number
  ): void {
    const tags = { provider: providerId, model: modelName };
    
    this.metrics.incrementCounter('provider.requests.total', 1, tags);
    this.metrics.incrementCounter('provider.tokens.prompt', response.usage.promptTokens, tags);
    this.metrics.incrementCounter('provider.tokens.completion', response.usage.completionTokens, tags);
    this.metrics.recordGauge('provider.request.latency', durationMs, tags);
    this.metrics.recordGauge('provider.request.cost', cost, tags);

    if (streamDurationMs > 0) {
      this.metrics.recordGauge('provider.stream.duration', streamDurationMs, tags);
    }
  }

  private isFatalError(err: any): boolean {
    if (err.errorCode === 'INVALID_API_KEY' || err.errorCode === 'VALIDATION_ERROR' || err instanceof ValidationError) {
      return true;
    }
    return false;
  }

  private async publishEvent(name: string, payload: any): Promise<void> {
    try {
      await this.eventBus.publish({
        name,
        payload,
        timestamp: new Date()
      });
    } catch (err) {
      // Don't interrupt flow if event bus fails
      this.logger.error(`Failed to publish event ${name}:`, err as Error);
    }
  }
}

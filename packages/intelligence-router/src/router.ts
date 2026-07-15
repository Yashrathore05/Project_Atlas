import { IIntelligenceRouter, ModelMetadata, IModelRegistry, IProviderHealth, ServiceHealth, ServiceStatus } from '@atlas/contracts';
import { ValidationError } from '@atlas/errors';

interface OverrideRule {
  pattern: RegExp;
  providerId: string;
  modelName: string;
}

export class IntelligenceRouter implements IIntelligenceRouter {
  private currentStatus: ServiceStatus = 'uninitialized';
  private overrides: OverrideRule[] = [];

  constructor(
    private modelRegistry: IModelRegistry,
    private healthTracker?: IProviderHealth
  ) {}

  async initialize(): Promise<void> {
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.overrides = [];
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      details: { registeredOverrides: this.overrides.length },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  public registerOverride(intentPattern: string, providerId: string, modelName: string): void {
    this.overrides.push({
      pattern: new RegExp(intentPattern, 'i'),
      providerId,
      modelName
    });
  }

  public async selectModel(intent: string, budgetLimit?: number): Promise<ModelMetadata> {
    // 1. Check manual regex overrides first
    for (const rule of this.overrides) {
      if (rule.pattern.test(intent)) {
        const model = this.modelRegistry.getModel(rule.providerId, rule.modelName);
        if (model) {
          return model;
        }
      }
    }

    // 2. Fetch all models
    let candidates = this.modelRegistry.listModels();
    if (candidates.length === 0) {
      throw new ValidationError('No models registered in the Model Registry.', 'EMPTY_MODEL_REGISTRY');
    }

    const query = intent.toLowerCase();

    // Exclude embedding models unless explicitly asking for embeddings
    if (!query.includes('embed') && !query.includes('embedding')) {
      candidates = candidates.filter(m => !m.embeddingSupport);
    }

    // Router meta-models are fallback gateways, not direct cheapest/best picks.
    if (!query.includes('router') && !query.includes('openrouter')) {
      candidates = candidates.filter(m => !m.tags.includes('router'));
    }

    // 3. Filter out unhealthy providers
    if (this.healthTracker) {
      candidates = candidates.filter(model => {
        const health = this.healthTracker!.getProviderHealth(model.providerId);
        return !health || health.status !== 'unhealthy';
      });
      // If all are unhealthy, fall back to showing all candidates rather than crashing
      if (candidates.length === 0) {
        candidates = this.modelRegistry.listModels().filter(m => !m.embeddingSupport);
      }
    }

    // 4. Apply budget limit if specified (price per Million input tokens)
    if (budgetLimit !== undefined) {
      candidates = candidates.filter(m => m.inputPricePerM <= budgetLimit);
      if (candidates.length === 0) {
        throw new ValidationError(`No models found under the budget limit of $${budgetLimit}/M tokens.`, 'BUDGET_EXCEEDED');
      }
    }

    // 5. Query matching logic
    const codingKeywords = ['code', 'coding', 'program', 'develop', 'script', 'python', 'javascript', 'typescript', 'java', 'c++', 'rust', 'golang', 'html', 'css', 'sql'];
    if (codingKeywords.some(keyword => query.includes(keyword))) {
      // Prioritize coding capabilities, then lower pricing
      const coded = candidates.filter(m => m.capabilities.includes('coding'));
      if (coded.length > 0) return coded.sort((a, b) => a.inputPricePerM - b.inputPricePerM)[0];
    }

    if (query.includes('vision') || query.includes('image') || query.includes('see') || query.includes('look')) {
      const vision = candidates.filter(m => m.visionSupport);
      if (vision.length > 0) return vision.sort((a, b) => b.latencyScore - a.latencyScore)[0];
    }

    if (query.includes('fast') || query.includes('speed') || query.includes('quick') || query.includes('latency')) {
      // Sort by latency score descending (higher score = faster)
      return candidates.sort((a, b) => b.latencyScore - a.latencyScore)[0];
    }

    if (query.includes('cheap') || query.includes('cost') || query.includes('budget') || query.includes('inexpensive')) {
      // Sort by input price ascending
      return candidates.sort((a, b) => a.inputPricePerM - b.inputPricePerM)[0];
    }

    if (query.includes('context') || query.includes('large context') || query.includes('long context')) {
      // Sort by context window descending
      return candidates.sort((a, b) => b.contextWindow - a.contextWindow)[0];
    }

    if (query.includes('reasoning') || query.includes('complex') || query.includes('smart') || query.includes('hard')) {
      // Prioritize reasoning models, then sort by reliability score
      const reasoning = candidates.filter(m => m.reasoningSupport);
      if (reasoning.length > 0) return reasoning.sort((a, b) => b.reliabilityScore - a.reliabilityScore)[0];
    }

    // Default choice: highest reliability premium model
    const premium = candidates.filter(m => m.tags.includes('premium'));
    if (premium.length > 0) {
      return premium.sort((a, b) => b.reliabilityScore - a.reliabilityScore)[0];
    }

    return candidates[0];
  }
}

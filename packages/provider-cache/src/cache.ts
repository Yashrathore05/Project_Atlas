import { IProviderCache, LlmResponse, ServiceHealth, ServiceStatus } from '@atlas/contracts';


interface CacheEntry {
  response: LlmResponse;
  expiresAt: number;
}

export class ProviderCache implements IProviderCache {
  private currentStatus: ServiceStatus = 'uninitialized';
  private cacheStore: Map<string, CacheEntry> = new Map();
  private defaultTtlMs = 300000; // 5 minutes default

  async initialize(): Promise<void> {
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.cacheStore.clear();
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      details: { cacheSize: this.cacheStore.size },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  public async get(prompt: string, model: string, options?: any): Promise<LlmResponse | null> {
    const key = this.generateKey(prompt, model, options);
    const entry = this.cacheStore.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cacheStore.delete(key);
      return null;
    }

    return entry.response;
  }

  public async set(prompt: string, model: string, response: LlmResponse, ttlSeconds?: number, options?: any): Promise<void> {
    const key = this.generateKey(prompt, model, options);
    const ttlMs = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtlMs;
    
    this.cacheStore.set(key, {
      response,
      expiresAt: Date.now() + ttlMs
    });
  }

  public async invalidate(prompt: string, model: string, options?: any): Promise<void> {
    const key = this.generateKey(prompt, model, options);
    this.cacheStore.delete(key);
  }

  public async clear(): Promise<void> {
    this.cacheStore.clear();
  }

  private generateKey(prompt: string, model: string, options?: any): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    const hashInput = `${model}:${prompt}:${optionsStr}`;
    
    // Pure JS hash function that doesn't rely on Node.js 'crypto' module
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

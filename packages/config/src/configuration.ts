import { IConfiguration, ServiceHealth, ServiceStatus } from '@atlas/contracts';
import { ProviderConfig, ProviderType } from '@atlas/domain';

export class Configuration implements IConfiguration {
  private currentStatus: ServiceStatus = 'uninitialized';
  private configStore: Map<string, any> = new Map();

  constructor(initialConfig?: Record<string, any>) {
    this.loadDefaults();
    if (initialConfig) {
      for (const [key, value] of Object.entries(initialConfig)) {
        this.configStore.set(key, value);
      }
    }
  }

  async initialize(): Promise<void> {
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      details: { totalKeys: this.configStore.size },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  private loadDefaults() {
    this.configStore.set('security.sandboxEnabled', true);
    this.configStore.set('security.allowNetwork', false);
    this.configStore.set('theme.mode', 'dark');
    this.configStore.set('workspace.maxAgents', 50);
  }

  public get<T>(key: string, defaultValue?: T): T {
    // 1. Check environment variable overrides (e.g. security.sandboxEnabled -> ATLAS_SECURITY_SANDBOX_ENABLED)
    const envKey = 'ATLAS_' + key.toUpperCase().replace(/\./g, '_');
    if (process.env[envKey] !== undefined) {
      const envVal = process.env[envKey];
      return this.coerceValue(envVal) as unknown as T;
    }

    // 2. Check config store
    if (this.configStore.has(key)) {
      return this.configStore.get(key) as T;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(`Configuration key "${key}" not found and no default value was provided.`);
  }

  public set<T>(key: string, value: T): void {
    this.configStore.set(key, value);
  }

  public getProviderConfig(providerId: string): ProviderConfig | null {
    // Attempt to load from env keys first
    const envApiKey = process.env[`ATLAS_PROVIDER_${providerId.toUpperCase()}_API_KEY`] || 
                      process.env[`${providerId.toUpperCase()}_API_KEY`];
    
    if (envApiKey) {
      return {
        id: providerId as ProviderType,
        name: providerId,
        enabled: true,
        apiKey: envApiKey,
        baseUrl: process.env[`ATLAS_PROVIDER_${providerId.toUpperCase()}_BASE_URL`],
        defaultModel: process.env[`ATLAS_PROVIDER_${providerId.toUpperCase()}_DEFAULT_MODEL`]
      };
    }

    const key = `providers.${providerId}`;
    if (this.configStore.has(key)) {
      return this.configStore.get(key) as ProviderConfig;
    }

    return null;
  }

  public getSecurityConfig(): Record<string, any> {
    return {
      sandboxEnabled: this.get<boolean>('security.sandboxEnabled', true),
      allowNetwork: this.get<boolean>('security.allowNetwork', false)
    };
  }

  private coerceValue(val: string): any {
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
    const num = Number(val);
    if (!isNaN(num)) return num;
    return val;
  }
}

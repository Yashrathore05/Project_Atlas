import { IProviderRegistry, IEventBus, ServiceHealth, ServiceStatus, ProviderMetadata } from '@atlas/contracts';
import { ProviderConfig } from '@atlas/domain';
import { ValidationError } from '@atlas/errors';

export class ProviderRegistry implements IProviderRegistry {
  private currentStatus: ServiceStatus = 'uninitialized';
  private providers: Map<string, { config: ProviderConfig; metadata: ProviderMetadata }> = new Map();

  constructor(private eventBus?: IEventBus) {}

  async initialize(): Promise<void> {
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.providers.clear();
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      details: { totalProviders: this.providers.size },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  public registerProvider(config: ProviderConfig, metadata: ProviderMetadata): void {
    if (!config.id) {
      throw new ValidationError('Provider ID is required for registration.', 'MISSING_PROVIDER_ID');
    }
    
    this.providers.set(config.id, { config, metadata });

    if (this.eventBus) {
      this.eventBus.publish({
        name: 'ProviderRegistered',
        payload: { providerId: config.id, metadata },
        timestamp: new Date()
      }).catch(err => console.error('Failed to publish ProviderRegistered event:', err));
    }
  }

  public unregisterProvider(providerId: string): void {
    const existing = this.providers.get(providerId);
    if (!existing) {
      return;
    }

    this.providers.delete(providerId);

    if (this.eventBus) {
      this.eventBus.publish({
        name: 'ProviderRemoved',
        payload: { providerId },
        timestamp: new Date()
      }).catch(err => console.error('Failed to publish ProviderRemoved event:', err));
    }
  }

  public enableProvider(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new ValidationError(`Provider "${providerId}" is not registered.`, 'PROVIDER_NOT_FOUND');
    }

    provider.config.enabled = true;
    provider.metadata.enabled = true;
  }

  public disableProvider(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new ValidationError(`Provider "${providerId}" is not registered.`, 'PROVIDER_NOT_FOUND');
    }

    provider.config.enabled = false;
    provider.metadata.enabled = false;
  }

  public getProvider(providerId: string): { config: ProviderConfig; metadata: ProviderMetadata } | null {
    return this.providers.get(providerId) || null;
  }

  public listProviders(): Array<{ config: ProviderConfig; metadata: ProviderMetadata }> {
    return Array.from(this.providers.values());
  }
}

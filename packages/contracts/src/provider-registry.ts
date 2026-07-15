import { IAppService } from './lifecycle';
import { ProviderConfig } from '@atlas/domain';

export interface ProviderMetadata {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  capabilities: string[];
}

export interface IProviderRegistry extends IAppService {
  registerProvider(config: ProviderConfig, metadata: ProviderMetadata): void;
  unregisterProvider(providerId: string): void;
  enableProvider(providerId: string): void;
  disableProvider(providerId: string): void;
  getProvider(providerId: string): { config: ProviderConfig; metadata: ProviderMetadata } | null;
  listProviders(): Array<{ config: ProviderConfig; metadata: ProviderMetadata }>;
}

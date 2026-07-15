import { IAppService } from './lifecycle';
import { ProviderConfig } from '@atlas/domain';

export interface IConfiguration extends IAppService {
  get<T>(key: string, defaultValue?: T): T;
  set<T>(key: string, value: T): void;
  getProviderConfig(providerId: string): ProviderConfig | null;
  getSecurityConfig(): Record<string, any>;
}

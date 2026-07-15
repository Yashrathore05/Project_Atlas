import { IAppService } from './lifecycle';
import { LlmResponse } from './provider-router';

export interface IProviderCache extends IAppService {
  get(prompt: string, model: string, options?: any): Promise<LlmResponse | null>;
  set(prompt: string, model: string, response: LlmResponse, ttlSeconds?: number, options?: any): Promise<void>;
  invalidate(prompt: string, model: string, options?: any): Promise<void>;
  clear(): Promise<void>;
}

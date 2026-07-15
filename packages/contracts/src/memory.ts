import { IAppService } from './lifecycle';

export interface IMemoryEngine extends IAppService {
  store(key: string, value: string): Promise<void>;
  retrieve(key: string): Promise<string | null>;
  search(query: string, limit?: number): Promise<string[]>;
}

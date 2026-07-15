import { IAppService } from './lifecycle';

export interface ProviderHealthRecord {
  providerId: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latencyMs: number;
  failureRate: number;
  successCount: number;
  failureCount: number;
  lastFailureTime?: Date;
  lastRecoveryTime?: Date;
  requestsPerMinute: number;
}

export interface IProviderHealth extends IAppService {
  trackRequest(providerId: string, durationMs: number, success: boolean): void;
  getProviderHealth(providerId: string): ProviderHealthRecord | null;
  listHealthRecords(): ProviderHealthRecord[];
}

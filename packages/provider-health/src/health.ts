import { IProviderHealth, ProviderHealthRecord, IEventBus, ServiceHealth, ServiceStatus } from '@atlas/contracts';

export class ProviderHealth implements IProviderHealth {
  private currentStatus: ServiceStatus = 'uninitialized';
  private healthRecords: Map<string, ProviderHealthRecord> = new Map();
  private requestTimestamps: Map<string, number[]> = new Map();

  constructor(private eventBus?: IEventBus) {}

  async initialize(): Promise<void> {
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.healthRecords.clear();
    this.requestTimestamps.clear();
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      details: { trackedProviders: this.healthRecords.size },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  public trackRequest(providerId: string, durationMs: number, success: boolean): void {
    const record = this.healthRecords.get(providerId) || {
      providerId,
      status: 'healthy',
      latencyMs: 0,
      failureRate: 0.0,
      successCount: 0,
      failureCount: 0,
      requestsPerMinute: 0
    };

    // Update request stats
    if (success) {
      record.successCount++;
      record.lastRecoveryTime = new Date();
    } else {
      record.failureCount++;
      record.lastFailureTime = new Date();
    }

    // Exponential moving average for latency
    if (success) {
      record.latencyMs = record.latencyMs === 0 ? durationMs : Math.round(record.latencyMs * 0.7 + durationMs * 0.3);
    }

    const total = record.successCount + record.failureCount;
    record.failureRate = record.failureCount / total;

    // Rolling Requests Per Minute
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(providerId) || [];
    timestamps.push(now);

    // Keep only last 60 seconds
    const cutoff = now - 60000;
    const filtered = timestamps.filter(ts => ts > cutoff);
    this.requestTimestamps.set(providerId, filtered);
    record.requestsPerMinute = filtered.length;

    // Recalculate health status based on thresholds
    let newStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (record.failureRate >= 0.5) {
      newStatus = 'unhealthy';
    } else if (record.failureRate >= 0.1 || record.latencyMs > 5000) {
      newStatus = 'degraded';
    }

    const statusChanged = record.status !== newStatus;
    const oldStatus = record.status;
    record.status = newStatus;

    this.healthRecords.set(providerId, record);

    if (statusChanged && this.eventBus) {
      this.eventBus.publish({
        name: 'ProviderHealthChanged',
        payload: { providerId, oldStatus, newStatus, latencyMs: record.latencyMs, failureRate: record.failureRate },
        timestamp: new Date()
      }).catch(err => console.error('Failed to publish ProviderHealthChanged event:', err));
    }
  }

  public getProviderHealth(providerId: string): ProviderHealthRecord | null {
    const record = this.healthRecords.get(providerId);
    if (!record) return null;

    // Refresh RPM metrics dynamically
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(providerId) || [];
    const cutoff = now - 60000;
    const filtered = timestamps.filter(ts => ts > cutoff);
    this.requestTimestamps.set(providerId, filtered);
    record.requestsPerMinute = filtered.length;

    return record;
  }

  public listHealthRecords(): ProviderHealthRecord[] {
    return Array.from(this.healthRecords.values()).map(r => this.getProviderHealth(r.providerId)!);
  }
}

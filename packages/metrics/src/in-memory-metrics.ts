import { IMetrics, ServiceHealth, ServiceStatus } from '@atlas/contracts';

export interface MetricDataPoint {
  value: number;
  tags?: Record<string, string>;
  timestamp: Date;
}

export class InMemoryMetrics implements IMetrics {
  private currentStatus: ServiceStatus = 'uninitialized';
  
  private counters: Map<string, MetricDataPoint[]> = new Map();
  private gauges: Map<string, MetricDataPoint[]> = new Map();
  private histograms: Map<string, MetricDataPoint[]> = new Map();

  async initialize(): Promise<void> {
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      details: {
        totalCounters: this.counters.size,
        totalGauges: this.gauges.size,
        totalHistograms: this.histograms.size
      },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  public incrementCounter(name: string, value = 1, tags?: Record<string, string>): void {
    const list = this.counters.get(name) || [];
    list.push({ value, tags, timestamp: new Date() });
    this.counters.set(name, list);
  }

  public recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    const list = this.gauges.get(name) || [];
    list.push({ value, tags, timestamp: new Date() });
    this.gauges.set(name, list);
  }

  public recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const list = this.histograms.get(name) || [];
    list.push({ value, tags, timestamp: new Date() });
    this.histograms.set(name, list);
  }

  public startTimer(name: string, tags?: Record<string, string>): () => void {
    if (typeof process !== 'undefined' && process.hrtime) {
      const startTime = process.hrtime();
      return () => {
        const diff = process.hrtime(startTime);
        const durationMs = (diff[0] * 1e9 + diff[1]) / 1e6;
        this.recordHistogram(name, durationMs, tags);
      };
    } else {
      const startTime = performance.now();
      return () => {
        const durationMs = performance.now() - startTime;
        this.recordHistogram(name, durationMs, tags);
      };
    }
  }

  public getCounterValue(name: string, tags?: Record<string, string>): number {
    const dataPoints = this.counters.get(name) || [];
    return dataPoints
      .filter(dp => this.matchTags(dp.tags, tags))
      .reduce((sum, dp) => sum + dp.value, 0);
  }

  public getGaugeValue(name: string, tags?: Record<string, string>): number | null {
    const dataPoints = this.gauges.get(name) || [];
    const filtered = dataPoints.filter(dp => this.matchTags(dp.tags, tags));
    if (filtered.length === 0) return null;
    return filtered[filtered.length - 1].value; // get latest gauge value
  }

  public getHistogramData(name: string, tags?: Record<string, string>): number[] {
    const dataPoints = this.histograms.get(name) || [];
    return dataPoints
      .filter(dp => this.matchTags(dp.tags, tags))
      .map(dp => dp.value);
  }

  private matchTags(source?: Record<string, string>, target?: Record<string, string>): boolean {
    if (!target) return true;
    if (!source) return false;
    for (const key of Object.keys(target)) {
      if (source[key] !== target[key]) return false;
    }
    return true;
  }
}

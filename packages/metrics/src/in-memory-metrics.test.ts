import { describe, it, expect } from 'vitest';
import { InMemoryMetrics } from './in-memory-metrics';

describe('In-Memory Metrics Service', () => {
  it('should initialize and check status/health', async () => {
    const metrics = new InMemoryMetrics();
    expect(metrics.status()).toBe('uninitialized');

    await metrics.initialize();
    expect(metrics.status()).toBe('ready');

    const health = await metrics.health();
    expect(health.status).toBe('healthy');
  });

  it('should track and aggregate counters with tags', () => {
    const metrics = new InMemoryMetrics();
    metrics.incrementCounter('llm_calls', 1, { provider: 'openai' });
    metrics.incrementCounter('llm_calls', 2, { provider: 'openai' });
    metrics.incrementCounter('llm_calls', 1, { provider: 'anthropic' });

    expect(metrics.getCounterValue('llm_calls')).toBe(4);
    expect(metrics.getCounterValue('llm_calls', { provider: 'openai' })).toBe(3);
    expect(metrics.getCounterValue('llm_calls', { provider: 'anthropic' })).toBe(1);
  });

  it('should track gauges and return the latest state', () => {
    const metrics = new InMemoryMetrics();
    metrics.recordGauge('active_workers', 2);
    metrics.recordGauge('active_workers', 5);

    expect(metrics.getGaugeValue('active_workers')).toBe(5);
  });

  it('should support execution timers', async () => {
    const metrics = new InMemoryMetrics();
    const stopTimer = metrics.startTimer('task_execution_time', { taskId: 'task-1' });

    // Wait a brief moment
    await new Promise(resolve => setTimeout(resolve, 50));
    stopTimer();

    const data = metrics.getHistogramData('task_execution_time', { taskId: 'task-1' });
    expect(data.length).toBe(1);
    expect(data[0]).toBeGreaterThanOrEqual(45);
  });
});

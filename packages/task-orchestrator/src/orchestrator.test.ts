import { describe, it, expect } from 'vitest';
import { AgentRegistry } from '@atlas/agent-registry';
import { CapabilityEngine } from '@atlas/capability-engine';
import { MessageStore } from '@atlas/agent-communication';
import { ContextEngine } from '@atlas/context-engine';
import { TaskOrchestrator } from './orchestrator';

describe('Task Orchestrator Package', () => {
  const mockEventBus = { publish: async () => {}, subscribe: () => {} };
  const mockLogger = { info: () => {}, error: () => {}, warn: () => {}, debug: () => {} };
  const mockMetrics = { incrementCounter: () => {}, recordGauge: () => {} };

  const mockProviderRouter = {
    routeRequest: async () => ({
      content: 'Output result content',
      usage: { promptTokens: 50, completionTokens: 100 }
    })
  } as any;

  const contextEngine = new ContextEngine();
  const messageStore = new MessageStore();

  const runtimeOptions = {
    providerRouter: mockProviderRouter,
    contextEngine,
    eventBus: mockEventBus as any,
    logger: mockLogger as any,
    metrics: mockMetrics as any
  };

  it('should plan, query capabilities, handle human approval, and execute pipeline tasks', async () => {
    const registry = new AgentRegistry();
    const capabilityEngine = new CapabilityEngine(registry);
    const orchestrator = new TaskOrchestrator(capabilityEngine, messageStore, runtimeOptions);

    const plan = await orchestrator.generatePlan('plan_abc', 'Build Atlas Engine', 'MultiAgent');
    expect(plan.tasks.length).toBe(4);

    const shared = contextEngine.createSharedContext();

    // Start plan execution in background since task_3 requires human approval
    const runPromise = orchestrator.executePlan('plan_abc', shared);

    // Give it a tiny moment to proceed to task_3 which requires approval
    await new Promise(resolve => setTimeout(resolve, 100));

    // Resolve approval for task_3
    orchestrator.resolveApproval('task_3', true);

    await runPromise;

    const finishedPlan = orchestrator.getPlan('plan_abc');
    expect(finishedPlan!.status).toBe('completed');
    expect(finishedPlan!.tasks.every(t => t.status === 'completed')).toBe(true);

    const msgs = await messageStore.listMessages({ conversationId: 'plan_abc' });
    expect(msgs.length).toBeGreaterThan(0);
  });
});

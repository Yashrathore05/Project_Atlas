import { describe, it, expect } from 'vitest';
import { AgentRegistry } from '@atlas/agent-registry';
import { CapabilityEngine } from './engine';

describe('Capability Engine Package', () => {
  it('should find active agents with a specific capability', async () => {
    const registry = new AgentRegistry();
    const engine = new CapabilityEngine(registry);

    // Create a custom agent with Python capability
    await registry.createAgent({
      id: 'python_coder',
      name: 'Python Coder',
      role: 'Developer',
      description: 'Codes in python',
      avatar: 'py.png',
      capabilities: ['Python', 'SQL'],
      systemPrompt: 'System',
      model: 'gpt-4o',
      provider: 'openai',
      temperature: 0.5,
      permissions: [],
      tools: [],
      budgetLimit: 100,
      currentSpend: 0,
      preferredTasks: []
    });

    const pythonAgents = await engine.findAgentsByCapability('Python');
    expect(pythonAgents.length).toBe(1);
    expect(pythonAgents[0].id).toBe('python_coder');

    const javaAgents = await engine.findAgentsByCapability('Java');
    expect(javaAgents.length).toBe(0);
  });

  it('should score and resolve the best agent or template for a task', async () => {
    const registry = new AgentRegistry();
    const engine = new CapabilityEngine(registry);

    // Pre-seeded templates:
    // CEO Agent has: ['Planning', 'Architecture', 'Writing']
    // React Engineer has: ['React', 'TypeScript', 'Vision']
    // Backend Engineer has: ['Python', 'SQL', 'DevOps', 'Docker', 'Linux']

    const bestForReact = await engine.findBestAgentForTask(['React', 'TypeScript']);
    expect(bestForReact).not.toBeNull();
    expect(bestForReact!.capabilities).toContain('React');

    const bestForPython = await engine.findBestAgentForTask(['Python', 'SQL']);
    expect(bestForPython).not.toBeNull();
    expect(bestForPython!.capabilities).toContain('Python');
  });
});

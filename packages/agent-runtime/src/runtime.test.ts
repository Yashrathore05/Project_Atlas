import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentRegistry } from '@atlas/agent-registry';
import { ContextEngine } from '@atlas/context-engine';
import { AgentInstance, AgentRuntime } from './runtime';
import { LocalNodeToolExecutor } from './tool-executor';

describe('Agent Runtime Package', () => {
  const mockEventBus = {
    publish: async () => {},
    subscribe: () => {}
  };
  const mockLogger = {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {}
  };
  const mockMetrics = {
    incrementCounter: () => {},
    recordGauge: () => {}
  };

  const mockProviderRouter = {
    routeRequest: async (provider: any, model: any, prompt: string) => {
      if (prompt.includes('Result from tool execution')) {
        return {
          content: 'Finalized response from model after executing tool.',
          usage: { promptTokens: 50, completionTokens: 50 }
        };
      }
      return {
        content: 'Composed response from model. CALL_TOOL: file_writer({"path": "out.txt", "content": "real file content"})',
        usage: { promptTokens: 100, completionTokens: 200 }
      };
    }
  } as any;

  const contextEngine = new ContextEngine();

  const options = {
    providerRouter: mockProviderRouter,
    contextEngine,
    eventBus: mockEventBus as any,
    logger: mockLogger as any,
    metrics: mockMetrics as any
  };

  it('should run execution loop and transition states correctly', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'atlas-runtime-'));
    const registry = new AgentRegistry();
    try {
      const profile = await registry.createAgent({
        id: 'coder_1',
        name: 'Coder 1',
        role: 'Engineer',
        description: 'Test coder',
        avatar: 'avatar.png',
        capabilities: ['Coding'],
        systemPrompt: 'You write code.',
        model: 'gpt-4o',
        provider: 'openai',
        temperature: 0.5,
        permissions: [],
        tools: ['file_writer'],
        budgetLimit: 10.0,
        currentSpend: 0.0,
        preferredTasks: []
      });

      const shared = contextEngine.createSharedContext();
      const instance = new AgentInstance(profile, shared, {
        ...options,
        toolExecutor: new LocalNodeToolExecutor(workspaceRoot)
      });
      expect(instance.getState()).toBe('Ready');

      const result = await instance.execute('Write index.js');
      expect(result).toContain('Finalized response from model');
      expect(await readFile(join(workspaceRoot, 'out.txt'), 'utf8')).toBe('real file content');
      expect(instance.getState()).toBe('Completed');
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('should prevent execution when tool lacks permission', async () => {
    const registry = new AgentRegistry();
    const profile = await registry.createAgent({
      id: 'coder_2',
      name: 'Coder 2',
      role: 'Engineer',
      description: 'Test coder',
      avatar: 'avatar.png',
      capabilities: ['Coding'],
      systemPrompt: 'You write code.',
      model: 'gpt-4o',
      provider: 'openai',
      temperature: 0.5,
      permissions: [],
      tools: [], // No permissions
      budgetLimit: 10.0,
      currentSpend: 0.0,
      preferredTasks: []
    });

    const shared = contextEngine.createSharedContext();
    const instance = new AgentInstance(profile, shared, options);

    await expect(instance.execute('Write index.js')).rejects.toThrow('permission');
    expect(instance.getState()).toBe('Failed');
  });

  it('should execute provider-native toolCalls', async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), 'atlas-runtime-toolcall-'));
    const router = {
      routeRequest: async (_provider: any, _model: any, prompt: string) => {
        if (prompt.includes('Result from tool execution')) {
          return {
            content: 'Read operation completed.',
            usage: { promptTokens: 30, completionTokens: 10, totalTokens: 40 }
          };
        }

        return {
          content: '',
          usage: { promptTokens: 20, completionTokens: 5, totalTokens: 25 },
          toolCalls: [
            {
              id: 'call_1',
              name: 'file_reader',
              arguments: JSON.stringify({ path: 'input.txt' })
            }
          ]
        };
      }
    } as any;

    try {
      const registry = new AgentRegistry();
      const profile = await registry.createAgent({
        id: 'reader_1',
        name: 'Reader 1',
        role: 'Engineer',
        description: 'Test reader',
        avatar: 'avatar.png',
        capabilities: ['Coding'],
        systemPrompt: 'You read files.',
        model: 'gpt-4o',
        provider: 'openai',
        temperature: 0.5,
        permissions: [],
        tools: ['file_reader'],
        budgetLimit: 10.0,
        currentSpend: 0.0,
        preferredTasks: []
      });

      const writer = new LocalNodeToolExecutor(workspaceRoot);
      await writer.execute({
        agentId: profile.id,
        toolName: 'file_writer',
        payload: { path: 'input.txt', content: 'native tool call content' }
      });

      const instance = new AgentInstance(profile, contextEngine.createSharedContext(), {
        ...options,
        providerRouter: router,
        toolExecutor: new LocalNodeToolExecutor(workspaceRoot)
      });

      const result = await instance.execute('Read input.txt');
      expect(result).toContain('Read operation completed');
      expect(instance.getState()).toBe('Completed');
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});

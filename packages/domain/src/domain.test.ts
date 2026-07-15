import { describe, it, expect } from 'vitest';
import { Workspace } from './workspace';
import { Project } from './project';
import { Agent } from './agent';
import { Task } from './task';

describe('Workspace Entity', () => {
  it('should create workspace and update provider settings', () => {
    const ws = new Workspace({
      id: 'ws-1',
      name: 'Atlas Default',
      providers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    expect(ws.name).toBe('Atlas Default');
    ws.updateProvider('openai', 'sk-key123', true, undefined, 'gpt-4');
    expect(ws.providers.length).toBe(1);
    expect(ws.providers[0].apiKey).toBe('sk-key123');
    expect(ws.providers[0].defaultModel).toBe('gpt-4');
  });

  it('should throw error on empty workspace name', () => {
    expect(() => {
      new Workspace({
        id: 'ws-2',
        name: '',
        providers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }).toThrow('Workspace name cannot be empty');
  });
});

describe('Agent Entity', () => {
  const defaultAgentProps = {
    id: 'agent-1',
    projectId: 'proj-1',
    name: 'Coder Agent',
    description: 'Writes clean code',
    avatar: '🤖',
    systemPrompt: 'You are a senior dev.',
    temperature: 0.5,
    model: 'claude-3-5-sonnet',
    provider: 'anthropic' as const,
    permissions: [],
    allowedTools: [],
    budgetLimit: 10.0,
    currentSpend: 0.0,
    version: 1
  };

  it('should instantiate and update details', () => {
    const agent = new Agent(defaultAgentProps);
    expect(agent.name).toBe('Coder Agent');
    expect(agent.temperature).toBe(0.5);

    agent.updateDetails('Senior Coder', 'Writes robust enterprise code', '💻');
    expect(agent.name).toBe('Senior Coder');
    expect(agent.avatar).toBe('💻');
    expect(agent.version).toBe(2);
  });

  it('should validate temperature bounds', () => {
    expect(() => {
      new Agent({ ...defaultAgentProps, temperature: 2.5 });
    }).toThrow('Temperature must be between 0.0 and 2.0');
  });

  it('should enforce spend recording and budget limit', () => {
    const agent = new Agent(defaultAgentProps);
    agent.recordSpend(5.0);
    expect(agent.currentSpend).toBe(5.0);

    expect(() => {
      agent.recordSpend(6.0); // 5.0 + 6.0 = 11.0 > budgetLimit 10.0
    }).toThrow('Budget limit of $10 exceeded');
  });
});

describe('Task Entity', () => {
  it('should manage steps and status transitions', () => {
    const task = new Task({
      id: 'task-1',
      projectId: 'proj-1',
      title: 'Analyze Repository',
      description: 'Find security vulnerabilities',
      status: 'pending',
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    expect(task.status).toBe('pending');
    task.start();
    expect(task.status).toBe('running');

    task.addStep('Scan Files', 'Run local grep scanner', 'agent-1');
    expect(task.steps.length).toBe(1);
    const stepId = task.steps[0].id;

    task.updateStepStatus(stepId, 'completed', 'Scan complete: No issues found');
    expect(task.steps[0].status).toBe('completed');
    expect(task.status).toBe('completed'); // auto completed because all steps are done
  });
});

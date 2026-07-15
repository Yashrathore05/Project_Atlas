import { describe, it, expect } from 'vitest';
import { AgentRegistry } from './registry';

describe('Agent Registry Package', () => {
  it('should list pre-seeded templates and instantiate them', async () => {
    const registry = new AgentRegistry();
    const templates = await registry.listTemplates();
    expect(templates.length).toBeGreaterThan(0);

    const firstTmpl = templates[0];
    const newAgent = await registry.createFromTemplate(firstTmpl.id, 'agent_1', { name: 'My CEO Agent' });
    expect(newAgent.id).toBe('agent_1');
    expect(newAgent.name).toBe('My CEO Agent');
    expect(newAgent.version).toBe(1);
  });

  it('should support CRUD, cloning, and updates', async () => {
    const registry = new AgentRegistry();

    // Create
    const agent = await registry.createAgent({
      id: 'backend_dev',
      name: 'Backend Dev',
      role: 'Engineer',
      description: 'Tests backend skills',
      avatar: 'avatar.png',
      capabilities: ['Python', 'SQL'],
      systemPrompt: 'System',
      model: 'gpt-4o',
      provider: 'openai',
      temperature: 0.5,
      permissions: ['read'],
      tools: ['write'],
      budgetLimit: 10.0,
      currentSpend: 0.0,
      preferredTasks: ['coding']
    });

    expect(agent.id).toBe('backend_dev');

    // Read
    const fetched = await registry.getAgent('backend_dev');
    expect(fetched).not.toBeNull();
    expect(fetched!.name).toBe('Backend Dev');

    // Update
    const updated = await registry.updateAgent('backend_dev', { temperature: 0.8 });
    expect(updated.temperature).toBe(0.8);
    expect(updated.version).toBe(2);

    // Clone
    const clone = await registry.cloneAgent('backend_dev', 'cloned_dev', 'Cloned Dev');
    expect(clone.id).toBe('cloned_dev');
    expect(clone.name).toBe('Cloned Dev');
    expect(clone.version).toBe(1);

    // Delete
    await registry.deleteAgent('backend_dev');
    const missing = await registry.getAgent('backend_dev');
    expect(missing).toBeNull();
  });

  it('should support export and import', async () => {
    const registry = new AgentRegistry();
    const templates = await registry.listTemplates();
    const template = templates[0];

    const agent = await registry.createFromTemplate(template.id, 'export_test');
    const exportedStr = await registry.exportAgent('export_test');
    expect(exportedStr).toContain('export_test');

    const imported = await registry.importAgent(exportedStr);
    expect(imported.id).toBe('export_test');
  });
});

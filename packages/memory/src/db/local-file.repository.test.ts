import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { LocalJsonStore, LocalWorkspaceRepository, LocalProjectRepository, LocalAgentRepository, LocalTaskRepository } from './local-file.repository';
import { Workspace, Project, Agent, Task } from '@atlas/domain';

const TEST_DB_PATH = path.join(__dirname, '../../test-db.json');

describe('Local File Repositories', () => {
  let store: LocalJsonStore;
  let workspaceRepo: LocalWorkspaceRepository;
  let projectRepo: LocalProjectRepository;
  let agentRepo: LocalAgentRepository;
  let taskRepo: LocalTaskRepository;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    store = new LocalJsonStore(TEST_DB_PATH);
    workspaceRepo = new LocalWorkspaceRepository(store);
    projectRepo = new LocalProjectRepository(store);
    agentRepo = new LocalAgentRepository(store);
    taskRepo = new LocalTaskRepository(store);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it('should persist and retrieve entities', async () => {
    const ws = new Workspace({
      id: 'ws-test',
      name: 'Test Workspace',
      providers: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await workspaceRepo.save(ws);
    const retrievedWs = await workspaceRepo.getById('ws-test');
    expect(retrievedWs).not.toBeNull();
    expect(retrievedWs!.name).toBe('Test Workspace');

    const project = new Project({
      id: 'proj-test',
      workspaceId: 'ws-test',
      name: 'Test Project',
      description: 'Project description',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await projectRepo.save(project);
    const retrievedProj = await projectRepo.getById('proj-test');
    expect(retrievedProj).not.toBeNull();
    expect(retrievedProj!.name).toBe('Test Project');
  });

  it('should support cascading deletes on projects', async () => {
    const project = new Project({
      id: 'proj-cascade',
      workspaceId: 'ws-test',
      name: 'Cascade Project',
      description: 'Runs cascading deletes test',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const agent = new Agent({
      id: 'agent-cascade',
      projectId: 'proj-cascade',
      name: 'Cascade Agent',
      description: 'Delete target',
      avatar: '🤖',
      systemPrompt: 'Delete me',
      temperature: 0.7,
      model: 'gpt-4o',
      provider: 'openai',
      permissions: [],
      allowedTools: [],
      budgetLimit: 5.0,
      currentSpend: 0.0,
      version: 1
    });

    await projectRepo.save(project);
    await agentRepo.save(agent);

    let foundAgent = await agentRepo.getById('agent-cascade');
    expect(foundAgent).not.toBeNull();

    await projectRepo.delete('proj-cascade');

    foundAgent = await agentRepo.getById('agent-cascade');
    expect(foundAgent).toBeNull(); // cascading delete cleared it!
  });
});

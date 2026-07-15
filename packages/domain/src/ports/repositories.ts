import { Workspace } from '../workspace';
import { Project } from '../project';
import { Agent } from '../agent';
import { Task } from '../task';

export interface IWorkspaceRepository {
  getById(id: string): Promise<Workspace | null>;
  save(workspace: Workspace): Promise<void>;
}

export interface IProjectRepository {
  getById(id: string): Promise<Project | null>;
  listByWorkspace(workspaceId: string): Promise<Project[]>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IAgentRepository {
  getById(id: string): Promise<Agent | null>;
  listByProject(projectId: string): Promise<Agent[]>;
  save(agent: Agent): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ITaskRepository {
  getById(id: string): Promise<Task | null>;
  listByProject(projectId: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
}

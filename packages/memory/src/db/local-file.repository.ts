import * as fs from 'fs';
import * as path from 'path';
import {
  IWorkspaceRepository,
  IProjectRepository,
  IAgentRepository,
  ITaskRepository,
  Workspace,
  WorkspaceProps,
  Project,
  ProjectProps,
  Agent,
  AgentProps,
  Task,
  TaskProps
} from '@atlas/domain';

export interface DbSchema {
  workspace: WorkspaceProps | null;
  projects: ProjectProps[];
  agents: AgentProps[];
  tasks: TaskProps[];
}

export class LocalJsonStore {
  private filePath: string;

  constructor(customPath?: string) {
    this.filePath = customPath || path.join(__dirname, '../../../data/db.json');
    this.initializeDb();
  }

  private initializeDb() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      const initialData: DbSchema = {
        workspace: null,
        projects: [],
        agents: [],
        tasks: []
      };
      fs.writeFileSync(this.filePath, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  public read(): DbSchema {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return { workspace: null, projects: [], agents: [], tasks: [] };
    }
  }

  public write(data: DbSchema) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export class LocalWorkspaceRepository implements IWorkspaceRepository {
  constructor(private store: LocalJsonStore) {}

  async getById(id: string): Promise<Workspace | null> {
    const db = this.store.read();
    if (db.workspace && db.workspace.id === id) {
      return new Workspace(db.workspace);
    }
    return null;
  }

  async save(workspace: Workspace): Promise<void> {
    const db = this.store.read();
    db.workspace = workspace.toJSON();
    this.store.write(db);
  }
}

export class LocalProjectRepository implements IProjectRepository {
  constructor(private store: LocalJsonStore) {}

  async getById(id: string): Promise<Project | null> {
    const db = this.store.read();
    const props = db.projects.find(p => p.id === id);
    return props ? new Project(props) : null;
  }

  async listByWorkspace(workspaceId: string): Promise<Project[]> {
    const db = this.store.read();
    return db.projects
      .filter(p => p.workspaceId === workspaceId)
      .map(p => new Project(p));
  }

  async save(project: Project): Promise<void> {
    const db = this.store.read();
    const index = db.projects.findIndex(p => p.id === project.id);
    if (index > -1) {
      db.projects[index] = project.toJSON();
    } else {
      db.projects.push(project.toJSON());
    }
    this.store.write(db);
  }

  async delete(id: string): Promise<void> {
    const db = this.store.read();
    db.projects = db.projects.filter(p => p.id !== id);
    db.agents = db.agents.filter(a => a.projectId !== id);
    db.tasks = db.tasks.filter(t => t.projectId !== id);
    this.store.write(db);
  }
}

export class LocalAgentRepository implements IAgentRepository {
  constructor(private store: LocalJsonStore) {}

  async getById(id: string): Promise<Agent | null> {
    const db = this.store.read();
    const props = db.agents.find(a => a.id === id);
    return props ? new Agent(props) : null;
  }

  async listByProject(projectId: string): Promise<Agent[]> {
    const db = this.store.read();
    return db.agents
      .filter(a => a.projectId === projectId)
      .map(a => new Agent(a));
  }

  async save(agent: Agent): Promise<void> {
    const db = this.store.read();
    const index = db.agents.findIndex(a => a.id === agent.id);
    if (index > -1) {
      db.agents[index] = agent.toJSON();
    } else {
      db.agents.push(agent.toJSON());
    }
    this.store.write(db);
  }

  async delete(id: string): Promise<void> {
    const db = this.store.read();
    db.agents = db.agents.filter(a => a.id !== id);
    this.store.write(db);
  }
}

export class LocalTaskRepository implements ITaskRepository {
  constructor(private store: LocalJsonStore) {}

  async getById(id: string): Promise<Task | null> {
    const db = this.store.read();
    const props = db.tasks.find(t => t.id === id);
    return props ? new Task(props) : null;
  }

  async listByProject(projectId: string): Promise<Task[]> {
    const db = this.store.read();
    return db.tasks
      .filter(t => t.projectId === projectId)
      .map(t => new Task(t));
  }

  async save(task: Task): Promise<void> {
    const db = this.store.read();
    const index = db.tasks.findIndex(t => t.id === task.id);
    if (index > -1) {
      db.tasks[index] = task.toJSON();
    } else {
      db.tasks.push(task.toJSON());
    }
    this.store.write(db);
  }

  async delete(id: string): Promise<void> {
    const db = this.store.read();
    db.tasks = db.tasks.filter(t => t.id !== id);
    this.store.write(db);
  }
}

import { ValidationError } from '@atlas/errors';

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  capabilities: string[];
  systemPrompt: string;
  model: string;
  provider: string;
  temperature: number;
  permissions: string[];
  tools: string[];
  tags?: string[];
  apiKey?: string;
  baseUrl?: string;
  mcpServers?: string[];
  budgetLimit: number;
  currentSpend: number;
  version: number;
  status: 'enabled' | 'disabled' | 'archived';
  statistics: {
    totalTasks: number;
    successRate: number;
    avgLatencyMs: number;
    totalSpend: number;
  };
  preferredTasks: string[];
}

export class AgentRegistry {
  private agents: Map<string, AgentProfile> = new Map();
  private templates: AgentProfile[] = [];

  constructor() {
    this.seedTemplates();
  }

  private seedTemplates(): void {
    const defaultTemplates: Omit<AgentProfile, 'id'>[] = [
      {
        name: 'CEO Agent',
        role: 'Coordinator & Planner',
        description: 'High-level workflow scheduler and team orchestrator.',
        avatar: 'ceo_avatar.png',
        capabilities: ['Planning', 'Architecture', 'Writing'],
        systemPrompt: 'You are the CEO Agent. Coordinate the team and direct tasks.',
        model: 'claude-3-5-sonnet',
        provider: 'anthropic',
        temperature: 0.2,
        permissions: ['read_file', 'write_file'],
        tools: ['web_search', 'file_reader'],
        budgetLimit: 100.0,
        currentSpend: 0.0,
        version: 1,
        status: 'enabled',
        statistics: { totalTasks: 0, successRate: 1.0, avgLatencyMs: 0, totalSpend: 0.0 },
        preferredTasks: ['planning', 'coordination']
      },
      {
        name: 'Backend Engineer',
        role: 'Software Developer',
        description: 'Implements APIs, database queries, and backend logic.',
        avatar: 'backend_avatar.png',
        capabilities: ['Python', 'SQL', 'DevOps', 'Docker', 'Linux'],
        systemPrompt: 'You are the Backend Engineer. Implement robust API services.',
        model: 'claude-3-5-sonnet',
        provider: 'anthropic',
        temperature: 0.5,
        permissions: ['read_file', 'write_file', 'execute_command'],
        tools: ['file_writer', 'terminal_execute'],
        budgetLimit: 50.0,
        currentSpend: 0.0,
        version: 1,
        status: 'enabled',
        statistics: { totalTasks: 0, successRate: 1.0, avgLatencyMs: 0, totalSpend: 0.0 },
        preferredTasks: ['coding', 'db_setup']
      },
      {
        name: 'React Engineer',
        role: 'Frontend Developer',
        description: 'Implements user interfaces using React and modern CSS.',
        avatar: 'frontend_avatar.png',
        capabilities: ['React', 'TypeScript', 'Vision'],
        systemPrompt: 'You are the React Engineer. Build beautiful, fluid interfaces.',
        model: 'gpt-4o',
        provider: 'openai',
        temperature: 0.7,
        permissions: ['read_file', 'write_file'],
        tools: ['file_writer', 'file_reader'],
        budgetLimit: 50.0,
        currentSpend: 0.0,
        version: 1,
        status: 'enabled',
        statistics: { totalTasks: 0, successRate: 1.0, avgLatencyMs: 0, totalSpend: 0.0 },
        preferredTasks: ['ui_design', 'frontend_impl']
      },
      {
        name: 'Security Engineer',
        role: 'Vulnerability Auditor',
        description: 'Performs static code audits and ensures code is secure.',
        avatar: 'security_avatar.png',
        capabilities: ['Security', 'Networking'],
        systemPrompt: 'You are the Security Engineer. Audit code for safety vulnerabilities.',
        model: 'claude-3-5-sonnet',
        provider: 'anthropic',
        temperature: 0.1,
        permissions: ['read_file'],
        tools: ['file_reader'],
        budgetLimit: 30.0,
        currentSpend: 0.0,
        version: 1,
        status: 'enabled',
        statistics: { totalTasks: 0, successRate: 1.0, avgLatencyMs: 0, totalSpend: 0.0 },
        preferredTasks: ['audit', 'security_check']
      },
      {
        name: 'Reviewer Agent',
        role: 'Quality Assurance',
        description: 'Verifies correct behavior, logic, and test coverage.',
        avatar: 'reviewer_avatar.png',
        capabilities: ['Planning', 'Architecture', 'Writing'],
        systemPrompt: 'You are the Reviewer Agent. Verify tasks and point out weaknesses.',
        model: 'gpt-4o',
        provider: 'openai',
        temperature: 0.2,
        permissions: ['read_file'],
        tools: ['file_reader'],
        budgetLimit: 40.0,
        currentSpend: 0.0,
        version: 1,
        status: 'enabled',
        statistics: { totalTasks: 0, successRate: 1.0, avgLatencyMs: 0, totalSpend: 0.0 },
        preferredTasks: ['pr_review', 'qa']
      }
    ];

    this.templates = defaultTemplates.map((t, index) => ({
      ...t,
      id: `tmpl_${index + 1}`
    }));
  }

  public async createAgent(profile: Omit<AgentProfile, 'version' | 'status' | 'statistics'>): Promise<AgentProfile> {
    if (!profile.name || profile.name.trim() === '') {
      throw new ValidationError('Agent name must not be empty', 'EMPTY_AGENT_NAME');
    }

    const newAgent: AgentProfile = {
      ...profile,
      version: 1,
      status: 'enabled',
      statistics: { totalTasks: 0, successRate: 1.0, avgLatencyMs: 0, totalSpend: 0.0 }
    };

    this.agents.set(newAgent.id, newAgent);
    return newAgent;
  }

  public async getAgent(id: string): Promise<AgentProfile | null> {
    return this.agents.get(id) || null;
  }

  public async deleteAgent(id: string): Promise<void> {
    if (!this.agents.has(id)) {
      throw new ValidationError(`Agent with ID ${id} does not exist`, 'AGENT_NOT_FOUND');
    }
    this.agents.delete(id);
  }

  public async cloneAgent(id: string, newId: string, newName?: string): Promise<AgentProfile> {
    const base = this.agents.get(id);
    if (!base) {
      throw new ValidationError(`Agent with ID ${id} does not exist`, 'AGENT_NOT_FOUND');
    }

    const cloned: AgentProfile = {
      ...JSON.parse(JSON.stringify(base)),
      id: newId,
      name: newName || `${base.name} (Clone)`,
      version: 1,
      currentSpend: 0.0,
      statistics: { totalTasks: 0, successRate: 1.0, avgLatencyMs: 0, totalSpend: 0.0 }
    };

    this.agents.set(newId, cloned);
    return cloned;
  }

  public async importAgent(jsonString: string): Promise<AgentProfile> {
    try {
      const parsed = JSON.parse(jsonString) as AgentProfile;
      if (!parsed.id || !parsed.name) {
        throw new ValidationError('Invalid agent JSON structure', 'INVALID_JSON');
      }
      this.agents.set(parsed.id, parsed);
      return parsed;
    } catch (err: any) {
      throw new ValidationError(`Failed to import agent: ${err.message}`, 'IMPORT_FAILED');
    }
  }

  public async exportAgent(id: string): Promise<string> {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new ValidationError(`Agent with ID ${id} does not exist`, 'AGENT_NOT_FOUND');
    }
    return JSON.stringify(agent, null, 2);
  }

  public async updateAgent(id: string, updates: Partial<AgentProfile>): Promise<AgentProfile> {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new ValidationError(`Agent with ID ${id} does not exist`, 'AGENT_NOT_FOUND');
    }

    const updated: AgentProfile = {
      ...agent,
      ...updates,
      id, // forbid changing the primary identifier key
      version: agent.version + 1
    };

    this.agents.set(id, updated);
    return updated;
  }

  public async listAgents(): Promise<AgentProfile[]> {
    return Array.from(this.agents.values());
  }

  public async listTemplates(): Promise<AgentProfile[]> {
    return this.templates;
  }

  public async createFromTemplate(templateId: string, newId: string, overrides?: Partial<AgentProfile>): Promise<AgentProfile> {
    const tmpl = this.templates.find(t => t.id === templateId);
    if (!tmpl) {
      throw new ValidationError(`Template with ID ${templateId} not found`, 'TEMPLATE_NOT_FOUND');
    }

    const newAgent: AgentProfile = {
      ...JSON.parse(JSON.stringify(tmpl)),
      id: newId,
      version: 1,
      currentSpend: 0.0,
      statistics: { totalTasks: 0, successRate: 1.0, avgLatencyMs: 0, totalSpend: 0.0 },
      ...overrides
    };

    this.agents.set(newId, newAgent);
    return newAgent;
  }
}

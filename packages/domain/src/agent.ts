import { ProviderType, AgentPermission } from './types';

export interface AgentProps {
  id: string;
  projectId: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string;
  temperature: number;
  model: string;
  provider: ProviderType;
  permissions: AgentPermission[];
  allowedTools: string[];
  budgetLimit: number;
  currentSpend: number;
  version: number;
}

export class Agent {
  private props: AgentProps;

  constructor(props: AgentProps) {
    this.validate(props);
    this.props = { ...props };
  }

  private validate(props: AgentProps) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Agent name cannot be empty');
    }
    if (props.temperature < 0 || props.temperature > 2) {
      throw new Error('Temperature must be between 0.0 and 2.0');
    }
    if (props.budgetLimit < 0) {
      throw new Error('Budget limit cannot be negative');
    }
    if (props.currentSpend < 0) {
      throw new Error('Current spend cannot be negative');
    }
  }

  public get id(): string { return this.props.id; }
  public get projectId(): string { return this.props.projectId; }
  public get name(): string { return this.props.name; }
  public get description(): string { return this.props.description; }
  public get avatar(): string { return this.props.avatar; }
  public get systemPrompt(): string { return this.props.systemPrompt; }
  public get temperature(): number { return this.props.temperature; }
  public get model(): string { return this.props.model; }
  public get provider(): ProviderType { return this.props.provider; }
  public get permissions(): AgentPermission[] { return this.props.permissions; }
  public get allowedTools(): string[] { return this.props.allowedTools; }
  public get budgetLimit(): number { return this.props.budgetLimit; }
  public get currentSpend(): number { return this.props.currentSpend; }
  public get version(): number { return this.props.version; }

  public updateDetails(name: string, description: string, avatar: string) {
    if (!name || name.trim() === '') {
      throw new Error('Agent name cannot be empty');
    }
    this.props.name = name;
    this.props.description = description;
    this.props.avatar = avatar;
    this.props.version += 1;
  }

  public updateModelConfig(provider: ProviderType, model: string, temperature: number) {
    if (temperature < 0 || temperature > 2) {
      throw new Error('Temperature must be between 0.0 and 2.0');
    }
    this.props.provider = provider;
    this.props.model = model;
    this.props.temperature = temperature;
    this.props.version += 1;
  }

  public recordSpend(amount: number) {
    if (amount < 0) {
      throw new Error('Spend amount cannot be negative');
    }
    if (this.props.currentSpend + amount > this.props.budgetLimit) {
      throw new Error(`Budget limit of $${this.props.budgetLimit} exceeded`);
    }
    this.props.currentSpend += amount;
  }

  public toJSON(): AgentProps {
    return { ...this.props };
  }
}

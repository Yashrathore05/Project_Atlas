import { ProviderConfig, ProviderType } from './types';

export interface WorkspaceProps {
  id: string;
  name: string;
  providers: ProviderConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export class Workspace {
  private props: WorkspaceProps;

  constructor(props: WorkspaceProps) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Workspace name cannot be empty');
    }
    this.props = { ...props };
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get providers(): ProviderConfig[] { return this.props.providers; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public updateProvider(providerId: ProviderType, apiKey: string, enabled: boolean, baseUrl?: string, defaultModel?: string) {
    const providerIndex = this.props.providers.findIndex(p => p.id === providerId);
    
    const updatedProvider: ProviderConfig = {
      id: providerId,
      name: this.getProviderDisplayName(providerId),
      enabled,
      apiKey,
      baseUrl,
      defaultModel
    };

    if (providerIndex > -1) {
      this.props.providers[providerIndex] = updatedProvider;
    } else {
      this.props.providers.push(updatedProvider);
    }
    
    this.props.updatedAt = new Date();
  }

  private getProviderDisplayName(providerId: ProviderType): string {
    switch (providerId) {
      case 'openai': return 'OpenAI';
      case 'anthropic': return 'Anthropic';
      case 'google': return 'Google Gemini';
      case 'groq': return 'Groq';
      case 'openrouter': return 'OpenRouter';
      case 'deepseek': return 'DeepSeek';
      case 'azure': return 'Azure OpenAI';
      case 'aws-bedrock': return 'AWS Bedrock';
      case 'ollama': return 'Ollama';
      case 'openai-compatible': return 'OpenAI Compatible';
      default: return providerId;
    }
  }

  public toJSON(): WorkspaceProps {
    return { ...this.props };
  }
}

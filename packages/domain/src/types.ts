export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'groq'
  | 'openrouter'
  | 'deepseek'
  | 'azure'
  | 'aws-bedrock'
  | 'ollama'
  | 'openai-compatible';

export interface ProviderConfig {
  id: ProviderType;
  name: string;
  enabled: boolean;
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface AgentPermission {
  id: string;
  name: string;
  description: string;
  granted: boolean;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, any>; // JSON Schema
}

export interface MemoryItem {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCallId?: string;
}

export interface TaskStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedAgentId?: string;
  output?: string;
  error?: string;
  timestamp: Date;
}

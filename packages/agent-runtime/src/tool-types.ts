export interface ToolExecutionRequest {
  agentId: string;
  toolName: string;
  payload: Record<string, unknown>;
}

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  output: string;
  metadata?: Record<string, unknown>;
}

export interface IToolExecutor {
  execute(request: ToolExecutionRequest): Promise<ToolExecutionResult>;
}

import { invoke } from '@tauri-apps/api/tauri';
import type { IToolExecutor, ToolExecutionRequest, ToolExecutionResult } from '@atlas/agent-runtime';

type TauriToolResponse = {
  output: string;
};

export class TauriToolExecutor implements IToolExecutor {
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    if (!('__TAURI__' in window)) {
      throw new Error(`Tauri native tool bridge is not available for ${request.toolName}.`);
    }

    switch (request.toolName) {
      case 'file_reader':
        return this.readFile(request);
      case 'file_writer':
        return this.writeFile(request);
      case 'terminal_execute':
        return this.runCommand(request);
      default:
        throw new Error(`Unknown desktop tool: ${request.toolName}`);
    }
  }

  private async readFile(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const response = await invoke<TauriToolResponse>('atlas_read_file', {
      path: this.getString(request.payload, 'path')
    });

    return {
      toolName: request.toolName,
      success: true,
      output: response.output
    };
  }

  private async writeFile(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const path = this.getString(request.payload, 'path');
    const content = this.getString(request.payload, 'content', '');
    const response = await invoke<TauriToolResponse>('atlas_write_file', { path, content });

    return {
      toolName: request.toolName,
      success: true,
      output: response.output,
      metadata: { path }
    };
  }

  private async runCommand(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const response = await invoke<TauriToolResponse>('atlas_terminal_execute', {
      payload: {
        command: this.getString(request.payload, 'command'),
        args: this.getStringArray(request.payload, 'args'),
        cwd: typeof request.payload.cwd === 'string' ? request.payload.cwd : undefined
      }
    });

    return {
      toolName: request.toolName,
      success: true,
      output: response.output
    };
  }

  private getString(payload: Record<string, unknown>, key: string, fallback?: string): string {
    const value = payload[key];
    if (typeof value === 'string') return value;
    if (fallback !== undefined) return fallback;
    throw new Error(`Tool payload missing string field: ${key}`);
  }

  private getStringArray(payload: Record<string, unknown>, key: string): string[] {
    const value = payload[key];
    if (value === undefined) return [];
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) return value;
    throw new Error(`Tool payload field must be string array: ${key}`);
  }
}

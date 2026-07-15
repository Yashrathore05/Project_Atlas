import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ValidationError } from '@atlas/errors';
import { IToolExecutor, ToolExecutionRequest, ToolExecutionResult } from './tool-types';

const execFileAsync = promisify(execFile);
export class UnavailableToolExecutor implements IToolExecutor {
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    throw new ValidationError(
      `Tool execution is not available in this runtime: ${request.toolName}`,
      'TOOL_EXECUTOR_UNAVAILABLE'
    );
  }
}

export class LocalNodeToolExecutor implements IToolExecutor {
  constructor(private workspaceRoot: string, private timeoutMs = 15000) {}

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    switch (request.toolName) {
      case 'file_reader':
        return this.readFile(request);
      case 'file_writer':
        return this.writeFile(request);
      case 'terminal_execute':
        return this.runCommand(request);
      default:
        throw new ValidationError(`Unknown tool: ${request.toolName}`, 'UNKNOWN_TOOL');
    }
  }

  private async readFile(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const fs = await import('node:fs/promises');
    const filePath = this.resolveWorkspacePath(this.getString(request.payload, 'path'));
    const content = await fs.readFile(filePath, 'utf8');

    return {
      toolName: request.toolName,
      success: true,
      output: content,
      metadata: { path: filePath }
    };
  }

  private async writeFile(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const fs = await import('node:fs/promises');
    const filePath = this.resolveWorkspacePath(this.getString(request.payload, 'path'));
    const content = this.getString(request.payload, 'content', '');

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');

    return {
      toolName: request.toolName,
      success: true,
      output: `Wrote ${Buffer.byteLength(content, 'utf8')} bytes to ${filePath}`,
      metadata: { path: filePath, bytes: Buffer.byteLength(content, 'utf8') }
    };
  }

  private async runCommand(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const command = this.getString(request.payload, 'command');
    const args = this.getStringArray(request.payload, 'args');
    const cwd = request.payload.cwd
      ? this.resolveWorkspacePath(this.getString(request.payload, 'cwd'))
      : this.workspaceRoot;

    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      timeout: this.timeoutMs,
      maxBuffer: 1024 * 1024,
      shell: false
    });

    return {
      toolName: request.toolName,
      success: true,
      output: [stdout, stderr].filter(Boolean).join('\n'),
      metadata: { command, args, cwd }
    };
  }

  private resolveWorkspacePath(inputPath: string): string {
    const resolved = path.resolve(this.workspaceRoot, inputPath);
    const root = path.resolve(this.workspaceRoot);

    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      throw new ValidationError(`Path escapes workspace root: ${inputPath}`, 'PATH_OUTSIDE_WORKSPACE');
    }

    return resolved;
  }

  private getString(payload: Record<string, unknown>, key: string, fallback?: string): string {
    const value = payload[key];
    if (typeof value === 'string') return value;
    if (fallback !== undefined) return fallback;
    throw new ValidationError(`Tool payload missing string field: ${key}`, 'INVALID_TOOL_PAYLOAD');
  }

  private getStringArray(payload: Record<string, unknown>, key: string): string[] {
    const value = payload[key];
    if (value === undefined) return [];
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      return value;
    }
    throw new ValidationError(`Tool payload field must be string array: ${key}`, 'INVALID_TOOL_PAYLOAD');
  }
}

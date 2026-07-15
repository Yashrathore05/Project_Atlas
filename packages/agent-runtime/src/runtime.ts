import { IAgentRuntime, IEventBus, ILogger, IMetrics, IProviderRouter, StreamChunk } from '@atlas/contracts';
import { AgentProfile } from '@atlas/agent-registry';
import { ContextEngine, SharedContext } from '@atlas/context-engine';
import { ValidationError, ProviderError } from '@atlas/errors';
import type { IToolExecutor, ToolExecutionResult } from './tool-types';

export type AgentState =
  | 'Created'
  | 'Ready'
  | 'Running'
  | 'Waiting'
  | 'Blocked'
  | 'Paused'
  | 'Streaming'
  | 'ToolExecution'
  | 'Review'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | 'Archived';

export interface AgentRuntimeOptions {
  providerRouter: IProviderRouter;
  contextEngine: ContextEngine;
  eventBus: IEventBus;
  logger: ILogger;
  metrics: IMetrics;
  toolExecutor?: IToolExecutor;
}

interface ParsedToolCall {
  toolName: string;
  payload: Record<string, unknown>;
}

export class AgentInstance {
  private currentState: AgentState = 'Created';
  private currentSpend = 0;
  private isCancelled = false;

  constructor(
    public profile: AgentProfile,
    private sharedContext: SharedContext,
    private options: AgentRuntimeOptions
  ) {
    this.transitionTo('Ready');
  }

  public getState(): AgentState {
    return this.currentState;
  }

  public pause(): void {
    if (this.currentState === 'Running' || this.currentState === 'ToolExecution') {
      this.transitionTo('Paused');
    }
  }

  public resume(): void {
    if (this.currentState === 'Paused') {
      this.transitionTo('Running');
    }
  }

  public cancel(): void {
    this.isCancelled = true;
    this.transitionTo('Cancelled');
  }

  public async execute(
    taskInput: string,
    runOptions?: { streamCallback?: (chunk: string) => void; approvalCallback?: (tool: string, payload: any) => Promise<boolean> }
  ): Promise<string> {
    if (this.currentState !== 'Ready' && this.currentState !== 'Paused') {
      throw new ValidationError(`Agent is not in a runnable state: ${this.currentState}`, 'INVALID_AGENT_STATE');
    }

    const startTime = Date.now();
    this.transitionTo('Running');
    await this.publishTimelineEvent('AgentStarted', { agentId: this.profile.id, taskInput });

    try {
      let loopCount = 0;
      const maxLoops = 5;
      let prompt = taskInput;

      while (loopCount < maxLoops) {
        if (this.isCancelled) {
          throw new ProviderError('Execution was cancelled by the user', 'CANCELLED');
        }

        // 1. Build Merged Context
        const merged = this.options.contextEngine.mergeContext(
          this.profile.systemPrompt,
          [prompt],
          this.sharedContext
        );
        await this.publishTimelineEvent('PromptBuilt', { agentId: this.profile.id, promptLength: merged.promptText.length });

        // 2. Request model with options
        const modelStartTime = Date.now();
        let streamingContent = '';

        const llmResponse = await this.options.providerRouter.routeRequest(
          this.profile.provider,
          this.profile.model,
          merged.promptText,
          {
            temperature: this.profile.temperature,
            tools: this.buildToolDefinitions(),
            streamCallback: async (chunk: StreamChunk) => {
              if (chunk.type === 'Token' && chunk.content) {
                streamingContent += chunk.content;
                if (runOptions?.streamCallback) {
                  runOptions.streamCallback(chunk.content);
                }
              }
            }
          }
        );

        const latency = Date.now() - modelStartTime;
        await this.publishTimelineEvent('ModelCalled', {
          agentId: this.profile.id,
          model: this.profile.model,
          tokens: llmResponse.usage,
          latencyMs: latency
        });

        // Track spend
        const requestCost = this.calculateRequestCost(llmResponse.usage);
        this.currentSpend += requestCost;
        this.options.metrics.incrementCounter('agent.spend.total', Math.round(requestCost * 1000000));
        this.options.metrics.recordGauge('agent.request.latency', latency);

        if (this.currentSpend > this.profile.budgetLimit) {
          this.transitionTo('Blocked');
          throw new ValidationError('Agent spend budget limit exceeded', 'BUDGET_LIMIT_EXCEEDED');
        }

        const toolCall = this.extractToolCall(llmResponse);
        if (toolCall) {
          this.transitionTo('ToolExecution');
          const { toolName, payload } = toolCall;

          // Permission Check
          const hasPermission = this.profile.tools.includes(toolName);
          if (!hasPermission) {
            throw new ValidationError(`Agent lacks permission to execute tool: ${toolName}`, 'PERMISSION_DENIED');
          }

          // Human Approval check if tool requires approval
          if (this.profile.permissions.includes('require_approval')) {
            if (!runOptions?.approvalCallback) {
              throw new ValidationError(`Approval callback is required for tool: ${toolName}`, 'APPROVAL_CALLBACK_REQUIRED');
            }
            this.transitionTo('Waiting');
            await this.publishTimelineEvent('ApprovalRequested', { agentId: this.profile.id, toolName, payload });
            const approved = await runOptions.approvalCallback(toolName, payload);
            if (!approved) {
              this.transitionTo('Failed');
              throw new ValidationError(`Execution rejected by user for tool: ${toolName}`, 'APPROVAL_REJECTED');
            }
            this.transitionTo('ToolExecution');
          }

          const toolResult = await this.executeTool(toolName, payload);
          await this.publishTimelineEvent('ToolExecuted', {
            agentId: this.profile.id,
            toolName,
            success: toolResult.success,
            metadata: toolResult.metadata
          });
          prompt = `Result from tool execution:\n${toolResult.output}`;
          loopCount++;
          continue;
        }

        // Final completed text output when the model does not request another tool.
        this.transitionTo('Completed');
        const duration = Date.now() - startTime;
        await this.publishTimelineEvent('TaskFinished', { agentId: this.profile.id, durationMs: duration });
        return llmResponse.content;
      }

      throw new ProviderError('Max tool execution loop limit reached', 'LOOP_LIMIT_EXCEEDED');
    } catch (err: any) {
      this.transitionTo('Failed');
      throw err;
    }
  }

  private extractToolCall(response: { content: string; toolCalls?: Array<{ name: string; arguments: string }> }): ParsedToolCall | null {
    if (response.toolCalls && response.toolCalls.length > 0) {
      const call = response.toolCalls[0];
      return {
        toolName: call.name,
        payload: this.parseToolPayload(call.arguments)
      };
    }

    const toolCallMatch = response.content.match(/CALL_TOOL:\s*([\w-]+)\s*\(([\s\S]*)\)/);
    if (!toolCallMatch) return null;

    return {
      toolName: toolCallMatch[1],
      payload: this.parseToolPayload(toolCallMatch[2] || '{}')
    };
  }

  private parseToolPayload(raw: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(raw || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Tool payload must be a JSON object');
      }
      return parsed as Record<string, unknown>;
    } catch (err: any) {
      throw new ValidationError(`Invalid tool payload JSON: ${err.message}`, 'INVALID_TOOL_PAYLOAD');
    }
  }

  private async executeTool(toolName: string, payload: Record<string, unknown>): Promise<ToolExecutionResult> {
    if (!this.options.toolExecutor) {
      throw new ValidationError(`Tool execution is not configured for tool: ${toolName}`, 'TOOL_EXECUTOR_UNAVAILABLE');
    }

    try {
      return await this.options.toolExecutor.execute({
        agentId: this.profile.id,
        toolName,
        payload
      });
    } catch (err: any) {
      await this.publishTimelineEvent('ToolFailed', {
        agentId: this.profile.id,
        toolName,
        error: err.message
      });
      throw err;
    }
  }

  private buildToolDefinitions(): Array<Record<string, unknown>> {
    return this.profile.tools.map(toolName => {
      const schemas: Record<string, Record<string, unknown>> = {
        file_reader: {
          type: 'function',
          function: {
            name: 'file_reader',
            description: 'Read a UTF-8 text file from the current workspace.',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Workspace-relative file path to read.' }
              },
              required: ['path'],
              additionalProperties: false
            }
          }
        },
        file_writer: {
          type: 'function',
          function: {
            name: 'file_writer',
            description: 'Write UTF-8 text content to a workspace-relative file path.',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Workspace-relative file path to write.' },
                content: { type: 'string', description: 'Full file content to write.' }
              },
              required: ['path', 'content'],
              additionalProperties: false
            }
          }
        },
        terminal_execute: {
          type: 'function',
          function: {
            name: 'terminal_execute',
            description: 'Execute a command in the workspace using argv, without shell expansion.',
            parameters: {
              type: 'object',
              properties: {
                command: { type: 'string', description: 'Executable name or absolute path.' },
                args: { type: 'array', items: { type: 'string' }, description: 'Command arguments.' },
                cwd: { type: 'string', description: 'Optional workspace-relative working directory.' }
              },
              required: ['command'],
              additionalProperties: false
            }
          }
        }
      };

      return schemas[toolName] || {
        type: 'function',
        function: {
          name: toolName,
          description: `Execute tool ${toolName}.`,
          parameters: {
            type: 'object',
            properties: {},
            additionalProperties: true
          }
        }
      };
    });
  }

  private transitionTo(newState: AgentState): void {
    const oldState = this.currentState;
    this.currentState = newState;
    this.options.logger.info(`Agent ${this.profile.id} transitioned from ${oldState} to ${newState}`);
    this.options.eventBus.publish({
      name: 'AgentStateTransitioned',
      payload: { agentId: this.profile.id, oldState, newState },
      timestamp: new Date()
    });
  }

  private async publishTimelineEvent(name: string, payload: any): Promise<void> {
    await this.options.eventBus.publish({
      name,
      payload: { ...payload, timestamp: new Date() },
      timestamp: new Date()
    });
  }

  private calculateRequestCost(usage: { promptTokens: number; completionTokens: number }): number {
    // Standard static approximation
    const promptPrice = 3.00 / 1000000;
    const completionPrice = 15.00 / 1000000;
    return (usage.promptTokens * promptPrice) + (usage.completionTokens * completionPrice);
  }
}

export class AgentRuntime implements IAgentRuntime {
  private currentStatus: ServiceStatus = 'uninitialized';
  private activeInstances: Map<string, AgentInstance> = new Map();

  constructor(
    private registry: any, // AgentRegistry
    private options: AgentRuntimeOptions
  ) {}

  async initialize(): Promise<void> {
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.activeInstances.clear();
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<any> {
    return {
      status: 'healthy',
      details: { activeInstances: this.activeInstances.size },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  /**
   * Implements executeAgentStep contract.
   */
  public async executeAgentStep(agentId: string, input: string): Promise<string> {
    const profile = await this.registry.getAgent(agentId);
    if (!profile) {
      throw new ValidationError(`Agent ${agentId} not found in registry`, 'AGENT_NOT_FOUND');
    }

    const shared = this.options.contextEngine.createSharedContext();
    const instance = new AgentInstance(profile, shared, this.options);
    this.activeInstances.set(agentId, instance);

    try {
      const output = await instance.execute(input);
      return output;
    } finally {
      this.activeInstances.delete(agentId);
    }
  }

  /**
   * Implements terminateExecution contract.
   */
  public async terminateExecution(agentId: string): Promise<void> {
    const instance = this.activeInstances.get(agentId);
    if (instance) {
      instance.cancel();
      this.activeInstances.delete(agentId);
    }
  }

  public getActiveInstance(agentId: string): AgentInstance | null {
    return this.activeInstances.get(agentId) || null;
  }
}

type ServiceStatus = 'uninitialized' | 'ready';

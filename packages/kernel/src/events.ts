import { IEvent } from '@atlas/contracts';
import { WorkspaceProps, ProjectProps, AgentProps, TaskProps } from '@atlas/domain';

export class WorkspaceCreated implements IEvent<WorkspaceProps> {
  public readonly name = 'WorkspaceCreated';
  public readonly timestamp = new Date();
  constructor(public readonly payload: WorkspaceProps) {}
}

export class ProjectCreated implements IEvent<ProjectProps> {
  public readonly name = 'ProjectCreated';
  public readonly timestamp = new Date();
  constructor(public readonly payload: ProjectProps) {}
}

export class ProjectDeleted implements IEvent<{ id: string }> {
  public readonly name = 'ProjectDeleted';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { id: string }) {}
}

export class AgentCreated implements IEvent<AgentProps> {
  public readonly name = 'AgentCreated';
  public readonly timestamp = new Date();
  constructor(public readonly payload: AgentProps) {}
}

export class AgentDeleted implements IEvent<{ id: string }> {
  public readonly name = 'AgentDeleted';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { id: string }) {}
}

export class TaskCreated implements IEvent<TaskProps> {
  public readonly name = 'TaskCreated';
  public readonly timestamp = new Date();
  constructor(public readonly payload: TaskProps) {}
}

export class TaskStarted implements IEvent<{ taskId: string }> {
  public readonly name = 'TaskStarted';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { taskId: string }) {}
}

export class TaskCompleted implements IEvent<{ taskId: string; output: string }> {
  public readonly name = 'TaskCompleted';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { taskId: string; output: string }) {}
}

export class TaskFailed implements IEvent<{ taskId: string; error: string }> {
  public readonly name = 'TaskFailed';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { taskId: string; error: string }) {}
}

export class MemoryUpdated implements IEvent<{ tier: string; key: string; length: number }> {
  public readonly name = 'MemoryUpdated';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { tier: string; key: string; length: number }) {}
}

export class ProviderCalled implements IEvent<{ provider: string; model: string; promptTokens: number; completionTokens: number }> {
  public readonly name = 'ProviderCalled';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { provider: string; model: string; promptTokens: number; completionTokens: number }) {}
}

export class WorkflowStarted implements IEvent<{ workflowId: string }> {
  public readonly name = 'WorkflowStarted';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { workflowId: string }) {}
}

export class WorkflowCompleted implements IEvent<{ workflowId: string }> {
  public readonly name = 'WorkflowCompleted';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { workflowId: string }) {}
}

export class ApprovalRequested implements IEvent<{ stepId: string; requestDetails: string }> {
  public readonly name = 'ApprovalRequested';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { stepId: string; requestDetails: string }) {}
}

export class BudgetExceeded implements IEvent<{ agentId: string; limit: number; currentSpend: number }> {
  public readonly name = 'BudgetExceeded';
  public readonly timestamp = new Date();
  constructor(public readonly payload: { agentId: string; limit: number; currentSpend: number }) {}
}

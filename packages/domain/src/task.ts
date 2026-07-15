import { TaskStep } from './types';

export interface TaskProps {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval';
  steps: TaskStep[];
  createdAt: Date;
  updatedAt: Date;
}

export class Task {
  private props: TaskProps;

  constructor(props: TaskProps) {
    if (!props.title || props.title.trim() === '') {
      throw new Error('Task title cannot be empty');
    }
    this.props = { ...props };
  }

  public get id(): string { return this.props.id; }
  public get projectId(): string { return this.props.projectId; }
  public get title(): string { return this.props.title; }
  public get description(): string { return this.props.description; }
  public get status(): string { return this.props.status; }
  public get steps(): TaskStep[] { return this.props.steps; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public start() {
    if (this.props.status !== 'pending') {
      throw new Error('Task can only start if it is pending');
    }
    this.props.status = 'running';
    this.props.updatedAt = new Date();
  }

  public addStep(title: string, description: string, assignedAgentId?: string) {
    const step: TaskStep = {
      id: Math.random().toString(36).substring(7),
      title,
      description,
      status: 'pending',
      assignedAgentId,
      timestamp: new Date()
    };
    this.props.steps.push(step);
    this.props.updatedAt = new Date();
  }

  public updateStepStatus(stepId: string, status: 'pending' | 'running' | 'completed' | 'failed', output?: string, error?: string) {
    const step = this.props.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step with ID ${stepId} not found`);
    }
    step.status = status;
    step.output = output;
    step.error = error;
    step.timestamp = new Date();
    
    // Automatically transition task status based on steps
    if (status === 'failed') {
      this.props.status = 'failed';
    } else if (status === 'completed' && this.props.steps.every(s => s.status === 'completed')) {
      this.props.status = 'completed';
    }
    
    this.props.updatedAt = new Date();
  }

  public complete() {
    this.props.status = 'completed';
    this.props.updatedAt = new Date();
  }

  public fail() {
    this.props.status = 'failed';
    this.props.updatedAt = new Date();
  }

  public toJSON(): TaskProps {
    return { ...this.props };
  }
}

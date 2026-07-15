import { CapabilityEngine } from '@atlas/capability-engine';
import { AgentInstance, AgentRuntimeOptions } from '@atlas/agent-runtime';
import { SharedContext } from '@atlas/context-engine';
import { MessageStore } from '@atlas/agent-communication';
import { ValidationError } from '@atlas/errors';

export type ExecutionMode =
  | 'SingleAgent'
  | 'MultiAgent'
  | 'Planner'
  | 'Review'
  | 'Autonomous';

export interface PlanTask {
  id: string;
  title: string;
  requiredCapabilities: string[];
  dependencies: string[]; // task IDs that must complete first
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
  assignedAgentId?: string;
  output?: string;
  error?: string;
  requiresApproval?: boolean;
}

export interface Plan {
  id: string;
  goal: string;
  tasks: PlanTask[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class TaskOrchestrator {
  private activePlans: Map<string, Plan> = new Map();
  private pendingApprovals: Map<string, (approved: boolean) => void> = new Map();

  constructor(
    private capabilityEngine: CapabilityEngine,
    private messageStore: MessageStore,
    private runtimeOptions: AgentRuntimeOptions
  ) {}

  /**
   * Generates a step-by-step Execution Plan from a goal using capability matching.
   */
  public async generatePlan(planId: string, goal: string, mode: ExecutionMode): Promise<Plan> {
    // Simulated Planner Agent breaking down the goal into dependencies
    const tasks: PlanTask[] = [];

    if (mode === 'SingleAgent') {
      tasks.push({
        id: 'task_1',
        title: `Execute goal: ${goal}`,
        requiredCapabilities: ['Planning'],
        dependencies: [],
        status: 'pending'
      });
    } else {
      // Deconstruct into a structured pipeline
      tasks.push({
        id: 'task_1',
        title: 'Draft architecture specifications and plans',
        requiredCapabilities: ['Architecture', 'Planning'],
        dependencies: [],
        status: 'pending'
      });
      tasks.push({
        id: 'task_2',
        title: 'Implement backend storage logic',
        requiredCapabilities: ['SQL', 'Python'],
        dependencies: ['task_1'],
        status: 'pending'
      });
      tasks.push({
        id: 'task_3',
        title: 'Audit backend modules for security issues',
        requiredCapabilities: ['Security'],
        dependencies: ['task_2'],
        status: 'pending',
        requiresApproval: true
      });
      tasks.push({
        id: 'task_4',
        title: 'Generate markdown system documentation',
        requiredCapabilities: ['Writing'],
        dependencies: ['task_3'],
        status: 'pending'
      });
    }

    const plan: Plan = {
      id: planId,
      goal,
      tasks,
      status: 'pending'
    };

    this.activePlans.set(planId, plan);
    await this.runtimeOptions.eventBus.publish({
      name: 'PlanGenerated',
      payload: { planId, goal, mode, tasks },
      timestamp: new Date()
    });
    return plan;
  }

  /**
   * Executes the generated plan resolving capabilities, dependencies, and handling user approvals.
   */
  public async executePlan(
    planId: string,
    sharedContext: SharedContext
  ): Promise<void> {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new ValidationError(`Plan ${planId} not found`, 'PLAN_NOT_FOUND');
    }

    plan.status = 'running';
    await this.runtimeOptions.eventBus.publish({
      name: 'PlanStarted',
      payload: { planId, goal: plan.goal },
      timestamp: new Date()
    });

    while (plan.tasks.some(t => t.status === 'pending' || t.status === 'running')) {
      const runnable = plan.tasks.filter(
        t => t.status === 'pending' && t.dependencies.every(depId => {
          const dep = plan.tasks.find(tk => tk.id === depId);
          return dep && dep.status === 'completed';
        })
      );

      if (runnable.length === 0 && plan.tasks.some(t => t.status === 'running')) {
        // Blocked waiting for asynchronous/parallel run tasks or approvals
        await new Promise(resolve => setTimeout(resolve, 50));
        continue;
      }

      if (runnable.length === 0 && plan.tasks.some(t => t.status === 'failed')) {
        plan.status = 'failed';
        return;
      }

      // Execute runnable tasks
      await Promise.all(
        runnable.map(async task => {
          task.status = 'running';
          await this.runtimeOptions.eventBus.publish({
            name: 'TaskStarted',
            payload: { planId, taskId: task.id, title: task.title, requiredCapabilities: task.requiredCapabilities },
            timestamp: new Date()
          });
          
          try {
            // Match Agent by capabilities
            const agent = await this.capabilityEngine.findBestAgentForTask(task.requiredCapabilities);
            if (!agent) {
              throw new ValidationError(`No active agent matches capabilities: ${task.requiredCapabilities.join(', ')}`, 'AGENT_NOT_FOUND');
            }

            task.assignedAgentId = agent.id;
            await this.runtimeOptions.eventBus.publish({
              name: 'TaskAssigned',
              payload: { planId, taskId: task.id, agentId: agent.id, agentName: agent.name },
              timestamp: new Date()
            });

            // Handle user approval gate if required
            if (task.requiresApproval) {
              const approved = await this.requestHumanApproval(task.id);
              if (!approved) {
                throw new ValidationError(`Step rejected by human gate: ${task.title}`, 'APPROVAL_REJECTED');
              }
            }

            // Setup agent instance and feed prior step output context
            const instance = new AgentInstance(agent, sharedContext, this.runtimeOptions);
            
            // Link agent communication logs
            await this.messageStore.storeMessage({
              type: 'REQUEST',
              senderId: 'orchestrator',
              receiverId: agent.id,
              content: `Please execute task: ${task.title}`,
              priority: 'medium',
              attachments: [],
              memoryReferences: [],
              contextReferences: [],
              taskReferences: [task.id],
              conversationId: planId,
              threadId: `thread_${task.id}`
            });

            const output = await instance.execute(task.title, {
              approvalCallback: async (tool, payload) => {
                const approvalId = `${task.id}:${tool}`;
                return this.requestHumanApproval(approvalId, tool, payload);
              }
            });

            await this.messageStore.storeMessage({
              type: 'RESPONSE',
              senderId: agent.id,
              receiverId: 'orchestrator',
              content: output,
              priority: 'medium',
              attachments: [],
              memoryReferences: [],
              contextReferences: [],
              taskReferences: [task.id],
              conversationId: planId,
              threadId: `thread_${task.id}`
            });

            task.output = output;
            task.status = 'completed';
            await this.runtimeOptions.eventBus.publish({
              name: 'TaskCompleted',
              payload: { planId, taskId: task.id, title: task.title, agentId: agent.id, output },
              timestamp: new Date()
            });
            
            // Feed into rolling shared context
            sharedContext.outputs[task.id] = output;
            sharedContext.timelineEvents.push(`Task ${task.id} completed by agent ${agent.name}`);
            sharedContext.keyDecisions.push(`Step ${task.id} executed successfully.`);

          } catch (err: any) {
            task.error = err.message;
            task.status = 'failed';
            await this.runtimeOptions.eventBus.publish({
              name: 'TaskFailed',
              payload: { planId, taskId: task.id, title: task.title, error: err.message },
              timestamp: new Date()
            });

            // Failure Recovery: Re-run assignment to see if an alternative model can resolve it
            const recovered = await this.attemptRecovery(task, sharedContext);
            if (recovered) {
              task.status = 'completed';
              await this.runtimeOptions.eventBus.publish({
                name: 'TaskRecovered',
                payload: { planId, taskId: task.id, title: task.title, output: task.output },
                timestamp: new Date()
              });
            } else {
              plan.status = 'failed';
            }
          }
        })
      );
    }

    if (plan.tasks.every(t => t.status === 'completed')) {
      plan.status = 'completed';
    } else {
      plan.status = 'failed';
    }
    await this.runtimeOptions.eventBus.publish({
      name: 'PlanFinished',
      payload: { planId, status: plan.status, tasks: plan.tasks },
      timestamp: new Date()
    });
  }

  private async requestHumanApproval(taskId: string, toolName = 'human approval', payload?: Record<string, unknown>): Promise<boolean> {
    await this.runtimeOptions.eventBus.publish({
      name: 'ApprovalRequested',
      payload: { taskId, agentId: 'backend', toolName, payload },
      timestamp: new Date()
    });
    return new Promise(resolve => {
      this.pendingApprovals.set(taskId, resolve);
    });
  }

  public resolveApproval(taskId: string, approved: boolean): void {
    const resolve = this.pendingApprovals.get(taskId);
    if (resolve) {
      resolve(approved);
      this.pendingApprovals.delete(taskId);
    }
  }

  private async attemptRecovery(task: PlanTask, sharedContext: SharedContext): Promise<boolean> {
    // Retry task with a more generic capability configuration or fallback
    try {
      this.runtimeOptions.logger.warn(`Orchestrator attempting failure recovery for task: ${task.id}`);
      
      // Fallback: search for high-capability CEO/General template
      const fallbackAgent = await this.capabilityEngine.findBestAgentForTask(['Planning', 'Architecture']);
      if (!fallbackAgent) return false;

      const instance = new AgentInstance(fallbackAgent, sharedContext, this.runtimeOptions);
      const output = await instance.execute(`Fallback recovery execution of: ${task.title}`);

      task.output = output;
      return true;
    } catch {
      return false;
    }
  }

  public getPlan(planId: string): Plan | null {
    return this.activePlans.get(planId) || null;
  }
}

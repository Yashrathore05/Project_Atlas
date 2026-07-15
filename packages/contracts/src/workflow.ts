import { IAppService } from './lifecycle';

export interface IWorkflowEngine extends IAppService {
  executeWorkflow(workflowId: string): Promise<void>;
  pauseWorkflow(workflowId: string): Promise<void>;
  resumeWorkflow(workflowId: string): Promise<void>;
  cancelWorkflow(workflowId: string): Promise<void>;
}

import { IAppService } from './lifecycle';

export interface IAgentRuntime extends IAppService {
  executeAgentStep(agentId: string, input: string): Promise<string>;
  terminateExecution(agentId: string): Promise<void>;
}

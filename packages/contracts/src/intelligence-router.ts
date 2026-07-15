import { IAppService } from './lifecycle';
import { ModelMetadata } from './model-registry';

export interface IIntelligenceRouter extends IAppService {
  selectModel(intent: string, budgetLimit?: number): Promise<ModelMetadata>;
  registerOverride(intentPattern: string, providerId: string, modelName: string): void;
}

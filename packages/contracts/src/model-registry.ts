import { IAppService } from './lifecycle';

export interface ModelMetadata {
  providerId: string;
  name: string;
  contextWindow: number;
  visionSupport: boolean;
  imageGeneration: boolean;
  audioSupport: boolean;
  streamingSupport: boolean;
  toolCalling: boolean;
  jsonMode: boolean;
  inputPricePerM: number;
  outputPricePerM: number;
  cachedTokenPricePerM?: number;
  reasoningSupport: boolean;
  embeddingSupport: boolean;
  latencyScore: number;
  reliabilityScore: number;
  maxTokens: number;
  capabilities: string[];
  tags: string[];
}

export interface IModelRegistry extends IAppService {
  registerModel(model: ModelMetadata): void;
  unregisterModel(providerId: string, modelName: string): void;
  getModel(providerId: string, modelName: string): ModelMetadata | null;
  listModels(query?: { tags?: string[]; capability?: string; providerId?: string }): ModelMetadata[];
}

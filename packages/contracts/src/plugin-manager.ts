import { IAppService } from './lifecycle';

export interface IPluginManager extends IAppService {
  loadPlugin(pluginId: string): Promise<void>;
  unloadPlugin(pluginId: string): Promise<void>;
  executeTool(pluginId: string, toolName: string, args: Record<string, any>): Promise<any>;
}

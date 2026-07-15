import { IAppService } from './lifecycle';

export interface IScheduler extends IAppService {
  scheduleTask(taskId: string, delayMs: number): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  setConcurrencyLimit(limit: number): void;
}

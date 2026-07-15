import { IAppService } from './lifecycle';

export interface IEvent<T = any> {
  name: string;
  payload: T;
  timestamp: Date;
}

export type EventCallback<T = any> = (event: IEvent<T>) => void | Promise<void>;

export interface IEventBus extends IAppService {
  publish<T>(event: IEvent<T>): Promise<void>;
  subscribe<T>(eventName: string, callback: EventCallback<T>): string;
  unsubscribe(subscriptionId: string): void;
}

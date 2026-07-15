export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details?: Record<string, any>;
  timestamp: Date;
}

export type ServiceStatus = 
  | 'uninitialized' 
  | 'initializing' 
  | 'ready' 
  | 'shutting_down' 
  | 'failed';

export interface IAppService {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  health(): Promise<ServiceHealth>;
  status(): ServiceStatus;
  ready(): boolean;
}

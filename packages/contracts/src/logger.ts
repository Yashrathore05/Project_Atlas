import { IAppService } from './lifecycle';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface ILogger extends IAppService {
  log(level: LogLevel, message: string, context?: Record<string, any>): void;
  trace(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>, cause?: Error): void;
  fatal(message: string, context?: Record<string, any>, cause?: Error): void;
}

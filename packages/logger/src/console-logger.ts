import { ILogger, LogLevel, ServiceHealth, ServiceStatus } from '@atlas/contracts';

export class ConsoleLogger implements ILogger {
  private currentStatus: ServiceStatus = 'uninitialized';
  private minLevel: LogLevel = 'info';
  private isJsonMode = true;

  private levels: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5
  };

  constructor(config?: { minLevel?: LogLevel; isJsonMode?: boolean }) {
    if (config?.minLevel) this.minLevel = config.minLevel;
    if (config?.isJsonMode !== undefined) this.isJsonMode = config.isJsonMode;
  }

  async initialize(): Promise<void> {
    this.currentStatus = 'ready';
  }

  async shutdown(): Promise<void> {
    this.currentStatus = 'uninitialized';
  }

  async health(): Promise<ServiceHealth> {
    return {
      status: 'healthy',
      details: { minLevel: this.minLevel, isJsonMode: this.isJsonMode },
      timestamp: new Date()
    };
  }

  status(): ServiceStatus {
    return this.currentStatus;
  }

  ready(): boolean {
    return this.currentStatus === 'ready';
  }

  public log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (this.levels[level] < this.levels[this.minLevel]) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(context ? { context } : {})
    };

    if (this.isJsonMode) {
      console.log(JSON.stringify(payload));
    } else {
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      console.log(`[${payload.timestamp}] [${payload.level}] ${message}${contextStr}`);
    }
  }

  public trace(message: string, context?: Record<string, any>): void {
    this.log('trace', message, context);
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, any>, cause?: Error): void {
    const errorContext = {
      ...context,
      ...(cause ? { error: { message: cause.message, stack: cause.stack } } : {})
    };
    this.log('error', message, errorContext);
  }

  public fatal(message: string, context?: Record<string, any>, cause?: Error): void {
    const errorContext = {
      ...context,
      ...(cause ? { error: { message: cause.message, stack: cause.stack } } : {})
    };
    this.log('fatal', message, errorContext);
  }
}

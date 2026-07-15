export abstract class AtlasError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(message: string, code: string, context?: Record<string, any>, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    
    if (cause) {
      this.cause = cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class DomainError extends AtlasError {
  constructor(message: string, code = 'DOMAIN_ERROR', context?: Record<string, any>, cause?: Error) {
    super(message, code, context, cause);
  }
}

export class ApplicationError extends AtlasError {
  constructor(message: string, code = 'APPLICATION_ERROR', context?: Record<string, any>, cause?: Error) {
    super(message, code, context, cause);
  }
}

export class InfrastructureError extends AtlasError {
  constructor(message: string, code = 'INFRASTRUCTURE_ERROR', context?: Record<string, any>, cause?: Error) {
    super(message, code, context, cause);
  }
}

export class ValidationError extends AtlasError {
  constructor(message: string, code = 'VALIDATION_ERROR', context?: Record<string, any>, cause?: Error) {
    super(message, code, context, cause);
  }
}

export class SecurityError extends AtlasError {
  constructor(message: string, code = 'SECURITY_ERROR', context?: Record<string, any>, cause?: Error) {
    super(message, code, context, cause);
  }
}

export class ProviderError extends AtlasError {
  constructor(message: string, code = 'PROVIDER_ERROR', context?: Record<string, any>, cause?: Error) {
    super(message, code, context, cause);
  }
}

export class WorkflowError extends AtlasError {
  constructor(message: string, code = 'WORKFLOW_ERROR', context?: Record<string, any>, cause?: Error) {
    super(message, code, context, cause);
  }
}

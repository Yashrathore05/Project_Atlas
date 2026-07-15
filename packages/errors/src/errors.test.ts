import { describe, it, expect } from 'vitest';
import { DomainError, ApplicationError, SecurityError, ValidationError } from './errors';

describe('Shared Error System', () => {
  it('should capture basic error details, name, and stack traces', () => {
    const error = new DomainError('Invalid state transition', 'INVALID_STATE');
    
    expect(error.message).toBe('Invalid state transition');
    expect(error.code).toBe('INVALID_STATE');
    expect(error.name).toBe('DomainError');
    expect(error.stack).toBeDefined();
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should store and retrieve optional context metadata', () => {
    const metadata = { entityId: 'agent-99', budget: 15.00 };
    const error = new ValidationError('Validation failed', 'VALIDATION_FAILED', metadata);

    expect(error.context).toEqual(metadata);
    expect(error.context!.entityId).toBe('agent-99');
  });

  it('should support error cause chaining', () => {
    const innerError = new Error('Database connection timeout');
    const appError = new ApplicationError('Failed to fetch project workspace data', 'DB_TIMEOUT', {}, innerError);

    expect(appError.cause).toBe(innerError);
    expect(appError.cause!.message).toBe('Database connection timeout');
  });
});

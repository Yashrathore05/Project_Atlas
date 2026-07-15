# @atlas/errors

Standardized error classification and error propagation module for Project Atlas.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/errors": "*"
}
```

## Usage

```typescript
import { ValidationError, SecurityError } from '@atlas/errors';

// With custom code and context metadata
throw new ValidationError(
  'Agent budget limit exceeded.', 
  'BUDGET_LIMIT_EXCEEDED', 
  { limit: 10.0, requestedSpend: 15.0 }
);

// Chaining errors
try {
  // some operation
} catch (error) {
  throw new SecurityError('Access denied.', 'UNAUTHORIZED_ACCESS', {}, error);
}
```

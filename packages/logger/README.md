# @atlas/logger

Console structured logger implementation for Project Atlas.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/logger": "*"
}
```

## Usage

```typescript
import { ConsoleLogger } from '@atlas/logger';

const logger = new ConsoleLogger({ minLevel: 'info', isJsonMode: true });
await logger.initialize();

logger.info('API Gateway started', { port: 8080 });
logger.error('Database connection lost', { db: 'sqlite' }, new Error('Timeout'));
```

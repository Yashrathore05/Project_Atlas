# @atlas/kernel

Application orchestrator core for Project Atlas, hosting Dependency Injection, Service Registry, Event Bus, and life-cycle handlers.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/kernel": "*"
}
```

## Usage

```typescript
import { Kernel } from '@atlas/kernel';
import { Configuration } from '@atlas/config';
import { ConsoleLogger } from '@atlas/logger';

// 1. Instantiate Kernel
const kernel = new Kernel();
const container = kernel.getContainer();
const registry = kernel.getServiceRegistry();

// 2. Register external services
const config = new Configuration();
const logger = new ConsoleLogger();

container.register('IConfiguration', config);
container.register('ILogger', logger);

registry.register('Config', config);
registry.register('Logger', logger);

// 3. Initialize all services
await kernel.initialize();

// 4. Retrieve event bus and publish events
const eventBus = container.resolve<IEventBus>('IEventBus');
```

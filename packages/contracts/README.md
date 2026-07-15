# @atlas/contracts

Decoupled service contract specifications for Project Atlas. 

## Design Rationale

All core services communicate via interfaces defined in this package. Concrete service implementations (e.g. `@atlas/logger`, `@atlas/metrics`, `@atlas/config`) must never directly reference other concrete implementations, adhering to the **Dependency Inversion Principle (DIP)**.

## Usage

```typescript
import { IAppService, ServiceHealth } from '@atlas/contracts';

export class DatabaseService implements IAppService {
  async initialize(): Promise<void> {
    // initialize db connection
  }
  
  async shutdown(): Promise<void> {
    // disconnect
  }

  async health(): Promise<ServiceHealth> {
    return { status: 'healthy', timestamp: new Date() };
  }

  status() {
    return 'ready' as const;
  }

  ready() {
    return true;
  }
}
```

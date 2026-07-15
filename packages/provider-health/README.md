# @atlas/provider-health

Model Provider Health tracking module for Project Atlas.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/provider-health": "*"
}
```

## Usage

```typescript
import { ProviderHealth } from '@atlas/provider-health';

const health = new ProviderHealth(eventBus);
await health.initialize();

// Record success requests
health.trackRequest('openai', 250, true);

// Record failures
health.trackRequest('anthropic', 0, false);

const stats = health.getProviderHealth('openai');
```

# @atlas/provider-registry

Model Provider Registry module for Project Atlas.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/provider-registry": "*"
}
```

## Usage

```typescript
import { ProviderRegistry } from '@atlas/provider-registry';
import { ProviderType } from '@atlas/domain';

const registry = new ProviderRegistry(eventBus);
await registry.initialize();

registry.registerProvider(
  {
    id: 'openai' as ProviderType,
    name: 'OpenAI',
    enabled: true,
    apiKey: 'sk-...'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    version: '1.0.0',
    enabled: true,
    capabilities: ['text', 'embeddings']
  }
);
```

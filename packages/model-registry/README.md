# @atlas/model-registry

Model Registry module for Project Atlas, managing pricing, limits, and capabilities.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/model-registry": "*"
}
```

## Usage

```typescript
import { ModelRegistry } from '@atlas/model-registry';

const registry = new ModelRegistry();
await registry.initialize();

// Get specific model configurations
const model = registry.getModel('openai', 'gpt-4o');

// Filter premium coding models
const codingModels = registry.listModels({ capability: 'coding', tags: ['premium'] });
```

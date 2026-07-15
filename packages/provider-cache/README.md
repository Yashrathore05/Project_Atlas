# @atlas/provider-cache

Response Caching module for Project Atlas, managing prompt hashes and TTL intervals.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/provider-cache": "*"
}
```

## Usage

```typescript
import { ProviderCache } from '@atlas/provider-cache';

const cache = new ProviderCache();
await cache.initialize();

const prompt = 'Compute 2+2';
const model = 'gpt-4o';

// Attempt lookup
const hit = await cache.get(prompt, model);

if (!hit) {
  // perform LLM call
  await cache.set(prompt, model, responseData, 600); // 10 minutes cache
}
```

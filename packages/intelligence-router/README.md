# @atlas/intelligence-router

Model Router Selector module for Project Atlas, matching intent statements to model specs.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/intelligence-router": "*"
}
```

## Usage

```typescript
import { IntelligenceRouter } from '@atlas/intelligence-router';

const router = new IntelligenceRouter(modelRegistry, healthTracker);
await router.initialize();

// Select optimal model for a code generation task
const coderModel = await router.selectModel('Implement a fast sorting routine in TypeScript');
```

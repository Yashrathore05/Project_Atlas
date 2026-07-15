# @atlas/metrics

InMemory metric logger and execution timer implementation for Project Atlas.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/metrics": "*"
}
```

## Usage

```typescript
import { InMemoryMetrics } from '@atlas/metrics';

const metrics = new InMemoryMetrics();
await metrics.initialize();

metrics.incrementCounter('agent_runs', 1, { agentId: 'bot-1' });
metrics.recordGauge('active_agents_count', 4);

const stopTimer = metrics.startTimer('llm_call_latency', { provider: 'openai' });
// perform call
stopTimer();
```

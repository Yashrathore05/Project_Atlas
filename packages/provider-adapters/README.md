# @atlas/provider-adapters

Model Provider Adapter implementations (OpenAI, Anthropic, Google, Groq, Ollama) for Project Atlas.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/provider-adapters": "*"
}
```

## Usage

```typescript
import { OpenaiAdapter, AnthropicAdapter } from '@atlas/provider-adapters';

const openai = new OpenaiAdapter();
const response = await openai.execute('Hi', { temperature: 0.7 });
```

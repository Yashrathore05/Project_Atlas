# @atlas/config

Configuration loader and overrides manager for Project Atlas.

## Installation

This package is automatically resolved in workspaces:
```json
"dependencies": {
  "@atlas/config": "*"
}
```

## Usage

```typescript
import { Configuration } from '@atlas/config';

const config = new Configuration();
await config.initialize();

// Get theme mode setting (supports environment variable override ATLAS_THEME_MODE)
const themeMode = config.get<string>('theme.mode'); 

// Fetch API credentials dynamically
const provider = config.getProviderConfig('openai');
```

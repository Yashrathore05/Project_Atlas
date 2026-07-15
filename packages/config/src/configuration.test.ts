import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Configuration } from './configuration';

describe('Configuration Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should initialize and fetch default settings', async () => {
    const config = new Configuration();
    await config.initialize();

    expect(config.get<string>('theme.mode')).toBe('dark');
    expect(config.get<boolean>('security.sandboxEnabled')).toBe(true);
    expect(config.get<number>('workspace.maxAgents')).toBe(50);
  });

  it('should override stored configuration using environment variables', () => {
    const config = new Configuration();
    
    // Set environment override
    process.env.ATLAS_THEME_MODE = 'light';
    process.env.ATLAS_SECURITY_SANDBOXENABLED = 'false';
    process.env.ATLAS_WORKSPACE_MAXAGENTS = '100';

    expect(config.get<string>('theme.mode')).toBe('light');
    expect(config.get<boolean>('security.sandboxEnabled')).toBe(false);
    expect(config.get<number>('workspace.maxAgents')).toBe(100);
  });

  it('should dynamically construct provider configurations using fallback environment variables', () => {
    const config = new Configuration();
    
    process.env.OPENAI_API_KEY = 'sk-env-openai';
    process.env.ATLAS_PROVIDER_OPENAI_DEFAULT_MODEL = 'gpt-4-turbo';

    const providerConfig = config.getProviderConfig('openai');
    expect(providerConfig).not.toBeNull();
    expect(providerConfig!.apiKey).toBe('sk-env-openai');
    expect(providerConfig!.defaultModel).toBe('gpt-4-turbo');
  });

  it('should throw error when requesting missing key without default value', () => {
    const config = new Configuration();
    expect(() => {
      config.get<string>('missing.key');
    }).toThrow('Configuration key "missing.key" not found and no default value was provided.');
  });
});

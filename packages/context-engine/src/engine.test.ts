import { describe, it, expect } from 'vitest';
import { ContextEngine } from './engine';

describe('Context Engine Package', () => {
  it('should successfully build and merge contexts across steps', () => {
    const engine = new ContextEngine();
    const shared = engine.createSharedContext();

    // Prior step finished
    shared.outputs['step_1'] = 'Created base project configuration';
    shared.files['package.json'] = '{"name": "atlas"}';
    shared.keyDecisions.push('Use Node.js LTS');

    const result = engine.mergeContext(
      'You are a developer assistant.',
      ['Past user query response cached'],
      shared,
      { 'index.ts': 'console.log("hello");' }
    );

    expect(result.promptText).toContain('You are a developer assistant.');
    expect(result.promptText).toContain('Created base project configuration');
    expect(result.promptText).toContain('package.json');
    expect(result.promptText).toContain('index.ts');
    expect(result.promptText).toContain('Use Node.js LTS');
    expect(result.tokenEstimate).toBeGreaterThan(0);
  });
});

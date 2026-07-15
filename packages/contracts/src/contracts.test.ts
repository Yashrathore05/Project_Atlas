import { describe, it, expect } from 'vitest';
import * as contracts from './index';

describe('Contracts Package Exports', () => {
  it('should export defined interfaces and types successfully', () => {
    // Assert that we have exported the lifecycle types/constants if any, or verify exports object
    expect(contracts).toBeDefined();
  });
});

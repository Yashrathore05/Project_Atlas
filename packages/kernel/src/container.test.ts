import { describe, it, expect } from 'vitest';
import { Container } from './container';

describe('Dependency Injection Container', () => {
  it('should register and resolve a static instance dependency', () => {
    const container = new Container();
    const serviceInstance = { name: 'LocalDBService' };
    
    container.register('Database', serviceInstance);
    
    expect(container.has('Database')).toBe(true);
    expect(container.resolve('Database')).toBe(serviceInstance);
  });

  it('should register and resolve a lazy factory dependency as a singleton cache', () => {
    const container = new Container();
    let callsCount = 0;
    
    container.registerFactory('ApiConfig', (c) => {
      callsCount++;
      return { endpoint: 'https://api.atlas.dev' };
    });
    
    expect(container.has('ApiConfig')).toBe(true);
    
    const firstCall = container.resolve<{ endpoint: string }>('ApiConfig');
    const secondCall = container.resolve<{ endpoint: string }>('ApiConfig');
    
    expect(firstCall.endpoint).toBe('https://api.atlas.dev');
    expect(firstCall).toBe(secondCall);
    expect(callsCount).toBe(1); // singleton cache verify
  });

  it('should throw error when registering duplicate dependency keys', () => {
    const container = new Container();
    container.register('Token', 'secret-val');
    
    expect(() => {
      container.register('Token', 'secret-val-two');
    }).toThrow('Dependency "Token" is already registered as an instance.');
  });

  it('should throw error when resolving non-existent dependency keys', () => {
    const container = new Container();
    expect(() => {
      container.resolve('NonExistent');
    }).toThrow('Dependency "NonExistent" could not be resolved from the container.');
  });
});

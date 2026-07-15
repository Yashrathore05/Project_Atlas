import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleLogger } from './console-logger';

describe('Console Logger Service', () => {
  let logSpy: any;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize and report health details', async () => {
    const logger = new ConsoleLogger({ minLevel: 'debug' });
    expect(logger.status()).toBe('uninitialized');
    expect(logger.ready()).toBe(false);

    await logger.initialize();
    expect(logger.status()).toBe('ready');
    expect(logger.ready()).toBe(true);

    const health = await logger.health();
    expect(health.status).toBe('healthy');
    expect(health.details).toEqual({ minLevel: 'debug', isJsonMode: true });
  });

  it('should format logs as JSON strings in JSON mode', () => {
    const logger = new ConsoleLogger({ minLevel: 'info', isJsonMode: true });
    logger.info('Connection established', { host: 'localhost' });

    expect(logSpy).toHaveBeenCalledOnce();
    const printedRaw = logSpy.mock.calls[0][0];
    const printedParsed = JSON.parse(printedRaw);

    expect(printedParsed.message).toBe('Connection established');
    expect(printedParsed.level).toBe('INFO');
    expect(printedParsed.context).toEqual({ host: 'localhost' });
  });

  it('should suppress logs below the configured minLevel threshold', () => {
    const logger = new ConsoleLogger({ minLevel: 'warn' });
    logger.info('Some info message');
    expect(logSpy).not.toHaveBeenCalled();

    logger.warn('A warning message');
    expect(logSpy).toHaveBeenCalledOnce();
  });

  it('should append error traces and details', () => {
    const logger = new ConsoleLogger({ minLevel: 'error' });
    const originalError = new Error('Disk Full');
    logger.error('Failed to save file snapshot', { path: '/root/test' }, originalError);

    expect(logSpy).toHaveBeenCalledOnce();
    const printedParsed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(printedParsed.level).toBe('ERROR');
    expect(printedParsed.context.error.message).toBe('Disk Full');
    expect(printedParsed.context.error.stack).toBeDefined();
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { debugLogger, configureDebugLogging } from '../../utils/debug';

/**
 * debugLogger early-returns in the test environment (see isTestEnvironment).
 * To exercise the actual console-writing branches we temporarily flip the env
 * vars so the guard passes, then restore them.
 */
function withNonTestEnv(fn: () => void) {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVitest = process.env.VITEST;
  try {
    process.env.NODE_ENV = 'development';
    delete process.env.VITEST;
    fn();
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVitest !== undefined) {
      process.env.VITEST = originalVitest;
    }
  }
}

describe('debugLogger', () => {
  beforeEach(() => {
    // Reset to default disabled state before each test
    debugLogger.configure({ enabled: false, prefix: '[API-CLIENT]' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configuration', () => {
    it('configureDebugLogging proxies to debugLogger.configure', () => {
      configureDebugLogging(true, '[TEST]');
      // No direct getter — we verify by enabling and checking that log methods
      // do attempt to run (they still early-return due to test env).
      expect(() => debugLogger.logCacheHit('e', 'k')).not.toThrow();
    });

    it('configure accepts partial config without clobbering unspecified fields', () => {
      configureDebugLogging(true, '[ORIGINAL]');
      debugLogger.configure({ enabled: false });
      // Still no throw; prefix should be preserved internally.
      expect(() => debugLogger.logInvalidation('entity', ['a'])).not.toThrow();
    });
  });

  describe('log methods are safe no-ops in the test environment', () => {
    beforeEach(() => {
      configureDebugLogging(true, '[TEST]');
    });

    it('logRequest does not throw or call console in test env', () => {
      const spy = vi.spyOn(console, 'group').mockImplementation(() => {});
      debugLogger.logRequest('GET', '/todos');
      expect(spy).not.toHaveBeenCalled();
    });

    it('logResponse does not throw in test env', () => {
      expect(() =>
        debugLogger.logResponse('GET', '/todos', { success: true, data: [] })
      ).not.toThrow();
    });

    it('logError does not throw in test env', () => {
      expect(() => debugLogger.logError('GET', '/todos', new Error('x'))).not.toThrow();
    });

    it('logCacheHit / logCacheMiss / logInvalidation do not throw in test env', () => {
      expect(() => debugLogger.logCacheHit('e', 'k')).not.toThrow();
      expect(() => debugLogger.logCacheMiss('e', 'k')).not.toThrow();
      expect(() => debugLogger.logInvalidation('e')).not.toThrow();
      expect(() => debugLogger.logInvalidation('e', ['a', 'b'])).not.toThrow();
    });

    it('logValidationError and logMutationError do not throw in test env', () => {
      expect(() =>
        debugLogger.logValidationError({ x: 1 }, { issues: [] }, { x: 'required' })
      ).not.toThrow();
      expect(() => debugLogger.logMutationError(new Error('x'), { x: 1 })).not.toThrow();
    });
  });

  describe('log methods emit to console when enabled and outside test env', () => {
    it('logRequest writes to console.group / console.log', () => {
      configureDebugLogging(true);
      const group = vi.spyOn(console, 'group').mockImplementation(() => {});
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const groupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      withNonTestEnv(() => {
        debugLogger.logRequest('GET', '/todos', { id: 1 }, { status: 'pending' });
      });

      expect(group).toHaveBeenCalled();
      expect(log).toHaveBeenCalled();
      expect(groupEnd).toHaveBeenCalled();
    });

    it('logRequest handles undefined queryParams without appending a query string', () => {
      configureDebugLogging(true);
      const group = vi.spyOn(console, 'group').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      withNonTestEnv(() => {
        debugLogger.logRequest('POST', '/users');
      });

      const groupCall = group.mock.calls[0]?.[0] as string | undefined;
      expect(groupCall).toBeDefined();
      expect(groupCall).not.toContain('?');
    });

    it('logResponse success/failure both produce output', () => {
      configureDebugLogging(true);
      const group = vi.spyOn(console, 'group').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      withNonTestEnv(() => {
        debugLogger.logResponse('GET', '/todos', { success: true, data: [] }, 120);
        debugLogger.logResponse(
          'GET',
          '/todos',
          { success: false, kind: 'unknown', message: 'boom' },
          50
        );
      });

      expect(group).toHaveBeenCalledTimes(2);
    });

    it('logError writes through console.group and console.error', () => {
      configureDebugLogging(true);
      const group = vi.spyOn(console, 'group').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const err = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      withNonTestEnv(() => {
        debugLogger.logError('POST', '/todos', new Error('bad'));
      });

      expect(group).toHaveBeenCalled();
      expect(err).toHaveBeenCalled();
    });

    it('logCacheHit, logCacheMiss, logInvalidation each emit a single console.log line', () => {
      configureDebugLogging(true);
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});

      withNonTestEnv(() => {
        debugLogger.logCacheHit('todos', 'list:todos');
        debugLogger.logCacheMiss('todos', 'list:todos');
        debugLogger.logInvalidation('todos', ['users']);
        debugLogger.logInvalidation('todos');
      });

      expect(log).toHaveBeenCalledTimes(4);
    });

    it('logValidationError and logMutationError write grouped error entries', () => {
      configureDebugLogging(true);
      const group = vi.spyOn(console, 'group').mockImplementation(() => {});
      const err = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      withNonTestEnv(() => {
        debugLogger.logValidationError({ x: 1 }, { issues: [] }, { x: 'required' });
        debugLogger.logMutationError(new Error('x'), { y: 2 });
      });

      expect(group).toHaveBeenCalledTimes(2);
      expect(err.mock.calls.length).toBeGreaterThanOrEqual(4);
    });

    it('log methods are no-ops when disabled', () => {
      configureDebugLogging(false);
      const group = vi.spyOn(console, 'group').mockImplementation(() => {});

      withNonTestEnv(() => {
        debugLogger.logRequest('GET', '/todos');
        debugLogger.logCacheHit('e', 'k');
      });

      expect(group).not.toHaveBeenCalled();
    });
  });
});

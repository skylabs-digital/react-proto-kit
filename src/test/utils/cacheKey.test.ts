import { describe, it, expect } from 'vitest';
import { listCacheKey, byIdCacheKey, recordCacheKey } from '../../utils/cacheKey';

describe('cacheKey', () => {
  describe('listCacheKey', () => {
    it('returns the endpoint prefixed with "list:" when no params are provided', () => {
      expect(listCacheKey('todos')).toBe('list:todos');
    });

    it('includes serialized params when present', () => {
      const key = listCacheKey('todos', { page: 1, limit: 10 });
      expect(key).toContain('list:todos');
      expect(key).toContain('"page":1');
      expect(key).toContain('"limit":10');
    });

    it('is stable regardless of property order in params', () => {
      const a = listCacheKey('todos', { limit: 10, page: 1 });
      const b = listCacheKey('todos', { page: 1, limit: 10 });
      expect(a).toBe(b);
    });

    it('is stable regardless of property order in queryParams', () => {
      const a = listCacheKey('todos', undefined, { tenantId: 't1', version: 'v1' });
      const b = listCacheKey('todos', undefined, { version: 'v1', tenantId: 't1' });
      expect(a).toBe(b);
    });

    it('produces different keys for different endpoints', () => {
      expect(listCacheKey('todos')).not.toBe(listCacheKey('users'));
    });

    it('produces different keys for different params on the same endpoint', () => {
      const a = listCacheKey('todos', { page: 1 });
      const b = listCacheKey('todos', { page: 2 });
      expect(a).not.toBe(b);
    });

    it('ignores undefined-valued fields so they do not create false differences', () => {
      const a = listCacheKey('todos', { page: 1, filter: undefined });
      const b = listCacheKey('todos', { page: 1 });
      expect(a).toBe(b);
    });

    it('does not collide across endpoints that share a prefix', () => {
      const a = listCacheKey('todo');
      const b = listCacheKey('todos');
      expect(a).not.toBe(b);
    });

    it('recurses into nested objects and arrays deterministically', () => {
      const a = listCacheKey('todos', { filter: { completed: true, priority: [1, 2, 3] } });
      const b = listCacheKey('todos', { filter: { priority: [1, 2, 3], completed: true } });
      expect(a).toBe(b);
    });

    it('distinguishes array order because arrays are ordered data', () => {
      const a = listCacheKey('todos', { priority: [1, 2, 3] });
      const b = listCacheKey('todos', { priority: [3, 2, 1] });
      expect(a).not.toBe(b);
    });
  });

  describe('byIdCacheKey', () => {
    it('returns the endpoint as-is', () => {
      expect(byIdCacheKey('users/42')).toBe('users/42');
    });

    it('does not add any prefix', () => {
      expect(byIdCacheKey('todos/abc')).not.toMatch(/^list:/);
    });
  });

  describe('recordCacheKey', () => {
    it('returns the endpoint when no queryParams are provided', () => {
      expect(recordCacheKey('settings')).toBe('settings');
    });

    it('appends stable serialized queryParams when present', () => {
      const key = recordCacheKey('settings', { tenantId: 't1' });
      expect(key).toBe('settings:{"tenantId":"t1"}');
    });

    it('is stable regardless of property order in queryParams', () => {
      const a = recordCacheKey('settings', { a: 1, b: 2 });
      const b = recordCacheKey('settings', { b: 2, a: 1 });
      expect(a).toBe(b);
    });

    it('produces different keys for different queryParams on the same endpoint', () => {
      const a = recordCacheKey('settings', { tenantId: 't1' });
      const b = recordCacheKey('settings', { tenantId: 't2' });
      expect(a).not.toBe(b);
    });

    it('does not collide with listCacheKey for the same endpoint', () => {
      expect(recordCacheKey('todos')).not.toBe(listCacheKey('todos'));
    });
  });
});

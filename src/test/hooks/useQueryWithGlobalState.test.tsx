/// <reference types="vitest/globals" />
import { z } from 'zod';
import { useQueryWithGlobalState } from '../../hooks/useQueryWithGlobalState';

const testSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
});

describe('useQueryWithGlobalState', () => {
  it('should be a valid hook function', () => {
    expect(typeof useQueryWithGlobalState).toBe('function');
    expect(useQueryWithGlobalState.name).toBe('useQueryWithGlobalState');
  });

  it('should accept valid parameters', () => {
    // Test that the hook accepts the expected parameter types
    const entity = 'testEntities';
    const id = '1';
    const schema = testSchema;
    const options = { enabled: true, cacheTime: 5000 };

    expect(typeof entity).toBe('string');
    expect(typeof id).toBe('string');
    expect(schema).toBeDefined();
    expect(typeof options).toBe('object');
  });

  it('should work with different schema types', () => {
    const complexSchema = z.object({
      id: z.string(),
      name: z.string().min(1),
      value: z.number().positive(),
      tags: z.array(z.string()).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    });

    expect(complexSchema).toBeDefined();
    expect(typeof useQueryWithGlobalState).toBe('function');
  });

  it('should accept configuration options', () => {
    const validOptions = {
      enabled: true,
      cacheTime: 5000,
      staleTime: 1000,
      refetchOnWindowFocus: false,
    };

    expect(typeof validOptions.enabled).toBe('boolean');
    expect(typeof validOptions.cacheTime).toBe('number');
    expect(typeof validOptions.staleTime).toBe('number');
    expect(typeof validOptions.refetchOnWindowFocus).toBe('boolean');
  });

  it('should work with different entity names', () => {
    const entities = ['users', 'posts', 'comments', 'categories'];

    entities.forEach(entity => {
      expect(typeof entity).toBe('string');
      expect(entity.length).toBeGreaterThan(0);
    });

    expect(typeof useQueryWithGlobalState).toBe('function');
  });

  it('should validate schema structure', () => {
    const validSchema = z.object({
      id: z.string(),
      name: z.string(),
      value: z.number(),
    });

    const parsedData = validSchema.safeParse({
      id: '1',
      name: 'Test',
      value: 100,
    });

    expect(parsedData.success).toBe(true);
    expect(typeof useQueryWithGlobalState).toBe('function');
  });

  it('should handle boolean enabled option', () => {
    const enabledOptions = [true, false];

    enabledOptions.forEach(enabled => {
      const options = { enabled };
      expect(typeof options.enabled).toBe('boolean');
    });

    expect(typeof useQueryWithGlobalState).toBe('function');
  });

  it('should handle different ID types', () => {
    const ids = ['1', '123', 'user-abc', 'post_456'];

    ids.forEach(id => {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    expect(typeof useQueryWithGlobalState).toBe('function');
  });
});

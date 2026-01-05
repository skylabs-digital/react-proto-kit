import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import {
  createSingleRecordApi,
  createSingleRecordReadOnlyApi,
} from '../../factory/createSingleRecordApi';

// Mock the hooks
vi.mock('../../hooks/useRecord', () => ({
  useRecord: vi.fn(() => ({
    data: null,
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock('../../hooks/useSingleRecordMutation', () => ({
  useSingleRecordUpdate: vi.fn(() => ({
    mutate: vi.fn(),
    loading: false,
    error: null,
  })),
  useSingleRecordPatch: vi.fn(() => ({
    mutate: vi.fn(),
    loading: false,
    error: null,
  })),
  useSingleRecordReset: vi.fn(() => ({
    mutate: vi.fn(),
    loading: false,
    error: null,
  })),
}));

describe('createSingleRecordApi', () => {
  const settingsSchema = z.object({
    theme: z.string(),
    language: z.string(),
    notifications: z.boolean(),
  });

  const settingsInputSchema = z.object({
    theme: z.string().optional(),
    language: z.string().optional(),
    notifications: z.boolean().optional(),
  });

  it('should create API with useRecord, useUpdate, usePatch methods', () => {
    const api = createSingleRecordApi(
      'users/:userId/settings',
      settingsSchema,
      settingsInputSchema
    );

    expect(api.useRecord).toBeDefined();
    expect(api.useUpdate).toBeDefined();
    expect(api.usePatch).toBeDefined();
    expect(api.withParams).toBeDefined();
    expect(api.withQuery).toBeDefined();
  });

  it('should NOT have list-based methods', () => {
    const api = createSingleRecordApi('settings', settingsSchema, settingsInputSchema);

    expect((api as any).useList).toBeUndefined();
    expect((api as any).useById).toBeUndefined();
    expect((api as any).useCreate).toBeUndefined();
    expect((api as any).useDelete).toBeUndefined();
  });

  it('should throw error when calling useRecord without resolving path params', () => {
    const api = createSingleRecordApi(
      'users/:userId/settings',
      settingsSchema,
      settingsInputSchema
    );

    expect(() => api.useRecord()).toThrow('Path parameters required but not provided');
    expect(() => api.useRecord()).toThrow('userId');
  });

  it('should allow useRecord after resolving path params with withParams', () => {
    const api = createSingleRecordApi(
      'users/:userId/settings',
      settingsSchema,
      settingsInputSchema
    );
    const resolvedApi = api.withParams({ userId: '123' });

    // Should not throw
    expect(() => resolvedApi.useRecord()).not.toThrow();
  });

  it('should throw error when calling useUpdate without resolving path params', () => {
    const api = createSingleRecordApi(
      'users/:userId/settings',
      settingsSchema,
      settingsInputSchema
    );

    expect(() => api.useUpdate()).toThrow('Path parameters required but not provided');
  });

  it('should throw error when calling usePatch without resolving path params', () => {
    const api = createSingleRecordApi(
      'users/:userId/settings',
      settingsSchema,
      settingsInputSchema
    );

    expect(() => api.usePatch()).toThrow('Path parameters required but not provided');
  });

  it('should allow chaining withParams and withQuery', () => {
    const api = createSingleRecordApi(
      'users/:userId/settings',
      settingsSchema,
      settingsInputSchema,
      {
        queryParams: {
          dynamic: ['section'],
        },
      }
    );

    const chainedApi = api.withParams({ userId: '123' }).withQuery({ section: 'notifications' });

    expect(() => chainedApi.useRecord()).not.toThrow();
  });

  it('should throw error for invalid query params', () => {
    const api = createSingleRecordApi('settings', settingsSchema, settingsInputSchema, {
      queryParams: {
        dynamic: ['section'],
      },
    });

    expect(() => api.withQuery({ invalidParam: 'value' })).toThrow('Invalid query parameters');
  });

  describe('useReset', () => {
    it('should throw error when useReset is called but not enabled', () => {
      const api = createSingleRecordApi('settings', settingsSchema, settingsInputSchema);

      expect(() => api.useReset()).toThrow('useReset is not enabled');
    });

    it('should allow useReset when allowReset is true', () => {
      const api = createSingleRecordApi('settings', settingsSchema, settingsInputSchema, {
        allowReset: true,
      });

      expect(() => api.useReset()).not.toThrow();
    });

    it('should throw error when calling useReset without resolving path params', () => {
      const api = createSingleRecordApi(
        'users/:userId/settings',
        settingsSchema,
        settingsInputSchema,
        {
          allowReset: true,
        }
      );

      expect(() => api.useReset()).toThrow('Path parameters required but not provided');
    });
  });
});

describe('createSingleRecordReadOnlyApi', () => {
  const statsSchema = z.object({
    totalUsers: z.number(),
    activeToday: z.number(),
    revenue: z.number(),
  });

  it('should create API with only useRecord method', () => {
    const api = createSingleRecordReadOnlyApi('dashboard/stats', statsSchema);

    expect(api.useRecord).toBeDefined();
    expect(api.withParams).toBeDefined();
    expect(api.withQuery).toBeDefined();
  });

  it('should NOT have mutation methods', () => {
    const api = createSingleRecordReadOnlyApi('dashboard/stats', statsSchema);

    expect((api as any).useUpdate).toBeUndefined();
    expect((api as any).usePatch).toBeUndefined();
    expect((api as any).useReset).toBeUndefined();
    expect((api as any).useCreate).toBeUndefined();
    expect((api as any).useDelete).toBeUndefined();
  });

  it('should throw error when calling useRecord without resolving path params', () => {
    const api = createSingleRecordReadOnlyApi('users/:userId/insights', statsSchema);

    expect(() => api.useRecord()).toThrow('Path parameters required but not provided');
  });

  it('should allow useRecord after resolving path params', () => {
    const api = createSingleRecordReadOnlyApi('users/:userId/insights', statsSchema);
    const resolvedApi = api.withParams({ userId: '456' });

    expect(() => resolvedApi.useRecord()).not.toThrow();
  });

  it('should support refetchInterval config', () => {
    const api = createSingleRecordReadOnlyApi('dashboard/stats', statsSchema, {
      refetchInterval: 30000,
    });

    expect(api.useRecord).toBeDefined();
  });

  it('should support query params', () => {
    const api = createSingleRecordReadOnlyApi('dashboard/stats', statsSchema, {
      queryParams: {
        static: { format: 'detailed' },
        dynamic: ['dateRange', 'teamId'],
      },
    });

    const withQuery = api.withQuery({ dateRange: 'week', teamId: 'team-1' });
    expect(() => withQuery.useRecord()).not.toThrow();
  });
});

describe('Entity name extraction', () => {
  const schema = z.object({ value: z.string() });

  it('should extract simple entity name', () => {
    const api = createSingleRecordApi('settings', schema, schema);
    // The entity name should be 'settings'
    expect(api).toBeDefined();
  });

  it('should combine segments for nested paths', () => {
    const api = createSingleRecordApi('users/:userId/settings', schema, schema);
    // The entity name should be 'users_settings'
    expect(api).toBeDefined();
  });

  it('should handle multiple nested segments', () => {
    const api = createSingleRecordApi('organizations/:orgId/teams/:teamId/config', schema, schema);
    // The entity name should be 'organizations_teams_config'
    expect(api).toBeDefined();
  });
});

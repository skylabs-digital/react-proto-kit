import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { z } from 'zod';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { createDomainApi } from '../../factory/createDomainApi';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { GlobalStateProvider } from '../../context/GlobalStateProvider';
import { ApiResponse } from '../../types';
import { installInMemoryLocalStorage } from '../utils/localStoragePolyfill';

const todoSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean(),
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ApiClientProvider connectorType="localStorage" config={{ simulateDelay: 0, errorRate: 0 }}>
    <GlobalStateProvider>{children}</GlobalStateProvider>
  </ApiClientProvider>
);

describe('mutation return contract', () => {
  let todosApi: ReturnType<typeof createDomainApi<typeof todoSchema, typeof todoSchema>>;
  let uninstallLocalStorage: () => void;

  beforeAll(() => {
    uninstallLocalStorage = installInMemoryLocalStorage();
  });

  afterAll(() => {
    uninstallLocalStorage();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    // Pass the schema twice so upsertSchema is active (3-arg form triggers validation in mutations)
    todosApi = createDomainApi('todos', todoSchema, todoSchema);
  });

  describe('useCreate', () => {
    it('returns a SuccessResponse with the created entity', async () => {
      const { result } = renderHook(() => todosApi.useCreate(), { wrapper });

      let response: ApiResponse<any> | undefined;
      await act(async () => {
        response = await result.current.mutate({ title: 'First', completed: false });
      });

      expect(response).toBeDefined();
      expect(response!.success).toBe(true);
      if (!response!.success) throw new Error('expected success');
      expect(response!.data).toMatchObject({ title: 'First', completed: false });
      expect((response!.data as { id: string }).id).toBeTruthy();
      expect(result.current.error).toBeNull();
    });

    it('returns an ErrorResponse on validation failure and does not throw', async () => {
      const { result } = renderHook(() => todosApi.useCreate(), { wrapper });

      let didThrow = false;
      let response: ApiResponse<any> | undefined;
      await act(async () => {
        try {
          // Empty title violates z.string().min(1)
          response = await result.current.mutate({ title: '', completed: false });
        } catch {
          didThrow = true;
        }
      });

      expect(didThrow).toBe(false);
      expect(response).toBeDefined();
      expect(response!.success).toBe(false);
      if (response!.success) throw new Error('expected error');
      expect(response!.kind).toBe('validation');
      if (response!.kind === 'validation') {
        expect(response!.fields).toBeDefined();
      }
      expect(result.current.error).not.toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('useUpdate', () => {
    it('returns a SuccessResponse with the updated entity', async () => {
      const { result: createResult } = renderHook(() => todosApi.useCreate(), { wrapper });
      let created: ApiResponse<any> | undefined;
      await act(async () => {
        created = await createResult.current.mutate({ title: 'Original', completed: false });
      });
      if (!created!.success) throw new Error('setup failed');
      const id = (created!.data as { id: string }).id;

      const { result: updateResult } = renderHook(() => todosApi.useUpdate(), { wrapper });
      let response: ApiResponse<any> | undefined;
      await act(async () => {
        response = await updateResult.current.mutate(id, { title: 'Updated', completed: true });
      });

      expect(response).toBeDefined();
      expect(response!.success).toBe(true);
      if (!response!.success) throw new Error('expected success');
      expect(response!.data).toMatchObject({ title: 'Updated', completed: true });
      expect(updateResult.current.error).toBeNull();
    });

    it('returns an ErrorResponse when the entity does not exist and does not throw', async () => {
      const { result } = renderHook(() => todosApi.useUpdate(), { wrapper });

      let didThrow = false;
      let response: ApiResponse<any> | undefined;
      await act(async () => {
        try {
          response = await result.current.mutate('nonexistent-id', {
            title: 'x',
            completed: false,
          });
        } catch {
          didThrow = true;
        }
      });

      expect(didThrow).toBe(false);
      expect(response).toBeDefined();
      expect(response!.success).toBe(false);
      expect(result.current.error).not.toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('usePatch', () => {
    it('returns a SuccessResponse with merged fields', async () => {
      const { result: createResult } = renderHook(() => todosApi.useCreate(), { wrapper });
      let created: ApiResponse<any> | undefined;
      await act(async () => {
        created = await createResult.current.mutate({ title: 'Original', completed: false });
      });
      if (!created!.success) throw new Error('setup failed');
      const id = (created!.data as { id: string }).id;

      const { result: patchResult } = renderHook(() => todosApi.usePatch(), { wrapper });
      let response: ApiResponse<any> | undefined;
      await act(async () => {
        response = await patchResult.current.mutate(id, { completed: true });
      });

      expect(response!.success).toBe(true);
      if (!response!.success) throw new Error('expected success');
      expect(response!.data).toMatchObject({ title: 'Original', completed: true });
    });
  });

  describe('useDelete', () => {
    it('returns a SuccessResponse when deleting an existing entity', async () => {
      const { result: createResult } = renderHook(() => todosApi.useCreate(), { wrapper });
      let created: ApiResponse<any> | undefined;
      await act(async () => {
        created = await createResult.current.mutate({ title: 'Delete me', completed: false });
      });
      if (!created!.success) throw new Error('setup failed');
      const id = (created!.data as { id: string }).id;

      const { result: deleteResult } = renderHook(() => todosApi.useDelete(), { wrapper });
      let response: ApiResponse<any> | undefined;
      await act(async () => {
        response = await deleteResult.current.mutate(id);
      });

      expect(response).toBeDefined();
      expect(response!.success).toBe(true);
      expect(deleteResult.current.error).toBeNull();
    });

    it('returns an ErrorResponse for a nonexistent id and does not throw', async () => {
      const { result } = renderHook(() => todosApi.useDelete(), { wrapper });

      let didThrow = false;
      let response: ApiResponse<any> | undefined;
      await act(async () => {
        try {
          response = await result.current.mutate('nonexistent-id');
        } catch {
          didThrow = true;
        }
      });

      expect(didThrow).toBe(false);
      expect(response).toBeDefined();
      expect(response!.success).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('validation error shapes', () => {
    it('exposes nested field paths in ErrorResponse.fields', async () => {
      const nestedSchema = z.object({
        title: z.string().min(1),
        author: z.object({
          name: z.string().min(1),
          email: z.string().email(),
        }),
      });

      const postsApi = createDomainApi('posts-nested', nestedSchema, nestedSchema);
      const { result } = renderHook(() => postsApi.useCreate(), { wrapper });

      let response: ApiResponse<any> | undefined;
      await act(async () => {
        response = await result.current.mutate({
          title: 'ok',
          author: { name: '', email: 'not-an-email' },
        });
      });

      expect(response!.success).toBe(false);
      if (response!.success) throw new Error('expected error');
      expect(response!.kind).toBe('validation');
      if (response!.kind !== 'validation') throw new Error('expected validation');
      expect(response!.fields).toBeDefined();
      // Flat dot-path keys
      expect(response!.fields['author.name']).toBeTruthy();
      expect(response!.fields['author.email']).toBeTruthy();
    });

    it('reports multiple top-level field errors in a single ErrorResponse', async () => {
      const multiFieldSchema = z.object({
        title: z.string().min(3),
        completed: z.boolean(),
        priority: z.number().min(1).max(5),
      });

      const api = createDomainApi('todos-multi', multiFieldSchema, multiFieldSchema);
      const { result } = renderHook(() => api.useCreate(), { wrapper });

      let response: ApiResponse<any> | undefined;
      await act(async () => {
        response = await result.current.mutate({
          title: 'ab',
          completed: true,
          priority: 99,
        } as any);
      });

      expect(response!.success).toBe(false);
      if (response!.success) throw new Error('expected error');
      expect(response!.kind).toBe('validation');
      if (response!.kind !== 'validation') throw new Error('expected validation');
      expect(response!.fields).toMatchObject({
        title: expect.any(String),
        priority: expect.any(String),
      });
    });

    it('useUpdate returns validation errors with the same discriminated shape', async () => {
      const { result: createResult } = renderHook(() => todosApi.useCreate(), { wrapper });
      let created: ApiResponse<any> | undefined;
      await act(async () => {
        created = await createResult.current.mutate({ title: 'ok', completed: false });
      });
      if (!created!.success) throw new Error('setup failed');
      const id = (created!.data as { id: string }).id;

      const { result } = renderHook(() => todosApi.useUpdate(), { wrapper });

      let response: ApiResponse<any> | undefined;
      await act(async () => {
        response = await result.current.mutate(id, { title: '', completed: false });
      });

      expect(response!.success).toBe(false);
      if (response!.success) throw new Error('expected error');
      expect(response!.kind).toBe('validation');
    });
  });

  describe('concurrent mutations on the same entity', () => {
    it('awaits two concurrent useCreate calls without throwing, each returning a discriminated response', async () => {
      const { result } = renderHook(() => todosApi.useCreate(), { wrapper });

      let responses: Array<ApiResponse<any>> = [];
      await act(async () => {
        const [r1, r2] = await Promise.all([
          result.current.mutate({ title: 'first', completed: false }),
          result.current.mutate({ title: 'second', completed: true }),
        ]);
        responses = [r1, r2];
      });

      expect(responses).toHaveLength(2);
      for (const res of responses) {
        expect(res).toBeDefined();
        expect(typeof res.success).toBe('boolean');
      }
      expect(responses.every(r => r.success)).toBe(true);
    });

    it('concurrent updates to the same id both resolve to discriminated responses without throwing', async () => {
      const { result: createResult } = renderHook(() => todosApi.useCreate(), { wrapper });
      let created: ApiResponse<any> | undefined;
      await act(async () => {
        created = await createResult.current.mutate({ title: 'original', completed: false });
      });
      if (!created!.success) throw new Error('setup failed');
      const id = (created!.data as { id: string }).id;

      const { result } = renderHook(() => todosApi.useUpdate(), { wrapper });

      let responses: Array<ApiResponse<any>> = [];
      let didThrow = false;
      await act(async () => {
        try {
          const [r1, r2] = await Promise.all([
            result.current.mutate(id, { title: 'A', completed: false }),
            result.current.mutate(id, { title: 'B', completed: true }),
          ]);
          responses = [r1, r2];
        } catch {
          didThrow = true;
        }
      });

      expect(didThrow).toBe(false);
      expect(responses).toHaveLength(2);
      for (const res of responses) {
        expect(typeof res.success).toBe('boolean');
      }
      // At least one should succeed; if both succeed, that's also valid
      expect(responses.filter(r => r.success).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('connector failure never throws', () => {
    function createFailingConnectorWrapper(errorMessage: string) {
      const failingConnector = {
        get: vi.fn().mockResolvedValue({ success: true, data: [] }),
        post: vi.fn().mockRejectedValue(new Error(errorMessage)),
        put: vi.fn().mockRejectedValue(new Error(errorMessage)),
        patch: vi.fn().mockRejectedValue(new Error(errorMessage)),
        delete: vi.fn().mockRejectedValue(new Error(errorMessage)),
      };
      return ({ children }: { children: React.ReactNode }) => (
        <ApiClientProvider connector={failingConnector as any}>
          <GlobalStateProvider>{children}</GlobalStateProvider>
        </ApiClientProvider>
      );
    }

    it('useCreate returns an unknown-kind ErrorResponse when the connector rejects', async () => {
      const failingWrapper = createFailingConnectorWrapper('network down');
      const api = createDomainApi('net-fail-create', todoSchema, todoSchema);
      const { result } = renderHook(() => api.useCreate(), { wrapper: failingWrapper });

      let didThrow = false;
      let response: ApiResponse<any> | undefined;
      await act(async () => {
        try {
          response = await result.current.mutate({ title: 'x', completed: false });
        } catch {
          didThrow = true;
        }
      });

      expect(didThrow).toBe(false);
      expect(response).toBeDefined();
      expect(response!.success).toBe(false);
      if (response!.success) throw new Error('expected error');
      expect(response!.kind).toBe('unknown');
      expect(response!.message).toContain('network down');
      expect(result.current.loading).toBe(false);
    });

    it('useUpdate returns an unknown-kind ErrorResponse when the connector rejects', async () => {
      const failingWrapper = createFailingConnectorWrapper('connection refused');
      const api = createDomainApi('net-fail-update', todoSchema, todoSchema);
      const { result } = renderHook(() => api.useUpdate(), { wrapper: failingWrapper });

      let response: ApiResponse<any> | undefined;
      await act(async () => {
        response = await result.current.mutate('any-id', { title: 'x', completed: false });
      });

      expect(response!.success).toBe(false);
      if (response!.success) throw new Error('expected error');
      expect(response!.kind).toBe('unknown');
    });

    it('useDelete returns an unknown-kind ErrorResponse when the connector rejects', async () => {
      const failingWrapper = createFailingConnectorWrapper('boom');
      const api = createDomainApi('net-fail-delete', todoSchema, todoSchema);
      const { result } = renderHook(() => api.useDelete(), { wrapper: failingWrapper });

      let response: ApiResponse<any> | undefined;
      await act(async () => {
        response = await result.current.mutate('any-id');
      });

      expect(response!.success).toBe(false);
      if (response!.success) throw new Error('expected error');
      expect(response!.kind).toBe('unknown');
    });

    it('preserves the loading=false state after a connector failure so consumers can retry', async () => {
      const failingWrapper = createFailingConnectorWrapper('transient');
      const api = createDomainApi('net-fail-retry', todoSchema, todoSchema);
      const { result } = renderHook(() => api.useCreate(), { wrapper: failingWrapper });

      await act(async () => {
        await result.current.mutate({ title: 'x', completed: false });
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });
  });
});

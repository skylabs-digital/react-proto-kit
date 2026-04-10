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
      expect(response!.error?.code).toBe('VALIDATION_ERROR');
      expect(response!.type).toBe('VALIDATION');
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
});

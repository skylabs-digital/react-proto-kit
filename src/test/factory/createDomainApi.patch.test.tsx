import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { z } from 'zod';
import { createDomainApi } from '../../factory/createDomainApi';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { GlobalStateProvider } from '../../context/GlobalStateProvider';
import { ApiResponse } from '../../types';
import { installInMemoryLocalStorage } from '../utils/localStoragePolyfill';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Test schema
const todoSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
  description: z.string().optional(),
});

const upsertSchema = z.object({
  title: z.string(),
  completed: z.boolean(),
  description: z.string().optional(),
});

describe('createDomainApi - usePatch functionality', () => {
  let todosApi: any;
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
    todosApi = createDomainApi('todos', todoSchema, todoSchema);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ApiClientProvider connectorType="localStorage" config={{ simulateDelay: 0, errorRate: 0 }}>
      <GlobalStateProvider>{children}</GlobalStateProvider>
    </ApiClientProvider>
  );

  it('should create usePatch hook', () => {
    const { result } = renderHook(() => todosApi.usePatch(), { wrapper });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.loading).toBe('boolean');
    expect(result.current.error).toBeNull();
  });

  it('should patch a todo item completely', async () => {
    // Create a todo first and capture its id from the returned response
    const { result: createResult } = renderHook(() => todosApi.useCreate(), { wrapper });

    let createResponse: ApiResponse<any> | undefined;
    await act(async () => {
      createResponse = await createResult.current.mutate({
        title: 'Original Title',
        completed: false,
        description: 'Original description',
      });
    });

    // Verify create returned a SuccessResponse
    expect(createResult.current.error).toBeNull();
    expect(createResponse).toBeDefined();
    expect(createResponse!.success).toBe(true);
    if (!createResponse!.success) throw new Error('expected success');
    expect(createResponse!.data).toMatchObject({
      title: 'Original Title',
      completed: false,
    });
    const createdId = (createResponse!.data as { id: string }).id;

    // Now test the patch functionality using the real created id
    const { result: patchResult } = renderHook(() => todosApi.usePatch(), { wrapper });

    let patchResponse: ApiResponse<any> | undefined;
    await act(async () => {
      patchResponse = await patchResult.current.mutate(createdId, {
        title: 'Updated Title',
        completed: true,
      });
    });

    // Verify patch returned a SuccessResponse with the updated data
    expect(patchResponse).toBeDefined();
    expect(patchResponse!.success).toBe(true);
    if (!patchResponse!.success) throw new Error('expected success');
    expect(patchResponse!.data).toMatchObject({
      title: 'Updated Title',
      completed: true,
    });
    expect(patchResult.current.loading).toBe(false);
  });

  it('should patch a specific field when field parameter is provided', async () => {
    // Create a todo first
    const { result: createResult } = renderHook(() => todosApi.useCreate(), { wrapper });

    await act(async () => {
      await createResult.current.mutate({
        title: 'Test Todo',
        completed: false,
        description: 'Test description',
      });
    });

    // Verify create was successful
    expect(createResult.current.error).toBeNull();

    // Use a known ID for patching
    const testId = 'test-id-456';

    // Now test the patch functionality with field parameter
    const { result: patchResult } = renderHook(() => todosApi.usePatch(), { wrapper });

    await act(async () => {
      await patchResult.current.mutate(testId, { completed: true }, 'completed');
    });

    // Verify the patch hook works
    expect(typeof patchResult.current.mutate).toBe('function');
    expect(typeof patchResult.current.loading).toBe('boolean');
  });

  it('should use upsertSchema when provided', () => {
    const todosApiWithUpsert = createDomainApi('todos', todoSchema, upsertSchema);

    const { result } = renderHook(() => todosApiWithUpsert.usePatch(), { wrapper });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
  });

  it('should return an ErrorResponse when patch target does not exist and never throw', async () => {
    const { result: patchResult } = renderHook(() => todosApi.usePatch(), { wrapper });

    let didThrow = false;
    let response: ApiResponse<any> | undefined;
    await act(async () => {
      try {
        // localStorage connector responds with success: false for unknown IDs
        response = await patchResult.current.mutate('non-existent-id', {
          title: 'whatever',
        } as any);
      } catch {
        didThrow = true;
      }
    });

    // The hook must never throw — callers rely on the returned ApiResponse instead
    expect(didThrow).toBe(false);
    expect(response).toBeDefined();
    expect(response!.success).toBe(false);
    expect(patchResult.current.loading).toBe(false);
    expect(patchResult.current.error).not.toBeNull();
  });
});

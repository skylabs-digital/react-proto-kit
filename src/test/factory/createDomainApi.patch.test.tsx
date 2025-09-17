import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { createDomainApi } from '../../factory/createDomainApi';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { GlobalStateProvider } from '../../context/GlobalStateProvider';
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

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    todosApi = createDomainApi('todos', todoSchema);
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
    // First create a todo
    const { result: createResult } = renderHook(() => todosApi.useCreate(), { wrapper });

    await act(async () => {
      await createResult.current.mutate({
        title: 'Original Title',
        completed: false,
        description: 'Original description',
      });
    });

    // Get the created todo
    const { result: listResult } = renderHook(() => todosApi.useList(), { wrapper });

    await act(async () => {
      await listResult.current.refetch();
    });

    const createdTodo = listResult.current.data?.[0];
    expect(createdTodo).toBeDefined();

    // Now patch the todo
    const { result: patchResult } = renderHook(() => todosApi.usePatch(), { wrapper });

    await act(async () => {
      await patchResult.current.mutate(createdTodo!.id, {
        title: 'Updated Title',
        completed: true,
      });
    });

    // Verify the patch was successful
    expect(patchResult.current.error).toBeNull();
    expect(patchResult.current.loading).toBe(false);

    // Refetch and verify the changes
    await act(async () => {
      await listResult.current.refetch();
    });

    const updatedTodo = listResult.current.data?.[0];
    expect(updatedTodo?.title).toBe('Updated Title');
    expect(updatedTodo?.completed).toBe(true);
    expect(updatedTodo?.description).toBe('Original description'); // Should remain unchanged
  });

  it('should patch a specific field when field parameter is provided', async () => {
    // First create a todo
    const { result: createResult } = renderHook(() => todosApi.useCreate(), { wrapper });

    await act(async () => {
      await createResult.current.mutate({
        title: 'Test Todo',
        completed: false,
        description: 'Test description',
      });
    });

    // Get the created todo
    const { result: listResult } = renderHook(() => todosApi.useList(), { wrapper });

    await act(async () => {
      await listResult.current.refetch();
    });

    const createdTodo = listResult.current.data?.[0];
    expect(createdTodo).toBeDefined();

    // Now patch only the completed field
    const { result: patchResult } = renderHook(() => todosApi.usePatch(), { wrapper });

    await act(async () => {
      await patchResult.current.mutate(createdTodo!.id, { completed: true }, 'completed');
    });

    // Verify the patch was successful
    expect(patchResult.current.error).toBeNull();
    expect(patchResult.current.loading).toBe(false);
  });

  it('should use upsertSchema when provided', () => {
    const todosApiWithUpsert = createDomainApi('todos', todoSchema, {
      upsertSchema: upsertSchema,
    });

    const { result } = renderHook(() => todosApiWithUpsert.usePatch(), { wrapper });

    expect(result.current).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
  });

  it('should handle validation errors', async () => {
    const { result: patchResult } = renderHook(() => todosApi.usePatch(), { wrapper });

    await act(async () => {
      try {
        // Try to patch with invalid data (missing required fields)
        await patchResult.current.mutate('non-existent-id', {} as any);
      } catch {
        // Expected to throw due to validation or non-existent ID
      }
    });

    // The hook should handle the error gracefully
    expect(patchResult.current.loading).toBe(false);
  });
});

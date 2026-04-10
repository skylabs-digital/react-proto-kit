import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useInvalidation } from '../../hooks/useInvalidation';
import { useList } from '../../hooks/useList';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { GlobalStateProvider } from '../../context/GlobalStateProvider';
import { __clearPendingRequests } from '../../utils/requestDedup';

const mockGet = vi.fn();
const mockConnector = {
  get: mockGet,
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

const createWrapper =
  () =>
  ({ children }: { children: React.ReactNode }) => (
    <ApiClientProvider connector={mockConnector as any}>
      <GlobalStateProvider>{children}</GlobalStateProvider>
    </ApiClientProvider>
  );

describe('useInvalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearPendingRequests();
  });

  it('returns an object with stable identity across renders', () => {
    const { result, rerender } = renderHook(() => useInvalidation(), {
      wrapper: createWrapper(),
    });

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    expect(secondResult).toBe(firstResult);
    expect(typeof firstResult.invalidate).toBe('function');
    expect(typeof firstResult.invalidateAll).toBe('function');
  });

  it('invalidate triggers refetch on a subscribed useList', async () => {
    mockGet
      .mockResolvedValueOnce({ success: true, data: [{ id: '1', title: 'a' }] })
      .mockResolvedValueOnce({ success: true, data: [{ id: '1', title: 'a-fresh' }] });

    const wrapper = createWrapper();

    // Combined hook so both live under the same provider tree.
    const { result } = renderHook(
      () => ({
        list: useList<any>('todos', 'todos'),
        invalidation: useInvalidation(),
      }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.list.loading).toBe(false));
    expect(result.current.list.data).toEqual([{ id: '1', title: 'a' }]);
    expect(mockGet).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.invalidation.invalidate('todos');
      // Let the async fetchData settle.
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  it('invalidateAll triggers refetch on every subscribed entity', async () => {
    mockGet.mockResolvedValue({ success: true, data: [] });

    const wrapper = createWrapper();

    const { result } = renderHook(
      () => ({
        todos: useList<any>('todos', 'todos'),
        users: useList<any>('users', 'users'),
        invalidation: useInvalidation(),
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.todos.loading).toBe(false);
      expect(result.current.users.loading).toBe(false);
    });

    // Two initial loads, one per entity.
    expect(mockGet).toHaveBeenCalledTimes(2);

    await act(async () => {
      result.current.invalidation.invalidateAll();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    await waitFor(() => {
      // Two more GETs, one per entity refetch.
      expect(mockGet).toHaveBeenCalledTimes(4);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useList } from '../../hooks/useList';
import { useById } from '../../hooks/useById';
import { useRecord } from '../../hooks/useRecord';
import { useCreateMutation } from '../../hooks/useCreateMutation';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { GlobalStateProvider } from '../../context/GlobalStateProvider';
import { __clearPendingRequests } from '../../utils/requestDedup';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockConnector = {
  get: mockGet,
  post: mockPost,
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

describe('cache layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearPendingRequests();
  });

  describe('request deduplication', () => {
    it('two useList instances sharing the same cacheKey only fire one request', async () => {
      let resolveFirst: (value: any) => void = () => {};
      const pending = new Promise(resolve => {
        resolveFirst = resolve;
      });
      mockGet.mockReturnValueOnce(pending);

      const wrapper = createWrapper();

      // Mount two concurrent consumers of the same list.
      const hookA = renderHook(() => useList<any>('todos', 'todos'), { wrapper });
      const hookB = renderHook(() => useList<any>('todos', 'todos'), { wrapper });

      // Both are still loading, the connector should have been called exactly once.
      expect(mockGet).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveFirst({ success: true, data: [{ id: '1', title: 'a' }] });
        await pending;
      });

      await waitFor(() => {
        expect(hookA.result.current.loading).toBe(false);
        expect(hookB.result.current.loading).toBe(false);
      });

      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidation on mutation', () => {
    it('useCreate triggers a refetch of subscribed useList via globalInvalidationManager', async () => {
      mockGet
        .mockResolvedValueOnce({ success: true, data: [{ id: '1', title: 'a' }] })
        .mockResolvedValueOnce({
          success: true,
          data: [
            { id: '2', title: 'b' },
            { id: '1', title: 'a' },
          ],
        });
      mockPost.mockResolvedValueOnce({
        success: true,
        data: { id: '2', title: 'b' },
      });

      const wrapper = createWrapper();

      const listHook = renderHook(() => useList<any>('todos', 'todos'), { wrapper });
      await waitFor(() => expect(listHook.result.current.loading).toBe(false));
      expect(listHook.result.current.data).toEqual([{ id: '1', title: 'a' }]);

      const createHook = renderHook(() => useCreateMutation<any, any>('todos', 'todos'), {
        wrapper,
      });

      await act(async () => {
        await createHook.result.current.mutate({ title: 'b' });
      });

      // The fast-path update should surface the new item immediately.
      expect(listHook.result.current.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: '2' })])
      );

      // And the background refetch triggered by the invalidation should have
      // hit the connector a second time (first call was the list load, second
      // is the post-invalidation refetch). The mutation itself uses `post`,
      // so the GET counter is exactly 2.
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('auto-refetch on endpoint change', () => {
    it('useById refetches when the id changes', async () => {
      mockGet
        .mockResolvedValueOnce({ success: true, data: { id: '1', name: 'alice' } })
        .mockResolvedValueOnce({ success: true, data: { id: '2', name: 'bob' } });

      const wrapper = createWrapper();

      let endpoint = 'users/1';
      const { result, rerender } = renderHook(
        ({ ep }: { ep: string }) => useById<any>('users', ep),
        { wrapper, initialProps: { ep: endpoint } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toEqual({ id: '1', name: 'alice' });
      expect(mockGet).toHaveBeenCalledTimes(1);

      endpoint = 'users/2';
      rerender({ ep: endpoint });

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: '2', name: 'bob' });
      });
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('useRecord refetches when the endpoint changes', async () => {
      mockGet
        .mockResolvedValueOnce({ success: true, data: { theme: 'dark' } })
        .mockResolvedValueOnce({ success: true, data: { theme: 'light' } });

      const wrapper = createWrapper();

      let endpoint = 'users/1/settings';
      const { result, rerender } = renderHook(
        ({ ep }: { ep: string }) => useRecord<any>('settings', ep),
        { wrapper, initialProps: { ep: endpoint } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toEqual({ theme: 'dark' });
      expect(mockGet).toHaveBeenCalledTimes(1);

      endpoint = 'users/2/settings';
      rerender({ ep: endpoint });

      await waitFor(() => {
        expect(result.current.data).toEqual({ theme: 'light' });
      });
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });
});

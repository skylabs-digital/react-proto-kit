import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
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

const withGlobalState =
  () =>
  ({ children }: { children: React.ReactNode }) => (
    <ApiClientProvider connector={mockConnector as any}>
      <GlobalStateProvider>{children}</GlobalStateProvider>
    </ApiClientProvider>
  );

const withoutGlobalState =
  () =>
  ({ children }: { children: React.ReactNode }) => (
    <ApiClientProvider connector={mockConnector as any}>{children}</ApiClientProvider>
  );

describe('useList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearPendingRequests();
  });

  describe('basic fetching', () => {
    it('loads data on mount and transitions loading to false', async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: [
          { id: '1', title: 'a' },
          { id: '2', title: 'b' },
        ],
      });

      const { result } = renderHook(() => useList<any>('todos', 'todos'), {
        wrapper: withGlobalState(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toHaveLength(2);
      expect(result.current.error).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('todos', {});
    });

    it('exposes pagination meta from the connector response', async () => {
      const meta = { total: 42, page: 1, limit: 10, totalPages: 5 };
      mockGet.mockResolvedValueOnce({ success: true, data: [{ id: '1' }], meta });

      const { result } = renderHook(() => useList<any>('items', 'items', { page: 1, limit: 10 }), {
        wrapper: withGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.meta).toEqual(meta);
    });
  });

  describe('error handling', () => {
    it('surfaces an ErrorResponse and leaves data null when the connector returns failure', async () => {
      mockGet.mockResolvedValueOnce({
        success: false,
        kind: 'http',
        status: 500,
        code: 'SERVER_ERROR',
        message: 'boom',
      });

      const { result } = renderHook(() => useList<any>('todos', 'todos'), {
        wrapper: withGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toMatchObject({
        success: false,
        kind: 'http',
        code: 'SERVER_ERROR',
      });
    });

    it('converts a thrown connector error into an unknown-kind ErrorResponse', async () => {
      mockGet.mockRejectedValueOnce(new Error('network down'));

      const { result } = renderHook(() => useList<any>('todos', 'todos'), {
        wrapper: withGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toMatchObject({
        success: false,
        kind: 'unknown',
      });
      expect(result.current.error?.message).toContain('network down');
    });
  });

  describe('imperative refetch', () => {
    it('refetch() bypasses the has-fetched guard and hits the connector again', async () => {
      mockGet
        .mockResolvedValueOnce({ success: true, data: [{ id: '1', v: 1 }] })
        .mockResolvedValueOnce({ success: true, data: [{ id: '1', v: 2 }] });

      const { result } = renderHook(() => useList<any>('todos', 'todos'), {
        wrapper: withGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockGet).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(result.current.data).toEqual([{ id: '1', v: 2 }]);
    });
  });

  describe('enabled option', () => {
    it('does not call the connector when enabled is false', async () => {
      const { result } = renderHook(
        () => useList<any>('todos', 'todos', undefined, { enabled: false }),
        { wrapper: withGlobalState() }
      );

      // Give any pending effects a chance to run.
      await new Promise(r => setTimeout(r, 20));

      expect(mockGet).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
    });
  });

  describe('non-global-state mode', () => {
    it('uses local state when no GlobalStateProvider is mounted', async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: [{ id: '1', title: 'local' }],
      });

      const { result } = renderHook(() => useList<any>('todos', 'todos'), {
        wrapper: withoutGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toEqual([{ id: '1', title: 'local' }]);
    });

    it('surfaces error responses in local state mode and clears data', async () => {
      mockGet.mockResolvedValueOnce({
        success: false,
        kind: 'notFound',
        message: 'Resource not found',
      });

      const { result } = renderHook(() => useList<any>('todos', 'todos'), {
        wrapper: withoutGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toBeNull();
      expect(result.current.error).toMatchObject({
        success: false,
        kind: 'notFound',
      });
    });
  });

  describe('withQuery / queryParams routing', () => {
    it('routes queryParams under params.filters so connectors see them uniformly', async () => {
      mockGet.mockResolvedValueOnce({ success: true, data: [] });

      const wrapper = withGlobalState();
      renderHook(
        () =>
          useList<any>('todos', 'todos', undefined, {
            queryParams: { status: 'done', priority: 'high' },
          }),
        { wrapper }
      );

      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      expect(mockGet).toHaveBeenLastCalledWith('todos', {
        filters: { status: 'done', priority: 'high' },
      });
    });

    it('merges queryParams with explicit params.filters (queryParams win on conflict)', async () => {
      mockGet.mockResolvedValueOnce({ success: true, data: [] });

      const wrapper = withGlobalState();
      renderHook(
        () =>
          useList<any>(
            'todos',
            'todos',
            { filters: { status: 'pending', tenant: 'acme' } },
            { queryParams: { status: 'done' } }
          ),
        { wrapper }
      );

      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      expect(mockGet).toHaveBeenLastCalledWith('todos', {
        filters: { tenant: 'acme', status: 'done' },
      });
    });

    it('leaves params untouched when no queryParams are provided', async () => {
      mockGet.mockResolvedValueOnce({ success: true, data: [] });

      const wrapper = withGlobalState();
      renderHook(() => useList<any>('todos', 'todos', { page: 2, limit: 10 }), { wrapper });

      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      expect(mockGet).toHaveBeenLastCalledWith('todos', { page: 2, limit: 10 });
    });
  });

  describe('request dedup across instances', () => {
    it('two simultaneous useList instances only fire a single connector call', async () => {
      let resolveFetch: (value: any) => void = () => {};
      const pending = new Promise(resolve => {
        resolveFetch = resolve;
      });
      mockGet.mockReturnValueOnce(pending);

      const wrapper = withGlobalState();

      const a = renderHook(() => useList<any>('todos', 'todos'), { wrapper });
      const b = renderHook(() => useList<any>('todos', 'todos'), { wrapper });

      expect(mockGet).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveFetch({ success: true, data: [{ id: '1' }] });
        await pending;
      });

      await waitFor(() => {
        expect(a.result.current.loading).toBe(false);
        expect(b.result.current.loading).toBe(false);
      });

      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });
});

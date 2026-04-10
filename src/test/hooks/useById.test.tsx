import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useById } from '../../hooks/useById';
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

describe('useById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearPendingRequests();
  });

  describe('basic fetching', () => {
    it('loads a single entity by endpoint and exposes it as data', async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: { id: '42', name: 'alice' },
      });

      const { result } = renderHook(() => useById<any>('users', 'users/42'), {
        wrapper: withGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toEqual({ id: '42', name: 'alice' });
      expect(result.current.error).toBeNull();
    });
  });

  describe('disabled paths (no endpoint / enabled:false)', () => {
    it('does not fetch when endpoint is undefined', async () => {
      const { result } = renderHook(() => useById<any>('users', undefined), {
        wrapper: withGlobalState(),
      });

      await new Promise(r => setTimeout(r, 20));

      expect(mockGet).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
    });

    it('does not fetch when enabled is false', async () => {
      const { result } = renderHook(
        () => useById<any>('users', 'users/42', undefined, { enabled: false }),
        { wrapper: withGlobalState() }
      );

      await new Promise(r => setTimeout(r, 20));

      expect(mockGet).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
    });
  });

  describe('error paths', () => {
    it('surfaces a notFound ErrorResponse from the connector', async () => {
      mockGet.mockResolvedValueOnce({
        success: false,
        kind: 'notFound',
        message: 'Item not found',
      });

      const { result } = renderHook(() => useById<any>('users', 'users/nope'), {
        wrapper: withGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toMatchObject({
        success: false,
        kind: 'notFound',
      });
    });

    it('converts a thrown connector error into an unknown-kind ErrorResponse', async () => {
      mockGet.mockRejectedValueOnce(new Error('oops'));

      const { result } = renderHook(() => useById<any>('users', 'users/42'), {
        wrapper: withGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toMatchObject({
        success: false,
        kind: 'unknown',
      });
    });
  });

  describe('refetch on endpoint change', () => {
    it('fetches the new entity when the endpoint changes', async () => {
      mockGet
        .mockResolvedValueOnce({ success: true, data: { id: '1', name: 'alice' } })
        .mockResolvedValueOnce({ success: true, data: { id: '2', name: 'bob' } });

      const { result, rerender } = renderHook(
        ({ ep }: { ep: string }) => useById<any>('users', ep),
        { wrapper: withGlobalState(), initialProps: { ep: 'users/1' } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toEqual({ id: '1', name: 'alice' });

      rerender({ ep: 'users/2' });

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: '2', name: 'bob' });
      });
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  describe('imperative refetch', () => {
    it('refetch() issues a fresh connector call and updates data', async () => {
      mockGet
        .mockResolvedValueOnce({ success: true, data: { id: '1', v: 1 } })
        .mockResolvedValueOnce({ success: true, data: { id: '1', v: 2 } });

      const { result } = renderHook(() => useById<any>('users', 'users/1'), {
        wrapper: withGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockGet).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(result.current.data).toEqual({ id: '1', v: 2 });
    });
  });

  describe('non-global-state mode', () => {
    it('uses local state when no GlobalStateProvider is mounted', async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: { id: '1', title: 'local' },
      });

      const { result } = renderHook(() => useById<any>('users', 'users/1'), {
        wrapper: withoutGlobalState(),
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toEqual({ id: '1', title: 'local' });
    });
  });

  describe('request dedup across instances', () => {
    it('two simultaneous useById instances for the same endpoint share a single connector call', async () => {
      let resolveFetch: (value: any) => void = () => {};
      const pending = new Promise(resolve => {
        resolveFetch = resolve;
      });
      mockGet.mockReturnValueOnce(pending);

      const wrapper = withGlobalState();

      const a = renderHook(() => useById<any>('users', 'users/1'), { wrapper });
      const b = renderHook(() => useById<any>('users', 'users/1'), { wrapper });

      expect(mockGet).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveFetch({ success: true, data: { id: '1', name: 'alice' } });
        await pending;
      });

      await waitFor(() => {
        expect(a.result.current.loading).toBe(false);
        expect(b.result.current.loading).toBe(false);
      });

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(a.result.current.data).toEqual({ id: '1', name: 'alice' });
      expect(b.result.current.data).toEqual({ id: '1', name: 'alice' });
    });
  });
});

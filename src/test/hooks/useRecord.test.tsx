import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useRecord } from '../../hooks/useRecord';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { GlobalStateProvider } from '../../context/GlobalStateProvider';

// Mock connector
const mockGet = vi.fn();
const mockConnector = {
  get: mockGet,
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

// Wrapper with providers
const createWrapper =
  (withGlobalState = false) =>
  ({ children }: { children: React.ReactNode }) => (
    <ApiClientProvider connector={mockConnector as any}>
      {withGlobalState ? <GlobalStateProvider>{children}</GlobalStateProvider> : children}
    </ApiClientProvider>
  );

describe('useRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should fetch single record on mount', async () => {
      const mockData = { theme: 'dark', language: 'en' };
      mockGet.mockResolvedValueOnce({ success: true, data: mockData });

      const { result } = renderHook(() => useRecord('settings', 'users/123/settings'), {
        wrapper: createWrapper(),
      });

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
      expect(mockGet).toHaveBeenCalledWith('users/123/settings', undefined);
    });

    it('should pass query params to connector', async () => {
      const mockData = { totalUsers: 100 };
      mockGet.mockResolvedValueOnce({ success: true, data: mockData });

      const { result } = renderHook(
        () =>
          useRecord('stats', 'dashboard/stats', {
            queryParams: { dateRange: 'week', teamId: 'team-1' },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGet).toHaveBeenCalledWith('dashboard/stats', {
        dateRange: 'week',
        teamId: 'team-1',
      });
    });

    it('should support manual refetch', async () => {
      const mockData1 = { theme: 'dark' };
      const mockData2 = { theme: 'light' };
      mockGet
        .mockResolvedValueOnce({ success: true, data: mockData1 })
        .mockResolvedValueOnce({ success: true, data: mockData2 });

      const { result } = renderHook(() => useRecord('settings', 'settings'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      // Trigger refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.data).toEqual(mockData2);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('should work with GlobalStateProvider', async () => {
      const mockData = { theme: 'dark' };
      mockGet.mockResolvedValueOnce({ success: true, data: mockData });

      const { result } = renderHook(() => useRecord('settings', 'users/123/settings'), {
        wrapper: createWrapper(true),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      mockGet.mockResolvedValueOnce({
        success: false,
        message: 'Not found',
        error: { code: 'NOT_FOUND' },
      });

      const { result } = renderHook(() => useRecord('settings', 'settings'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toEqual({
        success: false,
        message: 'Not found',
        error: { code: 'NOT_FOUND' },
      });
    });

    it('should handle network errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useRecord('settings', 'settings'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toMatchObject({
        success: false,
        message: 'Network error',
        error: { code: 'UNKNOWN_ERROR' },
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not fetch when enabled is false', () => {
      const { result } = renderHook(
        () =>
          useRecord('settings', 'settings', {
            enabled: false,
          }),
        { wrapper: createWrapper() }
      );

      // Should remain in initial state
      expect(result.current.loading).toBe(true);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should handle empty endpoint gracefully', () => {
      const { result } = renderHook(() => useRecord('settings', ''), {
        wrapper: createWrapper(),
      });

      // Should not make request with empty endpoint
      expect(mockGet).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(true);
    });

    it('should provide refetch function', async () => {
      mockGet.mockResolvedValue({ success: true, data: { theme: 'dark' } });

      const { result } = renderHook(() => useRecord('settings', 'settings'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate correct cache key without query params', async () => {
      mockGet.mockResolvedValueOnce({ success: true, data: { value: 1 } });

      const { result } = renderHook(() => useRecord('settings', 'users/123/settings'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeTruthy();
      });

      expect(mockGet).toHaveBeenCalledWith('users/123/settings', undefined);
    });

    it('should generate correct cache key with query params', async () => {
      mockGet.mockResolvedValueOnce({ success: true, data: { value: 1 } });

      const { result } = renderHook(
        () =>
          useRecord('stats', 'stats', {
            queryParams: { period: 'week', team: 'sales' },
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toBeTruthy();
      });

      expect(mockGet).toHaveBeenCalledWith('stats', { period: 'week', team: 'sales' });
    });
  });
});

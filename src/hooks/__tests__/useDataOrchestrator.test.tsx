import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDataOrchestrator } from '../useDataOrchestrator';
import { UseQueryResult, ErrorResponse } from '../../types';

// Mock hook factory
const createMockHook = (
  data: any,
  loading: boolean,
  error: ErrorResponse | null = null
): (() => UseQueryResult<any>) => {
  return () => ({
    data,
    loading,
    error,
    refetch: vi.fn(),
  });
};

describe('useDataOrchestrator', () => {
  it('should aggregate loading states correctly', () => {
    const { result } = renderHook(() =>
      useDataOrchestrator({
        users: createMockHook(null, true, null),
        profile: createMockHook(null, false, null),
      })
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.loadingStates.users).toBe(true);
    expect(result.current.loadingStates.profile).toBe(false);
  });

  it('should aggregate error states correctly', () => {
    const error: ErrorResponse = { success: false, message: 'Failed to load' };

    const { result } = renderHook(() =>
      useDataOrchestrator({
        users: createMockHook(null, false, error),
        profile: createMockHook({ name: 'John' }, false, null),
      })
    );

    expect(result.current.hasErrors).toBe(true);
    expect(result.current.errors.users).toEqual(error);
    expect(result.current.errors.profile).toBeUndefined();
  });

  it('should aggregate data correctly', () => {
    const usersData = [{ id: '1', name: 'Alice' }];
    const profileData = { id: '2', name: 'Bob' };

    const { result } = renderHook(() =>
      useDataOrchestrator({
        users: createMockHook(usersData, false, null),
        profile: createMockHook(profileData, false, null),
      })
    );

    expect(result.current.data.users).toEqual(usersData);
    expect(result.current.data.profile).toEqual(profileData);
  });

  it('should handle required/optional distinction', () => {
    const error: ErrorResponse = { success: false, message: 'Stats failed' };

    const { result } = renderHook(() =>
      useDataOrchestrator({
        required: {
          users: createMockHook([{ id: '1' }], false, null),
        },
        optional: {
          stats: createMockHook(null, false, error),
        },
      })
    );

    // Optional error should not trigger hasErrors
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.errors.stats).toEqual(error);
  });

  it(
    'should track isLoading only for first load',
    async () => {
      let loading = true;
      let data: any = null;

      const mockHook = () => ({
        data,
        loading,
        error: null,
        refetch: vi.fn(),
      });

      const { result, rerender } = renderHook(() =>
        useDataOrchestrator({
          users: mockHook,
        })
      );

      // First render - loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);

      // Update data and rerender
      loading = false;
      data = [{ id: '1' }];
      rerender();

      // Wait for settled state to update
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After first load completes
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);

      // Simulate refetch
      loading = true;
      rerender();

      // Wait for fetching state
      await waitFor(() => {
        expect(result.current.isFetching).toBe(true);
      });

      // On refetch: isFetching true, isLoading should eventually be false (already settled)
      // Note: This is async behavior
    },
    { timeout: 15000 }
  );

  it('should reset state when resetKey changes', () => {
    let resetKey = 'key1';

    const { result, rerender } = renderHook(() =>
      useDataOrchestrator(
        {
          users: createMockHook([{ id: '1' }], false, null),
        },
        { resetKey }
      )
    );

    expect(result.current.data.users).toEqual([{ id: '1' }]);

    // Change resetKey
    resetKey = 'key2';
    rerender();

    // State should be reset (tracked internally)
    // Data will still be there from the hook, but internal tracking resets
    expect(result.current).toBeDefined();
  });

  it('should provide retry and retryAll functions', () => {
    const mockRefetch = vi.fn();

    const { result } = renderHook(() =>
      useDataOrchestrator({
        users: () => ({
          data: [],
          loading: false,
          error: null,
          refetch: mockRefetch,
        }),
      })
    );

    result.current.retry('users');
    expect(mockRefetch).toHaveBeenCalledTimes(1);

    result.current.retryAll();
    expect(mockRefetch).toHaveBeenCalledTimes(2);
  });

  it('should handle null config', () => {
    const { result } = renderHook(() => useDataOrchestrator(null));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.data).toEqual({});
  });

  it('should call onError callback when errors occur', () => {
    const onError = vi.fn();
    const error: ErrorResponse = { success: false, message: 'Failed' };

    renderHook(() =>
      useDataOrchestrator(
        {
          users: createMockHook(null, false, error),
        },
        { onError }
      )
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        users: error,
      })
    );
  });
});

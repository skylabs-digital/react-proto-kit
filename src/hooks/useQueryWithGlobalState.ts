import { useEffect, useCallback } from 'react';
import { UseQueryResult, ErrorResponse } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';

export function useQueryWithGlobalState<T>(
  entity: string,
  endpoint: string,
  params?: Record<string, any>,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    cacheTime?: number;
  }
): UseQueryResult<T> {
  const { connector } = useApiClient();
  const entityState = useEntityState<T>(entity);
  const cacheKey = `${endpoint}${params ? JSON.stringify(params) : ''}`;

  // Get data from global state with safe access
  const data = entityState.data?.[cacheKey] || null;
  const loading = entityState.loading?.[cacheKey] || true;
  const error = entityState.errors?.[cacheKey] || null;

  const fetchData = useCallback(async () => {
    if (options?.enabled === false) return;

    // Get current data and lastFetch to avoid stale closure
    const currentData = entityState.data?.[cacheKey] || null;
    const currentLastFetch = entityState.lastFetch?.[cacheKey] || 0;

    // Check cache validity
    const cacheTime = options?.cacheTime || 5 * 60 * 1000; // 5 minutes default
    if (currentData && Date.now() - currentLastFetch < cacheTime) {
      return;
    }

    entityState.actions.setLoading(cacheKey, true);
    entityState.actions.setError(cacheKey, null);

    try {
      const response = await connector.get<T>(endpoint, params);

      if (response.success) {
        entityState.actions.setData(cacheKey, response.data);
      } else {
        entityState.actions.setError(cacheKey, response as ErrorResponse);
      }
    } catch (err) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        error: { code: 'UNKNOWN_ERROR' },
      };
      entityState.actions.setError(cacheKey, errorResponse);
    } finally {
      entityState.actions.setLoading(cacheKey, false);
    }
  }, [connector, endpoint, params, options?.enabled, cacheKey, entityState, options?.cacheTime]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Subscribe to invalidations
  useEffect(() => {
    const unsubscribe = globalInvalidationManager.subscribe(entity, () => {
      fetchData();
    });
    return unsubscribe;
  }, [entity, fetchData]);

  useEffect(() => {
    if (options?.refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, options?.refetchOnMount]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

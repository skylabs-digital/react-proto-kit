import { useEffect, useCallback } from 'react';
import { UseListResult, ErrorResponse, ListParams, PaginationMeta } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';
import { debugLogger } from '../utils/debug';

export function useListWithGlobalState<T>(
  entity: string,
  params?: ListParams,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    cacheTime?: number;
  }
): UseListResult<T> {
  const { connector } = useApiClient();
  const entityState = useEntityState<T>(entity);
  const cacheKey = `list${params ? JSON.stringify(params) : ''}`;

  // Get data from global state with safe access
  const data = entityState.lists?.[cacheKey] || null;
  const loading = entityState.loading?.[cacheKey] || false;
  const error = entityState.errors?.[cacheKey] || null;

  const fetchData = useCallback(async () => {
    if (options?.enabled === false) return;

    // Check cache validity - use current values from state
    const currentData = entityState.lists?.[cacheKey];
    const currentLastFetch = entityState.lastFetch?.[cacheKey] || 0;
    const cacheTime = options?.cacheTime || 5 * 60 * 1000; // 5 minutes default

    if (currentData && Date.now() - currentLastFetch < cacheTime) {
      debugLogger.logCacheHit(entity, cacheKey);
      return;
    }

    debugLogger.logCacheMiss(entity, cacheKey);
    entityState.actions.setLoading(cacheKey, true);
    entityState.actions.setError(cacheKey, null);

    try {
      const response = await connector.get<T[]>(entity, params);

      if (response.success) {
        // Atomic update - only replace data when new data is available
        entityState.actions.setList(cacheKey, response.data);
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
  }, [
    connector,
    entity,
    params,
    options?.enabled,
    cacheKey,
    entityState.actions,
    entityState.lists,
    entityState.lastFetch,
    options?.cacheTime,
  ]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Subscribe to invalidations
  useEffect(() => {
    const unsubscribe = globalInvalidationManager.subscribe(entity, () => {
      // Invalidate cache timestamp to force refetch on next access
      entityState.actions.invalidate();
    });
    return unsubscribe;
  }, [entity, entityState.actions]);

  useEffect(() => {
    if (options?.refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, options?.refetchOnMount]);

  // Extract meta from response if available
  const meta: PaginationMeta | undefined = undefined; // TODO: Extract from response

  return {
    data,
    loading,
    error,
    refetch,
    meta,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { UseQueryResult, ErrorResponse } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';

interface UseQueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  cacheTime?: number;
}

// Unified hook that can work with or without global state
export function useQuery<T>(
  entity: string,
  endpoint?: string,
  params?: Record<string, any>,
  options?: UseQueryOptions
): UseQueryResult<T> {
  const { connector } = useApiClient();

  // Extract options to avoid recreating callback dependencies
  const { enabled, refetchOnMount, cacheTime } = options || {};

  // Only get entity state if global state is enabled
  const entityState = useEntityState<T>(entity);
  const globalState = !!entityState;

  // Local state for non-global state mode
  const [localData, setLocalData] = useState<T | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<ErrorResponse | null>(null);

  // Determine which state to use
  const cacheKey = `${endpoint}${params ? JSON.stringify(params) : ''}`;

  const data = globalState && entityState ? entityState.data?.[cacheKey] || null : localData;

  const loading =
    globalState && entityState ? (entityState.loading?.[cacheKey] ?? true) : localLoading;

  const error = globalState && entityState ? entityState.errors?.[cacheKey] || null : localError;

  const lastFetch = globalState && entityState ? entityState.lastFetch?.[cacheKey] || 0 : 0;

  const fetchData = useCallback(async () => {
    if (!endpoint || enabled === false) return;

    // Check cache validity for global state
    if (globalState && entityState) {
      const cacheTimeMs = cacheTime || 5 * 60 * 1000; // 5 minutes default
      if (data && Date.now() - lastFetch < cacheTimeMs) {
        return;
      }

      entityState.actions.setLoading(cacheKey, true);
      entityState.actions.setError(cacheKey, null);
    } else {
      setLocalLoading(true);
      setLocalError(null);
    }

    try {
      const response = await connector.get<T>(endpoint, params);

      if (response.success) {
        if (globalState && entityState) {
          entityState.actions.setData(cacheKey, response.data);
        } else {
          setLocalData(response.data);
        }
      } else {
        const errorResponse = response as ErrorResponse;
        if (globalState && entityState) {
          entityState.actions.setError(cacheKey, errorResponse);
        } else {
          setLocalError(errorResponse);
          setLocalData(null);
        }
      }
    } catch (err) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        error: { code: 'UNKNOWN_ERROR' },
      };

      if (globalState && entityState) {
        entityState.actions.setError(cacheKey, errorResponse);
      } else {
        setLocalError(errorResponse);
        setLocalData(null);
      }
    } finally {
      if (globalState && entityState) {
        entityState.actions.setLoading(cacheKey, false);
      } else {
        setLocalLoading(false);
      }
    }
  }, [connector, endpoint, params, enabled, cacheTime, globalState, cacheKey, entityState]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Subscribe to invalidations only for global state
  useEffect(() => {
    if (globalState && entityState) {
      const unsubscribe = globalInvalidationManager.subscribe(entity, () => {
        fetchData();
      });
      return unsubscribe;
    }
  }, [entity, fetchData, globalState, entityState]);

  useEffect(() => {
    if (refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

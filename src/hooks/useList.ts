import { useState, useEffect, useCallback } from 'react';
import { UseListResult, ErrorResponse, ListParams, PaginationMeta } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';

interface UseListOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  cacheTime?: number;
  queryParams?: Record<string, any>;
}

// Unified hook that can work with or without global state
export function useList<T>(
  entity: string,
  endpoint: string,
  params?: ListParams,
  options?: UseListOptions
): UseListResult<T> {
  const { connector } = useApiClient();

  // Only get entity state if global state is enabled
  const entityState = useEntityState<T>(entity);
  const globalState = !!entityState;

  // Local state for non-global state mode
  const [localData, setLocalData] = useState<T[] | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<ErrorResponse | null>(null);
  const [localMeta, setLocalMeta] = useState<PaginationMeta | undefined>(undefined);

  // Determine which state to use - include endpoint to differentiate between different paths
  const cacheKey = `list:${endpoint}${params ? ':' + JSON.stringify(params) : ''}`;

  const data = globalState && entityState ? entityState.lists?.[cacheKey] || null : localData;

  const loading =
    globalState && entityState ? (entityState.loading?.[cacheKey] ?? true) : localLoading;

  const error = globalState && entityState ? entityState.errors?.[cacheKey] || null : localError;

  const meta = globalState && entityState ? entityState.meta?.[cacheKey] : localMeta;

  const lastFetch = globalState && entityState ? entityState.lastFetch?.[cacheKey] || 0 : 0;

  const fetchData = useCallback(
    async (forceRefetch = false) => {
      if (options?.enabled === false) return;

      // Check cache validity for global state
      if (globalState && entityState) {
        const cacheTime = options?.cacheTime || 5 * 60 * 1000; // 5 minutes default
        if (!forceRefetch && data && Date.now() - lastFetch < cacheTime) {
          return;
        }

        entityState.actions.setLoading(cacheKey, true);
        entityState.actions.setError(cacheKey, null);
      } else {
        setLocalLoading(true);
        setLocalError(null);
      }

      try {
        // Merge ListParams with queryParams
        const mergedParams = { ...params, ...options?.queryParams };
        const response = await connector.get<T[]>(endpoint, mergedParams);

        if (response.success) {
          if (globalState && entityState) {
            entityState.actions.setList(cacheKey, response.data);
            if (response.meta) {
              entityState.actions.setMeta(cacheKey, response.meta);
            }
          } else {
            setLocalData(response.data);
            setLocalMeta(response.meta);
          }
        } else {
          const errorResponse = response as ErrorResponse;
          if (globalState && entityState) {
            entityState.actions.setError(cacheKey, errorResponse);
          } else {
            setLocalError(errorResponse);
            setLocalData(null);
            setLocalMeta(undefined);
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
          setLocalMeta(undefined);
        }
      } finally {
        if (globalState && entityState) {
          entityState.actions.setLoading(cacheKey, false);
        } else {
          setLocalLoading(false);
        }
      }
    },
    [
      connector,
      endpoint,
      JSON.stringify(params), // Serialize params to avoid object reference changes
      options?.enabled,
      options?.cacheTime,
      globalState,
      cacheKey,
      entityState?.actions, // Only depend on actions, not the whole entityState
    ]
  );

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Invalidation system disabled - we update state directly in mutations
  // This prevents the flash from automatic refetching

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
    meta,
  };
}

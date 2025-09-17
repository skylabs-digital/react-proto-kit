import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Control flags to prevent duplicate fetches
  const hasFetchedRef = useRef(false);
  const isCurrentlyFetchingRef = useRef(false);

  // Determine which state to use - include endpoint to differentiate between different paths
  const cacheKey = `list:${endpoint}${params ? ':' + JSON.stringify(params) : ''}`;

  const data = globalState && entityState ? entityState.lists?.[cacheKey] || null : localData;

  const loading =
    globalState && entityState ? (entityState.loading?.[cacheKey] ?? true) : localLoading;

  const error = globalState && entityState ? entityState.errors?.[cacheKey] || null : localError;

  const meta = globalState && entityState ? entityState.meta?.[cacheKey] : localMeta;

  const fetchData = useCallback(
    async (forceRefetch = false) => {
      if (options?.enabled === false) return;

      // Prevent duplicate fetches unless forced (like refetch)
      if (!forceRefetch && (isCurrentlyFetchingRef.current || hasFetchedRef.current)) {
        return;
      }

      // Get current state values at execution time
      const currentEntityState = globalState ? entityState : null;
      const currentData = currentEntityState
        ? currentEntityState.lists?.[cacheKey] || null
        : localData;
      const currentLastFetch = currentEntityState
        ? currentEntityState.lastFetch?.[cacheKey] || 0
        : 0;

      // Check cache validity
      if (!forceRefetch && currentData) {
        const cacheTime = options?.cacheTime || 5 * 60 * 1000; // 5 minutes default
        if (Date.now() - currentLastFetch < cacheTime) {
          return;
        }
      }

      // Mark as currently fetching
      isCurrentlyFetchingRef.current = true;

      // Set loading state
      if (currentEntityState) {
        currentEntityState.actions.setLoading(cacheKey, true);
        currentEntityState.actions.setError(cacheKey, null);
      } else {
        setLocalLoading(true);
        setLocalError(null);
      }

      try {
        // Merge ListParams with queryParams
        const mergedParams = { ...params, ...options?.queryParams };
        const response = await connector.get<T[]>(endpoint, mergedParams);

        if (response.success) {
          if (currentEntityState) {
            currentEntityState.actions.setList(cacheKey, response.data);
            if (response.meta) {
              currentEntityState.actions.setMeta(cacheKey, response.meta);
            }
          } else {
            setLocalData(response.data);
            setLocalMeta(response.meta);
          }
          hasFetchedRef.current = true; // Mark as successfully fetched
        } else {
          const errorResponse = response as ErrorResponse;
          if (currentEntityState) {
            currentEntityState.actions.setError(cacheKey, errorResponse);
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

        if (currentEntityState) {
          currentEntityState.actions.setError(cacheKey, errorResponse);
        } else {
          setLocalError(errorResponse);
          setLocalData(null);
          setLocalMeta(undefined);
        }
      } finally {
        if (currentEntityState) {
          currentEntityState.actions.setLoading(cacheKey, false);
        } else {
          setLocalLoading(false);
        }
        isCurrentlyFetchingRef.current = false; // Mark as no longer fetching
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
    ]
  );

  const refetch = useCallback(async () => {
    await fetchData(true); // Force refetch
  }, [fetchData]);

  // Reset fetch flags when key parameters change
  useEffect(() => {
    hasFetchedRef.current = false;
    isCurrentlyFetchingRef.current = false;
  }, [endpoint, cacheKey]);

  // Initial fetch on mount - only runs once
  useEffect(() => {
    if (options?.refetchOnMount !== false && !hasFetchedRef.current) {
      fetchData();
    }
  }, []); // Empty dependency array - only runs on mount

  return {
    data,
    loading,
    error,
    refetch,
    meta,
  };
}

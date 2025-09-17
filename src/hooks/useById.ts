import { useState, useEffect, useCallback, useRef } from 'react';
import { UseQueryResult, ErrorResponse } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';

interface UseByIdOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  cacheTime?: number;
}

// Unified hook that can work with or without global state
export function useById<T>(
  entity: string,
  endpoint?: string,
  params?: Record<string, any>,
  options?: UseByIdOptions
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

  // Control flags to prevent duplicate fetches
  const hasFetchedRef = useRef(false);
  const isCurrentlyFetchingRef = useRef(false);

  // Determine which state to use
  const cacheKey = `${endpoint}${params ? JSON.stringify(params) : ''}`;

  const data = globalState && entityState ? entityState.data?.[cacheKey] || null : localData;

  const loading =
    globalState && entityState ? (entityState.loading?.[cacheKey] ?? true) : localLoading;

  const error = globalState && entityState ? entityState.errors?.[cacheKey] || null : localError;

  const fetchData = useCallback(
    async (force = false) => {
      if (!endpoint || enabled === false) return;

      // Prevent duplicate fetches unless forced (like refetch)
      if (!force && (isCurrentlyFetchingRef.current || hasFetchedRef.current)) {
        return;
      }

      // Get current state values at execution time
      const currentEntityState = globalState ? entityState : null;
      const currentData = currentEntityState
        ? currentEntityState.data?.[cacheKey] || null
        : localData;
      const currentLastFetch = currentEntityState
        ? currentEntityState.lastFetch?.[cacheKey] || 0
        : 0;

      // Check cache validity
      if (!force && currentData) {
        const cacheTimeMs = cacheTime || 5 * 60 * 1000; // 5 minutes default
        if (Date.now() - currentLastFetch < cacheTimeMs) {
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
        const response = await connector.get<T>(endpoint, params);

        if (response.success) {
          if (currentEntityState) {
            currentEntityState.actions.setData(cacheKey, response.data);
          } else {
            setLocalData(response.data);
          }
          hasFetchedRef.current = true; // Mark as successfully fetched
        } else {
          const errorResponse = response as ErrorResponse;
          if (currentEntityState) {
            currentEntityState.actions.setError(cacheKey, errorResponse);
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

        if (currentEntityState) {
          currentEntityState.actions.setError(cacheKey, errorResponse);
        } else {
          setLocalError(errorResponse);
          setLocalData(null);
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
    [connector, endpoint, params, enabled, cacheTime, globalState, cacheKey]
  );

  const refetch = useCallback(async () => {
    await fetchData(true); // Force refetch
  }, [fetchData]);

  // Reset fetch flags when key parameters change
  useEffect(() => {
    hasFetchedRef.current = false;
    isCurrentlyFetchingRef.current = false;
  }, [endpoint, cacheKey]);

  // Subscribe to invalidations only for global state
  useEffect(() => {
    if (globalState) {
      const unsubscribe = globalInvalidationManager.subscribe(entity, () => {
        hasFetchedRef.current = false; // Allow refetch on invalidation
        fetchData(true);
      });
      return unsubscribe;
    }
  }, [entity, globalState]); // Removed fetchData dependency

  // Initial fetch on mount - only runs once
  useEffect(() => {
    if (refetchOnMount !== false && !hasFetchedRef.current) {
      fetchData();
    }
  }, []); // Empty dependency array - only runs on mount

  return {
    data,
    loading,
    error,
    refetch,
  };
}

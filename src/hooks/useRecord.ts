import { useState, useEffect, useCallback, useRef } from 'react';
import { UseQueryResult, ErrorResponse } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';

interface UseRecordOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  cacheTime?: number;
  refetchInterval?: number;
  queryParams?: Record<string, any>;
}

/**
 * Hook for fetching a single record from an endpoint (not a list).
 * Unlike useById, this doesn't require an ID - the endpoint itself identifies the resource.
 *
 * Use cases:
 * - GET /users/:userId/settings - User settings
 * - GET /dashboard/stats - Dashboard statistics
 * - GET /config - Application configuration
 */
export function useRecord<T>(
  entity: string,
  endpoint: string,
  options?: UseRecordOptions
): UseQueryResult<T> {
  const { connector } = useApiClient();
  const {
    enabled = true,
    refetchOnMount = true,
    cacheTime,
    refetchInterval,
    queryParams,
  } = options || {};

  // Get entity state for caching
  const entityState = useEntityState<T>(entity);
  const globalState = !!entityState;

  // Local state for non-global state mode
  const [localData, setLocalData] = useState<T | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<ErrorResponse | null>(null);

  // Control flags
  const hasFetchedRef = useRef(false);
  const isCurrentlyFetchingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cache key is the endpoint + query params
  const cacheKey = queryParams
    ? `${endpoint}?${new URLSearchParams(queryParams as Record<string, string>).toString()}`
    : endpoint;

  // Get current data
  const data = globalState && entityState ? entityState.data?.[cacheKey] || null : localData;

  const loading =
    globalState && entityState ? (entityState.loading?.[cacheKey] ?? data === null) : localLoading;

  const error = globalState && entityState ? entityState.errors?.[cacheKey] || null : localError;

  const fetchData = useCallback(
    async (force = false) => {
      if (!endpoint || !enabled) return;

      // Prevent duplicate fetches unless forced
      if (!force && (isCurrentlyFetchingRef.current || hasFetchedRef.current)) {
        return;
      }

      // Check cache validity
      const currentEntityState = globalState ? entityState : null;
      const currentData = currentEntityState
        ? currentEntityState.data?.[cacheKey] || null
        : localData;
      const currentLastFetch = currentEntityState
        ? currentEntityState.lastFetch?.[cacheKey] || 0
        : 0;

      if (!force && currentData) {
        const cacheTimeMs = cacheTime || 5 * 60 * 1000; // 5 minutes default
        if (Date.now() - currentLastFetch < cacheTimeMs) {
          return;
        }
      }

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
        const response = await connector.get<T>(endpoint, queryParams);

        if (response.success) {
          if (currentEntityState) {
            currentEntityState.actions.setData(cacheKey, response.data);
          } else {
            setLocalData(response.data);
          }
          hasFetchedRef.current = true;
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
        isCurrentlyFetchingRef.current = false;
      }
    },
    [
      connector,
      endpoint,
      queryParams,
      enabled,
      cacheTime,
      globalState,
      cacheKey,
      entityState,
      localData,
    ]
  );

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Reset fetch flags when endpoint changes
  useEffect(() => {
    hasFetchedRef.current = false;
    isCurrentlyFetchingRef.current = false;
  }, [endpoint, cacheKey]);

  // Initial fetch on mount
  useEffect(() => {
    if (refetchOnMount && !hasFetchedRef.current && enabled) {
      fetchData();
    }
  }, [enabled]);

  // Setup refetch interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0 && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData(true);
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

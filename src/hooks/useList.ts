import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UseListResult,
  ErrorResponse,
  ListParams,
  PaginationMeta,
  RefetchBehavior,
} from '../types';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { useRefetchBehavior } from '../context/RefetchBehaviorContext';

interface UseListOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  cacheTime?: number;
  queryParams?: Record<string, any>;
  refetchBehavior?: RefetchBehavior;
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

  // Determine which state to use - include endpoint, params AND queryParams
  const cacheKeyParts = [endpoint];
  if (params) cacheKeyParts.push(JSON.stringify(params));
  if (options?.queryParams) cacheKeyParts.push(JSON.stringify(options.queryParams));
  const cacheKey = `list:${cacheKeyParts.join(':')}`;

  // Get refetch behavior from context or options (default: stale-while-revalidate)
  const contextBehavior = useRefetchBehavior();
  const refetchBehavior = options?.refetchBehavior || contextBehavior;

  // Get current data for this cacheKey
  const currentData =
    globalState && entityState ? entityState.lists?.[cacheKey] || null : localData;
  const currentLoading =
    globalState && entityState ? (entityState.loading?.[cacheKey] ?? true) : localLoading;

  // Store data by cacheKey for stale-while-revalidate
  const dataByCacheKeyRef = useRef<Map<string, T[] | null>>(new Map());
  const previousCacheKeyRef = useRef<string>(cacheKey);

  // Detect if cacheKey changed
  const cacheKeyChanged = previousCacheKeyRef.current !== cacheKey;

  // Save current data to Map when it's loaded (not null and not loading)
  useEffect(() => {
    if (currentData !== null && !currentLoading) {
      dataByCacheKeyRef.current.set(cacheKey, currentData);
    }
  }, [cacheKey, currentData, currentLoading]);

  // Determine what data to show based on refetchBehavior
  let data: T[] | null;
  let loading: boolean;

  if (refetchBehavior === 'stale-while-revalidate') {
    if (cacheKeyChanged && (currentData === null || currentLoading)) {
      // CacheKey just changed and new data not loaded yet
      // Try to show stale data from PREVIOUS cacheKey
      const previousData = dataByCacheKeyRef.current.get(previousCacheKeyRef.current);

      if (previousData !== undefined) {
        // We have previous data - show it while loading new data
        data = previousData;
        loading = false; // Don't block UI - show stale data
      } else {
        // No previous data (first load or first time on this tab path)
        // Behave like blocking mode
        data = currentData;
        loading = currentLoading;
      }
    } else {
      // Either cacheKey didn't change, or new data already loaded
      data = currentData;
      loading = currentLoading && currentData === null;
    }
  } else {
    // Blocking mode: always show current state
    data = currentData;
    loading = currentLoading;
  }

  // Update the previous cacheKey reference after first render with new key
  useEffect(() => {
    if (cacheKeyChanged) {
      previousCacheKeyRef.current = cacheKey;
    }
  }, [cacheKey, cacheKeyChanged]);

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

  // Reset fetch flags and refetch when key parameters change
  useEffect(() => {
    hasFetchedRef.current = false;
    isCurrentlyFetchingRef.current = false;

    // Auto-fetch when cacheKey changes (e.g., query params change)
    if (options?.refetchOnMount !== false) {
      fetchData();
    }
  }, [endpoint, cacheKey]); // Don't include fetchData to avoid loops

  return {
    data,
    loading,
    error,
    refetch,
    meta,
  };
}

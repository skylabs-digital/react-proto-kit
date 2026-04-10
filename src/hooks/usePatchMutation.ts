import { useState, useCallback } from 'react';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';
import { toUnknownErrorResponse } from '../utils/mutationHelpers';
import { ApiResponse, ErrorResponse, UsePatchMutationResult } from '../types';
import { byIdCacheKey, listCacheKey } from '../utils/cacheKey';

interface UsePatchMutationOptions {
  /**
   * Query parameters to attach to the PATCH request. Used by
   * createDomainApi.withQuery() to propagate dynamic params to mutations.
   */
  queryParams?: Record<string, any>;
}

// Unified hook that automatically detects global state availability
export function usePatchMutation<TInput, TEntity>(
  entity: string,
  endpoint?: string,
  options?: UsePatchMutationOptions
): UsePatchMutationResult<TInput, TEntity> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const queryParams = options?.queryParams;
  const queryParamsKey = queryParams ? JSON.stringify(queryParams) : undefined;

  // Only get entity state if global state is available
  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (id: string, data: TInput): Promise<ApiResponse<TEntity>> => {
      setLoading(true);
      setError(null);

      try {
        const baseEndpoint = endpoint || entity;
        const patchEndpoint = `${baseEndpoint}/${id}`;

        const response = await connector.patch<TEntity>(patchEndpoint, data, queryParams);

        if (response.success) {
          if (globalState && entityState) {
            // Fast path: update individual record cache so the UI reflects
            // the change without waiting for the background refetch.
            const individualCacheKey = byIdCacheKey(`${baseEndpoint}/${id}`);
            const existingData = entityState.data?.[individualCacheKey];
            const mergedData = existingData ? { ...existingData, ...response.data } : response.data;
            entityState.actions.setData(individualCacheKey, mergedData);

            // Update the item in every list cached under this endpoint.
            const baseListKey = listCacheKey(baseEndpoint);
            if (entityState.lists && typeof entityState.lists === 'object') {
              Object.keys(entityState.lists).forEach(key => {
                if (key === baseListKey || key.startsWith(`${baseListKey}:`)) {
                  const currentList = entityState.lists[key];
                  if (Array.isArray(currentList)) {
                    const updatedList = currentList.map((item: any) =>
                      item.id === id ? { ...item, ...response.data } : item
                    );
                    entityState.actions.setList(key, updatedList);
                  }
                }
              });
            }
          }

          // Background refetch via stale-while-revalidate.
          globalInvalidationManager.invalidate(entity);

          return response;
        } else {
          const errorResponse = response as ErrorResponse;
          setError(errorResponse);
          return errorResponse;
        }
      } catch (err) {
        const errorResponse = toUnknownErrorResponse(err);
        setError(errorResponse);
        return errorResponse;
      } finally {
        setLoading(false);
      }
    },
    [connector, entity, endpoint, globalState, entityState, queryParamsKey]
  );

  return {
    mutate,
    loading,
    error,
  };
}

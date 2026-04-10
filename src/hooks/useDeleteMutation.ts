import { useState, useCallback } from 'react';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';
import { toUnknownErrorResponse } from '../utils/mutationHelpers';
import { ApiResponse, ErrorResponse } from '../types';
import { byIdCacheKey, listCacheKey } from '../utils/cacheKey';

export interface UseDeleteMutationResult {
  mutate: (id: string) => Promise<ApiResponse<void>>;
  loading: boolean;
  error: ErrorResponse | null;
}

interface UseDeleteMutationOptions {
  /**
   * Query parameters to attach to the DELETE request. Used by
   * createDomainApi.withQuery() to propagate dynamic params to mutations.
   */
  queryParams?: Record<string, any>;
}

// Unified hook that can work with or without global state
export function useDeleteMutation<TEntity>(
  entity: string,
  endpoint?: string,
  options?: UseDeleteMutationOptions
): UseDeleteMutationResult {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const queryParams = options?.queryParams;
  const queryParamsKey = queryParams ? JSON.stringify(queryParams) : undefined;

  // Only get entity state if global state is enabled
  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (id: string): Promise<ApiResponse<void>> => {
      setLoading(true);
      setError(null);

      try {
        const baseEndpoint = endpoint || entity;
        const deleteEndpoint = `${baseEndpoint}/${id}`;

        const response = await connector.delete<void>(deleteEndpoint, undefined, queryParams);

        if (response.success) {
          if (globalState && entityState) {
            // Fast path: drop the record from the cache.
            const individualCacheKey = byIdCacheKey(`${baseEndpoint}/${id}`);
            entityState.actions.setData(individualCacheKey, undefined as any);

            // Remove the item from every list cached under this endpoint.
            const baseListKey = listCacheKey(baseEndpoint);
            if (entityState.lists && typeof entityState.lists === 'object') {
              Object.keys(entityState.lists).forEach(key => {
                if (key === baseListKey || key.startsWith(`${baseListKey}:`)) {
                  const list = entityState.lists[key];
                  if (Array.isArray(list)) {
                    const filteredList = list.filter((item: any) => item.id !== id);
                    entityState.actions.setList(key, filteredList);
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

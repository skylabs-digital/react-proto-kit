import { useState, useCallback } from 'react';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';
import { toUnknownErrorResponse, toValidationErrorResponse } from '../utils/mutationHelpers';
import { ApiResponse, ErrorResponse } from '../types';
import { byIdCacheKey, listCacheKey } from '../utils/cacheKey';
import { z } from 'zod';

export interface UseUpdateMutationResult<TInput, TEntity = unknown> {
  mutate: (id: string, data: TInput) => Promise<ApiResponse<TEntity>>;
  loading: boolean;
  error: ErrorResponse | null;
}

// Unified hook that automatically detects global state availability
export function useUpdateMutation<TInput, TEntity>(
  entity: string,
  endpoint?: string, // Optional endpoint, defaults to entity
  schema?: z.ZodSchema<TInput>
): UseUpdateMutationResult<TInput, TEntity> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  // Only get entity state if global state is available
  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (id: string, data: TInput): Promise<ApiResponse<TEntity>> => {
      setLoading(true);
      setError(null);

      try {
        if (schema) {
          const validationResult = schema.safeParse(data);
          if (!validationResult.success) {
            const errorResponse = toValidationErrorResponse(validationResult.error, data);
            setError(errorResponse);
            return errorResponse;
          }
        }

        const baseEndpoint = endpoint || entity;
        const updateEndpoint = `${baseEndpoint}/${id}`;

        const response = await connector.put<TEntity>(updateEndpoint, data);

        if (response.success) {
          if (globalState && entityState) {
            // Fast path: update the cache directly so the UI reflects the
            // change without waiting for a refetch.
            const individualCacheKey = byIdCacheKey(`${baseEndpoint}/${id}`);

            // Preserve fields not in the upsert schema by merging.
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

          // Trigger a background refetch via stale-while-revalidate to keep
          // the cache aligned with the backend after filter-sensitive updates.
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
    [connector, entity, endpoint, schema, globalState, entityState]
  );

  return {
    mutate,
    loading,
    error,
  };
}

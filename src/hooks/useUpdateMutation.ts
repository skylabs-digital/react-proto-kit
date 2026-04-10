import { useState, useCallback } from 'react';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { toUnknownErrorResponse, toValidationErrorResponse } from '../utils/mutationHelpers';
import { ApiResponse, ErrorResponse } from '../types';
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
          // Handle global state if available
          if (globalState && entityState) {
            // Update individual entity data using the same cache key format as useById
            const baseEndpoint = endpoint || entity;
            const individualCacheKey = `${baseEndpoint}/${id}`;

            // Get existing data to preserve fields not in upsertSchema
            const existingData = entityState.data?.[individualCacheKey];
            const mergedData = existingData ? { ...existingData, ...response.data } : response.data;
            entityState.actions.setData(individualCacheKey, mergedData);

            // Update item in specific lists for this endpoint
            const baseEndpointForCache = endpoint || entity;
            const specificCacheKey = `list:${baseEndpointForCache}`;

            // Safe check before accessing entityState.lists
            if (entityState.lists && typeof entityState.lists === 'object') {
              Object.keys(entityState.lists).forEach(listKey => {
                // Only update lists that match this endpoint pattern
                if (listKey.startsWith(specificCacheKey)) {
                  const currentList = entityState.lists[listKey];
                  if (Array.isArray(currentList)) {
                    const updatedList = currentList.map((item: any) =>
                      item.id === id ? { ...item, ...response.data } : item
                    );
                    entityState.actions.setList(listKey, updatedList);
                  }
                }
              });
            }

            // No invalidation - we've updated the state directly
            // This prevents the flash from refetching
          }

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

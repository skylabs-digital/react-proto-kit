import { useState, useCallback } from 'react';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { debugLogger } from '../utils/debug';
import { ErrorResponse } from '../types';

export interface UsePatchMutationResult<TInput> {
  mutate: (id: string, data: TInput) => Promise<void>;
  loading: boolean;
  error: ErrorResponse | null;
}

// Unified hook that automatically detects global state availability
export function usePatchMutation<TInput, TEntity>(
  entity: string,
  endpoint?: string
): UsePatchMutationResult<TInput> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  // Only get entity state if global state is available
  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (id: string, data: TInput) => {
      setLoading(true);
      setError(null);

      try {
        const baseEndpoint = endpoint || entity;
        const patchEndpoint = `${baseEndpoint}/${id}`;
        console.log('🔍 PATCH mutation:', {
          entity,
          endpoint: baseEndpoint,
          id,
          patchEndpoint,
          data,
        });
        debugLogger.logRequest('PATCH', patchEndpoint, data);

        const response = await connector.patch<TEntity>(patchEndpoint, data);

        if (response.success) {
          // Handle global state if available
          if (globalState && entityState) {
            // Update individual entity data
            entityState.actions.setData(id, response.data);

            // Update item in specific lists for this endpoint
            const baseEndpointForCache = endpoint || entity;
            const specificCacheKey = `list:${baseEndpointForCache}`;
            console.log('🔍 PATCH updating cache:', {
              entity,
              endpoint,
              baseEndpointForCache,
              specificCacheKey,
              availableKeys: Object.keys(entityState.lists),
              id,
            });

            Object.keys(entityState.lists).forEach(listKey => {
              // Only update lists that match this endpoint pattern
              if (listKey.startsWith(specificCacheKey)) {
                const currentList = entityState.lists[listKey];
                console.log('🔍 PATCH updating list:', {
                  listKey,
                  currentLength: currentList?.length,
                });
                if (Array.isArray(currentList)) {
                  const updatedList = currentList.map((item: any) =>
                    item.id === id ? { ...item, ...response.data } : item
                  );
                  entityState.actions.setList(listKey, updatedList);
                  console.log('🔍 PATCH after update:', { newLength: updatedList.length });
                }
              }
            });

            // No invalidation - we've updated the state directly
            // This prevents the flash from refetching
          }

          debugLogger.logResponse('PATCH', `${entity}/${id}`, response);
        } else {
          setError(response as ErrorResponse);
          debugLogger.logResponse('PATCH', `${entity}/${id}`, response);
        }
      } catch (err) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error',
          error: { code: 'UNKNOWN_ERROR' },
        };
        setError(errorResponse);
        debugLogger.logResponse('PATCH', `${entity}/${id}`, errorResponse);
      } finally {
        setLoading(false);
      }
    },
    [connector, entity, globalState, entityState]
  );

  return {
    mutate,
    loading,
    error,
  };
}

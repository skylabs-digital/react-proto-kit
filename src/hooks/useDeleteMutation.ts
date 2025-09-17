import { useState, useCallback } from 'react';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { debugLogger } from '../utils/debug';
import { ErrorResponse } from '../types';

export interface UseDeleteMutationResult {
  mutate: (id: string) => Promise<void>;
  loading: boolean;
  error: ErrorResponse | null;
}

// Unified hook that can work with or without global state
export function useDeleteMutation<TEntity>(
  entity: string,
  endpoint?: string
): UseDeleteMutationResult {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  // Only get entity state if global state is enabled
  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const baseEndpoint = endpoint || entity;
        const deleteEndpoint = `${baseEndpoint}/${id}`;
        debugLogger.logRequest('DELETE', deleteEndpoint, undefined);

        const response = await connector.delete(deleteEndpoint);

        if (response.success) {
          // Handle global state if enabled and available
          if (globalState && entityState) {
            // Remove from specific lists for this endpoint
            const baseEndpointForCache = endpoint || entity;
            const specificCacheKey = `list:${baseEndpointForCache}`;

            Object.keys(entityState.lists).forEach(listKey => {
              // Only update lists that match this endpoint pattern
              if (listKey.startsWith(specificCacheKey)) {
                const list = entityState.lists[listKey];
                if (Array.isArray(list)) {
                  const filteredList = list.filter((item: any) => item.id !== id);
                  entityState.actions.setList(listKey, filteredList);
                }
              }
            });

            // No invalidation - we've updated the state directly
            // This prevents the flash from refetching
          }

          debugLogger.logResponse('DELETE', `${entity}/${id}`, response);
        } else {
          setError(response as ErrorResponse);
          debugLogger.logResponse('DELETE', `${entity}/${id}`, response);
        }
      } catch (err) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error',
          error: { code: 'UNKNOWN_ERROR' },
        };
        setError(errorResponse);
        debugLogger.logResponse('DELETE', `${entity}/${id}`, errorResponse);
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

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { ErrorResponse, UseCreateMutationResult } from '../types';
import { debugLogger } from '../utils/debug';

interface UseCreateMutationOptions {
  globalState?: boolean;
  optimistic?: boolean;
}

// Unified hook that can work with or without global state
export function useCreateMutation<TInput, TOutput>(
  entity: string,
  schema?: z.ZodSchema<TInput>,
  options: UseCreateMutationOptions = { globalState: true }
): UseCreateMutationResult<TInput, TOutput> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  // Extract options to avoid recreating callback dependencies
  const { optimistic } = options;

  // Only get entity state if global state is enabled
  const entityState = useEntityState<TOutput>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput> => {
      setLoading(true);
      setError(null);

      // Generate temporary ID for optimistic updates
      const tempId = optimistic ? `temp_${Date.now()}_${Math.random()}` : null;

      try {
        // Validate input with Zod schema if provided
        if (schema) {
          try {
            schema.parse(input);
          } catch (validationError) {
            if (validationError instanceof z.ZodError) {
              const errorResponse: ErrorResponse = {
                success: false,
                message: 'Validation failed',
                error: { code: 'VALIDATION_ERROR' },
                type: 'VALIDATION',
                validation: validationError.issues.reduce((acc: Record<string, string>, err) => {
                  const path = err.path.join('.');
                  acc[path] = err.message;
                  return acc;
                }, {}),
              };

              debugLogger.logValidationError(input, validationError, errorResponse.validation);

              setError(errorResponse);
              setLoading(false);
              return Promise.reject(errorResponse);
            }
            throw validationError;
          }
        }

        // Optimistic update for global state
        if (optimistic && globalState && entityState && tempId) {
          // Note: addOptimistic method needs to be implemented in entityState
          // const optimisticData = { ...input, id: tempId } as unknown as TOutput;
          // entityState.actions.addOptimistic(tempId, optimisticData);
        }

        debugLogger.logRequest('POST', entity, input);

        const response = await connector.post<TOutput>(entity, input);

        if (response.success) {
          // Handle global state updates
          if (globalState && entityState) {
            // Add new item to global state (both optimistic and regular paths)
            if (response.data && typeof response.data === 'object' && 'id' in response.data) {
              // Update individual entity data
              entityState.actions.setData((response.data as any).id, response.data);

              // Add to all existing lists (prepend to show newest first)
              Object.keys(entityState.lists).forEach(listKey => {
                const currentList = entityState.lists[listKey];
                if (Array.isArray(currentList)) {
                  // Add the new item to the beginning of each list
                  entityState.actions.setList(listKey, [response.data, ...currentList]);
                }
              });
            }

            if (optimistic && tempId) {
              // Replace optimistic data with real data (if needed)
              // entityState.actions.confirmOptimistic(tempId, response.data);
            }

            // No need to invalidate - we've updated the state directly
            // This prevents the flash from refetching
          }

          debugLogger.logResponse('POST', entity, response);
          return response.data;
        } else {
          const errorResponse = response as ErrorResponse;

          // Rollback optimistic update on error
          if (optimistic && globalState && entityState && tempId) {
            entityState.actions.rollbackOptimistic(tempId);
          }

          setError(errorResponse);
          debugLogger.logResponse('POST', entity, response);
          throw new Error(errorResponse.message || 'Create mutation failed');
        }
      } catch (err) {
        // Rollback optimistic update on error
        if (optimistic && globalState && entityState && tempId) {
          entityState.actions.rollbackOptimistic(tempId);
        }

        const errorResponse: ErrorResponse = {
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error',
          error: { code: 'CREATE_MUTATION_ERROR' },
        };
        setError(errorResponse);
        debugLogger.logResponse('POST', entity, errorResponse);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [connector, entity, schema, globalState, optimistic, entityState]
  );

  return {
    mutate,
    loading,
    error,
  };
}

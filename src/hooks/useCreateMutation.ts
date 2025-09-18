import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { ErrorResponse, UseCreateMutationResult } from '../types';
import { debugLogger } from '../utils/debug';

// Helper function to extract default values from Zod schema
function extractDefaultValues(schema: z.ZodSchema<any>): Record<string, any> {
  const defaults: Record<string, any> = {};

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    for (const [key, fieldSchema] of Object.entries(shape)) {
      try {
        if (fieldSchema instanceof z.ZodDefault) {
          const defaultValue = fieldSchema._def.defaultValue;
          defaults[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
        } else if (
          fieldSchema instanceof z.ZodOptional &&
          fieldSchema._def.innerType instanceof z.ZodDefault
        ) {
          const defaultValue = fieldSchema._def.innerType._def.defaultValue;
          defaults[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
        }
      } catch (error) {
        // Skip fields that can't be processed
        console.warn(`Could not extract default value for field ${key}:`, error);
      }
    }
  }

  return defaults;
}

interface UseCreateMutationOptions {
  globalState?: boolean;
  optimistic?: boolean;
  entitySchema?: z.ZodSchema<any>;
}

// Unified hook that can work with or without global state
export function useCreateMutation<TInput, TOutput>(
  entity: string,
  endpoint?: string, // Optional endpoint, defaults to entity
  schema?: z.ZodSchema<TInput>,
  options: UseCreateMutationOptions = { globalState: true }
): UseCreateMutationResult<TInput, TOutput> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  // Extract options to avoid recreating callback dependencies
  const { optimistic, entitySchema } = options;

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

        // Apply default values from entitySchema if provided
        let dataToSend = input;
        if (entitySchema) {
          const defaultValues = extractDefaultValues(entitySchema);
          dataToSend = { ...defaultValues, ...input } as TInput;
        }

        const requestEndpoint = endpoint || entity;

        const response = await connector.post<TOutput>(requestEndpoint, dataToSend);

        if (response.success) {
          // Handle global state updates
          if (globalState && entityState) {
            // Add new item to global state (both optimistic and regular paths)

            // Store individual entity data for useById compatibility
            if (response.data && (response.data as any).id) {
              const requestEndpoint = endpoint || entity;
              const individualCacheKey = `${requestEndpoint}/${(response.data as any).id}`;
              entityState.actions.setData(individualCacheKey, response.data);
            }

            // Add to the specific list for this endpoint (prepend to show newest first)
            const requestEndpointForCache = endpoint || entity;
            const specificCacheKey = `list:${requestEndpointForCache}`;

            // Safe check before accessing entityState.lists
            if (entityState.lists && typeof entityState.lists === 'object') {
              Object.keys(entityState.lists).forEach(listKey => {
                // Only update lists that match this endpoint pattern
                if (listKey.startsWith(specificCacheKey)) {
                  const currentList = entityState.lists[listKey];
                  if (Array.isArray(currentList)) {
                    // Add the new item to the beginning of this specific list
                    entityState.actions.setList(listKey, [response.data, ...currentList]);
                  }
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

          return response.data;
        } else {
          const errorResponse = response as ErrorResponse;

          // Rollback optimistic update on error
          if (optimistic && globalState && entityState && tempId) {
            entityState.actions.rollbackOptimistic(tempId);
          }

          setError(errorResponse);
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

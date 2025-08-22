import { useState, useCallback } from 'react';
import { z } from 'zod';
import { UseMutationResult, ErrorResponse } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';

export function useMutationWithGlobalState<TInput, TOutput = void>(
  entity: string,
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  schema?: z.ZodSchema,
  options?: {
    optimistic?: boolean;
    invalidateRelated?: string[];
  }
): UseMutationResult<TInput, TOutput> {
  const { connector } = useApiClient();
  const entityState = useEntityState<TOutput>(entity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput> => {
      setLoading(true);
      setError(null);

      let tempId: string | undefined;

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
              setError(errorResponse);
              throw new Error('Validation failed');
            }
            throw validationError;
          }
        }

        // Optimistic update for CREATE operations
        if (options?.optimistic && method === 'POST') {
          tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          entityState.actions.optimisticUpdate('new', input as any, tempId);
        }

        let response;

        switch (method) {
          case 'POST':
            response = await connector.post<TOutput>(endpoint, input);
            break;
          case 'PUT':
            response = await connector.put<TOutput>(endpoint, input);
            break;
          case 'DELETE':
            response = await connector.delete<TOutput>(endpoint);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        if (response.success) {
          // Confirm optimistic update or update cache
          if (tempId) {
            entityState.actions.confirmOptimistic(tempId, response.data);
          }

          // Invalidate related entities
          const invalidationTargets = globalInvalidationManager.getInvalidationTargets(entity);
          invalidationTargets.forEach(targetEntity => {
            globalInvalidationManager.invalidate(targetEntity, response.data);
          });

          // Invalidate additional entities if specified
          if (options?.invalidateRelated) {
            options.invalidateRelated.forEach(targetEntity => {
              globalInvalidationManager.invalidate(targetEntity, response.data);
            });
          }

          return response.data;
        } else {
          // Rollback optimistic update
          if (tempId) {
            entityState.actions.rollbackOptimistic(tempId);
          }

          const errorResponse = response as ErrorResponse;
          setError(errorResponse);
          throw new Error(errorResponse.message || 'Mutation failed');
        }
      } catch (err) {
        // Rollback optimistic update
        if (tempId) {
          entityState.actions.rollbackOptimistic(tempId);
        }

        const errorResponse: ErrorResponse = {
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error',
          error: { code: 'MUTATION_ERROR' },
        };
        setError(errorResponse);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [connector, endpoint, method, schema, entityState, entity, options]
  );

  return {
    mutate,
    loading,
    error,
  };
}

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { UseMutationResult, ErrorResponse } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';
import { debugLogger } from '../utils/debug';
import { LocalStorageConnector } from '../connectors/LocalStorageConnector';

export function useMutationWithGlobalState<TInput, TOutput = void>(
  entity: string,
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  schema?: z.ZodSchema,
  options?: {
    optimistic?: boolean;
    invalidateRelated?: string[];
    entitySchema?: z.ZodSchema; // Schema for default value extraction
  }
): UseMutationResult<TInput, TOutput> {
  const { connector } = useApiClient();
  const entityState = useEntityState<TOutput>(entity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const mutate = useCallback(
    async (input: TInput, dynamicId?: string): Promise<TOutput> => {
      setLoading(true);
      setError(null);

      let tempId: string | undefined;

      try {
        // Build final endpoint with dynamic ID if provided
        const finalEndpoint = dynamicId ? `${endpoint}/${dynamicId}` : endpoint;

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

              // Debug logging for validation errors
              debugLogger.logResponse(method, endpoint, errorResponse, 0);
              debugLogger.logValidationError(input, validationError, errorResponse.validation);

              setError(errorResponse);
              setLoading(false);
              return Promise.reject(errorResponse);
            }
            throw validationError;
          }
        }

        // Optimistic update for CREATE operations
        if (options?.optimistic && method === 'POST') {
          tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const optimisticData = {
            ...input,
            id: tempId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          entityState.actions.optimisticUpdate(tempId, optimisticData as any, tempId);
        }

        let response;

        switch (method) {
          case 'POST':
            // Pass entitySchema to LocalStorageConnector for default value application
            if (connector instanceof LocalStorageConnector) {
              const schemaForDefaults = options?.entitySchema || schema;
              response = await connector.post<TOutput>(finalEndpoint, input, schemaForDefaults);
            } else {
              response = await connector.post<TOutput>(finalEndpoint, input);
            }
            break;
          case 'PUT':
            response = await connector.put<TOutput>(finalEndpoint, input);
            break;
          case 'DELETE':
            response = await connector.delete<TOutput>(finalEndpoint, input);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        if (response.success) {
          // Confirm optimistic update or update cache
          if (tempId) {
            entityState.actions.confirmOptimistic(tempId, response.data);
          } else {
            // For non-optimistic updates, update lists directly instead of invalidating
            if (method === 'POST' && response.data && (response.data as any).id) {
              entityState.actions.setData((response.data as any).id, response.data);

              // Update all existing list caches by adding the new item
              const existingLists = entityState.lists || {};
              console.log('🔍 Mutation Debug:', {
                entity,
                endpoint: finalEndpoint,
                existingLists: Object.keys(existingLists),
                responseData: response.data,
              });
              Object.keys(existingLists).forEach(listKey => {
                const currentList = existingLists[listKey];
                if (Array.isArray(currentList)) {
                  entityState.actions.setList(listKey, [...currentList, response.data]);
                  console.log('📝 Updated list:', listKey, 'new length:', currentList.length + 1);
                }
              });

              // If no lists exist yet, create the main 'list' cache
              if (Object.keys(existingLists).length === 0) {
                entityState.actions.setList('list', [response.data]);
                console.log('📝 Created new list cache with item');
              }

              // Force invalidation to trigger re-renders for all list observers
              console.log('🔄 Invalidating entity:', entity);
              globalInvalidationManager.invalidate(entity, response.data);
            } else if (method === 'PUT' && response.data && (response.data as any).id) {
              entityState.actions.setData((response.data as any).id, response.data);
              // Update the item in the list cache
              const currentList = entityState.lists?.['list'] || [];
              const updatedList = currentList.map(item =>
                (item as any).id === (response.data as any).id ? response.data : item
              );
              entityState.actions.setList('list', updatedList);
            } else if (method === 'DELETE') {
              // Extract ID from endpoint or use dynamicId for DELETE operations
              const idMatch = finalEndpoint.match(/\/([^/]+)$/);
              const deletedId = idMatch ? idMatch[1] : dynamicId;

              if (deletedId) {
                // Remove from all list caches
                Object.keys(entityState.lists || {}).forEach(listKey => {
                  const currentList = entityState.lists?.[listKey] || [];
                  if (Array.isArray(currentList)) {
                    const updatedList = currentList.filter(item => (item as any).id !== deletedId);
                    entityState.actions.setList(listKey, updatedList);
                  }
                });
              }
            }
          }

          // Don't invalidate - let optimistic updates handle the UI changes
          // Only invalidate other entities, not the current one
          if (options?.invalidateRelated) {
            debugLogger.logInvalidation(entity, options.invalidateRelated);
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

        // Handle different error types
        if (err && typeof err === 'object' && 'success' in err && err.success === false) {
          // This is already a formatted ErrorResponse (e.g., from validation)
          setError(err as ErrorResponse);
          return Promise.reject(err);
        }

        const errorResponse: ErrorResponse = {
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error',
          error: { code: 'MUTATION_ERROR' },
        };

        // Debug logging for general errors
        debugLogger.logResponse(method, endpoint, errorResponse, 0);
        debugLogger.logMutationError(err, input);

        setError(errorResponse);
        return Promise.reject(errorResponse);
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

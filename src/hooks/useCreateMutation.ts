import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';
import { ApiResponse, ErrorResponse, UseCreateMutationResult } from '../types';
import { toUnknownErrorResponse, toValidationErrorResponse } from '../utils/mutationHelpers';
import { byIdCacheKey, listCacheKey } from '../utils/cacheKey';

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
  entitySchema?: z.ZodSchema<any>;
  /**
   * Query parameters to attach to the POST request (e.g. tenant id, api
   * version, feature flags). Used by createDomainApi.withQuery() to propagate
   * dynamic params to mutations.
   */
  queryParams?: Record<string, any>;
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

  const { entitySchema, queryParams } = options;
  // Stable key for useCallback deps so inline queryParams objects don't
  // force the mutation callback to be recreated every render.
  const queryParamsKey = queryParams ? JSON.stringify(queryParams) : undefined;

  // Only get entity state if global state is enabled
  const entityState = useEntityState<TOutput>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (input: TInput): Promise<ApiResponse<TOutput>> => {
      setLoading(true);
      setError(null);

      try {
        if (schema) {
          const validationResult = schema.safeParse(input);
          if (!validationResult.success) {
            const errorResponse = toValidationErrorResponse(validationResult.error, input);
            setError(errorResponse);
            return errorResponse;
          }
        }

        // Apply default values from entitySchema if provided
        let dataToSend = input;
        if (entitySchema) {
          const defaultValues = extractDefaultValues(entitySchema);
          dataToSend = { ...defaultValues, ...input } as TInput;
        }

        const requestEndpoint = endpoint || entity;

        const response = await connector.post<TOutput>(requestEndpoint, dataToSend, queryParams);

        if (response.success) {
          if (globalState && entityState) {
            // Fast path: update the cache directly so the UI reflects the new
            // item without waiting for a network round-trip.
            // Store individual entity data using the same key format as useById.
            if (response.data && (response.data as any).id) {
              const individualCacheKey = byIdCacheKey(
                `${requestEndpoint}/${(response.data as any).id}`
              );
              entityState.actions.setData(individualCacheKey, response.data);
            }

            // Prepend the new item to every list cached under this endpoint.
            // We match both the exact no-params key and any variant that
            // extends it with `:` (params/queryParams).
            const baseListKey = listCacheKey(requestEndpoint);
            if (entityState.lists && typeof entityState.lists === 'object') {
              Object.keys(entityState.lists).forEach(key => {
                if (key === baseListKey || key.startsWith(`${baseListKey}:`)) {
                  const currentList = entityState.lists[key];
                  if (Array.isArray(currentList)) {
                    entityState.actions.setList(key, [response.data, ...currentList]);
                  }
                }
              });
            }
          }

          // Notify cache subscribers (useList / useById / useRecord) so they
          // can refetch in the background via stale-while-revalidate. The
          // fast-path update above keeps the UI responsive; this ensures the
          // backend remains the source of truth and corrects any drift in
          // filtered/sorted lists.
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
    [connector, entity, endpoint, schema, globalState, entityState, entitySchema, queryParamsKey]
  );

  return {
    mutate,
    loading,
    error,
  };
}

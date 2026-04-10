import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { ApiResponse, ErrorResponse, UseCreateMutationResult } from '../types';
import { toUnknownErrorResponse, toValidationErrorResponse } from '../utils/mutationHelpers';

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

  const { entitySchema } = options;

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

        const response = await connector.post<TOutput>(requestEndpoint, dataToSend);

        if (response.success) {
          if (globalState && entityState) {
            // Store individual entity data for useById compatibility
            if (response.data && (response.data as any).id) {
              const individualCacheKey = `${requestEndpoint}/${(response.data as any).id}`;
              entityState.actions.setData(individualCacheKey, response.data);
            }

            // Add to the specific list for this endpoint (prepend to show newest first)
            const specificCacheKey = `list:${requestEndpoint}`;

            if (entityState.lists && typeof entityState.lists === 'object') {
              Object.keys(entityState.lists).forEach(listKey => {
                if (listKey.startsWith(specificCacheKey)) {
                  const currentList = entityState.lists[listKey];
                  if (Array.isArray(currentList)) {
                    entityState.actions.setList(listKey, [response.data, ...currentList]);
                  }
                }
              });
            }
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
    [connector, entity, endpoint, schema, globalState, entityState, entitySchema]
  );

  return {
    mutate,
    loading,
    error,
  };
}

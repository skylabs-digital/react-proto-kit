import { useState, useCallback } from 'react';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { ErrorResponse } from '../types';
import { z } from 'zod';

export interface UseSingleRecordUpdateResult<TInput> {
  mutate: (data: TInput) => Promise<void>;
  loading: boolean;
  error: ErrorResponse | null;
}

export interface UseSingleRecordResetResult {
  mutate: () => Promise<void>;
  loading: boolean;
  error: ErrorResponse | null;
}

/**
 * Update mutation for single record endpoints (no ID appending).
 * Uses PUT method on the exact endpoint provided.
 */
export function useSingleRecordUpdate<TInput, TEntity>(
  entity: string,
  endpoint: string,
  schema?: z.ZodSchema<TInput>
): UseSingleRecordUpdateResult<TInput> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (data: TInput) => {
      setLoading(true);
      setError(null);

      try {
        // Validate input data if schema is provided
        if (schema) {
          const validationResult = schema.safeParse(data);
          if (!validationResult.success) {
            const errorResponse: ErrorResponse = {
              success: false,
              message: 'Validation failed',
              error: { code: 'VALIDATION_ERROR' },
              type: 'VALIDATION',
            };
            setError(errorResponse);
            return;
          }
        }

        // Use endpoint directly - no ID appending
        const response = await connector.put<TEntity>(endpoint, data);

        if (response.success) {
          if (globalState && entityState) {
            // Update cache using endpoint as cache key
            entityState.actions.setData(endpoint, response.data);
          }
        } else {
          setError(response as ErrorResponse);
        }
      } catch (err) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error',
          error: { code: 'UNKNOWN_ERROR' },
        };
        setError(errorResponse);
      } finally {
        setLoading(false);
      }
    },
    [connector, endpoint, schema, globalState, entityState]
  );

  return { mutate, loading, error };
}

/**
 * Patch mutation for single record endpoints (no ID appending).
 * Uses PATCH method on the exact endpoint provided.
 */
export function useSingleRecordPatch<TInput, TEntity>(
  entity: string,
  endpoint: string
): UseSingleRecordUpdateResult<TInput> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (data: TInput) => {
      setLoading(true);
      setError(null);

      try {
        // Use endpoint directly - no ID appending
        const response = await connector.patch<TEntity>(endpoint, data);

        if (response.success) {
          if (globalState && entityState) {
            // Update cache - merge with existing data
            const existingData = entityState.data?.[endpoint];
            const mergedData = existingData ? { ...existingData, ...response.data } : response.data;
            entityState.actions.setData(endpoint, mergedData);
          }
        } else {
          setError(response as ErrorResponse);
        }
      } catch (err) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error',
          error: { code: 'UNKNOWN_ERROR' },
        };
        setError(errorResponse);
      } finally {
        setLoading(false);
      }
    },
    [connector, endpoint, globalState, entityState]
  );

  return { mutate, loading, error };
}

/**
 * Reset/Delete mutation for single record endpoints (no ID appending).
 * Uses DELETE method on the exact endpoint provided.
 */
export function useSingleRecordReset<TEntity>(
  entity: string,
  endpoint: string
): UseSingleRecordResetResult {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use endpoint directly - no ID appending
      const response = await connector.delete(endpoint);

      if (response.success) {
        if (globalState && entityState) {
          // Clear cache for this endpoint
          entityState.actions.setData(endpoint, undefined as any);
        }
      } else {
        setError(response as ErrorResponse);
      }
    } catch (err) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        error: { code: 'UNKNOWN_ERROR' },
      };
      setError(errorResponse);
    } finally {
      setLoading(false);
    }
  }, [connector, endpoint, globalState, entityState]);

  return { mutate, loading, error };
}

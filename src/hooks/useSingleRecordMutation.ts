import { useState, useCallback } from 'react';
import { useApiClient } from '../provider/ApiClientProvider';
import { useEntityState } from '../context/GlobalStateProvider';
import { globalInvalidationManager } from '../context/InvalidationManager';
import { toUnknownErrorResponse, toValidationErrorResponse } from '../utils/mutationHelpers';
import { ApiResponse, ErrorResponse } from '../types';
import { recordCacheKey } from '../utils/cacheKey';
import { z } from 'zod';

export interface UseSingleRecordUpdateResult<TInput, TEntity = unknown> {
  mutate: (data: TInput) => Promise<ApiResponse<TEntity>>;
  loading: boolean;
  error: ErrorResponse | null;
}

export interface UseSingleRecordResetResult {
  mutate: () => Promise<ApiResponse<void>>;
  loading: boolean;
  error: ErrorResponse | null;
}

interface UseSingleRecordMutationOptions {
  /**
   * Query parameters attached to the mutation request. Used by
   * createSingleRecordApi.withQuery() to propagate dynamic params.
   */
  queryParams?: Record<string, any>;
}

/**
 * Update mutation for single record endpoints (no ID appending).
 * Uses PUT method on the exact endpoint provided.
 */
export function useSingleRecordUpdate<TInput, TEntity>(
  entity: string,
  endpoint: string,
  schema?: z.ZodSchema<TInput>,
  options?: UseSingleRecordMutationOptions
): UseSingleRecordUpdateResult<TInput, TEntity> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const queryParams = options?.queryParams;
  const queryParamsKey = queryParams ? JSON.stringify(queryParams) : undefined;

  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (data: TInput): Promise<ApiResponse<TEntity>> => {
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

        const response = await connector.put<TEntity>(endpoint, data, queryParams);

        if (response.success) {
          if (globalState && entityState) {
            // Fast path: use the same cacheKey format that useRecord reads from,
            // including any query params so `withQuery` variants stay aligned.
            entityState.actions.setData(recordCacheKey(endpoint, queryParams), response.data);
          }
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
    [connector, entity, endpoint, schema, globalState, entityState, queryParamsKey]
  );

  return { mutate, loading, error };
}

/**
 * Patch mutation for single record endpoints (no ID appending).
 * Uses PATCH method on the exact endpoint provided.
 */
export function useSingleRecordPatch<TInput, TEntity>(
  entity: string,
  endpoint: string,
  options?: UseSingleRecordMutationOptions
): UseSingleRecordUpdateResult<TInput, TEntity> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const queryParams = options?.queryParams;
  const queryParamsKey = queryParams ? JSON.stringify(queryParams) : undefined;

  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(
    async (data: TInput): Promise<ApiResponse<TEntity>> => {
      setLoading(true);
      setError(null);

      try {
        // Use endpoint directly - no ID appending
        const response = await connector.patch<TEntity>(endpoint, data, queryParams);

        if (response.success) {
          if (globalState && entityState) {
            // Fast path: merge into the cache using the same key as useRecord,
            // including query params so `withQuery` variants stay aligned.
            const cacheKey = recordCacheKey(endpoint, queryParams);
            const existingData = entityState.data?.[cacheKey];
            const mergedData = existingData ? { ...existingData, ...response.data } : response.data;
            entityState.actions.setData(cacheKey, mergedData);
          }
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
    [connector, entity, endpoint, globalState, entityState, queryParamsKey]
  );

  return { mutate, loading, error };
}

/**
 * Reset/Delete mutation for single record endpoints (no ID appending).
 * Uses DELETE method on the exact endpoint provided.
 */
export function useSingleRecordReset<TEntity>(
  entity: string,
  endpoint: string,
  options?: UseSingleRecordMutationOptions
): UseSingleRecordResetResult {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const queryParams = options?.queryParams;
  const queryParamsKey = queryParams ? JSON.stringify(queryParams) : undefined;

  const entityState = useEntityState<TEntity>(entity);
  const globalState = !!entityState;

  const mutate = useCallback(async (): Promise<ApiResponse<void>> => {
    setLoading(true);
    setError(null);

    try {
      // Use endpoint directly - no ID appending
      const response = await connector.delete<void>(endpoint, undefined, queryParams);

      if (response.success) {
        if (globalState && entityState) {
          // Clear cache for this endpoint using the same key as useRecord,
          // including query params so `withQuery` variants stay aligned.
          entityState.actions.setData(recordCacheKey(endpoint, queryParams), undefined as any);
        }
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
  }, [connector, entity, endpoint, globalState, entityState, queryParamsKey]);

  return { mutate, loading, error };
}

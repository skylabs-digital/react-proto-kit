import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useApiClient } from '../provider/ApiClientProvider';
import { ErrorResponse } from '../types';
import { debugLogger } from '../utils/debug';

export function useMutation<TInput, TOutput = void>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  schema?: z.ZodSchema
): {
  mutate: (input: TInput, dynamicId?: string) => Promise<TOutput>;
  loading: boolean;
  error: ErrorResponse | null;
} {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const mutate = useCallback(
    async (input: TInput, dynamicId?: string): Promise<TOutput> => {
      setLoading(true);
      setError(null);

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

              // Debug logging for validation errors
              debugLogger.logValidationError(input, validationError, errorResponse.validation);

              setError(errorResponse);
              setLoading(false);
              return Promise.reject(errorResponse);
            }
            throw validationError;
          }
        }

        // Build final endpoint with dynamic ID if provided
        const finalEndpoint = dynamicId ? `${endpoint}/${dynamicId}` : endpoint;

        let response;

        switch (method) {
          case 'POST':
            response = await connector.post<TOutput>(finalEndpoint, input);
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
          return response.data;
        } else {
          const errorResponse = response as ErrorResponse;
          setError(errorResponse);
          throw new Error(errorResponse.message || 'Mutation failed');
        }
      } catch (err) {
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
    [connector, endpoint, method, schema]
  );

  return {
    mutate,
    loading,
    error,
  };
}

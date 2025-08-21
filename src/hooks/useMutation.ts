import { useState, useCallback } from 'react';
import { z } from 'zod';
import { UseMutationResult, ErrorResponse } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';

export function useMutation<TInput, TOutput = void>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  schema?: z.ZodSchema
): UseMutationResult<TInput, TOutput> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput> => {
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
              setError(errorResponse);
              throw new Error('Validation failed');
            }
            throw validationError;
          }
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

import { useState, useCallback } from 'react';
import { UseMutationResult, ErrorResponse } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';

export function useMutation<TInput, TOutput = void>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
): UseMutationResult<TInput, TOutput> {
  const { connector } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput> => {
      setLoading(true);
      setError(null);

      try {
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
    [connector, endpoint, method]
  );

  return {
    mutate,
    loading,
    error,
  };
}

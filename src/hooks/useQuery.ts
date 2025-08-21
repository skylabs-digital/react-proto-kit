import { useState, useEffect, useCallback } from 'react';
import { UseQueryResult, ErrorResponse } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';

export function useQuery<T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    cacheTime?: number;
  }
): UseQueryResult<T> {
  const { connector } = useApiClient();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const fetchData = useCallback(async () => {
    if (options?.enabled === false) return;

    setLoading(true);
    setError(null);

    try {
      const response = await connector.get<T>(endpoint, params);
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response as ErrorResponse);
        setData(null);
      }
    } catch (err) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        error: { code: 'UNKNOWN_ERROR' },
      };
      setError(errorResponse);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [connector, endpoint, params, options?.enabled]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (options?.refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, options?.refetchOnMount]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

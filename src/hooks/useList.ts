import { useState, useEffect, useCallback } from 'react';
import { UseListResult, ErrorResponse, ListParams, PaginationMeta } from '../types';
import { useApiClient } from '../provider/ApiClientProvider';

export function useList<T>(
  endpoint: string,
  params?: ListParams,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
  }
): UseListResult<T> {
  const { connector } = useApiClient();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);

  const fetchData = useCallback(async () => {
    if (options?.enabled === false) return;

    setLoading(true);
    setError(null);

    try {
      const response = await connector.get<T[]>(endpoint, params);

      if (response.success) {
        setData(response.data);
        setMeta(response.meta);
      } else {
        setError(response as ErrorResponse);
        setData(null);
        setMeta(undefined);
      }
    } catch (err) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        error: { code: 'UNKNOWN_ERROR' },
      };
      setError(errorResponse);
      setData(null);
      setMeta(undefined);
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
    meta,
  };
}

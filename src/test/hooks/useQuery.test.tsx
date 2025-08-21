import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useQuery } from '../../hooks/useQuery';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { IConnector, ApiResponse } from '../../types';

// Mock connector
const mockConnector: IConnector = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

// Test wrapper
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ApiClientProvider connectorType="localStorage" config={{}}>
      {children}
    </ApiClientProvider>
  );
};

// Mock the useApiClient hook to return our mock connector
vi.mock('../../provider/ApiClientProvider', async () => {
  const actual = await vi.importActual('../../provider/ApiClientProvider');
  return {
    ...actual,
    useApiClient: () => ({
      connector: mockConnector,
      config: {},
    }),
  };
});

describe('useQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test Item' };
    const mockResponse: ApiResponse<typeof mockData> = {
      success: true,
      data: mockData,
    };
    
    (mockConnector.get as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useQuery('items/1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(mockConnector.get).toHaveBeenCalledWith('items/1', undefined);
  });

  it('should handle error response', async () => {
    const mockError = {
      success: false,
      message: 'Item not found',
      error: { code: 'NOT_FOUND' },
    };
    
    (mockConnector.get as any).mockResolvedValueOnce(mockError);

    const { result } = renderHook(() => useQuery('items/999'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toEqual(mockError);
  });

  it('should pass parameters to connector', async () => {
    const mockResponse: ApiResponse<any[]> = {
      success: true,
      data: [],
    };
    
    (mockConnector.get as any).mockResolvedValueOnce(mockResponse);

    const params = { page: 1, limit: 10 };
    renderHook(() => useQuery('items', params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockConnector.get).toHaveBeenCalledWith('items', params);
    });
  });

  it('should not fetch when enabled is false', async () => {
    renderHook(() => useQuery('items', undefined, { enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(mockConnector.get).not.toHaveBeenCalled();
  });

  it('should refetch data when refetch is called', async () => {
    const mockData = { id: 1, name: 'Test Item' };
    const mockResponse: ApiResponse<typeof mockData> = {
      success: true,
      data: mockData,
    };
    
    (mockConnector.get as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQuery('items/1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockConnector.get).toHaveBeenCalledTimes(1);

    await result.current.refetch();

    expect(mockConnector.get).toHaveBeenCalledTimes(2);
  });

  it('should handle network errors', async () => {
    (mockConnector.get as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useQuery('items/1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toEqual({
      success: false,
      message: 'Network error',
      error: { code: 'UNKNOWN_ERROR' },
    });
  });
});

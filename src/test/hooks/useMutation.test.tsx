import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useMutation } from '../../hooks/useMutation';
import { ApiClientProvider } from '../../provider/ApiClientProvider';
import { IConnector, ApiResponse, ErrorResponse } from '../../types';

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

// Mock the useApiClient hook
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

describe('useMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute POST mutation successfully', async () => {
    const mockData = { id: 1, name: 'New Item' };
    const mockResponse: ApiResponse<typeof mockData> = {
      success: true,
      data: mockData,
    };

    (mockConnector.post as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useMutation('items', 'POST'), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    const inputData = { name: 'New Item' };

    let returnedData;
    await act(async () => {
      returnedData = await result.current.mutate(inputData);
    });

    expect(returnedData).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(mockConnector.post).toHaveBeenCalledWith('items', inputData);
  });

  it('should execute PUT mutation successfully', async () => {
    const mockData = { id: 1, name: 'Updated Item' };
    const mockResponse: ApiResponse<typeof mockData> = {
      success: true,
      data: mockData,
    };

    (mockConnector.put as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useMutation('items/1', 'PUT'), {
      wrapper: createWrapper(),
    });

    const inputData = { name: 'Updated Item' };

    let returnedData;
    await act(async () => {
      returnedData = await result.current.mutate(inputData);
    });

    expect(returnedData).toEqual(mockData);
    expect(mockConnector.put).toHaveBeenCalledWith('items/1', inputData);
  });

  it('should execute DELETE mutation successfully', async () => {
    const mockResponse: ApiResponse<void> = {
      success: true,
      data: undefined,
    };

    (mockConnector.delete as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useMutation('items/1', 'DELETE'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutate(undefined);
    });

    expect(mockConnector.delete).toHaveBeenCalledWith('items/1');
  });

  it('should handle API error response', async () => {
    const mockError: ErrorResponse = {
      success: false,
      message: 'Validation failed',
      error: { code: 'MUTATION_ERROR' },
    };

    (mockConnector.post as any).mockResolvedValueOnce(mockError);

    const { result } = renderHook(() => useMutation('items', 'POST'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(result.current.mutate({ name: 'Invalid' })).rejects.toThrow('Validation failed');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it('should handle network errors', async () => {
    (mockConnector.post as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMutation('items', 'POST'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(result.current.mutate({ name: 'Test' })).rejects.toThrow('Network error');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual({
      success: false,
      message: 'Network error',
      error: { code: 'MUTATION_ERROR' },
    });
  });

  it('should handle unsupported method', async () => {
    const { result } = renderHook(() => useMutation('items', 'PATCH' as any), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(result.current.mutate({ name: 'Test' })).rejects.toThrow(
        'Unsupported method: PATCH'
      );
    });
  });
});

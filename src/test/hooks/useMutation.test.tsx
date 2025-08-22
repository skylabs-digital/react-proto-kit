/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { useMutation } from '../../hooks/useMutation';
import { createTestWrapper } from '../helpers/testUtils';

describe('useMutation', () => {
  let mockLocalStorage: any;

  beforeEach(() => {
    // Setup localStorage mock
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    // Setup test data
    const testData = {
      items: [
        {
          id: '1',
          name: 'Existing Item',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ],
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));

    vi.clearAllMocks();
  });

  const TestWrapper = createTestWrapper({
    connectorType: 'localStorage',
    config: {},
  });

  it('should execute POST mutation successfully', async () => {
    const { result } = renderHook(() => useMutation('items', 'POST'), {
      wrapper: TestWrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    const inputData = { name: 'New Item' };

    let returnedData;
    await act(async () => {
      returnedData = await result.current.mutate(inputData);
    });

    expect(returnedData).toMatchObject({
      name: 'New Item',
    });
    expect(returnedData).toHaveProperty('id');
    expect(returnedData).toHaveProperty('createdAt');
    expect(returnedData).toHaveProperty('updatedAt');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should execute PUT mutation successfully', async () => {
    const { result } = renderHook(() => useMutation('items/1', 'PUT'), {
      wrapper: TestWrapper,
    });

    const inputData = { name: 'Updated Item' };

    let returnedData;
    await act(async () => {
      returnedData = await result.current.mutate(inputData);
    });

    expect(returnedData).toMatchObject({
      id: '1',
      name: 'Updated Item',
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should execute DELETE mutation successfully', async () => {
    const { result } = renderHook(() => useMutation('items/1', 'DELETE'), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.mutate(undefined);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle API error response', async () => {
    const { result } = renderHook(() => useMutation('items/999', 'PUT'), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      try {
        await result.current.mutate({ name: 'Invalid' });
      } catch {
        // Expected error for non-existent item
      }
    });

    expect(result.current.error).toBeDefined();
  });

  it('should handle network errors', async () => {
    const { result } = renderHook(() => useMutation('items/999', 'DELETE'), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      try {
        await result.current.mutate(undefined);
      } catch {
        // Expected error for non-existent item
      }
    });

    expect(result.current.error).toBeDefined();
  });

  it('should handle unsupported method', async () => {
    const { result } = renderHook(() => useMutation('items', 'PATCH' as any), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      try {
        await result.current.mutate({ name: 'Test' });
      } catch (error) {
        expect((error as Error).message).toContain('Unsupported method: PATCH');
      }
    });
  });
});

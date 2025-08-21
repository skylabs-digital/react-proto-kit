import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FetchConnector } from '../../connectors/FetchConnector';
import { ErrorResponse, SuccessResponse } from '../../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FetchConnector', () => {
  let connector: FetchConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new FetchConnector({
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 1,
    });
  });

  describe('get', () => {
    it('should make GET request and return data', async () => {
      const mockData = { id: 1, name: 'Test Item' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await connector.get('items/1');

      expect(result.success).toBe(true);
      expect((result as SuccessResponse<typeof mockData>).data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('items', { page: 1, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/items?page=1&limit=10',
        expect.any(Object)
      );
    });

    it('should handle API response format', async () => {
      const mockApiResponse = {
        success: true,
        data: { id: 1, name: 'Test' },
        meta: { total: 1 },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await connector.get('items/1');

      expect(result).toEqual(mockApiResponse);
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            message: 'Not found',
            code: 'NOT_FOUND',
          }),
      });

      const result = await connector.get('items/999');

      expect(result.success).toBe(false);
      expect((result as ErrorResponse).error?.code).toBe('NOT_FOUND');
      expect((result as ErrorResponse).message).toBe('Not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await connector.get('items');

      expect(result.success).toBe(false);
      expect((result as ErrorResponse).error?.code).toBe('NETWORK_ERROR');
    });

    it('should handle timeout', async () => {
      const timeoutConnector = new FetchConnector({
        baseUrl: 'https://api.example.com',
        timeout: 100,
      });

      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('The operation was aborted')), 200)
          )
      );

      const result = await timeoutConnector.get('items');

      expect(result.success).toBe(false);
      expect((result as ErrorResponse).error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('post', () => {
    it('should make POST request with data', async () => {
      const mockData = { id: 1, name: 'New Item' };
      const postData = { name: 'New Item' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await connector.post('items', postData);

      expect(result.success).toBe(true);
      expect((result as SuccessResponse<typeof mockData>).data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  describe('put', () => {
    it('should make PUT request with data', async () => {
      const mockData = { id: 1, name: 'Updated Item' };
      const updateData = { name: 'Updated Item' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await connector.put('items/1', updateData);

      expect(result.success).toBe(true);
      expect((result as SuccessResponse<typeof mockData>).data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await connector.delete('items/1');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('retries', () => {
    it('should retry on network failure', async () => {
      const retryConnector = new FetchConnector({
        baseUrl: 'https://api.example.com',
        retries: 2,
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await retryConnector.get('items');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

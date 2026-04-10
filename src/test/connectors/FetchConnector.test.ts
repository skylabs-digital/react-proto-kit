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

    it('flattens nested `filters` onto the query string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('todos', { filters: { status: 'done', priority: 'high' } });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl.startsWith('https://api.example.com/todos?')).toBe(true);
      expect(calledUrl).toContain('status=done');
      expect(calledUrl).toContain('priority=high');
    });

    it('merges `filters` with top-level pagination params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('todos', {
        page: 2,
        limit: 5,
        filters: { status: 'done' },
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=5');
      expect(calledUrl).toContain('status=done');
      // `filters` itself is never serialized as a literal key
      expect(calledUrl).not.toContain('filters=');
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
      expect((result as ErrorResponse).kind).toBe('notFound');
      expect((result as ErrorResponse).message).toBe('Not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await connector.get('items');

      expect(result.success).toBe(false);
      expect((result as ErrorResponse).kind).toBe('network');
    });

    it(
      'should handle timeout',
      async () => {
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
        expect((result as ErrorResponse).kind).toBe('network');
      },
      { timeout: 15000 }
    );
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

    it('normalizes success responses without a `data` key to include data: undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Item deleted successfully' }),
      });

      const result = await connector.delete('items/1');

      expect(result.success).toBe(true);
      expect('data' in result).toBe(true);
      expect((result as SuccessResponse<void>).data).toBeUndefined();
      expect((result as SuccessResponse<void>).message).toBe('Item deleted successfully');
    });
  });

  describe('retries', () => {
    it(
      'should retry on network failure',
      async () => {
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
      },
      { timeout: 15000 }
    );
  });

  describe('error response details propagation', () => {
    it('should preserve extra body fields in ErrorResponse.details for http errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () =>
          Promise.resolve({
            message: 'Stock exceeded',
            code: 'STOCK_EXCEEDED',
            type: 'TRANSACTION',
            items: [
              { productId: 'p1', requested: 5, available: 2 },
              { productId: 'p2', requested: 3, available: 0 },
            ],
            orderId: 'order-123',
          }),
      });

      const result = await connector.get('checkout');

      expect(result.success).toBe(false);
      const err = result as ErrorResponse;
      if (err.kind !== 'http') throw new Error('expected http kind');
      expect(err.message).toBe('Stock exceeded');
      expect(err.code).toBe('STOCK_EXCEEDED');
      expect(err.status).toBe(409);
      expect(err.details).toBeDefined();
      const details = err.details as Record<string, unknown>;
      expect(details.type).toBe('TRANSACTION');
      expect(details.items).toEqual([
        { productId: 'p1', requested: 5, available: 2 },
        { productId: 'p2', requested: 3, available: 0 },
      ]);
      expect(details.orderId).toBe('order-123');
    });

    it('should surface validation errors as kind: validation with fields populated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            message: 'Bad request',
            code: 'BAD_REQUEST',
            type: 'VALIDATION',
            validation: { email: 'Invalid email' },
          }),
      });

      const result = await connector.get('users');

      expect(result.success).toBe(false);
      const err = result as ErrorResponse;
      if (err.kind !== 'validation') throw new Error('expected validation kind');
      expect(err.message).toBe('Bad request');
      expect(err.fields).toEqual({ email: 'Invalid email' });
      // Unknown extras (like `type`) land in details; known keys (message, code,
      // validation) are extracted by httpErrorFromResponse and not duplicated.
      expect(err.details).toBeDefined();
      const details = err.details as Record<string, unknown>;
      expect(details.type).toBe('VALIDATION');
    });

    it('should set details to undefined when error body has only known fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            message: 'Internal error',
          }),
      });

      const result = await connector.get('items');

      expect(result.success).toBe(false);
      const err = result as ErrorResponse;
      if (err.kind !== 'http') throw new Error('expected http kind');
      expect(err.details).toBeUndefined();
    });
  });

  describe('baseUrl trailing slash normalization', () => {
    it('should correctly resolve URLs when baseUrl has no trailing slash', async () => {
      const connectorWithoutSlash = new FetchConnector({
        baseUrl: 'https://api.example.com/v1',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      await connectorWithoutSlash.get('items');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/items',
        expect.any(Object)
      );
    });

    it('should correctly resolve URLs when baseUrl has trailing slash', async () => {
      const connectorWithSlash = new FetchConnector({
        baseUrl: 'https://api.example.com/v1/',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      await connectorWithSlash.get('items');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/items',
        expect.any(Object)
      );
    });

    it('should handle nested paths correctly without trailing slash', async () => {
      const connectorWithoutSlash = new FetchConnector({
        baseUrl: 'http://localhost:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connectorWithoutSlash.get('users/123/posts');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/users/123/posts',
        expect.any(Object)
      );
    });

    it('should handle nested paths correctly with trailing slash', async () => {
      const connectorWithSlash = new FetchConnector({
        baseUrl: 'http://localhost:3000/api/',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connectorWithSlash.get('users/123/posts');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/users/123/posts',
        expect.any(Object)
      );
    });

    it('should handle endpoint with leading slash (baseUrl without trailing)', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://localhost:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('/todos');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/todos', expect.any(Object));
    });

    it('should handle endpoint with leading slash (baseUrl with trailing)', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://localhost:3000/api/',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('/todos');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/todos', expect.any(Object));
    });

    it('should handle simple endpoint without slashes', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://localhost:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('todos');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/todos', expect.any(Object));
    });

    it('should handle endpoint with id', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://localhost:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await connector.get('todos/abc123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/todos/abc123',
        expect.any(Object)
      );
    });

    it('should handle POST to baseUrl with path', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://localhost:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '1' }),
      });

      await connector.post('todos', { text: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/todos',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    // Exact user scenario: http://localhost:3000/api
    it('should preserve /api path with http://localhost:3000/api baseUrl', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://localhost:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('todos');

      // Should be http://localhost:3000/api/todos, NOT http://localhost:3000/todos
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/todos', expect.any(Object));
    });

    it('should preserve /api path with http://localhost:3000/api/ baseUrl (trailing slash)', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://localhost:3000/api/',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('todos');

      // Should be http://localhost:3000/api/todos, NOT http://localhost:3000/todos
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/todos', expect.any(Object));
    });

    // EXACT USER SCENARIO: baseUrl with /api/ and endpoint starting with /
    it('should handle /combos/active endpoint with http://localhost:3000/api/ baseUrl', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://localhost:3000/api/',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      // User's exact endpoint: /combos/active
      await connector.get('/combos/active');

      // Should be http://localhost:3000/api/combos/active
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/combos/active',
        expect.any(Object)
      );
    });

    it('should handle /combos/active endpoint with http://localhost:3000/api baseUrl (no trailing)', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://localhost:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      // User's exact endpoint: /combos/active
      await connector.get('/combos/active');

      // Should be http://localhost:3000/api/combos/active
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/combos/active',
        expect.any(Object)
      );
    });
  });

  describe('IP address as baseUrl', () => {
    it('should work with IP address and port', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://192.168.4.22:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('todos');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.4.22:3000/api/todos',
        expect.any(Object)
      );
    });

    it('should work with IP address, port, and trailing slash', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://192.168.4.22:3000/api/',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('todos');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.4.22:3000/api/todos',
        expect.any(Object)
      );
    });

    it('should work with IP address and leading slash on endpoint', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://192.168.4.22:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('/combos/active');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.4.22:3000/api/combos/active',
        expect.any(Object)
      );
    });

    it('should work with IP address and nested path with ID', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://192.168.4.22:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await connector.get('users/123/posts');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.4.22:3000/api/users/123/posts',
        expect.any(Object)
      );
    });

    it('should work with IP address and query params', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://192.168.4.22:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('todos', { status: 'active', page: 1 });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.4.22:3000/api/todos?status=active&page=1',
        expect.any(Object)
      );
    });

    it('should work with IP address from window.location.origin pattern', async () => {
      // Simulates: baseUrl = `${window.location.origin}/api`
      // where window.location.origin = 'http://192.168.4.22:3000'
      const connector = new FetchConnector({
        baseUrl: 'http://192.168.4.22:3000/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '1', text: 'test' }),
      });

      await connector.post('todos', { text: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.4.22:3000/api/todos',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should work with 10.x.x.x IP address', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://10.0.0.1:8080/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('items');

      expect(mockFetch).toHaveBeenCalledWith('http://10.0.0.1:8080/api/items', expect.any(Object));
    });

    it('should work with IP address without port', async () => {
      const connector = new FetchConnector({
        baseUrl: 'http://192.168.1.100/api',
        retries: 1,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await connector.get('todos');

      expect(mockFetch).toHaveBeenCalledWith('http://192.168.1.100/api/todos', expect.any(Object));
    });
  });
});

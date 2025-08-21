import { FetchConnector } from '../../connectors/FetchConnector';
import { ConnectorConfig } from '../../types';
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();
const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('FetchConnector - Seed Functionality', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  const seedData = {
    users: [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ],
    products: [{ id: '1', name: 'Laptop', price: 999.99, category: 'Electronics' }],
  };

  describe('204 No Content with seed fallback', () => {
    it('should return seed data when API returns 204 and useOnNoContent is true', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: true,
          },
        },
      };

      // Mock 204 response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(seedData.users);
        expect(result.message).toBe('Using seed data for 204 response');
      }
    });

    it('should return null when API returns 204 and useOnNoContent is false', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: false,
          },
        },
      };

      // Mock 204 response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('should return null when API returns 204 and no seed configuration', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
      };

      // Mock 204 response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('seed data for different endpoint patterns', () => {
    it('should return list seed data for collection endpoints', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: true,
          },
        },
      };

      // Mock 204 response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(2);
      }
    });

    it('should return single item seed data for item endpoints', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: true,
          },
        },
      };

      // Mock 204 response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.get('users/1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(seedData.users[0]);
      }
    });

    it('should return null for non-existent item in seed data', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: true,
          },
        },
      };

      // Mock 204 response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.get('users/999');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('should return null for non-existent collection in seed data', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: true,
          },
        },
      };

      // Mock 204 response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.get('orders');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('normal responses (non-204)', () => {
    it('should return API data for successful responses, ignoring seed', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: true,
          },
        },
      };

      const apiData = [{ id: '3', name: 'API User', email: 'api@example.com' }];

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => apiData,
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(apiData);
        expect(result.data).not.toEqual(seedData.users);
      }
    });

    it('should return error responses normally, ignoring seed', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: true,
          },
        },
      };

      // Mock error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Not found');
    });
  });

  describe('POST, PUT, DELETE operations', () => {
    it('should handle 204 responses for POST operations with seed', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: true,
          },
        },
      };

      // Mock 204 response for POST
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.post('users', { name: 'New User' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(seedData.users);
      }
    });

    it('should handle 204 responses for PUT operations with seed', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: true,
          },
        },
      };

      // Mock 204 response for PUT
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.put('users/1', { name: 'Updated User' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(seedData.users[0]);
      }
    });

    it('should handle 204 responses for DELETE operations with seed', async () => {
      const config: ConnectorConfig = {
        baseUrl: 'https://api.example.com',
        seed: {
          data: seedData,
          behavior: {
            useOnNoContent: true,
          },
        },
      };

      // Mock 204 response for DELETE
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const connector = new FetchConnector(config);
      const result = await connector.delete('users/1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(seedData.users[0]);
      }
    });
  });
});

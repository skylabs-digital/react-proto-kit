import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FetchConnector } from '../../connectors/FetchConnector';
import { LocalStorageConnector } from '../../connectors/LocalStorageConnector';

describe('Dynamic ID Support in Connectors', () => {
  describe('FetchConnector', () => {
    let connector: FetchConnector;
    let mockFetch: any;

    beforeEach(() => {
      mockFetch = vi.fn();
      global.fetch = mockFetch;
      connector = new FetchConnector({ baseUrl: 'http://localhost:3000' });
    });

    describe('PUT with dynamic ID', () => {
      it('should append ID to endpoint when endpoint lacks ID but data has ID', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: '123', name: 'Updated' } }),
        };
        mockFetch.mockResolvedValue(mockResponse);

        const data = { id: '123', name: 'Updated Item' };
        await connector.put('posts', data);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/posts/123',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(data),
          })
        );
      });

      it('should not modify endpoint when ID is already present', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({ success: true, data: { id: '123', name: 'Updated' } }),
        };
        mockFetch.mockResolvedValue(mockResponse);

        const data = { id: '123', name: 'Updated Item' };
        await connector.put('posts/456', data);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/posts/456',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(data),
          })
        );
      });

      it('should not modify endpoint when data has no ID', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({ success: true, data: { name: 'Updated' } }),
        };
        mockFetch.mockResolvedValue(mockResponse);

        const data = { name: 'Updated Item' };
        await connector.put('posts', data);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/posts',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(data),
          })
        );
      });
    });

    describe('DELETE with dynamic ID', () => {
      it('should append ID to endpoint when endpoint lacks ID but data has ID', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({ success: true }),
        };
        mockFetch.mockResolvedValue(mockResponse);

        const data = { id: '123' };
        await connector.delete('posts', data);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/posts/123',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      it('should not modify endpoint when ID is already present', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({ success: true }),
        };
        mockFetch.mockResolvedValue(mockResponse);

        const data = { id: '123' };
        await connector.delete('posts/456', data);

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/posts/456',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      it('should work without data parameter (original behavior)', async () => {
        const mockResponse = {
          ok: true,
          json: () => Promise.resolve({ success: true }),
        };
        mockFetch.mockResolvedValue(mockResponse);

        await connector.delete('posts/123');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/posts/123',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('LocalStorageConnector', () => {
    let connector: LocalStorageConnector;
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

      connector = new LocalStorageConnector({ simulateDelay: 0 });

      // Setup test data
      const testData = {
        posts: [
          {
            id: '123',
            title: 'Test Post',
            content: 'Content',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
          },
          {
            id: '456',
            title: 'Another Post',
            content: 'More content',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
          },
        ],
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
    });

    describe('PUT with dynamic ID', () => {
      it('should extract ID from data when endpoint lacks ID', async () => {
        const updateData = { id: '123', title: 'Updated Post', content: 'Updated content' };

        const result = await connector.put('posts', updateData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toMatchObject({
            id: '123',
            title: 'Updated Post',
            content: 'Updated content',
          });
        }

        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });

      it('should use endpoint ID when present (original behavior)', async () => {
        const updateData = { title: 'Updated Post', content: 'Updated content' };
        const result = await connector.put('posts/123', updateData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toMatchObject({
            id: '123',
            title: 'Updated Post',
            content: 'Updated content',
          });
        }

        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });

      it('should return error when no ID is available', async () => {
        const updateData = { title: 'Updated Post', content: 'Updated content' };
        const result = await connector.put('posts', updateData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.message).toContain('ID is required for update operation');
        }
      });
    });

    describe('DELETE with dynamic ID', () => {
      it('should extract ID from data when endpoint lacks ID', async () => {
        const deleteData = { id: '123' };
        const result = await connector.delete('posts', deleteData);

        expect(result.success).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });

      it('should use endpoint ID when present (original behavior)', async () => {
        const result = await connector.delete('posts/456');

        expect(result.success).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });

      it('should return error when no ID is available', async () => {
        const result = await connector.delete('posts');

        expect(result.success).toBe(false);
        expect(result.message).toContain('ID is required for delete operation');
      });
    });
  });
});

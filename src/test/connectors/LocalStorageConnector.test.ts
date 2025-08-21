import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageConnector } from '../../connectors/LocalStorageConnector';

describe('LocalStorageConnector', () => {
  let connector: LocalStorageConnector;
  let mockLocalStorage: any;

  beforeEach(() => {
    // Clear localStorage mock
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });

    connector = new LocalStorageConnector({
      simulateDelay: 0, // Disable delay for tests
      errorRate: 0, // Disable errors for tests
    });
  });

  describe('get', () => {
    it('should return empty list when no data exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await connector.get('products');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
        expect(result.meta).toEqual({
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        });
      }
    });

    it('should return paginated list of items', async () => {
      const mockData = {
        products: [
          { id: '1', name: 'Product 1', price: 100 },
          { id: '2', name: 'Product 2', price: 200 },
          { id: '3', name: 'Product 3', price: 300 },
        ],
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = await connector.get('products', { page: 1, limit: 2 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.meta).toEqual({
          total: 3,
          page: 1,
          limit: 2,
          totalPages: 2,
        });
      }
    });

    it('should return single item by id', async () => {
      const mockData = {
        products: [
          { id: '1', name: 'Product 1', price: 100 },
          { id: '2', name: 'Product 2', price: 200 },
        ],
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = await connector.get('products/1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: '1', name: 'Product 1', price: 100 });
      }
    });

    it('should return error when item not found', async () => {
      const mockData = { products: [] };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = await connector.get('products/999');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe('NOT_FOUND');
      }
    });

    it('should filter items based on filters', async () => {
      const mockData = {
        products: [
          { id: '1', name: 'Product 1', category: 'electronics' },
          { id: '2', name: 'Product 2', category: 'books' },
          { id: '3', name: 'Product 3', category: 'electronics' },
        ],
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = await connector.get('products', {
        filters: { category: 'electronics' },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.meta?.total).toBe(2);
      }
    });
  });

  describe('post', () => {
    it('should create new item with generated id and timestamps', async () => {
      mockLocalStorage.getItem.mockReturnValue('{}');

      const newItem = { name: 'New Product', price: 150 };
      const result = await connector.post('products', newItem);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          name: 'New Product',
          price: 150,
        });
        expect((result.data as any).id).toBeDefined();
        expect((result.data as any).createdAt).toBeDefined();
        expect((result.data as any).updatedAt).toBeDefined();
      }

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should add item to existing collection', async () => {
      const existingData = {
        products: [{ id: '1', name: 'Existing Product' }],
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));

      const newItem = { name: 'New Product', price: 150 };
      await connector.post('products', newItem);

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.products).toHaveLength(2);
    });
  });

  describe('put', () => {
    it('should update existing item', async () => {
      const existingData = {
        products: [{ id: '1', name: 'Old Name', price: 100, createdAt: '2023-01-01' }],
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));

      const updates = { name: 'Updated Name', price: 200 };
      const result = await connector.put('products/1', updates);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          id: '1',
          name: 'Updated Name',
          price: 200,
        });
        expect((result.data as any).updatedAt).toBeDefined();
      }
    });

    it('should return error when item not found', async () => {
      mockLocalStorage.getItem.mockReturnValue('{"products": []}');

      const result = await connector.put('products/999', { name: 'Updated' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe('NOT_FOUND');
      }
    });

    it('should return error when no id provided', async () => {
      const result = await connector.put('products', { name: 'Updated' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe('INVALID_REQUEST');
      }
    });
  });

  describe('delete', () => {
    it('should delete existing item', async () => {
      const existingData = {
        products: [
          { id: '1', name: 'Product 1' },
          { id: '2', name: 'Product 2' },
        ],
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));

      const result = await connector.delete('products/1');

      expect(result.success).toBe(true);

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.products).toHaveLength(1);
      expect(savedData.products[0].id).toBe('2');
    });

    it('should return error when item not found', async () => {
      mockLocalStorage.getItem.mockReturnValue('{"products": []}');

      const result = await connector.delete('products/999');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe('NOT_FOUND');
      }
    });

    it('should return error when no id provided', async () => {
      const result = await connector.delete('products');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe('INVALID_REQUEST');
      }
    });
  });

  describe('error simulation', () => {
    it('should simulate errors when errorRate is set', async () => {
      const errorConnector = new LocalStorageConnector({
        simulateDelay: 0,
        errorRate: 1, // 100% error rate
      });

      const result = await errorConnector.get('products');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe('STORAGE_ERROR');
      }
    });
  });
});

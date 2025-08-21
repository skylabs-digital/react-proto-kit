import { LocalStorageConnector } from '../../connectors/LocalStorageConnector';
import { ConnectorConfig } from '../../types';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('LocalStorageConnector - Seed Functionality', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  const seedData = {
    users: [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ],
    products: [{ id: '1', name: 'Laptop', price: 999.99, category: 'Electronics' }],
  };

  describe('initializeEmpty behavior', () => {
    it('should initialize empty collections with seed data when initializeEmpty is true', async () => {
      const config: ConnectorConfig = {
        seed: {
          data: seedData,
          behavior: {
            initializeEmpty: true,
            mergeStrategy: 'replace',
          },
        },
      };

      const connector = new LocalStorageConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('John Doe');
      expect(result.data[1].name).toBe('Jane Smith');
    });

    it('should not initialize when initializeEmpty is false', async () => {
      const config: ConnectorConfig = {
        seed: {
          data: seedData,
          behavior: {
            initializeEmpty: false,
            mergeStrategy: 'replace',
          },
        },
      };

      const connector = new LocalStorageConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('merge strategies', () => {
    it('should replace existing data with replace strategy', async () => {
      // First, add some existing data
      const existingConnector = new LocalStorageConnector();
      await existingConnector.post('users', {
        name: 'Existing User',
        email: 'existing@example.com',
      });

      // Now create connector with seed data and replace strategy
      const config: ConnectorConfig = {
        seed: {
          data: seedData,
          behavior: {
            initializeEmpty: true,
            mergeStrategy: 'replace',
          },
        },
      };

      const connector = new LocalStorageConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.find((u: any) => u.name === 'Existing User')).toBeUndefined();
      expect(result.data.find((u: any) => u.name === 'John Doe')).toBeDefined();
    });

    it('should append seed data with append strategy', async () => {
      // First, add some existing data
      const existingConnector = new LocalStorageConnector();
      await existingConnector.post('users', {
        name: 'Existing User',
        email: 'existing@example.com',
      });

      // Now create connector with seed data and append strategy
      const config: ConnectorConfig = {
        seed: {
          data: seedData,
          behavior: {
            initializeEmpty: true,
            mergeStrategy: 'append',
          },
        },
      };

      const connector = new LocalStorageConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3); // 1 existing + 2 seed
      expect(result.data.find((u: any) => u.name === 'Existing User')).toBeDefined();
      expect(result.data.find((u: any) => u.name === 'John Doe')).toBeDefined();
    });

    it('should not add seed data to existing collections with merge strategy', async () => {
      // First, add some existing data
      const existingConnector = new LocalStorageConnector();
      await existingConnector.post('users', {
        name: 'Existing User',
        email: 'existing@example.com',
      });

      // Now create connector with seed data and merge strategy
      const config: ConnectorConfig = {
        seed: {
          data: seedData,
          behavior: {
            initializeEmpty: true,
            mergeStrategy: 'merge',
          },
        },
      };

      const connector = new LocalStorageConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Only existing data
      expect(result.data[0].name).toBe('Existing User');
    });

    it('should add seed data to empty collections with merge strategy', async () => {
      const config: ConnectorConfig = {
        seed: {
          data: seedData,
          behavior: {
            initializeEmpty: true,
            mergeStrategy: 'merge',
          },
        },
      };

      const connector = new LocalStorageConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('John Doe');
    });
  });

  describe('seed data structure', () => {
    it('should add timestamps and IDs to seed data items that lack them', async () => {
      const seedWithoutTimestamps = {
        users: [{ name: 'Test User', email: 'test@example.com' }],
      };

      const config: ConnectorConfig = {
        seed: {
          data: seedWithoutTimestamps,
          behavior: {
            initializeEmpty: true,
            mergeStrategy: 'replace',
          },
        },
      };

      const connector = new LocalStorageConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result.data[0]).toHaveProperty('updatedAt');
      expect(result.data[0].name).toBe('Test User');
    });

    it('should preserve existing IDs and timestamps in seed data', async () => {
      const seedWithTimestamps = {
        users: [
          {
            id: 'custom-id',
            name: 'Test User',
            email: 'test@example.com',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
      };

      const config: ConnectorConfig = {
        seed: {
          data: seedWithTimestamps,
          behavior: {
            initializeEmpty: true,
            mergeStrategy: 'replace',
          },
        },
      };

      const connector = new LocalStorageConnector(config);
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      expect(result.data[0].id).toBe('custom-id');
      expect(result.data[0].createdAt).toBe('2024-01-01T00:00:00Z');
      expect(result.data[0].updatedAt).toBe('2024-01-02T00:00:00Z');
    });
  });

  describe('multiple collections', () => {
    it('should seed multiple collections independently', async () => {
      const config: ConnectorConfig = {
        seed: {
          data: seedData,
          behavior: {
            initializeEmpty: true,
            mergeStrategy: 'replace',
          },
        },
      };

      const connector = new LocalStorageConnector(config);

      const usersResult = await connector.get('users');
      const productsResult = await connector.get('products');

      expect(usersResult.success).toBe(true);
      expect(usersResult.data).toHaveLength(2);

      expect(productsResult.success).toBe(true);
      expect(productsResult.data).toHaveLength(1);
      expect(productsResult.data[0].name).toBe('Laptop');
    });
  });

  describe('no seed configuration', () => {
    it('should work normally without seed configuration', async () => {
      const connector = new LocalStorageConnector();
      const result = await connector.get('users');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });
});

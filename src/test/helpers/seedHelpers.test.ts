import {
  createDevSeedConfig,
  createFallbackSeedConfig,
  createInitSeedConfig,
  generateMockData,
  createEnvironmentSeedConfig,
} from '../../helpers/seedHelpers';

describe('Seed Helpers', () => {
  const testSeedData = {
    users: [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ],
    products: [{ id: '1', name: 'Laptop', price: 999.99, category: 'Electronics' }],
  };

  describe('createDevSeedConfig', () => {
    it('should create development seed config with default options', () => {
      const config = createDevSeedConfig(testSeedData);

      expect(config.data).toEqual(testSeedData);
      expect(config.behavior?.initializeEmpty).toBe(true);
      expect(config.behavior?.useOnNoContent).toBe(true);
      expect(config.behavior?.mergeStrategy).toBe('replace');
    });

    it('should create development seed config with custom options', () => {
      const config = createDevSeedConfig(testSeedData, {
        mergeStrategy: 'append',
        initializeEmpty: false,
        useOnNoContent: false,
      });

      expect(config.data).toEqual(testSeedData);
      expect(config.behavior?.initializeEmpty).toBe(false);
      expect(config.behavior?.useOnNoContent).toBe(false);
      expect(config.behavior?.mergeStrategy).toBe('append');
    });
  });

  describe('createFallbackSeedConfig', () => {
    it('should create fallback seed config for 204 responses only', () => {
      const config = createFallbackSeedConfig(testSeedData);

      expect(config.data).toEqual(testSeedData);
      expect(config.behavior?.initializeEmpty).toBe(false);
      expect(config.behavior?.useOnNoContent).toBe(true);
      expect(config.behavior?.mergeStrategy).toBe('replace');
    });
  });

  describe('createInitSeedConfig', () => {
    it('should create initialization seed config with default merge strategy', () => {
      const config = createInitSeedConfig(testSeedData);

      expect(config.data).toEqual(testSeedData);
      expect(config.behavior?.initializeEmpty).toBe(true);
      expect(config.behavior?.useOnNoContent).toBe(false);
      expect(config.behavior?.mergeStrategy).toBe('merge');
    });

    it('should create initialization seed config with custom merge strategy', () => {
      const config = createInitSeedConfig(testSeedData, 'append');

      expect(config.data).toEqual(testSeedData);
      expect(config.behavior?.initializeEmpty).toBe(true);
      expect(config.behavior?.useOnNoContent).toBe(false);
      expect(config.behavior?.mergeStrategy).toBe('append');
    });
  });

  describe('generateMockData', () => {
    it('should generate mock data with default count', () => {
      const template = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      };

      const mockData = generateMockData(template);

      expect(mockData).toHaveLength(5); // default count
      expect(mockData[0]).toHaveProperty('id');
      expect(mockData[0]).toHaveProperty('createdAt');
      expect(mockData[0]).toHaveProperty('updatedAt');
      expect(mockData[0].name).toBe('Test User');
      expect(mockData[0].email).toBe('test@example.com');
      expect(mockData[0].role).toBe('user');
    });

    it('should generate mock data with custom count', () => {
      const template = {
        name: 'Test Product',
        price: 99.99,
      };

      const mockData = generateMockData(template, 3);

      expect(mockData).toHaveLength(3);
      expect(mockData[0].id).toBe('1');
      expect(mockData[1].id).toBe('2');
      expect(mockData[2].id).toBe('3');
    });

    it('should generate unique IDs for each item', () => {
      const template = { name: 'Test' };
      const mockData = generateMockData(template, 10);

      const ids = mockData.map(item => item.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(10);
    });

    it('should generate timestamps in chronological order', () => {
      const template = { name: 'Test' };
      const mockData = generateMockData(template, 3);

      const timestamps = mockData.map(item => new Date(item.createdAt).getTime());

      expect(timestamps[0]).toBeLessThanOrEqual(timestamps[1]);
      expect(timestamps[1]).toBeLessThanOrEqual(timestamps[2]);
    });

    it('should preserve template properties in all generated items', () => {
      const template = {
        name: 'Product',
        price: 199.99,
        category: 'Electronics',
        inStock: true,
      };

      const mockData = generateMockData(template, 3);

      mockData.forEach(item => {
        expect(item.name).toBe('Product');
        expect(item.price).toBe(199.99);
        expect(item.category).toBe('Electronics');
        expect(item.inStock).toBe(true);
      });
    });
  });

  describe('createEnvironmentSeedConfig', () => {
    it('should return undefined for production environment', () => {
      const config = createEnvironmentSeedConfig(testSeedData, 'production');
      expect(config).toBeUndefined();
    });

    it('should return seed config for development environment with replace strategy', () => {
      const config = createEnvironmentSeedConfig(testSeedData, 'development');

      expect(config).toBeDefined();
      expect(config!.data).toEqual(testSeedData);
      expect(config!.behavior?.mergeStrategy).toBe('replace');
      expect(config!.behavior?.initializeEmpty).toBe(true);
      expect(config!.behavior?.useOnNoContent).toBe(true);
    });

    it('should return seed config for staging environment with merge strategy', () => {
      const config = createEnvironmentSeedConfig(testSeedData, 'staging');

      expect(config).toBeDefined();
      expect(config!.data).toEqual(testSeedData);
      expect(config!.behavior?.mergeStrategy).toBe('merge');
      expect(config!.behavior?.initializeEmpty).toBe(true);
      expect(config!.behavior?.useOnNoContent).toBe(true);
    });

    it('should default to development environment', () => {
      const config = createEnvironmentSeedConfig(testSeedData);

      expect(config).toBeDefined();
      expect(config!.behavior?.mergeStrategy).toBe('replace');
    });
  });

  describe('edge cases', () => {
    it('should handle empty seed data', () => {
      const emptySeedData = {};
      const config = createDevSeedConfig(emptySeedData);

      expect(config.data).toEqual({});
      expect(config.behavior?.initializeEmpty).toBe(true);
    });

    it('should handle seed data with empty arrays', () => {
      const seedDataWithEmptyArrays = {
        users: [],
        products: [],
      };
      const config = createDevSeedConfig(seedDataWithEmptyArrays);

      expect(config.data).toEqual(seedDataWithEmptyArrays);
    });

    it('should generate mock data with count of 0', () => {
      const template = { name: 'Test' };
      const mockData = generateMockData(template, 0);

      expect(mockData).toHaveLength(0);
      expect(Array.isArray(mockData)).toBe(true);
    });

    it('should generate mock data with count of 1', () => {
      const template = { name: 'Single Item' };
      const mockData = generateMockData(template, 1);

      expect(mockData).toHaveLength(1);
      expect(mockData[0].id).toBe('1');
      expect(mockData[0].name).toBe('Single Item');
    });
  });
});

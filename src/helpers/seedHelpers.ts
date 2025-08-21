import { SeedConfig } from '../types';

/**
 * Creates a seed configuration for development environments
 */
export function createDevSeedConfig(
  seedData: Record<string, any[]>,
  options?: {
    mergeStrategy?: 'replace' | 'merge' | 'append';
    initializeEmpty?: boolean;
    useOnNoContent?: boolean;
  }
): SeedConfig {
  return {
    data: seedData,
    behavior: {
      initializeEmpty: options?.initializeEmpty ?? true,
      useOnNoContent: options?.useOnNoContent ?? true,
      mergeStrategy: options?.mergeStrategy ?? 'replace',
    },
  };
}

/**
 * Creates a seed configuration that only works with 204 responses (for fetch connector)
 */
export function createFallbackSeedConfig(seedData: Record<string, any[]>): SeedConfig {
  return {
    data: seedData,
    behavior: {
      initializeEmpty: false,
      useOnNoContent: true,
      mergeStrategy: 'replace',
    },
  };
}

/**
 * Creates a seed configuration for localStorage initialization only
 */
export function createInitSeedConfig(
  seedData: Record<string, any[]>,
  mergeStrategy: 'replace' | 'merge' | 'append' = 'merge'
): SeedConfig {
  return {
    data: seedData,
    behavior: {
      initializeEmpty: true,
      useOnNoContent: false,
      mergeStrategy,
    },
  };
}

/**
 * Generates mock data for a given schema structure
 */
export function generateMockData<T extends Record<string, any>>(
  template: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  count: number = 5
): T[] {
  const mockData: T[] = [];

  for (let i = 1; i <= count; i++) {
    const item = {
      ...template,
      id: i.toString(),
      createdAt: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000).toISOString(),
    } as unknown as T;

    mockData.push(item);
  }

  return mockData;
}

/**
 * Creates environment-aware seed configuration
 */
export function createEnvironmentSeedConfig(
  seedData: Record<string, any[]>,
  environment: 'development' | 'staging' | 'production' = 'development'
): SeedConfig | undefined {
  // Only provide seed data in non-production environments
  if (environment === 'production') {
    return undefined;
  }

  return createDevSeedConfig(seedData, {
    mergeStrategy: environment === 'development' ? 'replace' : 'merge',
    initializeEmpty: true,
    useOnNoContent: true,
  });
}

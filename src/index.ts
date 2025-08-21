// Main exports
export { ApiClientProvider, useApiClient } from './provider/ApiClientProvider';

// Export main API functionality
export * from './factory/createDomainApi';
export * from './connectors/FetchConnector';
export * from './connectors/LocalStorageConnector';
export * from './helpers/schemas';
export * from './helpers/seedHelpers';

// Export navigation functionality
export * from './navigation';

// Export forms functionality
export * from './forms';

// Hooks
export { useQuery } from './hooks/useQuery';
export { useMutation } from './hooks/useMutation';
export { useList } from './hooks/useList';

// Factory
export { createDomainApi } from './factory/createDomainApi';

// Helpers (main agility features)
export {
  createEntitySchema,
  createTimestampedSchema,
  createCrudApi,
  createReadOnlyApi,
  createCustomApi,
  createCreateSchema,
  createUpdateSchema,
} from './helpers/schemas';

// Seed helpers
export {
  createDevSeedConfig,
  createFallbackSeedConfig,
  createInitSeedConfig,
  generateMockData,
  createEnvironmentSeedConfig,
} from './helpers/seedHelpers';

// Types
export type {
  // Core types
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  PaginationMeta,

  // Connector types
  ConnectorType,
  IConnector,
  ConnectorConfig,
  FetchInstance,
  RequestInterceptor,
  ResponseInterceptor,

  // Domain API types
  DomainApiConfig,
  CustomOperation,
  DomainInterceptors,
  CrudOperation,

  // Seed types
  SeedConfig,

  // Hook types
  UseQueryResult,
  UseMutationResult,
  UseListResult,
  ListParams,

  // Generated API types
  GeneratedCrudApi,

  // Type inference helpers
  InferType,
  InferCreateType,
  InferUpdateType,
  InferListResponse,
} from './types';

// Re-export Zod for convenience
export { z } from 'zod';

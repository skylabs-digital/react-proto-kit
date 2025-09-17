// Main exports
export { ApiClientProvider, useApiClient } from './provider/ApiClientProvider';

// Export all types
export * from './types';

// Export connectors
export * from './connectors/FetchConnector';
export * from './connectors/LocalStorageConnector';

// Export provider
export * from './provider/ApiClientProvider';

// Export context and global state
export * from './context/GlobalStateProvider';
export * from './context/InvalidationManager';

// Export utility types
export * from './factory/createDomainApi';

// Export debug utilities
export { configureDebugLogging } from './utils/debug';

// Export forms
export * from './forms';

// Export navigation
export * from './navigation';

// Helpers (main agility features)
export {
  createEntitySchema,
  createTimestampedSchema,
  createReadOnlyApi,
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

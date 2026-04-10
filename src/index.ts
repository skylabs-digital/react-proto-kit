// All types, connectors, context, factories, forms, navigation and provider
// exports are aggregated via `export *` below. The explicit re-exports that
// used to duplicate these were removed to avoid drift — everything public
// lives in the respective modules and is re-exported from this barrel.

// Core types (also covers hook result types, orchestrator types, etc.)
export * from './types';

// Connectors
export * from './connectors/FetchConnector';
export * from './connectors/LocalStorageConnector';

// Provider
export * from './provider/ApiClientProvider';

// Context and global state
export * from './context/GlobalStateProvider';
export * from './context/InvalidationManager';
export * from './context/DataOrchestratorContext';
export * from './context/RefetchBehaviorContext';

// Factories
export * from './factory/createDomainApi';
export * from './factory/createSingleRecordApi';

// Debug utilities
export { configureDebugLogging } from './utils/debug';

// Forms
export * from './forms';

// Navigation
export * from './navigation';

// Data Orchestrator
export { useDataOrchestrator } from './hooks/useDataOrchestrator';
export { withDataOrchestrator } from './hoc/withDataOrchestrator';

// Cache invalidation
export { useInvalidation } from './hooks/useInvalidation';
export type { UseInvalidationResult } from './hooks/useInvalidation';

// Helpers (main agility features)
export {
  createEntitySchema,
  createTimestampedSchema,
  createReadOnlyApi,
  createCreateSchema,
  createUpdateSchema,
} from './helpers/schemas';
export type { ReadOnlyApi } from './helpers/schemas';

// Seed helpers
export {
  createDevSeedConfig,
  createFallbackSeedConfig,
  createInitSeedConfig,
  generateMockData,
  createEnvironmentSeedConfig,
} from './helpers/seedHelpers';

// Re-export Zod for convenience
export { z } from 'zod';

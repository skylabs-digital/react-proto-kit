import { z } from 'zod';

// Base types
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  success: false;
  message?: string;
  error?: { code: string };
  type?: 'AUTH' | 'VALIDATION' | 'TRANSACTION' | 'NAVIGATION';
  validation?: Record<string, string>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Connector types
export type ConnectorType = 'localStorage' | 'fetch';

export interface IConnector {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>;
  patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>;
}

// Configuration types
export interface ConnectorConfig {
  // Fetch Connector
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  fetchInstance?: FetchInstance;

  // LocalStorage Connector
  simulateDelay?: number;
  errorRate?: number;

  // Global config
  errorHandling?: 'throw' | 'return';
  caching?: boolean;
  pagination?: PaginationConfig;

  // Seed configuration
  seed?: SeedConfig;
}

export interface SeedConfig {
  // Seed data by endpoint/collection
  data?: Record<string, any[]>;

  // Seed behavior configuration
  behavior?: {
    // For FetchConnector: use seed data when endpoint returns 204
    useOnNoContent?: boolean;
    // For LocalStorageConnector: initialize empty collections with seed data
    initializeEmpty?: boolean;
    // Global: whether to merge seed with existing data or replace
    mergeStrategy?: 'replace' | 'merge' | 'append';
  };
}

export interface FetchInstance {
  interceptors: {
    request: RequestInterceptor[];
    response: ResponseInterceptor[];
  };
}

export interface PaginationConfig {
  defaultLimit?: number;
  maxLimit?: number;
  defaultPage?: number;
}

export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

export interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: any;
}

// Refetch behavior for data orchestrator
export type RefetchBehavior = 'stale-while-revalidate' | 'blocking';

// Global state configuration
export interface GlobalStateConfig {
  optimistic?: boolean;
  cacheTime?: number;
  syncStrategy?: 'immediate' | 'debounced';
}

// Domain API types
export interface DomainApiConfig<T extends z.ZodSchema = z.ZodSchema> {
  entity: string;
  schema: T;
  createSchema?: z.ZodSchema;
  updateSchema?: z.ZodSchema;
  listSchema?: z.ZodSchema;
  customOperations?: Record<string, CustomOperation>;
  interceptors?: DomainInterceptors;
  pagination?: PaginationConfig;
}

export interface CustomOperation {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  inputSchema?: z.ZodSchema;
  outputSchema?: z.ZodSchema;
}

export interface DomainInterceptors {
  request?: (config: RequestConfig, operation: CrudOperation) => RequestConfig;
  response?: (response: ApiResponse, operation: CrudOperation) => ApiResponse;
  error?: (error: ErrorResponse, operation: CrudOperation) => ErrorResponse | void;
}

export type CrudOperation = 'list' | 'byId' | 'create' | 'update' | 'delete' | string;

// Hook types
export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: ErrorResponse | null;
  refetch: () => Promise<void>;
}

export interface UseMutationResult<TInput, TOutput = void> {
  mutate: (id: string, input?: TInput, field?: string) => Promise<TOutput>;
  loading: boolean;
  error: ErrorResponse | null;
}

export interface UseCreateMutationResult<TInput, _TOutput = void> {
  mutate: (input: TInput) => Promise<_TOutput>;
  loading: boolean;
  error: ErrorResponse | null;
}

export interface UseUpdateMutationResult<TInput, _TOutput = void> {
  mutate: (id: string, data: TInput) => Promise<void>;
  loading: boolean;
  error: ErrorResponse | null;
}

export interface UsePatchMutationResult<TInput> {
  mutate: (id: string, data: TInput) => Promise<void>;
  loading: boolean;
  error: ErrorResponse | null;
}

export interface UseDeleteMutationResult {
  mutate: (id: string) => Promise<void>;
  loading: boolean;
  error: ErrorResponse | null;
}

export interface UseListResult<T> extends UseQueryResult<T[]> {
  meta?: PaginationMeta;
}

// Complete entity type with auto-generated fields
export type CompleteEntityType<T> = T & { id: string; createdAt: string; updatedAt: string };

// Generated API types - T represents the business schema, CompleteEntityType<T> is what gets returned
export interface GeneratedCrudApi<T> {
  useList: (params?: ListParams) => UseListResult<CompleteEntityType<T>>;
  useById: (id: string | undefined | null) => UseQueryResult<CompleteEntityType<T>>;
  useCreate: () => UseCreateMutationResult<
    Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    CompleteEntityType<T>
  >;
  useUpdate: () => UseUpdateMutationResult<
    Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    CompleteEntityType<T>
  >;
  usePatch: () => UsePatchMutationResult<Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>>;
  useDelete: () => UseDeleteMutationResult;
}

export interface ListParams {
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
}

// Type inference helpers
export type InferType<T extends z.ZodSchema> = z.infer<T>;
export type InferCreateType<T extends z.ZodSchema> = Omit<
  z.infer<T>,
  'id' | 'createdAt' | 'updatedAt'
>;
export type InferUpdateType<T extends z.ZodSchema> = Partial<InferCreateType<T>>;
export type InferListResponse<T extends z.ZodSchema> = SuccessResponse<z.infer<T>[]>;

// ============================================================================
// Data Orchestrator Types
// ============================================================================

// Hook factory that returns a query result
export type QueryHookFactory<T> = () => UseQueryResult<T>;

// Basic configuration - all resources are required by default
export type DataOrchestratorConfig = {
  [key: string]: QueryHookFactory<any>;
};

// Advanced configuration with required/optional resources
export interface RequiredOptionalConfig {
  required?: DataOrchestratorConfig;
  optional?: DataOrchestratorConfig;
}

// Union type for config
export type DataOrchestratorInput<T = DataOrchestratorConfig> = T | RequiredOptionalConfig | null;

// Extract data type from a hook factory
export type ExtractDataType<T> = T extends QueryHookFactory<infer U> ? U : never;

// Extract data types from config
export type ExtractDataFromConfig<T extends DataOrchestratorConfig> = {
  [K in keyof T]: ExtractDataType<T[K]> | null;
};

// Extract data types with required/optional distinction
export type ExtractDataFromRequiredOptional<T extends RequiredOptionalConfig> = {
  [K in keyof T['required']]: T['required'][K] extends QueryHookFactory<infer U> ? U : never;
} & {
  [K in keyof T['optional']]: T['optional'][K] extends QueryHookFactory<infer U> ? U | null : never;
};

// Options for useDataOrchestrator
export interface UseDataOrchestratorOptions {
  resetKey?: string | number;
  onError?: (errors: Record<string, ErrorResponse>) => void;
  /**
   * Array of URL search param names to watch for changes.
   * When any of these params change, the orchestrator will automatically reset.
   * Useful for hooks that depend on URL query parameters.
   *
   * @example
   * ```tsx
   * // Automatically reset when 'status' or 'category' change in URL
   * withDataOrchestrator(Component, {
   *   hooks: { todos: () => todosApi.useList({ queryParams: { status } }) },
   *   options: { watchSearchParams: ['status', 'category'] }
   * })
   * ```
   */
  watchSearchParams?: string[];
  /**
   * Behavior when refetching data after URL parameter changes.
   *
   * - 'stale-while-revalidate' (default): Shows previous data while fetching new data.
   *   Provides smooth transitions without UI blocking.
   *
   * - 'blocking': Clears data and shows loading state while fetching.
   *   More explicit but can cause UI flashes.
   *
   * @default 'stale-while-revalidate'
   * @example
   * ```tsx
   * withDataOrchestrator(Component, {
   *   hooks: { todos: () => todosApi.useList() },
   *   options: {
   *     watchSearchParams: ['status'],
   *     refetchBehavior: 'stale-while-revalidate' // smooth transitions
   *   }
   * })
   * ```
   */
  refetchBehavior?: RefetchBehavior;
}

// Main result type for useDataOrchestrator
export interface UseDataOrchestratorResult<T extends DataOrchestratorConfig> {
  // Data indexed by key
  data: ExtractDataFromConfig<T>;

  // Aggregated states
  isLoading: boolean; // First load of required resources (blocks rendering)
  isFetching: boolean; // First load + refetches (non-blocking indicator)
  hasErrors: boolean;

  // Granular states
  loadingStates: {
    [K in keyof T]: boolean;
  };

  errors: {
    [K in keyof T]?: ErrorResponse;
  };

  // Retry functions
  retry: (key: keyof T) => void;
  retryAll: () => void;

  // Refetch functions (legacy - use retry)
  refetch: {
    [K in keyof T]: () => Promise<void>;
  };
}

// Result type with required/optional distinction
export interface UseDataOrchestratorResultWithOptional<T extends RequiredOptionalConfig> {
  data: ExtractDataFromRequiredOptional<T>;

  // Aggregated states (only consider required resources)
  isLoading: boolean;
  isFetching: boolean;
  hasErrors: boolean;

  // Granular states for all resources
  loadingStates: {
    [K in keyof T['required']]: boolean;
  } & {
    [K in keyof T['optional']]: boolean;
  };

  errors: {
    [K in keyof T['required']]?: ErrorResponse;
  } & {
    [K in keyof T['optional']]?: ErrorResponse;
  };

  // Retry functions
  retry: (key: keyof T['required'] | keyof T['optional']) => void;
  retryAll: () => void;

  // Refetch functions for all resources (legacy)
  refetch: {
    [K in keyof T['required']]: () => Promise<void>;
  } & {
    [K in keyof T['optional']]: () => Promise<void>;
  };
}

// Props for DataOrchestratorProvider
export interface DataOrchestratorProviderProps {
  children: React.ReactNode;
  defaultLoader?: React.ReactNode;
  defaultErrorComponent?: React.ComponentType<DataOrchestratorErrorProps>;
  mode?: 'fullscreen' | 'passive';
}

// Props for error component
export interface DataOrchestratorErrorProps {
  errors: Record<string, ErrorResponse>;
  retry?: () => void;
}

// ============================================
// withDataOrchestrator HOC Types
// ============================================

/**
 * Orchestrator control methods injected by withDataOrchestrator HOC
 * Provides refetch capabilities and loading state access
 *
 * @template T - DataOrchestratorConfig type
 *
 * @example
 * ```tsx
 * const Component = ({ user, posts, orchestrator }: WithOrchestratorProps<PageData>) => {
 *   return (
 *     <div>
 *       <button onClick={orchestrator.retryAll}>Refresh All</button>
 *       <button onClick={() => orchestrator.retry('posts')}>Refresh Posts</button>
 *       {orchestrator.loading.posts && <Spinner />}
 *     </div>
 *   );
 * };
 * ```
 */
export interface OrchestratorControls<T extends DataOrchestratorConfig> {
  /**
   * Refetch a specific resource by key
   * @param key - The resource key to refetch
   */
  retry: (key: keyof T) => void;

  /**
   * Refetch all resources (required and optional)
   */
  retryAll: () => void;

  /**
   * Individual refetch functions for each resource
   * Returns a Promise that resolves when refetch completes
   */
  refetch: {
    [K in keyof T]: () => Promise<void>;
  };

  /**
   * Loading state for each resource
   * True when the resource is currently fetching
   */
  loading: {
    [K in keyof T]: boolean;
  };

  /**
   * Error state for each resource
   * Contains the error if the resource failed to load
   */
  errors: {
    [K in keyof T]?: ErrorResponse;
  };

  /**
   * True if any resource is currently fetching (initial load or refetch)
   */
  isFetching: boolean;

  /**
   * True if currently performing initial load of required resources
   */
  isLoading: boolean;
}

/**
 * Helper type for components wrapped with withDataOrchestrator
 * Combines custom props, data props, and orchestrator controls
 *
 * @template TData - Shape of the data being orchestrated (resource names to types)
 * @template TProps - Additional props the component accepts (optional)
 *
 * @example
 * ```tsx
 * interface PageData {
 *   user: User;
 *   posts: Post[];
 * }
 *
 * interface CustomProps {
 *   theme: 'light' | 'dark';
 * }
 *
 * type Props = WithOrchestratorProps<PageData, CustomProps>;
 *
 * const Component = ({ user, posts, theme, orchestrator }: Props) => {
 *   return <div>...</div>;
 * };
 * ```
 */
export type WithOrchestratorProps<
  TData extends Record<string, any>,
  TProps extends Record<string, any> = Record<string, never>,
> = TProps &
  TData & {
    orchestrator: OrchestratorControls<any>;
  };

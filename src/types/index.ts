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
  baseURL: string;
  headers: Record<string, string>;
  interceptors: {
    request: RequestInterceptor[];
    response: ResponseInterceptor[];
  };
  timeout?: number;
  retries?: number;
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

// Global state configuration
export interface GlobalStateConfig {
  optimistic?: boolean;
  cacheTime?: number;
  syncStrategy?: 'immediate' | 'debounced';
  upsertSchema?: z.ZodSchema;
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
  useQuery: (id: string | undefined | null) => UseQueryResult<CompleteEntityType<T>>;
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

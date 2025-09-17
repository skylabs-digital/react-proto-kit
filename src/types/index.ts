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
  devMode?: boolean;
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
  globalState?: boolean;
  optimistic?: boolean;
  invalidateRelated?: string[];
  cacheTime?: number;
  syncStrategy?: 'immediate' | 'debounced';
  devMode?: boolean;
}

// Legacy Domain API types (to be removed)
export interface LegacyDomainApiConfig<T extends z.ZodSchema = z.ZodSchema> {
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
  mutate: (input: TInput, dynamicId?: string) => Promise<TOutput>;
  loading: boolean;
  error: ErrorResponse | null;
}

export interface UseListResult<T> extends UseQueryResult<T[]> {
  meta?: PaginationMeta;
}

// Complete entity type with auto-generated fields
export type CompleteEntityType<T> = T & { id: string; createdAt: string; updatedAt: string };

// Path parameter extraction utility - simplified approach
type PathParamNames<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
  ? Param | PathParamNames<Rest>
  : T extends `${string}:${infer Param}`
    ? Param
    : never;

export type ExtractPathParams<T extends string> =
  PathParamNames<T> extends never ? Record<string, never> : { [K in PathParamNames<T>]: string };

// Query params configuration
export interface QueryParamsConfig<TQueryParams = any> {
  static?: Record<string, string | number | boolean>;
  dynamic?: string[];
  schema?: z.ZodSchema<TQueryParams>;
}

// Domain API configuration
export interface DomainApiConfig<_TEntity = any, _TUpsert = any, TQueryParams = any> {
  entitySchema: any;
  upsertSchema?: any;
  queryParams?: QueryParamsConfig<TQueryParams>;
  globalState?: boolean;
  optimistic?: boolean;
  cacheTime?: number;
  invalidateRelated?: string[];
}

// Builder interface for chaining
export interface DomainApiBuilder<
  TEntity,
  TInput,
  TPath extends string,
  TQueryParams = Record<string, any>,
> {
  withParams<TParams extends ExtractPathParams<TPath>>(
    params: TParams
  ): DomainApiBuilder<TEntity, TInput, TPath, TQueryParams>;
  withQuery<TQuery extends Partial<TQueryParams>>(
    query: TQuery
  ): DomainApiBuilder<TEntity, TInput, TPath, TQueryParams>;

  useList(
    params?: ListParams & { queryParams?: Partial<TQueryParams> }
  ): UseListResult<CompleteEntityType<TEntity>>;
  useQuery(
    id: string,
    options?: { queryParams?: Partial<TQueryParams> }
  ): UseQueryResult<CompleteEntityType<TEntity>>;
  useById(
    id: string | undefined | null,
    options?: { queryParams?: Partial<TQueryParams> }
  ): UseQueryResult<CompleteEntityType<TEntity>>;
  useCreate(): UseMutationResult<TInput, CompleteEntityType<TEntity>>;
  useUpdate(id?: string): UseMutationResult<Partial<TInput>, CompleteEntityType<TEntity>>;
  useDelete(id?: string): UseMutationResult<void>;
}

// Main API interface - extends builder with additional metadata
export type GeneratedCrudApi<
  TEntity,
  TInput,
  TPath extends string,
  TQueryParams = Record<string, any>,
> = DomainApiBuilder<TEntity, TInput, TPath, TQueryParams>;

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

import { TSchema, Static } from '@sinclair/typebox';

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
  delete<T>(endpoint: string): Promise<ApiResponse<T>>;
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

// Domain API types
export interface DomainApiConfig<T extends TSchema = TSchema> {
  entity: string;
  schema: T;
  createSchema?: TSchema;
  updateSchema?: TSchema;
  listSchema?: TSchema;
  customOperations?: Record<string, CustomOperation>;
  interceptors?: DomainInterceptors;
  pagination?: PaginationConfig;
}

export interface CustomOperation {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  inputSchema?: TSchema;
  outputSchema?: TSchema;
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
  mutate: (input: TInput) => Promise<TOutput>;
  loading: boolean;
  error: ErrorResponse | null;
}

export interface UseListResult<T> extends UseQueryResult<T[]> {
  meta?: PaginationMeta;
}

// Generated API types
export interface GeneratedCrudApi<T> {
  useList?: (params?: ListParams) => UseListResult<T>;
  useById?: (id: string) => UseQueryResult<T>;
  useCreate?: () => UseMutationResult<any, T>;
  useUpdate?: (id: string) => UseMutationResult<any, T>;
  useDelete?: (id: string) => UseMutationResult<void>;
}

export interface ListParams {
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
}

// Type inference helpers
export type InferType<T extends TSchema> = Static<T>;
export type InferCreateType<T extends TSchema> = Omit<Static<T>, 'id' | 'createdAt' | 'updatedAt'>;
export type InferUpdateType<T extends TSchema> = Partial<InferCreateType<T>>;
export type InferListResponse<T extends TSchema> = SuccessResponse<Static<T>[]>;

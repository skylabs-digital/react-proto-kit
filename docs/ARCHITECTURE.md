# Architecture Guide

This document provides a comprehensive overview of React Proto Kit's internal architecture, design decisions, and implementation details.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Architecture Layers](#architecture-layers)
- [Data Flow](#data-flow)
- [Type System](#type-system)
- [State Management](#state-management)
- [Connector Architecture](#connector-architecture)
- [Hook System](#hook-system)
- [Builder Pattern](#builder-pattern)
- [Performance Considerations](#performance-considerations)
- [Design Decisions](#design-decisions)

## Overview

React Proto Kit is designed as a layered architecture that abstracts away the complexity of API interactions while providing maximum flexibility and type safety. The architecture follows these key principles:

1. **Separation of Concerns**: Clear boundaries between data fetching, state management, and UI components
2. **Type Safety**: Full TypeScript support with automatic type inference
3. **Flexibility**: Support for multiple backends and storage mechanisms
4. **Performance**: Optimized for minimal re-renders and efficient data fetching
5. **Developer Experience**: Intuitive APIs with minimal boilerplate

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                         │
├─────────────────────────────────────────────────────────────┤
│                    React Hooks Layer                       │
├─────────────────────────────────────────────────────────────┤
│                  Domain API Factory                        │
├─────────────────────────────────────────────────────────────┤
│                 Global State Manager                       │
├─────────────────────────────────────────────────────────────┤
│                  Connector Interface                       │
├─────────────────────────────────────────────────────────────┤
│           FetchConnector    LocalStorageConnector          │
└─────────────────────────────────────────────────────────────┘
```

## Core Concepts

### Domain API

The central concept in React Proto Kit is the **Domain API** - a complete CRUD interface generated from a single function call. Each Domain API encapsulates:

- **Entity Schema**: Defines the structure of data entities
- **Upsert Schema**: Defines the structure for create/update operations
- **Path Template**: Defines the API endpoint structure
- **Configuration**: Caching, optimization, and query parameter settings

### Connectors

**Connectors** abstract the data source, allowing the same API to work with different backends:

- **FetchConnector**: HTTP REST API communication
- **LocalStorageConnector**: Browser localStorage for prototyping
- **Custom Connectors**: Extensible for any data source

### Global State

**Global State** provides automatic synchronization across components:

- Centralized data cache
- Automatic invalidation
- Optimistic updates
- Request deduplication

## Architecture Layers

### 1. Component Layer

React components consume APIs through hooks, remaining agnostic to the underlying data source.

```tsx
function UserList() {
  const { data: users, loading } = userApi.useList();
  const { mutate: createUser } = userApi.useCreate();
  
  // Component logic remains simple and focused
}
```

### 2. Hook Layer

Custom hooks provide the interface between components and the data layer:

- `useList` - Fetch collections
- `useQuery` - Fetch single entities
- `useCreate` - Create entities
- `useUpdate` - Update entities (PUT)
- `usePatch` - Partial updates (PATCH)
- `useDelete` - Delete entities

### 3. Domain API Factory

The `createDomainApi` function generates complete CRUD APIs:

```tsx
export function createDomainApi<TEntity, TUpsert>(
  pathTemplate: string,
  entitySchema: TEntity,
  upsertSchema: TUpsert,
  config?: DomainApiConfig
) {
  // Returns complete API with all CRUD operations
}
```

### 4. Global State Layer

Manages centralized state with these key components:

- **EntityState**: Stores entity data by type
- **LoadingState**: Tracks loading states
- **ErrorState**: Manages error states
- **InvalidationManager**: Handles cache invalidation

### 5. Connector Layer

Abstracts data sources with a common interface:

```tsx
interface IConnector {
  get<T>(path: string, params?: any): Promise<ApiResponse<T[]>>;
  getById<T>(path: string, id: string): Promise<ApiResponse<T>>;
  post<T, U>(path: string, data: T): Promise<ApiResponse<U>>;
  put<T, U>(path: string, id: string, data: T): Promise<ApiResponse<U>>;
  patch<T, U>(path: string, id: string, data: Partial<T>): Promise<ApiResponse<U>>;
  delete(path: string, id: string): Promise<ApiResponse<void>>;
}
```

## Data Flow

### Query Flow

```
Component → Hook → Global State Check → Connector → API/Storage → Response → Global State Update → Component Re-render
```

1. **Component** calls hook (e.g., `useList()`)
2. **Hook** checks global state for cached data
3. If cache miss, **Hook** calls connector
4. **Connector** fetches data from source
5. **Response** is processed and validated
6. **Global State** is updated with new data
7. **Component** re-renders with new data

### Mutation Flow

```
Component → Hook → Optimistic Update → Connector → API/Storage → Success/Error → State Reconciliation → Component Re-render
```

1. **Component** calls mutation (e.g., `createUser()`)
2. **Hook** applies optimistic update (if enabled)
3. **Connector** sends request to data source
4. On **Success**: Confirm optimistic update
5. On **Error**: Rollback optimistic update
6. **Component** re-renders with final state

## Type System

### Schema-Driven Types

The type system is built around Zod schemas that define both runtime validation and compile-time types:

```tsx
// Runtime schema
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
});

// Compile-time type (automatically inferred)
type User = z.infer<typeof userSchema>;
// Result: { name: string; email: string; age: number; }
```

### Type Augmentation

The system automatically augments entity types with metadata fields:

```tsx
type CompleteEntityType<T> = T & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
```

### Type Extraction Utilities

Helper types extract types from generated APIs:

```tsx
export type ExtractEntityType<T> =
  T extends GeneratedCrudApi<infer U>
    ? U & { id: string; createdAt: string; updatedAt: string }
    : never;

export type ExtractInputType<T> =
  T extends GeneratedCrudApi<infer U>
    ? Omit<U, 'id' | 'createdAt' | 'updatedAt'>
    : never;
```

## State Management

### Entity State Structure

```tsx
interface EntityState {
  data: Record<string, Record<string, any>>; // entityType -> id -> entity
  lists: Record<string, string[]>;           // cacheKey -> entityIds
  loading: Record<string, boolean>;          // cacheKey -> loading state
  errors: Record<string, Error | null>;     // cacheKey -> error state
  lastFetch: Record<string, number>;        // cacheKey -> timestamp
}
```

### Cache Key Generation

Cache keys are generated deterministically to ensure consistency:

```tsx
function generateCacheKey(
  entityType: string,
  operation: 'list' | 'query',
  params?: any
): string {
  const baseKey = `${entityType}:${operation}`;
  if (!params) return baseKey;
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
    
  return `${baseKey}:${sortedParams}`;
}
```

### Invalidation Strategy

The invalidation system ensures data consistency:

1. **Automatic Invalidation**: Mutations invalidate related queries
2. **Manual Invalidation**: Explicit cache clearing
3. **Time-based Invalidation**: TTL-based cache expiration
4. **Dependency Invalidation**: Related entity invalidation

## Connector Architecture

### Connector Interface

All connectors implement the `IConnector` interface, ensuring consistent behavior:

```tsx
interface IConnector {
  // Query operations
  get<T>(path: string, params?: any): Promise<ApiResponse<T[]>>;
  getById<T>(path: string, id: string): Promise<ApiResponse<T>>;
  
  // Mutation operations
  post<T, U>(path: string, data: T): Promise<ApiResponse<U>>;
  put<T, U>(path: string, id: string, data: T): Promise<ApiResponse<U>>;
  patch<T, U>(path: string, id: string, data: Partial<T>): Promise<ApiResponse<U>>;
  delete(path: string, id: string): Promise<ApiResponse<void>>;
}
```

### FetchConnector Implementation

The FetchConnector handles HTTP communication:

```tsx
class FetchConnector implements IConnector {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  
  async get<T>(path: string, params?: any): Promise<ApiResponse<T[]>> {
    const url = this.buildUrl(path, params);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.defaultHeaders,
    });
    
    return this.handleResponse<T[]>(response);
  }
  
  // ... other methods
}
```

### LocalStorageConnector Implementation

The LocalStorageConnector simulates API behavior using browser storage:

```tsx
class LocalStorageConnector implements IConnector {
  private prefix: string;
  private simulateDelay: number;
  
  async get<T>(path: string, params?: any): Promise<ApiResponse<T[]>> {
    await this.delay(); // Simulate network latency
    
    const collection = this.getCollection(path);
    const filtered = this.applyFilters(collection, params);
    
    return { data: filtered, success: true };
  }
  
  // ... other methods
}
```

## Hook System

### Hook Architecture

Hooks are built in layers for maximum reusability:

1. **Base Hooks**: Core functionality (`useQuery`, `useList`)
2. **Enhanced Hooks**: Global state integration (`useQueryWithGlobalState`)
3. **Domain Hooks**: Generated hooks from `createDomainApi`

### useList Implementation

```tsx
export function useList<T>(
  entityType: string,
  path: string,
  params?: ListParams,
  options?: QueryOptions
): UseListResult<T> {
  const connector = useApiClient();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await connector.get<T>(path, params);
      
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [connector, path, params]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch: fetchData };
}
```

### Global State Integration

Global state hooks wrap base hooks with caching and synchronization:

```tsx
export function useListWithGlobalState<T>(
  entityType: string,
  path: string,
  params?: ListParams,
  options?: QueryOptions
): UseListResult<T> {
  const entityState = useGlobalState();
  const cacheKey = generateCacheKey(entityType, 'list', params);
  
  // Check cache first
  const cachedData = entityState.lists[cacheKey];
  const loading = entityState.loading[cacheKey] ?? false;
  const error = entityState.errors[cacheKey] ?? null;
  
  // Fetch if cache miss or expired
  useEffect(() => {
    if (shouldFetch(cacheKey, options?.cacheTime)) {
      fetchAndCache(entityType, path, params, cacheKey);
    }
  }, [entityType, path, params, cacheKey, options?.cacheTime]);
  
  return { data: cachedData, loading, error, refetch: () => fetchAndCache(...) };
}
```

## Builder Pattern

### Implementation

The builder pattern allows for flexible API configuration:

```tsx
export function createDomainApi<TEntity, TUpsert>(
  pathTemplate: string,
  entitySchema: TEntity,
  upsertSchema: TUpsert,
  config?: DomainApiConfig
) {
  let currentPath = pathTemplate;
  let currentQueryParams: Record<string, any> = {};
  
  const api = {
    withParams: (params: Record<string, string>) => {
      currentPath = buildPath(pathTemplate, params);
      return api; // Return self for chaining
    },
    
    withQuery: (queryParams: Record<string, any>) => {
      currentQueryParams = { ...config?.queryParams?.static, ...queryParams };
      return api; // Return self for chaining
    },
    
    useList: (params?: ListParams) => {
      return useList(entityType, currentPath, params, {
        queryParams: currentQueryParams,
        ...config
      });
    },
    
    // ... other methods
  };
  
  return api;
}
```

### Usage Pattern

```tsx
const api = createDomainApi('users/:userId/posts', postSchema, postSchema);

// Chain configuration
const configuredApi = api
  .withParams({ userId: '123' })
  .withQuery({ status: 'published' });

// Use configured API
const { data: posts } = configuredApi.useList();
```

## Performance Considerations

### Request Deduplication

Multiple simultaneous requests for the same resource are deduplicated:

```tsx
const pendingRequests = new Map<string, Promise<any>>();

async function fetchWithDeduplication<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  
  const promise = fetcher();
  pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
}
```

### Optimistic Updates

Optimistic updates provide immediate UI feedback:

```tsx
async function optimisticUpdate<T>(
  optimisticData: T,
  actualUpdate: () => Promise<T>,
  rollback: (error: Error) => void
): Promise<T> {
  // Apply optimistic update immediately
  updateState(optimisticData);
  
  try {
    // Perform actual update
    const result = await actualUpdate();
    // Confirm optimistic update
    updateState(result);
    return result;
  } catch (error) {
    // Rollback on error
    rollback(error);
    throw error;
  }
}
```

### Memory Management

The system includes several memory optimization strategies:

1. **Weak References**: Use WeakMap for temporary data
2. **Cache Limits**: Automatic cleanup of old cache entries
3. **Subscription Cleanup**: Proper cleanup of event listeners
4. **Component Unmount**: Clear component-specific state

## Design Decisions

### Why Zod for Schemas?

1. **Runtime Validation**: Ensures data integrity at runtime
2. **Type Inference**: Automatic TypeScript type generation
3. **Composability**: Easy schema composition and transformation
4. **Developer Experience**: Excellent error messages and IDE support

### Why Builder Pattern?

1. **Flexibility**: Allows dynamic configuration without complex parameters
2. **Readability**: Chain calls are more readable than large config objects
3. **Type Safety**: Each step in the chain is fully typed
4. **Immutability**: Each call returns a new configured instance

### Why Global State?

1. **Consistency**: Single source of truth across components
2. **Performance**: Reduced API calls through caching
3. **Real-time**: Automatic synchronization across components
4. **Offline Support**: Local state can work without network

### Why Connector Pattern?

1. **Flexibility**: Support for different backends
2. **Testing**: Easy mocking and testing
3. **Migration**: Gradual migration between data sources
4. **Extensibility**: Custom connectors for specific needs

### Schema Separation (Entity vs Upsert)

1. **Server Fields**: Entity schema includes server-generated fields
2. **Client Fields**: Upsert schema only includes client-sendable fields
3. **Validation**: Different validation rules for different operations
4. **Type Safety**: Prevents sending invalid fields to server

This architecture provides a solid foundation for rapid prototyping while maintaining the flexibility to scale to production applications. The layered approach ensures that each component has a single responsibility while the type system provides safety and excellent developer experience.

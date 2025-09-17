# API Reference

Complete reference for all React Proto Kit APIs, hooks, and utilities.

## Table of Contents

- [Core API](#core-api)
- [Hooks](#hooks)
- [Type Utilities](#type-utilities)
- [Providers](#providers)
- [Form Utilities](#form-utilities)
- [Navigation Utilities](#navigation-utilities)
- [Configuration](#configuration)

## Core API

### `createDomainApi(path, entitySchema, upsertSchema, config?)`

Creates a complete CRUD API for a resource with full TypeScript support.

```tsx
const api = createDomainApi(path, entitySchema, upsertSchema, config);
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Resource path template (e.g., `'users'`, `'todos/:todoId/comments'`) |
| `entitySchema` | `ZodSchema` | Zod schema for entity responses (includes all fields) |
| `upsertSchema` | `ZodSchema` | Zod schema for create/update operations (excludes auto-generated fields) |
| `config?` | `DomainApiConfig` | Optional configuration object |

#### Configuration Options

```tsx
interface DomainApiConfig {
  optimistic?: boolean;           // Enable optimistic updates (default: true)
  cacheTime?: number;            // Cache duration in milliseconds (default: 5 minutes)
  queryParams?: {
    static?: Record<string, any>;    // Always included in requests
    dynamic?: string[];              // Runtime configurable parameters
  };
}
```

#### Return Value

Returns an API object with the following methods:

##### Query Methods

- **`useList(params?): UseListResult<T>`** - Fetch list of entities
- **`useQuery(id): UseQueryResult<T>`** - Fetch single entity by ID
- **`useById(id): UseQueryResult<T>`** - Alias for `useQuery`

##### Mutation Methods

- **`useCreate(): UseMutationResult<TInput, T>`** - Create new entity
- **`useUpdate(): UseMutationResult<TInput, T>`** - Update entire entity (PUT)
- **`usePatch(): UseMutationResult<Partial<TInput>, T>`** - Partial update (PATCH)
- **`useDelete(): UseMutationResult<void, void>`** - Delete entity

##### Builder Methods

- **`withParams(params): API`** - Inject path parameters for nested routes
- **`withQuery(params): API`** - Inject query parameters

#### Examples

##### Basic Usage

```tsx
import { createDomainApi, z } from '@skylabs-digital/react-proto-kit';

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  isActive: z.boolean(),
});

const userApi = createDomainApi('users', userSchema, userSchema);

function UserList() {
  const { data: users, loading } = userApi.useList();
  const { mutate: createUser } = userApi.useCreate();
  
  return (
    <div>
      {users?.map(user => <div key={user.id}>{user.name}</div>)}
      <button onClick={() => createUser({ name: 'John', email: 'john@example.com', isActive: true })}>
        Add User
      </button>
    </div>
  );
}
```

##### Nested Resources

```tsx
const commentApi = createDomainApi(
  'posts/:postId/comments',
  commentSchema,
  commentUpsertSchema,
  {
    queryParams: {
      static: { include: 'author' },
      dynamic: ['status', 'sortBy']
    }
  }
);

function PostComments({ postId }: { postId: string }) {
  const api = commentApi
    .withParams({ postId })
    .withQuery({ status: 'published', sortBy: 'createdAt' });
    
  const { data: comments } = api.useList();
  
  return (
    <div>
      {comments?.map(comment => <div key={comment.id}>{comment.text}</div>)}
    </div>
  );
}
```

##### Different Entity and Upsert Schemas

```tsx
// Full entity schema (includes server-generated fields)
const postEntitySchema = z.object({
  title: z.string(),
  content: z.string(),
  slug: z.string(),           // Server-generated
  publishedAt: z.string(),    // Server-managed
  viewCount: z.number(),      // Server-managed
});

// Upsert schema (only fields that can be sent to server)
const postUpsertSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const postApi = createDomainApi('posts', postEntitySchema, postUpsertSchema);
```

## Hooks

### Query Hooks

All query hooks return a consistent interface:

```tsx
interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseListResult<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

#### `useList(params?)`

Fetch a list of entities with optional parameters.

```tsx
const { data, loading, error, refetch } = api.useList({
  page: 1,
  limit: 10,
  search: 'query',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

**Parameters:**
```tsx
interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any; // Additional custom parameters
}
```

#### `useQuery(id)` / `useById(id)`

Fetch a single entity by ID.

```tsx
const { data: user, loading, error } = api.useQuery('user-123');
```

### Mutation Hooks

All mutation hooks return a consistent interface:

```tsx
interface UseMutationResult<TInput, TOutput> {
  mutate: (data: TInput, id?: string) => Promise<TOutput>;
  loading: boolean;
  error: Error | null;
}
```

#### `useCreate()`

Create a new entity.

```tsx
const { mutate: createUser, loading, error } = api.useCreate();

// Usage
await createUser({
  name: 'John Doe',
  email: 'john@example.com'
});
```

#### `useUpdate()`

Update an entire entity (PUT request).

```tsx
const { mutate: updateUser, loading, error } = api.useUpdate();

// Usage - requires all fields from upsertSchema
await updateUser('user-123', {
  name: 'John Smith',
  email: 'john.smith@example.com'
});
```

#### `usePatch()`

Partially update an entity (PATCH request).

```tsx
const { mutate: patchUser, loading, error } = api.usePatch();

// Usage - only requires changed fields
await patchUser('user-123', {
  name: 'John Smith' // Only updating name
});
```

#### `useDelete()`

Delete an entity.

```tsx
const { mutate: deleteUser, loading, error } = api.useDelete();

// Usage
await deleteUser('user-123');
```

## Type Utilities

### `ExtractEntityType<T>`

Extracts the complete entity type from an API, including auto-generated fields.

```tsx
import { ExtractEntityType } from '@skylabs-digital/react-proto-kit';

const userApi = createDomainApi('users', userSchema, userUpsertSchema);

type User = ExtractEntityType<typeof userApi>;
// Result: { id: string; createdAt: string; updatedAt: string; name: string; email: string; }
```

### `ExtractInputType<T>`

Extracts the input type for create/update operations (excludes auto-generated fields).

```tsx
import { ExtractInputType } from '@skylabs-digital/react-proto-kit';

type UserInput = ExtractInputType<typeof userApi>;
// Result: { name: string; email: string; }
```

## Providers

### `ApiClientProvider`

Configures the HTTP client and connection type for your application.

```tsx
import { ApiClientProvider } from '@skylabs-digital/react-proto-kit';

function App() {
  return (
    <ApiClientProvider 
      connectorType="fetch" 
      config={{ baseUrl: 'http://localhost:3001' }}
    >
      {/* Your app */}
    </ApiClientProvider>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `connectorType` | `'fetch' \| 'localStorage'` | Connection type |
| `config?` | `ConnectorConfig` | Connector-specific configuration |
| `children` | `ReactNode` | Child components |

#### Connector Configurations

##### Fetch Connector

```tsx
interface FetchConnectorConfig {
  baseUrl?: string;                    // Base URL for API requests
  timeout?: number;                    // Request timeout in milliseconds
  headers?: Record<string, string>;    // Default headers
  interceptors?: {
    request?: RequestInterceptor[];    // Request interceptors
    response?: ResponseInterceptor[];  // Response interceptors
  };
}
```

##### LocalStorage Connector

```tsx
interface LocalStorageConnectorConfig {
  prefix?: string;        // Key prefix for localStorage (default: 'react-proto-kit')
  simulate?: {
    delay?: number;       // Simulate network delay (default: 100ms)
    errorRate?: number;   // Simulate error rate 0-1 (default: 0)
  };
}
```

### `GlobalStateProvider`

Enables global state management and real-time synchronization across components.

```tsx
import { GlobalStateProvider } from '@skylabs-digital/react-proto-kit';

function App() {
  return (
    <ApiClientProvider connectorType="fetch">
      <GlobalStateProvider>
        {/* Your app */}
      </GlobalStateProvider>
    </ApiClientProvider>
  );
}
```

## Form Utilities

### `useFormData(schema, initialValues)`

Provides form state management with Zod validation.

```tsx
import { useFormData } from '@skylabs-digital/react-proto-kit';

function UserForm() {
  const { values, errors, handleInputChange, handleSubmit, reset } = useFormData(
    userSchema,
    { name: '', email: '' }
  );

  const onSubmit = handleSubmit(async (data) => {
    // data is fully typed and validated
    await createUser(data);
    reset();
  });

  return (
    <form onSubmit={onSubmit}>
      <input
        name="name"
        value={values.name || ''}
        onChange={handleInputChange}
      />
      {errors.name && <span>{errors.name}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### Return Value

```tsx
interface UseFormDataResult<T> {
  values: Partial<T>;
  errors: Record<keyof T, string>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (onSubmit: (data: T) => void | Promise<void>) => (e: React.FormEvent) => void;
  reset: () => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Record<keyof T, string>) => void;
}
```

## Navigation Utilities

### `useUrlSelector(key, parser, options?)`

Synchronizes component state with URL parameters.

```tsx
import { useUrlSelector } from '@skylabs-digital/react-proto-kit';

function TodoList() {
  const [filter, setFilter] = useUrlSelector(
    'filter', 
    (value: string) => value as 'all' | 'active' | 'completed',
    { defaultValue: 'all' }
  );
  
  const [page, setPage] = useUrlSelector(
    'page',
    (value: string) => parseInt(value) || 1
  );

  return (
    <div>
      <button onClick={() => setFilter('active')}>Show Active</button>
      <button onClick={() => setPage(page + 1)}>Next Page</button>
    </div>
  );
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | URL parameter key |
| `parser` | `(value: string) => T` | Function to parse URL value |
| `options?` | `UrlSelectorOptions<T>` | Configuration options |

#### Options

```tsx
interface UrlSelectorOptions<T> {
  defaultValue?: T;      // Default value when parameter is not present
  multiple?: boolean;    // Whether to handle multiple values (arrays)
  replace?: boolean;     // Use replaceState instead of pushState
}
```

## Configuration

### Debug Logging

Enable debug logging to troubleshoot issues:

```tsx
import { configureDebugLogging } from '@skylabs-digital/react-proto-kit';

// Enable debug logging with custom prefix
configureDebugLogging(true, '[MY-APP]');
```

### Global Configuration

Configure default behaviors globally:

```tsx
import { configure } from '@skylabs-digital/react-proto-kit';

configure({
  defaultCacheTime: 10 * 60 * 1000,  // 10 minutes
  defaultOptimistic: true,
  defaultTimeout: 30000,             // 30 seconds
});
```

## Error Handling

All hooks provide consistent error handling:

```tsx
function UserList() {
  const { data: users, loading, error } = userApi.useList();
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {users?.map(user => <div key={user.id}>{user.name}</div>)}
    </div>
  );
}
```

### Error Types

```tsx
interface ApiError extends Error {
  status?: number;        // HTTP status code
  statusText?: string;    // HTTP status text
  data?: any;            // Error response data
}
```

## Best Practices

1. **Schema Design**: Keep entity schemas complete, upsert schemas minimal
2. **Type Safety**: Always use `ExtractEntityType` and `ExtractInputType` for consistent typing
3. **Error Handling**: Always handle loading and error states in your components
4. **Caching**: Use appropriate cache times based on data volatility
5. **Optimistic Updates**: Enable for better UX, disable for critical operations
6. **Nested Resources**: Use builder pattern for dynamic path parameters
7. **Form Validation**: Leverage Zod schemas for consistent validation

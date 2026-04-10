# ⚡ React Proto Kit

<div align="center">

> **From idea to working prototype in minutes**

[![npm version](https://badge.fury.io/js/@skylabs-digital%2Freact-proto-kit.svg)](https://www.npmjs.com/package/@skylabs-digital/react-proto-kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Zod](https://img.shields.io/badge/Zod-3.x-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)
[![Tests](https://img.shields.io/badge/tests-273%20passing-brightgreen?logo=vitest&logoColor=white)](#running-tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful React toolkit that eliminates boilerplate and accelerates development.  
Build full-stack apps with **type-safe APIs**, **real-time state**, and **automatic CRUD** — all from a single schema.

[Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Examples](#-examples) · [Full Docs](./docs/)

</div>

---

## 🚀 Quick Start

```bash
npm install @skylabs-digital/react-proto-kit zod react react-router-dom
```

```tsx
import { createDomainApi, z } from '@skylabs-digital/react-proto-kit';

// 1️⃣ Define your schema
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
});

// 2️⃣ Create a fully functional API
const userApi = createDomainApi('users', userSchema, userSchema);

// 3️⃣ Use it in your component
function UserList() {
  const { data: users, loading } = userApi.useList();
  const { mutate: createUser } = userApi.useCreate();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => createUser({ name: 'John', email: 'john@example.com', age: 30 })}>
        Add User
      </button>
      {users?.map(user => (
        <div key={user.id}>{user.name} - {user.email}</div>
      ))}
    </div>
  );
}
```

That's it! Full CRUD API with TypeScript inference, cache management, and automatic state sync.

---

## ✨ Features at a Glance

| Category | Features |
|----------|----------|
| 🔥 **Zero Boilerplate** | One function creates a complete CRUD API |
| 🎯 **Type-Safe** | Full TypeScript inference from Zod schemas — `ExtractEntityType`, `ExtractInputType` |
| ⚡ **Real-time State** | Automatic synchronization across components via `GlobalStateProvider` |
| 🔄 **Optimistic Updates** | Instant UI feedback with automatic rollback |
| 🌐 **Backend Agnostic** | `FetchConnector` for REST APIs, `LocalStorageConnector` for prototyping |
| 🛡️ **Structured Errors** | Full `ErrorResponse` propagation with custom `data` field for rich error handling |
| 📝 **Form Handling** | Built-in validation with `useFormData` and `createFormHandler` |
| 🔗 **Nested Resources** | Path templates like `todos/:todoId/comments` with builder pattern |
| 📊 **Query Params** | Static and dynamic query parameter management |
| 🔍 **URL State** | `useUrlTabs`, `useUrlModal`, `useUrlDrawer`, `useUrlStepper`, `useUrlAccordion`, `useUrlParam` |
| 🎭 **Data Orchestrator** | Aggregate multiple APIs with `isLoading` / `isFetching` / `stale-while-revalidate` |
| 🍞 **Snackbar** | Built-in toast notifications with queue management |
| 📡 **Single Record APIs** | `createSingleRecordApi` for settings, profiles, stats endpoints |
| 📖 **Read-Only APIs** | `createReadOnlyApi` / `createSingleRecordReadOnlyApi` for list or single-record GET-only endpoints |
| 🐛 **Debug Logging** | Configurable request/response logging via `configureDebugLogging` |
| 🌱 **Seed Data** | Built-in seed helpers for development and testing |

---

## 📖 Table of Contents

- [Installation](#-installation)
- [Basic Usage](#-basic-usage)
- [Advanced Features](#-advanced-features)
  - [Nested Resources & Builder Pattern](#-nested-resources--builder-pattern)
  - [Separate Schemas](#-separate-schemas-for-entity-vs-input)
  - [Type Extraction](#-type-extraction)
  - [Structured Error Handling](#️-structured-error-handling)
  - [Form Integration](#-form-integration)
  - [URL State Management](#-url-state-management)
  - [Partial Updates (PATCH)](#-partial-updates-with-patch)
  - [Single Record APIs](#-single-record-apis)
  - [Read-Only APIs](#-read-only-apis)
  - [Data Orchestrator](#-data-orchestrator)
  - [Local Storage Mode](#-local-storage-mode)
  - [Debug Logging](#-debug-logging)
  - [Seed Data](#-seed-data)
- [API Reference](#-api-reference)
- [UI Components](#-ui-components)
- [Examples](#-examples)
- [Backend Integration](#-backend-integration)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

## 📦 Installation

```bash
# npm
npm install @skylabs-digital/react-proto-kit zod react react-router-dom

# yarn
yarn add @skylabs-digital/react-proto-kit zod react react-router-dom

# pnpm
pnpm add @skylabs-digital/react-proto-kit zod react react-router-dom
```

**Peer Dependencies:**

| Package | Version |
|---------|---------|
| `react` | >= 16.8.0 |
| `react-router-dom` | >= 6.0.0 |
| `zod` | >= 3.0.0 |

---

## 🎯 Basic Usage

### 1️⃣ Setup Providers

```tsx
import { BrowserRouter } from 'react-router-dom';
import { ApiClientProvider, GlobalStateProvider } from '@skylabs-digital/react-proto-kit';

function App() {
  return (
    <BrowserRouter>
      <ApiClientProvider
        connectorType="fetch"
        config={{ baseUrl: 'http://localhost:3001/api' }}
      >
        <GlobalStateProvider>
          {/* Your app components */}
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}
```

> 💡 The `baseUrl` is slash-agnostic — `http://localhost:3001/api` and `http://localhost:3001/api/` both work identically.

### 2️⃣ Define Your Schema

```tsx
import { z } from '@skylabs-digital/react-proto-kit';

// Only define business fields — id, createdAt, updatedAt are auto-generated
const todoSchema = z.object({
  text: z.string().min(1, 'Todo text is required'),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});
```

### 3️⃣ Create Your API

```tsx
import { createDomainApi } from '@skylabs-digital/react-proto-kit';

const todoApi = createDomainApi('todos', todoSchema, todoSchema, {
  optimistic: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
});
```

### 4️⃣ Use in Components

```tsx
function TodoApp() {
  const { data: todos, loading, error } = todoApi.useList();
  const { mutate: createTodo } = todoApi.useCreate();
  const { mutate: updateTodo } = todoApi.useUpdate();
  const { mutate: deleteTodo } = todoApi.useDelete();

  if (loading) return <div>Loading todos...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => createTodo({ text: 'New Todo', completed: false })}>
        Add Todo
      </button>
      {todos?.map(todo => (
        <div key={todo.id}>
          <span>{todo.text}</span>
          <button onClick={() => updateTodo(todo.id, { ...todo, completed: !todo.completed })}>
            Toggle
          </button>
          <button onClick={() => deleteTodo(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🚀 Advanced Features

### 🔗 Nested Resources & Builder Pattern

```tsx
// Comments belong to todos
const commentApi = createDomainApi(
  'todos/:todoId/comments',
  commentSchema,
  commentUpsertSchema,
  {
    optimistic: false,
    queryParams: {
      static: { include: 'author' },
      dynamic: ['status', 'sortBy']
    }
  }
);

// Usage with builder pattern
function TodoComments({ todoId }: { todoId: string }) {
  const api = commentApi
    .withParams({ todoId })
    .withQuery({ status: 'published', sortBy: 'createdAt' });
    
  const { data: comments } = api.useList();
  const { mutate: createComment } = api.useCreate();
  
  return (
    <div>
      {comments?.map(comment => (
        <div key={comment.id}>{comment.text}</div>
      ))}
      <button onClick={() => createComment({ text: 'New comment', authorId: 'user-1' })}>
        Add Comment
      </button>
    </div>
  );
}
```

### 🔀 Separate Schemas for Entity vs Input

```tsx
// Full entity schema (includes server-generated fields)
const userEntitySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().url(), // Server-generated
  lastLoginAt: z.string().datetime(), // Server-managed
});

// Schema for create/update operations (excludes server-generated fields)
const userUpsertSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const userApi = createDomainApi('users', userEntitySchema, userUpsertSchema);
```

### 🏷️ Type Extraction

```tsx
import { ExtractEntityType, ExtractInputType } from '@skylabs-digital/react-proto-kit';

type User = ExtractEntityType<typeof userApi>;
// Result: { id: string; createdAt: string; updatedAt: string; name: string; email: string; avatar: string; lastLoginAt: string; }

type UserInput = ExtractInputType<typeof userApi>;
// Result: { name: string; email: string; }
```

### 🛡️ Structured Error Handling

Every mutation hook resolves to a discriminated `ApiResponse<T>`. When the backend returns an error, any **extra fields** in the response body are preserved in the `data` property of the `ErrorResponse` branch:

```tsx
import { ErrorResponse } from '@skylabs-digital/react-proto-kit';

// Backend returns HTTP 409:
// { message: "Stock exceeded", code: "STOCK_EXCEEDED", items: [...], orderId: "order-123" }

const res = await createMutation.mutate(checkoutData);
if (!res.success) {
  if (res.error?.code === 'STOCK_EXCEEDED') {
    // Extra fields from the response body are in res.data
    const items = res.data?.items as StockExceededItem[];
    showStockExceededDialog(items);
  }
  return;
}
// res.data is the created entity on success
```

**`ErrorResponse` interface:**

```tsx
interface ErrorResponse {
  success: false;
  message?: string;                       // Error message
  error?: { code: string };               // Error code (e.g., 'STOCK_EXCEEDED')
  type?: 'AUTH' | 'VALIDATION' | 'TRANSACTION' | 'NAVIGATION';
  validation?: Record<string, string>;    // Field-level validation errors
  data?: Record<string, unknown>;         // 🆕 Any extra fields from the response body
}
```

> 💡 The `data` field is automatically populated from any response body fields that aren't `message`, `code`, `type`, or `validation`. If the error body only has known fields, `data` is `undefined`.

See the full [Error Handling Guide](./docs/ERROR_HANDLING.md) for patterns and examples.

### 📝 Form Integration

```tsx
import { useFormData } from '@skylabs-digital/react-proto-kit';

function UserForm() {
  const { mutate: createUser } = userApi.useCreate();
  const { values, errors, handleInputChange, handleSubmit, reset } = useFormData(
    userUpsertSchema,
    { name: '', email: '' }
  );

  const onSubmit = handleSubmit(async (data) => {
    const res = await createUser(data);
    if (!res.success) return; // Bail out; createUser.error exposes the ErrorResponse for rendering
    reset();
  });

  return (
    <form onSubmit={onSubmit}>
      <input
        name="name"
        value={values.name || ''}
        onChange={handleInputChange}
        placeholder="Name"
      />
      {errors.name && <span>{errors.name}</span>}
      
      <input
        name="email"
        value={values.email || ''}
        onChange={handleInputChange}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email}</span>}
      
      <button type="submit">Create User</button>
    </form>
  );
}
```

### 🔍 URL State Management

```tsx
import { useUrlSelector } from '@skylabs-digital/react-proto-kit';

function TodoList() {
  const [filter, setFilter] = useUrlSelector('filter', (value: string) => value as FilterType);
  const [page, setPage] = useUrlSelector('page', (value: string) => parseInt(value) || 1);
  
  const { data: todos } = todoApi.useList({
    page,
    limit: 10,
    filter: filter || 'all'
  });

  return (
    <div>
      <button onClick={() => setFilter('active')}>Show Active</button>
      <button onClick={() => setFilter('completed')}>Show Completed</button>
      <button onClick={() => setPage(page + 1)}>Next Page</button>
      {/* Render todos */}
    </div>
  );
}
```

### ✏️ Partial Updates with PATCH

```tsx
function TodoItem({ todo }: { todo: Todo }) {
  const { mutate: patchTodo } = todoApi.usePatch();
  
  // Only update the completed field
  const toggleCompleted = () => {
    patchTodo(todo.id, { completed: !todo.completed });
  };
  
  return (
    <div>
      <span>{todo.text}</span>
      <button onClick={toggleCompleted}>
        {todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
      </button>
    </div>
  );
}
```

### 📡 Single Record APIs

```tsx
import { createSingleRecordApi, createSingleRecordReadOnlyApi } from '@skylabs-digital/react-proto-kit';

// Full CRUD for single record (settings, profile, etc.)
const settingsApi = createSingleRecordApi(
  'users/:userId/settings',
  settingsSchema,
  settingsInputSchema,
  { 
    allowReset: true,           // Enable useReset() for reset to defaults
    refetchInterval: 30000      // Auto-refresh every 30 seconds
  }
);

// Read-only for computed/aggregate data (stats, analytics)
const statsApi = createSingleRecordReadOnlyApi(
  'dashboard/stats',
  statsSchema,
  { refetchInterval: 60000 }
);
```

**Usage in components:**

```tsx
function UserSettings({ userId }: { userId: string }) {
  const api = settingsApi.withParams({ userId });
  
  // Fetch single record (not a list)
  const { data: settings, loading, refetch } = api.useRecord();
  
  // Update entire record (PUT - no ID needed)
  const { mutate: updateSettings, loading: updating } = api.useUpdate();
  
  // Partial update (PATCH - no ID needed)
  const { mutate: patchSettings } = api.usePatch();
  
  // Reset to defaults (DELETE - optional, requires allowReset: true)
  const { mutate: resetSettings } = api.useReset();
  
  const handleSave = async (newSettings: SettingsInput) => {
    const res = await updateSettings(newSettings);
    if (!res.success) {
      // Show toast, keep the form open, etc.
      return;
    }
  };

  const toggleDarkMode = async () => {
    await patchSettings({ darkMode: !settings?.darkMode });
    // Fire-and-forget: the hook's `error` state will surface any failure
  };

  if (loading) return <Spinner />;
  
  return (
    <SettingsForm 
      settings={settings} 
      onSave={handleSave}
      onToggleDarkMode={toggleDarkMode}
      onReset={resetSettings}
    />
  );
}

// Read-only dashboard stats
function DashboardStats() {
  const { data: stats, loading } = statsApi.useRecord();
  
  if (loading) return <StatsSkeleton />;
  
  return (
    <div>
      <StatCard title="Total Users" value={stats?.totalUsers} />
      <StatCard title="Active Today" value={stats?.activeToday} />
    </div>
  );
}
```

**Key differences from `createDomainApi`:**

| Feature | `createDomainApi` | `createSingleRecordApi` | `createSingleRecordReadOnlyApi` |
|---------|-------------------|-------------------------|--------------------------------|
| `useList` | ✅ | ❌ | ❌ |
| `useById` | ✅ | ❌ | ❌ |
| `useRecord` | ❌ | ✅ | ✅ |
| `useCreate` | ✅ | ❌ | ❌ |
| `useUpdate` | ✅ (with ID) | ✅ (no ID) | ❌ |
| `usePatch` | ✅ (with ID) | ✅ (no ID) | ❌ |
| `useDelete` | ✅ | ❌ | ❌ |
| `useReset` | ❌ | ✅ (optional) | ❌ |
| `refetchInterval` | ❌ | ✅ | ✅ |

### 📖 Read-Only APIs

For endpoints where you only need to fetch data (no create/update/delete):

```tsx
import { createReadOnlyApi } from '@skylabs-digital/react-proto-kit';

// Read-only list endpoint (e.g., public catalog, reference data)
const combosApi = createReadOnlyApi('/combos/active', comboSchema);

function ComboList() {
  const { data: combos, loading } = combosApi.useList();
  if (loading) return <div>Loading...</div>;
  return <ul>{combos?.map(c => <li key={c.id}>{c.name}</li>)}</ul>;
}
```

> 💡 Also available: `createSingleRecordReadOnlyApi` for single-record GET-only endpoints (stats, analytics).

### 🎭 Data Orchestrator

Manage multiple API calls in a single component with smart loading states. Choose between **Hook** (flexible) or **HOC** (declarative) patterns:

#### Hook Pattern

```tsx
import { useDataOrchestrator } from '@skylabs-digital/react-proto-kit';

function Dashboard() {
  const { data, isLoading, isFetching, hasErrors, errors, retryAll } = useDataOrchestrator({
    required: {
      users: userApi.useList,
      products: productApi.useList,
    },
    optional: {
      stats: statsApi.useQuery,
    },
  });

  if (isLoading) return <FullPageLoader />;
  if (hasErrors) return <ErrorPage errors={errors} onRetry={retryAll} />;

  return (
    <div>
      {isFetching && <TopBarSpinner />}
      <h1>Users: {data.users!.length}</h1>
      <h1>Products: {data.products!.length}</h1>
    </div>
  );
}
```

#### HOC Pattern (with Refetch)

```tsx
import { withDataOrchestrator } from '@skylabs-digital/react-proto-kit';

interface DashboardData {
  users: User[];
  products: Product[];
}

function DashboardContent({ users, products, orchestrator }: DashboardData & { orchestrator: any }) {
  return (
    <div>
      {/* Refresh all data */}
      <button onClick={orchestrator.retryAll} disabled={orchestrator.isFetching}>
        {orchestrator.isFetching ? 'Refreshing...' : 'Refresh All'}
      </button>
      
      <h1>Users: {users.length}</h1>
      
      {/* Refresh individual resource */}
      <button onClick={() => orchestrator.retry('products')}>Refresh Products</button>
      {orchestrator.loading.products && <Spinner />}
      
      <h1>Products: {products.length}</h1>
    </div>
  );
}

export const Dashboard = withDataOrchestrator<DashboardData>(DashboardContent, {
  hooks: {
    users: userApi.useList,
    products: productApi.useList,
  }
});
```

#### URL-Driven Data with Auto-Refetch

```tsx
import { withDataOrchestrator, useUrlTabs, useUrlParam } from '@skylabs-digital/react-proto-kit';

interface TodoListData {
  todos: Todo[];
}

function TodoListContent({ todos, orchestrator }: TodoListData & { orchestrator: any }) {
  const [activeTab, setTab] = useUrlTabs('status', ['active', 'completed', 'archived'], 'active');

  return (
    <div>
      {/* Tab navigation updates URL */}
      <button onClick={() => setTab('active')}>Active</button>
      <button onClick={() => setTab('completed')}>Completed</button>
      <button onClick={() => setTab('archived')}>Archived</button>

      {/* Non-blocking refetch indicator */}
      {orchestrator.isFetching && <span>🔄 Refreshing...</span>}

      {/* List updates automatically when tab changes */}
      <ul>
        {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
      </ul>
    </div>
  );
}

const TodoListWithData = withDataOrchestrator<TodoListData>(TodoListContent, {
  hooks: {
    todos: () => {
      const [status] = useUrlParam('status'); // Reads ?status=active
      return todoApi.withQuery({ status: status || 'active' }).useList();
    },
  },
  options: {
    watchSearchParams: ['status'], // Auto-refetch when ?status= changes
    refetchBehavior: 'stale-while-revalidate', // Smooth transitions (default)
  },
});
```

**How it works:**
1. User clicks "Completed" tab → URL updates to `?status=completed`
2. `watchSearchParams` detects change
3. Hook re-executes with new status value
4. `stale-while-revalidate` shows "Active" todos while loading "Completed"
5. Smooth transition when new data arrives

**Key Features:**
- **`isLoading`**: Blocks rendering during first load of required resources
- **`isFetching`**: Shows non-blocking indicator for refetches
- **`watchSearchParams`**: Auto-refetch when specified URL params change
- **`refetchBehavior`**: `'stale-while-revalidate'` (smooth) or `'blocking'` (explicit)
- **Required vs Optional**: Control which resources block rendering
- **Granular Retry**: Retry individual resources or all at once
- **Orchestrator Prop**: HOC injects refetch capabilities automatically
- **Type-Safe**: Full TypeScript inference for all data

**Refetch Behaviors:**
- **`stale-while-revalidate`** (default): Shows previous data while fetching new data. Perfect for tabs, filters, pagination.
- **`blocking`**: Clears data and shows loading state. Use for critical updates where stale data is misleading.

See [Data Orchestrator Documentation](./docs/DATA_ORCHESTRATOR.md) for complete examples.

### 💾 Local Storage Mode

Perfect for prototyping without a backend — your API calls work exactly the same:

```tsx
function App() {
  return (
    <BrowserRouter>
      <ApiClientProvider connectorType="localStorage">
        <GlobalStateProvider>
          {/* Your app works exactly the same! */}
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}
```

### 🐛 Debug Logging

Enable detailed request/response logging during development:

```tsx
import { configureDebugLogging } from '@skylabs-digital/react-proto-kit';

// Enable all debug logs
configureDebugLogging({ enabled: true });

// Disable in production
configureDebugLogging({ enabled: false });
```

### 🌱 Seed Data

Pre-populate your app with seed data for development and demos:

```tsx
import { createDevSeedConfig, createFallbackSeedConfig } from '@skylabs-digital/react-proto-kit';

// Seed data only in development
const seedConfig = createDevSeedConfig([
  { text: 'Learn React Proto Kit', completed: false, priority: 'high' },
  { text: 'Build something awesome', completed: false, priority: 'medium' },
]);

// Or use fallback seed (only if collection is empty)
const fallbackSeed = createFallbackSeedConfig([
  { text: 'Default item', completed: false },
]);
```

> 💡 Also available: `createInitSeedConfig`, `createEnvironmentSeedConfig`, and `generateMockData` for advanced seeding scenarios.

---

## 📚 API Reference

### `createDomainApi(path, entitySchema, upsertSchema, config?)`

Creates a complete CRUD API for a resource.

**Parameters:**
- `path: string` - Resource path (e.g., 'users', 'todos/:todoId/comments')
- `entitySchema: ZodSchema` - Schema for entity responses
- `upsertSchema: ZodSchema` - Schema for create/update operations
- `config?: object` - Optional configuration

**Config Options:**
```tsx
{
  optimistic?: boolean;        // Enable optimistic updates (default: true)
  cacheTime?: number;         // Cache duration in milliseconds
  queryParams?: {
    static?: Record<string, any>;   // Always included parameters
    dynamic?: string[];             // Runtime configurable parameters
  };
}
```

**Returns:** API object with methods:
- `useList(params?)` - Fetch list of entities
- `useQuery(id)` / `useById(id)` - Fetch single entity
- `useCreate()` - Create new entity
- `useUpdate()` - Update entire entity (PUT)
- `usePatch()` - Partial update (PATCH)
- `useDelete()` - Delete entity
- `withParams(params)` - Inject path parameters (builder pattern)
- `withQuery(params)` - Inject query parameters (builder pattern)

### `createSingleRecordApi(path, entitySchema, upsertSchema, config?)`

Creates an API for single-record endpoints (settings, config, profile).

**Parameters:**
- `path: string` - Resource path (e.g., 'settings', 'users/:userId/profile')
- `entitySchema: ZodSchema` - Schema for entity responses
- `upsertSchema: ZodSchema` - Schema for update operations
- `config?: object` - Optional configuration

**Config Options:**
```tsx
{
  cacheTime?: number;           // Cache duration in milliseconds
  refetchInterval?: number;     // Auto-refetch interval (for real-time data)
  allowReset?: boolean;         // Enable useReset() method
  queryParams?: {
    static?: Record<string, any>;
    dynamic?: string[];
  };
}
```

**Returns:** API object with methods:
- `useRecord()` - Fetch single record
- `useUpdate()` - Update entire record (PUT)
- `usePatch()` - Partial update (PATCH)
- `useReset()` - Reset to defaults (DELETE) - only if `allowReset: true`
- `withParams(params)` - Inject path parameters
- `withQuery(params)` - Inject query parameters

### `createSingleRecordReadOnlyApi(path, entitySchema, config?)`

Creates a read-only API for computed/aggregate endpoints (stats, analytics).

**Parameters:**
- `path: string` - Resource path (e.g., 'dashboard/stats')
- `entitySchema: ZodSchema` - Schema for entity responses
- `config?: object` - Optional configuration (same as above, minus `allowReset`)

**Returns:** API object with methods:
- `useRecord()` - Fetch single record
- `withParams(params)` - Inject path parameters
- `withQuery(params)` - Inject query parameters

### `createReadOnlyApi(path, entitySchema)`

Creates a read-only list API (no create/update/delete).

**Returns:** `{ useList, useById, withParams, withQuery }`

### Hooks

All hooks return objects with consistent interfaces:

**Query Hooks** (`useList`, `useQuery`, `useById`, `useRecord`):

```tsx
{
  data: T | T[] | null;
  loading: boolean;
  error: ErrorResponse | null;
  refetch: () => Promise<void>;
}
```

**Mutation Hooks** (`useCreate`, `useUpdate`, `usePatch`, `useDelete`):

```tsx
{
  mutate: (...args) => Promise<ApiResponse<T>>;
  loading: boolean;
  error: ErrorResponse | null;  // 🛡️ Mirrors the last ErrorResponse, useful for persistent banners
}
```

> 💡 **Mutations always resolve to an `ApiResponse<T>` and never throw.** Check `res.success` before reading `res.data`. The `error` state on the hook is kept in sync for rendering persistent banners, but inline reactions belong to the awaited return value:
>
> ```tsx
> const res = await updateTodo.mutate(id, data);
> if (!res.success) {
>   showSnackbar({ message: res.message, variant: 'error' });
>   return;
> }
> // res.data is the updated entity
> ```
>
> This replaces the previous `try/catch` pattern — reading `mutation.error` immediately after `await mutate(...)` would return the stale value from the previous render, so returning the response from `mutate` is the only reliable way to react inline.

### Type Utilities

| Utility | Description |
|---------|-------------|
| `ExtractEntityType<T>` | Complete entity type with auto-generated fields (`id`, `createdAt`, `updatedAt`) |
| `ExtractInputType<T>` | Input type for create/update operations (excludes auto-generated fields) |
| `InferType<T>` | Infer entity type from a Zod schema |
| `InferCreateType<T>` | Infer create input type |
| `InferUpdateType<T>` | Infer update input type |

## 📁 Examples

The repository includes **9 working examples** covering different use cases:

| Example | Description |
|---------|-------------|
| 📝 [Todo (Basic)](./examples/todo-without-global-context/) | Simple CRUD operations with local state |
| 📝 [Todo (Global State)](./examples/todo-with-global-context/) | Real-time state sync across components |
| 📝 [Todo (Backend)](./examples/todo-with-backend/) | Full-stack integration with Express.js |
| 📝 [Todo (Tabs)](./examples/todo-with-tabs-example/) | URL-driven tabs with auto-refetch |
| 📰 [Blog (Backend)](./examples/blog-with-backend/) | Nested resources (posts → comments) |
| 📰 [Blog (Global State)](./examples/blog-with-global-context/) | Blog with centralized state |
| 📰 [Blog (Basic)](./examples/blog-without-global-context/) | Blog without global state |
| 🔍 [URL Navigation Demo](./examples/url-navigation-demo/) | Modal, Drawer, Tabs, Stepper, Accordion |
| 🐛 [Debug Renders](./examples/debug-renders/) | Performance debugging and render tracking |

**Run any example locally:**

```bash
git clone https://github.com/skylabs-digital/react-proto-kit.git
cd react-proto-kit/examples/todo-with-backend
npm install
npm run dev
```

## 🎨 UI Components

### Snackbar Notifications

Built-in toast-style notifications with auto-dismiss and queue management:

```tsx
import { SnackbarProvider, SnackbarContainer, useSnackbar } from '@skylabs-digital/react-proto-kit';

// Setup (once in your app)
function App() {
  return (
    <SnackbarProvider>
      <SnackbarContainer position="top-right" maxVisible={3} />
      <YourApp />
    </SnackbarProvider>
  );
}

// Use in any component
function SaveButton() {
  const { showSnackbar } = useSnackbar();
  
  const handleSave = async () => {
    try {
      await saveData();
      showSnackbar({
        message: 'Changes saved successfully!',
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      showSnackbar({
        message: 'Error saving changes',
        variant: 'error',
        duration: 5000
      });
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

**Snackbar Features:**
- ✅ 4 variants: `success`, `error`, `warning`, `info`
- ✅ Auto-dismiss with configurable timeout
- ✅ Queue system for multiple notifications
- ✅ Optional action buttons (undo, etc.)
- ✅ Fully customizable via `SnackbarComponent` prop
- ✅ 6 position options (top/bottom, left/center/right)
- ✅ Portal rendering for proper z-index

**Custom Snackbar Component:**
```tsx
import { SnackbarItemProps } from '@skylabs-digital/react-proto-kit';

function CustomSnackbar({ snackbar, onClose, animate }: SnackbarItemProps) {
  return (
    <div style={{ /* your custom styles */ }}>
      <span>{snackbar.message}</span>
      {snackbar.action && (
        <button onClick={() => {
          snackbar.action.onClick();
          onClose(snackbar.id);
        }}>
          {snackbar.action.label}
        </button>
      )}
      <button onClick={() => onClose(snackbar.id)}>×</button>
    </div>
  );
}

// Use custom component
<SnackbarContainer SnackbarComponent={CustomSnackbar} />
```

**Integration with CRUD APIs:**
```tsx
const todosApi = createDomainApi('todos', todoSchema);
const { showSnackbar } = useSnackbar();

const createMutation = todosApi.useCreate({
  onSuccess: () => showSnackbar({ message: 'Todo created!', variant: 'success' }),
  onError: (e) => showSnackbar({ message: e.message, variant: 'error' })
});
```

## 📖 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

| Guide | Description |
|-------|-------------|
| 📘 [API Reference](./docs/API_REFERENCE.md) | Complete API documentation with all hooks and components |
| 🛡️ [Error Handling](./docs/ERROR_HANDLING.md) | Structured `ErrorResponse`, custom error codes, `data` field |
| 🎨 [UI Components](./docs/UI_COMPONENTS.md) | Modal, Drawer, Tabs, Stepper, Accordion, Snackbar |
| 🎭 [Data Orchestrator](./docs/DATA_ORCHESTRATOR.md) | Aggregate multiple APIs, stale-while-revalidate |
| 📝 [Forms Guide](./docs/FORMS.md) | Form handling, validation, `useFormData`, `createFormHandler` |
| ⚡ [Global Context](./docs/GLOBAL_CONTEXT_GUIDE.md) | State management and real-time sync |
| 🚀 [Advanced Usage](./docs/ADVANCED_USAGE.md) | Complex patterns and best practices |
| 🏗️ [Architecture](./docs/ARCHITECTURE.md) | Internal design decisions and data flow |
| 📡 [Single Record API (RFC)](./docs/RFC_SINGLE_RECORD_API.md) | Design spec for single-record endpoints |
| 🔄 [Data Orchestrator Refetch (RFC)](./docs/RFC_WITH_DATA_ORCHESTRATOR_REFETCH.md) | Design spec for refetch behaviors |
| 🔗 [URL Navigation (RFC)](./docs/RFC_URL_NAVIGATION.md) | Design spec for URL-driven UI components |
| 📋 [Migration Guide](./docs/MIGRATION_GUIDE.md) | Upgrading between versions |
| 🤝 [Contributing](./docs/CONTRIBUTING.md) | How to contribute to the project |

## 🛠 Backend Integration

### Express.js Example

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let todos = [];
let nextId = 1;

// GET /todos
app.get('/todos', (req, res) => {
  res.json(todos);
});

// POST /todos
app.post('/todos', (req, res) => {
  const todo = {
    id: String(nextId++),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...req.body
  };
  todos.push(todo);
  res.status(201).json(todo);
});

// PUT /todos/:id
app.put('/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });
  
  todos[index] = {
    ...todos[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json(todos[index]);
});

// PATCH /todos/:id
app.patch('/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });
  
  todos[index] = {
    ...todos[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json(todos[index]);
});

// DELETE /todos/:id
app.delete('/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });
  
  todos.splice(index, 1);
  res.status(204).send();
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/skylabs-digital/react-proto-kit.git
cd react-proto-kit
npm install
npm run dev
```

### Running Tests

```bash
yarn test              # Run tests once
yarn test --watch      # Run tests in watch mode
yarn ci                # Lint + type-check + test + build
```

---

## 📄 License

MIT © [Skylabs Digital](https://github.com/skylabs-digital)

---

<div align="center">

Built with ❤️ by the **Skylabs Digital** team

[Zod](https://zod.dev/) · [React](https://reactjs.org/) · [Vitest](https://vitest.dev/) · [Vite](https://vitejs.dev/)

**Ready to prototype at lightning speed?** ⚡

[Get Started](#-quick-start) · [Explore Examples](#-examples) · [Read the Docs](./docs/)

</div>

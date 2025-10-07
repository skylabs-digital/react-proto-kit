# API Reference

Complete reference for all React Proto Kit APIs, hooks, and utilities.

## Table of Contents

- [Core API](#core-api)
- [Hooks](#hooks)
- [Data Orchestrator](#data-orchestrator)
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

## Data Orchestrator

The Data Orchestrator helps manage multiple data fetching operations with smart loading states and refetch capabilities.

### `useDataOrchestrator(config, options?)`

Aggregate multiple hook calls into a single orchestrated state.

```tsx
import { useDataOrchestrator } from '@skylabs-digital/react-proto-kit';

const { data, isLoading, isFetching, hasErrors, errors, retry, retryAll, refetch } = useDataOrchestrator({
  users: usersApi.useList,
  products: productsApi.useList,
});
```

#### Config

**Simple Config** - All resources are required by default:

```tsx
const result = useDataOrchestrator({
  users: usersApi.useList,
  profile: () => profileApi.useQuery(userId),
});
```

**Advanced Config** - Required vs Optional resources:

```tsx
const result = useDataOrchestrator({
  required: {
    users: usersApi.useList,       // Must load before rendering
  },
  optional: {
    stats: statsApi.useQuery,      // Can fail without blocking
  },
});
```

#### Options

```tsx
interface UseDataOrchestratorOptions {
  resetKey?: string | number;  // Reset state when this changes
  onError?: (errors: Record<string, ErrorResponse>) => void;
}
```

#### Return Value

```tsx
interface UseDataOrchestratorResult<T> {
  // Data by key
  data: { [K in keyof T]: DataType | null };
  
  // Aggregated states
  isLoading: boolean;      // First load of required resources (blocks rendering)
  isFetching: boolean;     // First load + refetches (non-blocking indicator)
  hasErrors: boolean;      // Only considers required resource errors
  
  // Granular states
  loadingStates: { [K in keyof T]: boolean };
  errors: { [K in keyof T]?: ErrorResponse };
  
  // Retry functions
  retry: (key: keyof T) => void;
  retryAll: () => void;
  refetch: { [K in keyof T]: () => Promise<void> };
}
```

---

### `withDataOrchestrator<TData>(Component, config)`

HOC that wraps a component with data orchestration. Injects an `orchestrator` prop with refetch capabilities.

```tsx
import { withDataOrchestrator } from '@skylabs-digital/react-proto-kit';

interface PageData {
  users: User[];
  posts: Post[];
}

function MyComponent({ 
  users, 
  posts, 
  orchestrator 
}: PageData & { orchestrator: any }) {
  return (
    <div>
      <button onClick={orchestrator.retryAll}>Refresh All</button>
      <button onClick={() => orchestrator.retry('posts')}>Refresh Posts</button>
      {orchestrator.loading.posts && <Spinner />}
      
      <UserList users={users} />
      <PostList posts={posts} />
    </div>
  );
}

export const MyPage = withDataOrchestrator<PageData>(MyComponent, {
  hooks: {
    users: usersApi.useList,
    posts: postsApi.useList,
  }
});
```

#### Orchestrator Prop API

The injected `orchestrator` prop provides:

```tsx
interface OrchestratorControls {
  // Refetch methods
  retry: (key: string) => void;              // Refetch single resource
  retryAll: () => void;                      // Refetch all resources
  refetch: { [key: string]: () => Promise<void> };  // Async refetch per resource
  
  // State access
  loading: { [key: string]: boolean };       // Loading state per resource
  errors: { [key: string]?: ErrorResponse }; // Error state per resource
  isFetching: boolean;                       // Any resource currently fetching
  isLoading: boolean;                        // Initial load in progress
}
```

#### Configuration

```tsx
interface WithDataOrchestratorConfig<T> {
  hooks: T;                                    // Required: data hooks
  loader?: React.ReactNode;                    // Optional: custom loader
  errorComponent?: React.ComponentType<...>;   // Optional: custom error component
  options?: UseDataOrchestratorOptions;        // Optional: orchestrator options
}
```

**Example with all options:**

```tsx
export const Dashboard = withDataOrchestrator<DashboardData>(
  DashboardComponent,
  {
    hooks: {
      users: usersApi.useList,
      products: productsApi.useList,
    },
    loader: <CustomLoader />,
    errorComponent: CustomErrorPage,
    options: {
      resetKey: userId,
      onError: (errors) => console.error('Failed:', errors),
    }
  }
);
```

#### Use Cases

**Refresh All Button:**

```tsx
<button 
  onClick={orchestrator.retryAll}
  disabled={orchestrator.isFetching}
>
  {orchestrator.isFetching ? 'Refreshing...' : 'Refresh'}
</button>
```

**Individual Resource Refresh:**

```tsx
<button onClick={() => orchestrator.retry('reviews')}>
  Refresh Reviews
</button>
{orchestrator.loading.reviews && <Spinner />}
```

**After Mutation:**

```tsx
const createMutation = todosApi.useCreate({
  onSuccess: () => {
    orchestrator.refetch.todos();
  }
});
```

See [Data Orchestrator Documentation](./DATA_ORCHESTRATOR.md) for detailed patterns and examples.

---

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

## Navigation & UI Components

React Proto Kit includes a complete suite of URL-synchronized UI components for building dynamic interfaces.

### `useSnackbar()`

Hook for displaying toast-style notifications with auto-dismiss and queue management.

```tsx
import { SnackbarProvider, SnackbarContainer, useSnackbar } from '@skylabs-digital/react-proto-kit';

// Setup (once in your app root)
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
        message: 'Saved successfully!',
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      showSnackbar({
        message: 'Error saving data',
        variant: 'error',
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => handleSave()
        }
      });
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

#### API

```tsx
interface UseSnackbarReturn {
  showSnackbar: (options: ShowSnackbarOptions) => string;  // Returns snackbar ID
  hideSnackbar: (id: string) => void;                      // Close by ID
  hideAll: () => void;                                     // Close all
}

interface ShowSnackbarOptions {
  message: string;                                  // Notification message
  variant?: 'success' | 'error' | 'warning' | 'info';  // Visual style
  duration?: number | null;                         // Auto-dismiss delay (null = persist)
  onClose?: () => void;                            // Callback when closed
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

#### Components

**SnackbarContainer**: Container that renders all active snackbars

```tsx
interface SnackbarContainerProps {
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  maxVisible?: number;        // Max simultaneous snackbars (default: 3)
  className?: string;
  animate?: boolean;          // Enable animations (default: true)
  SnackbarComponent?: React.ComponentType<SnackbarItemProps>;  // Custom snackbar component
}
```

**Custom Snackbar Component**: Override default styling

```tsx
import { SnackbarItemProps } from '@skylabs-digital/react-proto-kit';

function CustomSnackbar({ snackbar, onClose, animate }: SnackbarItemProps) {
  return (
    <div className="my-custom-snackbar">
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

---

### `useUrlModal(modalId, options?)`

Manages modal state via URL parameter (`?modal=modalId`). Ensures only one modal is open at a time.

```tsx
import { useUrlModal } from '@skylabs-digital/react-proto-kit';

function UserEditModal() {
  const [isOpen, setOpen] = useUrlModal('editUser', {
    onOpen: () => console.log('Modal opened'),
    onClose: () => console.log('Modal closed')
  });
  
  return (
    <>
      <button onClick={() => setOpen(true)}>Edit User</button>
      {isOpen && (
        <div className="modal">
          <h2>Edit User</h2>
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </>
  );
}
```

#### API

```tsx
type UseUrlModalReturn = readonly [
  boolean,                      // isOpen
  (value?: boolean) => void     // setOpen (toggles if no value)
];

interface UseUrlModalOptions {
  onOpen?: () => void;
  onClose?: () => void;
}
```

---

### `useUrlDrawer(drawerId, options?)`

Manages drawer/sidebar state via URL parameter (`?drawer=drawerId`).

```tsx
import { useUrlDrawer } from '@skylabs-digital/react-proto-kit';

function FilterDrawer() {
  const [isOpen, setOpen] = useUrlDrawer('filters', {
    position: 'right',
    onOpen: () => console.log('Drawer opened')
  });
  
  return (
    <>
      <button onClick={() => setOpen(true)}>Show Filters</button>
      {isOpen && (
        <aside className="drawer">
          <h3>Filters</h3>
          <button onClick={() => setOpen(false)}>Close</button>
        </aside>
      )}
    </>
  );
}
```

#### API

```tsx
interface UseUrlDrawerOptions {
  position?: 'left' | 'right' | 'top' | 'bottom';
  onOpen?: () => void;
  onClose?: () => void;
}
```

---

### `useUrlTabs(options)`

Manages tab state via URL parameter (`?tab=tabId`).

```tsx
import { useUrlTabs } from '@skylabs-digital/react-proto-kit';

function SettingsTabs() {
  const { activeTab, setTab, isActive } = useUrlTabs({
    tabs: ['profile', 'security', 'notifications'],
    defaultTab: 'profile',
    paramName: 'section'  // Custom param name (default: 'tab')
  });
  
  return (
    <div>
      <nav>
        <button onClick={() => setTab('profile')} className={isActive('profile') ? 'active' : ''}>
          Profile
        </button>
        <button onClick={() => setTab('security')} className={isActive('security') ? 'active' : ''}>
          Security
        </button>
      </nav>
      
      {activeTab === 'profile' && <ProfileSettings />}
      {activeTab === 'security' && <SecuritySettings />}
    </div>
  );
}
```

#### API

```tsx
interface UseUrlTabsReturn {
  activeTab: string;
  setTab: (tabId: string) => void;
  isActive: (tabId: string) => boolean;
  nextTab: () => void;
  prevTab: () => void;
}
```

---

### `useUrlStepper(options)`

Manages multi-step form state via URL parameter (`?step=stepId`).

```tsx
import { useUrlStepper } from '@skylabs-digital/react-proto-kit';

function OnboardingFlow() {
  const { currentStep, nextStep, prevStep, goToStep, isComplete } = useUrlStepper({
    steps: ['welcome', 'profile', 'preferences', 'complete'],
    defaultStep: 'welcome'
  });
  
  return (
    <div>
      <h2>Step {currentStep}</h2>
      {currentStep === 'welcome' && <WelcomeStep />}
      {currentStep === 'profile' && <ProfileStep />}
      
      <button onClick={prevStep} disabled={currentStep === 'welcome'}>
        Previous
      </button>
      <button onClick={nextStep} disabled={isComplete}>
        Next
      </button>
    </div>
  );
}
```

#### API

```tsx
interface UseUrlStepperReturn {
  currentStep: string;
  currentStepIndex: number;
  goToStep: (step: string | number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isComplete: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}
```

---

### `useUrlAccordion(options)`

Manages accordion state via URL parameter. Supports single or multiple expanded panels.

```tsx
import { useUrlAccordion } from '@skylabs-digital/react-proto-kit';

// Single mode
function FAQAccordion() {
  const { expanded, toggle, isExpanded } = useUrlAccordion({
    mode: 'single',
    paramName: 'faq'
  });
  
  return (
    <div>
      <div onClick={() => toggle('shipping')}>
        <h3>Shipping Info</h3>
        {isExpanded('shipping') && <p>Ships in 2-3 days</p>}
      </div>
      
      <div onClick={() => toggle('returns')}>
        <h3>Returns</h3>
        {isExpanded('returns') && <p>30-day return policy</p>}
      </div>
    </div>
  );
}

// Multiple mode
function FilterAccordion() {
  const { expanded, toggle, isExpanded, expandAll, collapseAll } = useUrlAccordion({
    mode: 'multiple',
    paramName: 'filters'
  });
  
  return (
    <div>
      <button onClick={expandAll}>Expand All</button>
      <button onClick={collapseAll}>Collapse All</button>
      {/* ... accordion items */}
    </div>
  );
}
```

#### API

```tsx
// Single mode
interface AccordionHelpersSingle {
  expanded: string | undefined;
  toggle: (id: string) => void;
  isExpanded: (id: string) => boolean;
  expand: (id: string) => void;
  collapse: () => void;
}

// Multiple mode
interface AccordionHelpersMultiple {
  expanded: string[];
  toggle: (id: string) => void;
  isExpanded: (id: string) => boolean;
  expand: (id: string) => void;
  collapse: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
}
```

---

### `useUrlSelector(key, parser, options?)`

Low-level hook for synchronizing any component state with URL parameters.

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

#### API

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

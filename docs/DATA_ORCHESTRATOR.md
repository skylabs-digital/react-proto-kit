# Data Orchestrator

The Data Orchestrator is a powerful feature that helps you manage multiple data fetching operations in a single page or component.

## Features

- 🎯 **Aggregate multiple hooks** - Combine `useList`, `useQuery` from multiple domains
- 🔄 **Smart loading states** - Distinguish between first load (`isLoading`) and refetches (`isFetching`)
- ✅ **Required vs Optional** - Mark resources as critical or optional for rendering
- 🔁 **Granular retry** - Retry individual resources or all at once
- 🔑 **Reset on navigation** - Clear state when route parameters change
- 📦 **Two modes** - Hook for flexibility, HOC for simplicity

## Quick Start

### 1. Hook Mode (Maximum Flexibility)

```tsx
import { useDataOrchestrator, createDomainApi, z } from '@skylabs-digital/react-proto-kit';

const usersApi = createDomainApi('users', userSchema);
const productsApi = createDomainApi('products', productSchema);

function Dashboard() {
  const { data, isLoading, isFetching, hasErrors, errors, retryAll } = useDataOrchestrator({
    users: usersApi.useList,
    products: productsApi.useList,
  });

  // First load - blocks rendering
  if (isLoading) return <FullPageLoader />;
  
  // Error - show error screen
  if (hasErrors) return <ErrorPage errors={errors} onRetry={retryAll} />;

  return (
    <div>
      {/* Refetch indicator - non-blocking */}
      {isFetching && <TopBarSpinner />}
      
      <h1>Users: {data.users!.length}</h1>
      <h1>Products: {data.products!.length}</h1>
    </div>
  );
}
```

### 2. HOC Mode (Declarative with Refetch)

```tsx
import { withDataOrchestrator } from '@skylabs-digital/react-proto-kit';

interface DashboardData {
  users: User[];
  products: Product[];
}

function DashboardContent({ 
  users, 
  products, 
  orchestrator 
}: DashboardData & { orchestrator: any }) {
  return (
    <div>
      {/* Refresh all data */}
      <button 
        onClick={orchestrator.retryAll}
        disabled={orchestrator.isFetching}
      >
        {orchestrator.isFetching ? 'Refreshing...' : 'Refresh All'}
      </button>

      <h1>Users: {users.length}</h1>
      
      {/* Refresh individual resource */}
      <button onClick={() => orchestrator.retry('products')}>
        Refresh Products
      </button>
      {orchestrator.loading.products && <Spinner />}
      
      <h1>Products: {products.length}</h1>
    </div>
  );
}

// Only renders when all data is loaded
export const Dashboard = withDataOrchestrator<DashboardData>(DashboardContent, {
  hooks: {
    users: usersApi.useList,
    products: productsApi.useList,
  },
});
```

## API Reference

### `useDataOrchestrator(config, options?)`

#### Config Object

```tsx
// Simple config - all resources are required by default
const result = useDataOrchestrator({
  users: usersApi.useList,
  profile: () => profileApi.useQuery(userId),
});

// Advanced config - required vs optional
const result = useDataOrchestrator({
  required: {
    users: usersApi.useList,       // Must load before rendering
    profile: () => profileApi.useQuery(userId),
  },
  optional: {
    stats: statsApi.useQuery,      // Can fail without blocking
    activity: activityApi.useList,
  },
});
```

#### Options

```tsx
interface UseDataOrchestratorOptions {
  resetKey?: string | number;  // Reset state when this changes
  onError?: (errors: Record<string, ErrorResponse>) => void;
  watchSearchParams?: string[]; // Auto-reset when URL params change
  refetchBehavior?: 'stale-while-revalidate' | 'blocking'; // Loading UX mode
}
```

**New Options:**

- **`watchSearchParams`**: Array of URL search parameter names to watch. When any of these params change in the URL, the orchestrator automatically resets and refetches all data.
  
  ```tsx
  withDataOrchestrator(Component, {
    hooks: { /* ... */ },
    options: {
      watchSearchParams: ['status', 'category'], // Refetch when ?status= or ?category= changes
    },
  });
  ```

- **`refetchBehavior`**: Controls how data transitions during refetches (default: `'stale-while-revalidate'`):
  - `'stale-while-revalidate'`: Shows previous data while fetching new data. Provides smooth transitions without loading flashes.
  - `'blocking'`: Clears data and shows loading state during refetch. More explicit but can feel slower.
  
  ```tsx
  withDataOrchestrator(Component, {
    hooks: { /* ... */ },
    options: {
      watchSearchParams: ['tab'],
      refetchBehavior: 'stale-while-revalidate', // Smooth tab transitions
    },
  });
  ```

#### Return Value

```tsx
interface UseDataOrchestratorResult<T> {
  // Data by key (null until loaded)
  data: { [K in keyof T]: DataType<T[K]> | null };
  
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
  
  // Legacy refetch (use retry instead)
  refetch: { [K in keyof T]: () => Promise<void> };
}
```

## Common Patterns

### Pattern 1: Required + Optional Resources

```tsx
function ProductPage({ productId }: { productId: string }) {
  const { data, isLoading, errors, retry } = useDataOrchestrator(
    {
      required: {
        product: () => productsApi.useQuery(productId),
      },
      optional: {
        reviews: () => reviewsApi.useList({ productId }),
        related: () => productsApi.useList({ category: 'similar' }),
      },
    },
    { resetKey: productId }  // Reset when productId changes
  );

  if (isLoading) return <Loader />;

  return (
    <div>
      <ProductDetails product={data.product!} />
      
      {/* Optional resources can fail independently */}
      {errors.reviews ? (
        <ErrorBanner error={errors.reviews}>
          <button onClick={() => retry('reviews')}>Retry Reviews</button>
        </ErrorBanner>
      ) : (
        <ReviewsList reviews={data.reviews} />
      )}
    </div>
  );
}
```

### Pattern 2: Progressive Loading

```tsx
function Dashboard() {
  const { data, loadingStates, errors, retry } = useDataOrchestrator({
    users: usersApi.useList,
    products: productsApi.useList,
    stats: statsApi.useQuery,
  });

  return (
    <div>
      {/* Each section loads independently */}
      <section>
        <h2>Users</h2>
        {loadingStates.users ? (
          <Skeleton />
        ) : errors.users ? (
          <ErrorBlock error={errors.users} onRetry={() => retry('users')} />
        ) : (
          <UserList users={data.users!} />
        )}
      </section>

      <section>
        <h2>Products</h2>
        {loadingStates.products ? (
          <Skeleton />
        ) : errors.products ? (
          <ErrorBlock error={errors.products} onRetry={() => retry('products')} />
        ) : (
          <ProductList products={data.products!} />
        )}
      </section>
    </div>
  );
}
```

### Pattern 3: Route Parameters with Reset

```tsx
function UserProfile() {
  const { userId } = useParams();
  
  const { data, isLoading, isFetching, hasErrors, retryAll } = useDataOrchestrator(
    {
      profile: () => usersApi.useQuery(userId),
      posts: () => postsApi.useList({ userId }),
      followers: () => followersApi.useList({ userId }),
    },
    { resetKey: userId }  // Reset state when navigating to different user
  );

  if (isLoading) return <Loader />;
  if (hasErrors) return <ErrorPage onRetry={retryAll} />;

  return (
    <div>
      {/* Non-blocking refetch indicator */}
      {isFetching && <RefreshIndicator />}
      
      <ProfileHeader profile={data.profile!} />
      <PostsList posts={data.posts!} />
      <FollowersList followers={data.followers!} />
    </div>
  );
}
```

### Pattern 4: Global Loader/Error Components

```tsx
import { DataOrchestratorProvider } from '@skylabs-digital/react-proto-kit';

function App() {
  return (
    <DataOrchestratorProvider
      defaultLoader={<CustomLoader />}
      defaultErrorComponent={CustomError}
      mode="fullscreen"
    >
      <YourApp />
    </DataOrchestratorProvider>
  );
}

// Now all withDataOrchestrator HOCs will use these defaults
const Dashboard = withDataOrchestrator(DashboardContent, {
  hooks: { users: usersApi.useList },
  // No need to specify loader/errorComponent
});
```

### Pattern 5: URL-Driven Tabs with Smooth Transitions ⭐ NEW

Perfect for tabbed interfaces where the active tab is controlled by URL search params:

```tsx
import { withDataOrchestrator, useUrlTabs, useUrlParam } from '@skylabs-digital/react-proto-kit';

interface TodoListData {
  todos: Todo[];
}

// Component receives filtered data based on active tab
function TodoListContent({ todos, orchestrator }: TodoListData & { orchestrator: any }) {
  const [activeTab, setTab] = useUrlTabs<'active' | 'completed' | 'archived'>(
    'status',
    ['active', 'completed', 'archived'],
    'active'
  );

  return (
    <div>
      {/* Tab navigation updates URL */}
      <nav>
        <button onClick={() => setTab('active')}>Active</button>
        <button onClick={() => setTab('completed')}>Completed</button>
        <button onClick={() => setTab('archived')}>Archived</button>
      </nav>

      {/* Non-blocking refetch indicator */}
      {orchestrator.isFetching && <span>🔄 Refreshing...</span>}

      {/* List updates automatically when tab changes */}
      <TodoList todos={todos} />
    </div>
  );
}

// HOC configuration with URL watching
const TodoListWithData = withDataOrchestrator<TodoListData>(TodoListContent, {
  hooks: {
    todos: () => {
      // Hook reads current status from URL
      const [status] = useUrlParam('status');
      return todosApi.withQuery({ status: status || 'active' }).useList();
    },
  },
  options: {
    // Automatically refetch when ?status= changes
    watchSearchParams: ['status'],
    
    // Show previous tab's data while loading new tab (smooth transitions)
    refetchBehavior: 'stale-while-revalidate',
  },
});
```

**How it works:**

1. User clicks "Completed" tab
2. URL updates to `?status=completed`
3. `watchSearchParams` detects change
4. Hook re-executes with new `status` value
5. `stale-while-revalidate` shows "Active" todos while loading "Completed"
6. Smooth transition when new data arrives

**Benefits:**
- ✅ Shareable URLs (`?status=completed`)
- ✅ Browser back/forward works
- ✅ No loading flashes between tabs
- ✅ Previous tab data stays visible during transitions

### Pattern 6: Multi-Filter with URL State

Combine multiple URL parameters for complex filtering:

```tsx
interface ProductListData {
  products: Product[];
}

function ProductListContent({ products, orchestrator }: ProductListData & { orchestrator: any }) {
  const [category] = useUrlParam('category');
  const [sortBy] = useUrlParam('sortBy');
  const [status] = useUrlParam('status');

  return (
    <div>
      {/* URL-driven filters */}
      <FilterBar 
        category={category} 
        sortBy={sortBy}
        status={status}
      />

      {/* Smooth transitions between filter combinations */}
      {orchestrator.isFetching && <Spinner />}
      
      <ProductGrid products={products} />
    </div>
  );
}

const ProductListWithData = withDataOrchestrator<ProductListData>(ProductListContent, {
  hooks: {
    products: () => {
      const [category] = useUrlParam('category');
      const [sortBy] = useUrlParam('sortBy');
      const [status] = useUrlParam('status');
      
      return productsApi.withQuery({ category, sortBy, status }).useList();
    },
  },
  options: {
    // Refetch when any of these URL params change
    watchSearchParams: ['category', 'sortBy', 'status'],
    refetchBehavior: 'stale-while-revalidate',
  },
});
```

## Key Concepts

### isLoading vs isFetching

**`isLoading`**: Only `true` during the **first load** of required resources. Blocks rendering.

**`isFetching`**: `true` during first load **AND** refetches. Use for non-blocking indicators.

```tsx
const { isLoading, isFetching } = useDataOrchestrator({ users: usersApi.useList });

// First load
if (isLoading) return <FullPageLoader />;  // Blocks everything

// After first load completes, refetches show indicator without blocking
return (
  <div>
    {isFetching && <TopBarSpinner />}  {/* Non-blocking */}
    <UserList users={data.users!} />
  </div>
);
```

### resetKey

Use `resetKey` to reset the orchestrator's internal state when route parameters change:

```tsx
const { productId } = useParams();

const result = useDataOrchestrator(
  {
    product: () => productsApi.useQuery(productId),
    reviews: () => reviewsApi.useList({ productId }),
  },
  { resetKey: productId }
);

// When productId changes from '123' to '456':
// 1. State resets completely
// 2. isLoading becomes true again
// 3. Previous data is cleared
// 4. Hooks re-execute with new productId
```

### Retry Functions

**`retry(key)`**: Retry a specific resource

**`retryAll()`**: Retry all resources

```tsx
const { retry, retryAll, errors } = useDataOrchestrator({
  required: { users: usersApi.useList },
  optional: { stats: statsApi.useQuery },
});

// Retry specific resource
{errors.stats && <button onClick={() => retry('stats')}>Retry Stats</button>}

// Retry everything
<button onClick={retryAll}>Refresh All</button>
```

## withDataOrchestrator HOC

The `withDataOrchestrator` HOC provides a declarative way to fetch data with automatic loading/error handling. It **injects an `orchestrator` prop** with refetch capabilities.

### Basic Usage

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

### Orchestrator Prop API

The `orchestrator` prop provides full control over data fetching:

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

### Patterns with HOC

#### Pattern A: Refresh All Button

```tsx
function Dashboard({ users, products, orchestrator }: DashboardData & { orchestrator: any }) {
  return (
    <div>
      <button 
        onClick={orchestrator.retryAll}
        disabled={orchestrator.isFetching}
      >
        {orchestrator.isFetching ? 'Refreshing...' : 'Refresh'}
      </button>
      
      <UserList users={users} />
      <ProductList products={products} />
    </div>
  );
}

export const DashboardPage = withDataOrchestrator<DashboardData>(Dashboard, {
  hooks: {
    users: usersApi.useList,
    products: productsApi.useList,
  }
});
```

#### Pattern B: Individual Resource Refresh

```tsx
function ProductPage({ product, reviews, orchestrator }: PageData & { orchestrator: any }) {
  return (
    <div>
      <ProductDetails product={product} />
      
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Reviews</h2>
          <button 
            onClick={() => orchestrator.retry('reviews')}
            disabled={orchestrator.loading.reviews}
          >
            {orchestrator.loading.reviews ? '⟳' : 'Refresh Reviews'}
          </button>
        </div>
        
        {orchestrator.loading.reviews && <Skeleton />}
        <ReviewsList reviews={reviews} />
      </section>
    </div>
  );
}

export const ProductPageWithData = withDataOrchestrator<PageData>(ProductPage, {
  hooks: {
    product: () => productsApi.useQuery(productId),
    reviews: () => reviewsApi.useList({ productId }),
  }
});
```

#### Pattern C: After Mutation Refetch

```tsx
function TodoList({ todos, orchestrator }: TodoData & { orchestrator: any }) {
  const createMutation = todosApi.useCreate({
    onSuccess: () => {
      // Refetch todos after creating
      orchestrator.refetch.todos();
    }
  });
  
  const deleteMutation = todosApi.useDelete({
    onSuccess: () => {
      orchestrator.refetch.todos();
    }
  });
  
  return (
    <div>
      <TodoForm onSubmit={createMutation.mutate} />
      <TodoList todos={todos} onDelete={deleteMutation.mutate} />
    </div>
  );
}

export const TodoPage = withDataOrchestrator<TodoData>(TodoList, {
  hooks: { todos: todosApi.useList }
});
```

#### Pattern D: Pull-to-Refresh

```tsx
function Feed({ posts, notifications, orchestrator }: FeedData & { orchestrator: any }) {
  const [isPulling, setIsPulling] = useState(false);
  
  const handlePullToRefresh = async () => {
    setIsPulling(true);
    await orchestrator.retryAll();
    setIsPulling(false);
  };
  
  return (
    <PullToRefresh onRefresh={handlePullToRefresh} refreshing={isPulling}>
      <NotificationBadge 
        count={notifications.length}
        loading={orchestrator.loading.notifications}
      />
      <PostFeed posts={posts} loading={orchestrator.loading.posts} />
    </PullToRefresh>
  );
}

export const FeedPage = withDataOrchestrator<FeedData>(Feed, {
  hooks: {
    posts: postsApi.useList,
    notifications: () => notificationsApi.useList({ unread: true }),
  }
});
```

### HOC Configuration

```tsx
interface WithDataOrchestratorConfig<T> {
  hooks: T;                                    // Required: data hooks
  loader?: React.ReactNode;                    // Optional: custom loader
  errorComponent?: React.ComponentType<...>;   // Optional: custom error component
  options?: UseDataOrchestratorOptions;        // Optional: orchestrator options
}

// Example with all options
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
      onError: (errors) => console.error('Data loading failed:', errors),
    }
  }
);
```

### Auto-Reset with URL Search Params

A common pattern is to filter data based on URL query parameters. The HOC supports **automatic reset** when specific search params change:

```tsx
import { useUrlParam, withDataOrchestrator } from '@skylabs-digital/react-proto-kit';

function TodoListContent({ todos, orchestrator }) {
  return (
    <div>
      <h1>Todos</h1>
      <ul>
        {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
      </ul>
    </div>
  );
}

export function TodoListPage() {
  const [status] = useUrlParam('status');  // Reads ?status=completed
  const [category] = useUrlParam('category');  // Reads ?category=work

  // Component wrapped with HOC
  const TodoList = withDataOrchestrator(TodoListContent, {
    hooks: {
      // Hooks capture current status/category values
      // Use withQuery() to inject query params
      todos: () => todosApi.withQuery({ status, category }).useList()
    },
    options: {
      // 🔥 Auto-reset when these params change!
      watchSearchParams: ['status', 'category']
    }
  });

  return <TodoList />;
}
```

**How it works:**
1. User changes `?status=active` to `?status=completed` in URL
2. HOC detects change in watched param `status`
3. Automatically resets orchestrator state
4. Hooks re-execute with new `status` value
5. Fresh data loads with new filters ✨

**Without `watchSearchParams`:**
- Changing URL params wouldn't trigger re-fetch
- Would need manual `orchestrator.refetch()` calls
- Hooks would still use old captured values

---

### Hook vs HOC: When to Use What

**Use `useDataOrchestrator` (Hook) when:**
- ✅ You need custom loading/error UI
- ✅ You want progressive loading per section
- ✅ You need fine-grained control over rendering
- ✅ Component has complex conditional logic

**Use `withDataOrchestrator` (HOC) when:**
- ✅ You want declarative data fetching
- ✅ Standard full-page loader/error is sufficient
- ✅ Component is purely presentational
- ✅ You want refetch capabilities with minimal boilerplate
- ✅ Data depends on URL query parameters (use `watchSearchParams`)

## Type Safety

The Data Orchestrator is fully typed:

```tsx
const result = useDataOrchestrator({
  users: usersApi.useList,
  profile: () => profileApi.useQuery('123'),
});

// TypeScript knows:
result.data.users: User[] | null
result.data.profile: Profile | null
result.loadingStates.users: boolean
result.errors.profile?: ErrorResponse
result.retry: (key: 'users' | 'profile') => void
```

## Refetch Behavior Explained

### Stale-While-Revalidate (Default) ⭐

Shows previous data while fetching new data, providing smooth transitions without loading flashes:

```tsx
// Tab 1: Active todos load → [Todo1, Todo2, Todo3]
// User clicks Tab 2: Completed
// During fetch: Shows [Todo1, Todo2, Todo3] (stale from Tab 1)
// After fetch completes: Smoothly transitions to [Todo4, Todo5] (fresh data)
```

**Perfect for:**
- Tab switching
- Filter changes
- Pagination
- Any UI where immediate feedback is important

**Caching:**
- `useList`: Caches by `cacheKey` (endpoint + params + queryParams)
- `useById`: Caches by ID
- Each unique combination is cached independently

**Behavior:**
- **First load**: Shows loading state (no previous data available)
- **Subsequent changes**: Shows previous data while fetching
- **Error handling**: Falls back to blocking mode if no previous data

### Blocking Mode

Clears data and shows loading state during refetch:

```tsx
// Tab 1: Active todos load → [Todo1, Todo2, Todo3]
// User clicks Tab 2: Completed
// During fetch: Shows loading spinner (data cleared)
// After fetch completes: Shows [Todo4, Todo5]
```

**Perfect for:**
- Critical data updates where stale data is misleading
- When you want explicit loading feedback
- Small datasets that load quickly

**Use cases:**
```tsx
withDataOrchestrator(Component, {
  hooks: { /* ... */ },
  options: {
    refetchBehavior: 'blocking', // Explicit loading states
  },
});
```

### Configuration Levels

**1. Global (App-wide):**
```tsx
<RefetchBehaviorProvider behavior="stale-while-revalidate">
  <App />
</RefetchBehaviorProvider>
```

**2. Per Orchestrator:**
```tsx
withDataOrchestrator(Component, {
  hooks: { /* ... */ },
  options: {
    refetchBehavior: 'stale-while-revalidate', // Overrides global
  },
});
```

**3. Per Hook (advanced):**
```tsx
todosApi.useList({ refetchBehavior: 'blocking' }) // Overrides orchestrator
```

**Precedence:** Hook > Orchestrator > Context > Default

## Best Practices

### ✅ DO

- Use `isLoading` for full-page loading states
- Use `isFetching` for refetch indicators (non-blocking)
- Mark truly optional resources as `optional`
- Use `watchSearchParams` for URL-driven data
- Use `stale-while-revalidate` for smooth UX (default)
- Use `resetKey` when data depends on route params
- Provide `onError` callback for logging/tracking
- Combine `watchSearchParams` + `refetchBehavior` for tab UIs

### ❌ DON'T

- Don't mark critical resources as `optional`
- Don't forget to handle `null` data after loading checks
- Don't ignore `isFetching` - it improves UX
- Don't skip `resetKey` for route-dependent data
- Don't use `blocking` mode unless you need explicit loading states
- Don't forget to wrap hooks in factories when using URL params

## Migration from Manual Hooks

### Before (Manual)

```tsx
function Dashboard() {
  const { data: users, loading: usersLoading, error: usersError } = usersApi.useList();
  const { data: products, loading: productsLoading, error: productsError } = productsApi.useList();
  
  const loading = usersLoading || productsLoading;
  const hasError = !!usersError || !!productsError;
  
  if (loading) return <Loader />;
  if (hasError) return <ErrorPage />;
  
  return <div>...</div>;
}
```

### After (Data Orchestrator)

```tsx
function Dashboard() {
  const { data, isLoading, hasErrors } = useDataOrchestrator({
    users: usersApi.useList,
    products: productsApi.useList,
  });
  
  if (isLoading) return <Loader />;
  if (hasErrors) return <ErrorPage />;
  
  return <div>...</div>;
}
```

## Examples

See complete working examples in:

### URL-Driven Tab Switching
- **`/examples/todo-with-tabs-example/`** - Complete example showing:
  - `watchSearchParams` for automatic refetching on URL changes
  - `refetchBehavior: 'stale-while-revalidate'` for smooth tab transitions
  - `useUrlTabs` for tab state management
  - `useUrlParam` for reading URL parameters in hooks

### Complex Dashboard
- **`/examples/todo-with-global-context/src/DashboardExample.tsx`** - Shows:
  - Multiple data sources with required/optional pattern
  - Progressive loading per section
  - Granular error handling

## Related

- [RFC: withDataOrchestrator Refetch Support](./RFC_WITH_DATA_ORCHESTRATOR_REFETCH.md) - Implementation details
- [URL Navigation Guide](./RFC_URL_NAVIGATION.md) - URL state management
- [createDomainApi Documentation](./CREATE_DOMAIN_API.md)
- [Global State Documentation](./GLOBAL_STATE.md)

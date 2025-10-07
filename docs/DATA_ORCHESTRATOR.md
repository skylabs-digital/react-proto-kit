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
}
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

## Best Practices

### ✅ DO

- Use `isLoading` for full-page loading states
- Use `isFetching` for refetch indicators
- Mark truly optional resources as `optional`
- Use `resetKey` when data depends on route params
- Provide `onError` callback for logging/tracking

### ❌ DON'T

- Don't mark critical resources as `optional`
- Don't forget to handle `null` data after loading checks
- Don't ignore `isFetching` - it improves UX
- Don't skip `resetKey` for route-dependent data

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

See the complete examples in:
- `/examples/todo-with-global-context/src/DashboardExample.tsx`

## Related

- [createDomainApi Documentation](./CREATE_DOMAIN_API.md)
- [Global State Documentation](./GLOBAL_STATE.md)
- [RFC: Data Orchestrator](./RFC_PAGE_DATA_WRAPPER.md)

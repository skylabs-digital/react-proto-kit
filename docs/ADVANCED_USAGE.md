# Advanced Usage Guide

This guide covers advanced patterns, best practices, and complex use cases for React Proto Kit.

## Table of Contents

- [Complex Schema Patterns](#complex-schema-patterns)
- [Advanced API Patterns](#advanced-api-patterns)
- [State Management Strategies](#state-management-strategies)
- [Performance Optimization](#performance-optimization)
- [Error Handling Patterns](#error-handling-patterns)
- [Testing Strategies](#testing-strategies)
- [Custom Connectors](#custom-connectors)
- [Migration Patterns](#migration-patterns)

## Complex Schema Patterns

### Polymorphic Schemas

Handle different entity types with union schemas:

```tsx
import { z } from '@skylabs-digital/react-proto-kit';

// Base notification schema
const baseNotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});

// Specific notification types
const emailNotificationSchema = baseNotificationSchema.extend({
  type: z.literal('email'),
  subject: z.string(),
  body: z.string(),
});

const pushNotificationSchema = baseNotificationSchema.extend({
  type: z.literal('push'),
  title: z.string(),
  message: z.string(),
  icon: z.string().optional(),
});

// Union schema for all notification types
const notificationSchema = z.discriminatedUnion('type', [
  emailNotificationSchema,
  pushNotificationSchema,
]);

const notificationApi = createDomainApi('notifications', notificationSchema, notificationSchema);

// Usage with type discrimination
function NotificationItem({ notification }: { notification: ExtractEntityType<typeof notificationApi> }) {
  switch (notification.type) {
    case 'email':
      return <EmailNotification notification={notification} />;
    case 'push':
      return <PushNotification notification={notification} />;
    default:
      return null;
  }
}
```

### Nested Object Schemas

Handle complex nested data structures:

```tsx
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string().default('US'),
});

const contactInfoSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
});

const userProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  avatar: z.string().url().optional(),
  address: addressSchema,
  contactInfo: contactInfoSchema,
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(false),
      sms: z.boolean().default(false),
    }),
  }),
});

const userApi = createDomainApi('users', userProfileSchema, userProfileSchema);
```

### Conditional Schemas

Use Zod's conditional validation for complex business rules:

```tsx
const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1),
  price: z.number().min(0),
  type: z.enum(['physical', 'digital']),
}).refine((data) => {
  // Physical items require shipping info
  if (data.type === 'physical') {
    return data.quantity <= 100; // Max quantity for physical items
  }
  return true;
}, {
  message: "Physical items cannot exceed quantity of 100",
});

const orderSchema = z.object({
  customerId: z.string(),
  items: z.array(orderItemSchema).min(1),
  shippingAddress: addressSchema.optional(),
  billingAddress: addressSchema,
  paymentMethod: z.enum(['credit_card', 'paypal', 'bank_transfer']),
}).refine((data) => {
  // Require shipping address for physical items
  const hasPhysicalItems = data.items.some(item => item.type === 'physical');
  return !hasPhysicalItems || data.shippingAddress;
}, {
  message: "Shipping address required for physical items",
  path: ['shippingAddress'],
});
```

## Advanced API Patterns

### Multi-Tenant APIs

Handle multi-tenant applications with dynamic path parameters:

```tsx
// Tenant-specific API
const createTenantApi = (tenantId: string) => {
  const userApi = createDomainApi(
    `tenants/${tenantId}/users`,
    userSchema,
    userUpsertSchema,
    {
      queryParams: {
        static: { tenantId },
        dynamic: ['role', 'status', 'department']
      }
    }
  );
  
  const projectApi = createDomainApi(
    `tenants/${tenantId}/projects`,
    projectSchema,
    projectUpsertSchema
  );
  
  return { userApi, projectApi };
};

// Usage in component
function TenantDashboard({ tenantId }: { tenantId: string }) {
  const { userApi, projectApi } = useMemo(() => createTenantApi(tenantId), [tenantId]);
  
  const { data: users } = userApi.useList();
  const { data: projects } = projectApi.useList();
  
  return (
    <div>
      <h2>Tenant {tenantId}</h2>
      <UserList users={users} />
      <ProjectList projects={projects} />
    </div>
  );
}
```

### API Composition

Compose multiple APIs for complex data relationships:

```tsx
// Create related APIs
const userApi = createDomainApi('users', userSchema, userUpsertSchema);
const postApi = createDomainApi('posts', postSchema, postUpsertSchema);
const commentApi = createDomainApi('posts/:postId/comments', commentSchema, commentUpsertSchema);

// Compose into a blog API
const createBlogApi = () => {
  return {
    users: userApi,
    posts: postApi,
    comments: commentApi,
    
    // Helper methods for common operations
    getUserPosts: (userId: string) => {
      return postApi.useList({ userId });
    },
    
    getPostComments: (postId: string) => {
      return commentApi.withParams({ postId }).useList();
    },
    
    // Complex operations
    createPostWithTags: async (postData: any, tags: string[]) => {
      const { mutate: createPost } = postApi.useCreate();
      const post = await createPost(postData);
      
      // Create tags separately
      await Promise.all(
        tags.map(tag => 
          fetch(`/api/posts/${post.id}/tags`, {
            method: 'POST',
            body: JSON.stringify({ name: tag })
          })
        )
      );
      
      return post;
    }
  };
};
```

### Paginated Data with Infinite Scroll

Implement infinite scroll with automatic pagination:

```tsx
function useInfiniteList<T>(api: any, pageSize = 20) {
  const [allData, setAllData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const { data, loading: queryLoading } = api.useList({
    page,
    limit: pageSize
  });

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllData(data);
      } else {
        setAllData(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === pageSize);
      setLoading(false);
    }
  }, [data, page, pageSize]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setLoading(true);
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
  }, []);

  return {
    data: allData,
    loading: queryLoading || loading,
    hasMore,
    loadMore,
    reset
  };
}

// Usage
function InfinitePostList() {
  const { data: posts, loading, hasMore, loadMore } = useInfiniteList(postApi);

  return (
    <div>
      {posts.map(post => <PostItem key={post.id} post={post} />)}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## State Management Strategies

### Selective State Updates

Optimize performance by updating only specific parts of the state:

```tsx
function useSelectiveUpdate<T>(api: any, selector: (data: T[]) => any) {
  const { data: fullData, ...rest } = api.useList();
  
  const selectedData = useMemo(() => {
    return fullData ? selector(fullData) : null;
  }, [fullData, selector]);
  
  return { data: selectedData, ...rest };
}

// Usage
function TodoStats() {
  const { data: stats } = useSelectiveUpdate(
    todoApi,
    (todos) => ({
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      pending: todos.filter(t => !t.completed).length
    })
  );
  
  return (
    <div>
      <div>Total: {stats?.total}</div>
      <div>Completed: {stats?.completed}</div>
      <div>Pending: {stats?.pending}</div>
    </div>
  );
}
```

### Cross-Component State Synchronization

Synchronize state across multiple components:

```tsx
// Custom hook for shared state
function useSharedTodoState() {
  const { data: todos, loading, error } = todoApi.useList();
  const { mutate: createTodo } = todoApi.useCreate();
  const { mutate: updateTodo } = todoApi.useUpdate();
  const { mutate: deleteTodo } = todoApi.useDelete();
  
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  const filteredTodos = useMemo(() => {
    if (!todos) return [];
    
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);
  
  const stats = useMemo(() => ({
    total: todos?.length || 0,
    completed: todos?.filter(t => t.completed).length || 0,
    active: todos?.filter(t => !t.completed).length || 0
  }), [todos]);
  
  return {
    todos: filteredTodos,
    allTodos: todos,
    loading,
    error,
    filter,
    setFilter,
    stats,
    actions: {
      create: createTodo,
      update: updateTodo,
      delete: deleteTodo
    }
  };
}

// Use in multiple components
function TodoHeader() {
  const { stats, filter, setFilter } = useSharedTodoState();
  
  return (
    <div>
      <h1>Todos ({stats.total})</h1>
      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active ({stats.active})</button>
        <button onClick={() => setFilter('completed')}>Completed ({stats.completed})</button>
      </div>
    </div>
  );
}

function TodoList() {
  const { todos, loading, actions } = useSharedTodoState();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {todos.map(todo => (
        <TodoItem 
          key={todo.id} 
          todo={todo} 
          onUpdate={actions.update}
          onDelete={actions.delete}
        />
      ))}
    </div>
  );
}
```

## Performance Optimization

### Memoization Strategies

Optimize re-renders with proper memoization:

```tsx
// Memoize expensive computations
const ExpensiveComponent = memo(({ data }: { data: any[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveComputation(item)
    }));
  }, [data]);
  
  return (
    <div>
      {processedData.map(item => (
        <div key={item.id}>{item.computed}</div>
      ))}
    </div>
  );
});

// Memoize callback functions
function TodoItem({ todo, onUpdate }: { todo: Todo; onUpdate: (id: string, data: any) => void }) {
  const handleToggle = useCallback(() => {
    onUpdate(todo.id, { ...todo, completed: !todo.completed });
  }, [todo, onUpdate]);
  
  return (
    <div>
      <span>{todo.text}</span>
      <button onClick={handleToggle}>Toggle</button>
    </div>
  );
}
```

### Lazy Loading

Implement lazy loading for better performance:

```tsx
// Lazy load components
const LazyUserProfile = lazy(() => import('./UserProfile'));
const LazyUserPosts = lazy(() => import('./UserPosts'));

function UserDashboard({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState('profile');
  
  return (
    <div>
      <div>
        <button onClick={() => setActiveTab('profile')}>Profile</button>
        <button onClick={() => setActiveTab('posts')}>Posts</button>
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        {activeTab === 'profile' && <LazyUserProfile userId={userId} />}
        {activeTab === 'posts' && <LazyUserPosts userId={userId} />}
      </Suspense>
    </div>
  );
}
```

### Virtual Scrolling

Handle large datasets with virtual scrolling:

```tsx
import { FixedSizeList as List } from 'react-window';

function VirtualizedList() {
  const { data: items, loading } = itemApi.useList({ limit: 10000 });
  
  if (loading) return <div>Loading...</div>;
  
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      <ItemComponent item={items[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={items?.length || 0}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

## Error Handling Patterns

### Global Error Boundary

Implement global error handling:

```tsx
class ApiErrorBoundary extends Component<
  { children: ReactNode; fallback?: ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('API Error:', error, errorInfo);
    // Send to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }
    
    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}
```

### Retry Logic

Implement automatic retry for failed requests:

```tsx
function useRetryableQuery<T>(api: any, maxRetries = 3) {
  const [retryCount, setRetryCount] = useState(0);
  const { data, loading, error, refetch } = api.useList();
  
  useEffect(() => {
    if (error && retryCount < maxRetries) {
      const timeout = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refetch();
      }, Math.pow(2, retryCount) * 1000); // Exponential backoff
      
      return () => clearTimeout(timeout);
    }
  }, [error, retryCount, maxRetries, refetch]);
  
  const reset = useCallback(() => {
    setRetryCount(0);
  }, []);
  
  return {
    data,
    loading,
    error: retryCount >= maxRetries ? error : null,
    retryCount,
    reset
  };
}
```

## Testing Strategies

### Mock API Responses

Create mock APIs for testing:

```tsx
// test-utils.tsx
export function createMockApi<T>(mockData: T[]) {
  return {
    useList: () => ({
      data: mockData,
      loading: false,
      error: null,
      refetch: jest.fn()
    }),
    useQuery: (id: string) => ({
      data: mockData.find((item: any) => item.id === id) || null,
      loading: false,
      error: null,
      refetch: jest.fn()
    }),
    useCreate: () => ({
      mutate: jest.fn(),
      loading: false,
      error: null
    }),
    useUpdate: () => ({
      mutate: jest.fn(),
      loading: false,
      error: null
    }),
    useDelete: () => ({
      mutate: jest.fn(),
      loading: false,
      error: null
    })
  };
}

// Component test
test('TodoList renders todos', () => {
  const mockTodos = [
    { id: '1', text: 'Test todo', completed: false, createdAt: '2023-01-01', updatedAt: '2023-01-01' }
  ];
  
  const mockApi = createMockApi(mockTodos);
  
  render(<TodoList api={mockApi} />);
  
  expect(screen.getByText('Test todo')).toBeInTheDocument();
});
```

### Integration Testing

Test API integration with MSW (Mock Service Worker):

```tsx
// mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/todos', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', text: 'Test todo', completed: false, createdAt: '2023-01-01', updatedAt: '2023-01-01' }
      ])
    );
  }),
  
  rest.post('/api/todos', (req, res, ctx) => {
    const newTodo = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...req.body
    };
    
    return res(ctx.json(newTodo));
  })
];

// test setup
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Custom Connectors

### Creating Custom Connectors

Implement custom connectors for specific backends:

```tsx
import { IConnector, ApiResponse } from '@skylabs-digital/react-proto-kit';

class GraphQLConnector implements IConnector {
  private client: any;
  
  constructor(config: { endpoint: string; headers?: Record<string, string> }) {
    this.client = new GraphQLClient(config.endpoint, {
      headers: config.headers
    });
  }
  
  async get<T>(path: string, params?: any): Promise<ApiResponse<T[]>> {
    const query = this.buildListQuery(path, params);
    const data = await this.client.request(query, params);
    return { data, success: true };
  }
  
  async getById<T>(path: string, id: string): Promise<ApiResponse<T>> {
    const query = this.buildSingleQuery(path);
    const data = await this.client.request(query, { id });
    return { data, success: true };
  }
  
  async post<T, U>(path: string, data: T): Promise<ApiResponse<U>> {
    const mutation = this.buildCreateMutation(path);
    const result = await this.client.request(mutation, { input: data });
    return { data: result, success: true };
  }
  
  async put<T, U>(path: string, id: string, data: T): Promise<ApiResponse<U>> {
    const mutation = this.buildUpdateMutation(path);
    const result = await this.client.request(mutation, { id, input: data });
    return { data: result, success: true };
  }
  
  async patch<T, U>(path: string, id: string, data: Partial<T>): Promise<ApiResponse<U>> {
    const mutation = this.buildPatchMutation(path);
    const result = await this.client.request(mutation, { id, input: data });
    return { data: result, success: true };
  }
  
  async delete(path: string, id: string): Promise<ApiResponse<void>> {
    const mutation = this.buildDeleteMutation(path);
    await this.client.request(mutation, { id });
    return { success: true };
  }
  
  private buildListQuery(path: string, params?: any): string {
    // Build GraphQL query based on path and params
    return `query { ${path} { id, ...fields } }`;
  }
  
  // ... other helper methods
}

// Usage
function App() {
  return (
    <ApiClientProvider 
      connectorType="custom"
      connector={new GraphQLConnector({ endpoint: '/graphql' })}
    >
      {/* Your app */}
    </ApiClientProvider>
  );
}
```

## Migration Patterns

### Gradual Migration

Migrate from existing APIs gradually:

```tsx
// Legacy API wrapper
function createLegacyApiWrapper(legacyApi: any) {
  return {
    useList: () => {
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      
      useEffect(() => {
        legacyApi.fetchAll()
          .then(setData)
          .catch(setError)
          .finally(() => setLoading(false));
      }, []);
      
      return { data, loading, error, refetch: () => {} };
    },
    
    useCreate: () => ({
      mutate: legacyApi.create,
      loading: false,
      error: null
    })
  };
}

// Use during migration
function TodoList() {
  // Use new API for some features
  const newApi = todoApi;
  
  // Use legacy wrapper for others
  const legacyApi = createLegacyApiWrapper(window.legacyTodoApi);
  
  // Gradually switch over
  const useNewApi = process.env.NODE_ENV === 'development';
  const api = useNewApi ? newApi : legacyApi;
  
  const { data: todos, loading } = api.useList();
  
  return (
    <div>
      {todos?.map(todo => <TodoItem key={todo.id} todo={todo} />)}
    </div>
  );
}
```

### Feature Flags

Use feature flags for controlled rollouts:

```tsx
function useFeatureFlag(flag: string): boolean {
  return process.env[`REACT_APP_FEATURE_${flag.toUpperCase()}`] === 'true';
}

function TodoApp() {
  const useOptimisticUpdates = useFeatureFlag('OPTIMISTIC_UPDATES');
  const useRealTimeSync = useFeatureFlag('REALTIME_SYNC');
  
  const todoApi = createDomainApi('todos', todoSchema, todoSchema, {
    optimistic: useOptimisticUpdates,
    realTime: useRealTimeSync
  });
  
  return <TodoList api={todoApi} />;
}
```

This advanced usage guide covers complex patterns and strategies for building sophisticated applications with React Proto Kit. Use these patterns as building blocks for your specific use cases.

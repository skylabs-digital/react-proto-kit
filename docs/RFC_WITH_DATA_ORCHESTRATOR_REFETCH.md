# RFC: Enhanced withDataOrchestrator HOC with Refetch Support

**Status:** ✅ IMPLEMENTED  
**Author:** React Proto Kit Team  
**Created:** 2025-10-07  
**Last Updated:** 2025-10-07  
**Implemented:** 2025-10-07

---

## Summary

Enhance the `withDataOrchestrator` HOC to inject refetch capabilities and provide proper TypeScript generics for better type inference and developer experience.

## Motivation

### Current Limitations

The current `withDataOrchestrator` HOC has two main issues:

1. **No Refetch Access**: Components wrapped with the HOC cannot trigger data refetches. While `useDataOrchestrator` provides `retry`, `retryAll`, and `refetch` methods, these are not exposed to wrapped components.

2. **Poor Type Inference**: The HOC uses `any` types and doesn't provide a clean way to specify the shape of injected data props.

### Current Behavior

```tsx
// Current implementation
const UserProfile = withDataOrchestrator(
  ({ user, posts }: { user: User; posts: Post[] }) => {
    // ❌ No way to refetch data
    // ❌ Types must be manually specified
    return <div>...</div>;
  },
  {
    hooks: {
      user: () => userApi.useQuery(userId),
      posts: () => postsApi.useList()
    }
  }
);
```

### Problems

1. **Cannot Refetch**: No way to trigger data refresh (e.g., after mutations, pull-to-refresh, etc.)
2. **Manual Types**: Must manually type component props, error-prone
3. **No Intellisense**: No autocomplete for injected data props

---

## Proposed Solution

### 1. Inject Orchestrator Controls

Add a new injected prop `orchestrator` (or `dataOrchestrator`) that provides refetch methods:

```tsx
interface OrchestratorControls<T extends DataOrchestratorConfig> {
  /** Refetch a specific resource by key */
  retry: (key: keyof T) => void;
  
  /** Refetch all resources */
  retryAll: () => void;
  
  /** Individual refetch functions by key */
  refetch: {
    [K in keyof T]: () => Promise<void>;
  };
  
  /** Loading states by resource key */
  loading: {
    [K in keyof T]: boolean;
  };
  
  /** Check if any resource is currently fetching */
  isFetching: boolean;
}
```

### 2. Generic Type Support

Provide a generic type helper to properly type wrapped components:

```tsx
type WithOrchestratorProps<
  TData extends Record<string, any>,
  TProps = {}
> = TProps & TData & {
  orchestrator: OrchestratorControls<any>;
};
```

### 3. Updated API

```tsx
// Define data shape
interface PageData {
  user: User;
  posts: Post[];
  comments: Comment[];
}

// Type the component with data + orchestrator
type UserProfileProps = WithOrchestratorProps<PageData>;

const UserProfileComponent = ({ user, posts, comments, orchestrator }: UserProfileProps) => {
  const handleRefresh = () => {
    orchestrator.retryAll();
  };
  
  const handleRefreshPosts = () => {
    orchestrator.retry('posts');
    // or
    orchestrator.refetch.posts();
  };
  
  return (
    <div>
      <button onClick={handleRefresh} disabled={orchestrator.isFetching}>
        Refresh All
      </button>
      
      <UserCard user={user} />
      
      <PostsList 
        posts={posts}
        loading={orchestrator.loading.posts}
        onRefresh={handleRefreshPosts}
      />
      
      <CommentsList comments={comments} />
    </div>
  );
};

// Wrap with HOC
export const UserProfile = withDataOrchestrator<PageData>(
  UserProfileComponent,
  {
    hooks: {
      user: () => userApi.useQuery(userId),
      posts: () => postsApi.useList({ queryParams: { userId } }),
      comments: () => commentsApi.useList({ queryParams: { userId } })
    }
  }
);
```

---

## Design Options

### Option A: Single `orchestrator` Prop (Recommended)

**Pros:**
- Single, clear namespace for orchestrator functionality
- Avoids prop name collisions
- Easy to document and discover
- Follows pattern similar to React Hook Form's `formState`, Tanstack Query's `query`, etc.

**Cons:**
- One extra level of nesting (`orchestrator.retry` vs `retry`)

```tsx
const Component = ({ user, posts, orchestrator }: WithOrchestratorProps<PageData>) => {
  return (
    <button onClick={orchestrator.retryAll}>Refresh</button>
  );
};
```

### Option B: Flatten All Props

**Pros:**
- Direct access to methods
- Less nesting

**Cons:**
- Risk of prop name collisions (e.g., if data has `retry` field)
- Harder to distinguish orchestrator props from data props
- More cluttered prop interface

```tsx
const Component = ({ 
  user, 
  posts, 
  retry, 
  retryAll, 
  refetch, 
  isFetching 
}: WithOrchestratorProps<PageData>) => {
  return (
    <button onClick={retryAll}>Refresh</button>
  );
};
```

### Option C: Separate Data and Controls Props

**Pros:**
- Very explicit separation
- No collision risk

**Cons:**
- More verbose
- Unusual pattern in React ecosystem

```tsx
const Component = ({ 
  data: { user, posts },
  controls: { retry, retryAll }
}: WithOrchestratorControlsProps<PageData>) => {
  return (
    <button onClick={controls.retryAll}>Refresh</button>
  );
};
```

**Recommendation:** **Option A** - Single `orchestrator` prop provides the best balance of safety, discoverability, and clean API.

---

## Implementation Plan

### Phase 1: Core Enhancement

1. **Update HOC to inject orchestrator prop**
   - Pass `orchestrator` object to wrapped component
   - Include `retry`, `retryAll`, `refetch`, `loading`, `isFetching`

2. **Add type helpers**
   - `WithOrchestratorProps<TData, TProps>`
   - `OrchestratorControls<T>`

3. **Update existing behavior**
   - Maintain backward compatibility
   - Data props still spread directly
   - New `orchestrator` prop is additive

### Phase 2: Documentation

1. Update API reference
2. Add examples to UI_COMPONENTS.md
3. Create migration guide for existing HOC usage
4. Add TypeScript examples

### Phase 3: Testing

1. Add tests for refetch functionality
2. Add tests for type inference
3. Add integration tests with CRUD operations

---

## API Design

### Updated HOC Signature

```tsx
export function withDataOrchestrator<
  TData extends Record<string, any>,
  TProps extends Record<string, any> = {},
  TConfig extends DataOrchestratorConfig | RequiredOptionalConfig = DataOrchestratorConfig
>(
  Component: React.ComponentType<TProps & TData & { orchestrator: OrchestratorControls<TConfig> }>,
  config: WithDataOrchestratorConfig<TConfig>
): React.ComponentType<TProps>
```

### Type Helpers

```tsx
/**
 * Helper type for components wrapped with withDataOrchestrator
 * Combines custom props, data props, and orchestrator controls
 * 
 * @example
 * interface PageData {
 *   user: User;
 *   posts: Post[];
 * }
 * 
 * type Props = WithOrchestratorProps<PageData, { theme: 'light' | 'dark' }>;
 */
export type WithOrchestratorProps<
  TData extends Record<string, any>,
  TProps extends Record<string, any> = {}
> = TProps & TData & {
  orchestrator: OrchestratorControls<any>;
};

/**
 * Orchestrator control methods injected by withDataOrchestrator
 */
export interface OrchestratorControls<T extends DataOrchestratorConfig> {
  /** Refetch a specific resource */
  retry: (key: keyof T) => void;
  
  /** Refetch all resources */
  retryAll: () => void;
  
  /** Individual refetch functions */
  refetch: {
    [K in keyof T]: () => Promise<void>;
  };
  
  /** Loading state for each resource */
  loading: {
    [K in keyof T]: boolean;
  };
  
  /** True if any resource is currently fetching */
  isFetching: boolean;
}
```

---

## Examples

### Example 1: Simple Refetch

```tsx
import { withDataOrchestrator, WithOrchestratorProps } from '@skylabs-digital/react-proto-kit';

interface DashboardData {
  stats: DashboardStats;
  recentActivity: Activity[];
}

const DashboardComponent = ({ stats, recentActivity, orchestrator }: WithOrchestratorProps<DashboardData>) => {
  return (
    <div>
      <header>
        <h1>Dashboard</h1>
        <button 
          onClick={orchestrator.retryAll}
          disabled={orchestrator.isFetching}
        >
          {orchestrator.isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>
      
      <StatsPanel stats={stats} />
      <ActivityFeed activities={recentActivity} />
    </div>
  );
};

export const Dashboard = withDataOrchestrator<DashboardData>(
  DashboardComponent,
  {
    hooks: {
      stats: () => statsApi.useQuery('overview'),
      recentActivity: () => activityApi.useList({ listParams: { limit: 10 } })
    }
  }
);
```

### Example 2: Selective Refetch with Loading States

```tsx
interface ProductPageData {
  product: Product;
  reviews: Review[];
  relatedProducts: Product[];
}

const ProductPageComponent = ({ 
  product, 
  reviews, 
  relatedProducts,
  orchestrator 
}: WithOrchestratorProps<ProductPageData>) => {
  const handleRefreshReviews = async () => {
    await orchestrator.refetch.reviews();
    console.log('Reviews refreshed!');
  };
  
  return (
    <div>
      <ProductDetails product={product} />
      
      <section>
        <h2>Reviews</h2>
        <button 
          onClick={handleRefreshReviews}
          disabled={orchestrator.loading.reviews}
        >
          {orchestrator.loading.reviews ? 'Loading...' : 'Refresh Reviews'}
        </button>
        <ReviewsList reviews={reviews} />
      </section>
      
      <section>
        <h2>Related Products</h2>
        {orchestrator.loading.relatedProducts && <Spinner />}
        <ProductGrid products={relatedProducts} />
      </section>
    </div>
  );
};

export const ProductPage = withDataOrchestrator<ProductPageData>(
  ProductPageComponent,
  {
    hooks: {
      product: () => productsApi.useQuery(productId),
      reviews: () => reviewsApi.useList({ queryParams: { productId } }),
      relatedProducts: () => productsApi.useList({ queryParams: { category: product?.category } })
    }
  }
);
```

### Example 3: With Required/Optional Resources

```tsx
interface UserProfileData {
  user: User;
  posts: Post[];
  stats?: UserStats; // Optional
}

const UserProfileComponent = ({ 
  user, 
  posts, 
  stats,
  orchestrator 
}: WithOrchestratorProps<UserProfileData>) => {
  return (
    <div>
      <UserHeader user={user} />
      
      <PostsList posts={posts} />
      
      {/* Optional stats may not be available */}
      {stats && <StatsPanel stats={stats} />}
      
      <button onClick={() => orchestrator.retry('posts')}>
        Refresh Posts
      </button>
    </div>
  );
};

export const UserProfile = withDataOrchestrator<UserProfileData>(
  UserProfileComponent,
  {
    hooks: {
      required: {
        user: () => usersApi.useQuery(userId),
        posts: () => postsApi.useList({ queryParams: { userId } })
      },
      optional: {
        stats: () => statsApi.useQuery(userId)
      }
    }
  }
);
```

### Example 4: Pull-to-Refresh Pattern

```tsx
interface FeedData {
  posts: Post[];
  notifications: Notification[];
}

const FeedComponent = ({ posts, notifications, orchestrator }: WithOrchestratorProps<FeedData>) => {
  const [isPulling, setIsPulling] = useState(false);
  
  const handlePullToRefresh = async () => {
    setIsPulling(true);
    await orchestrator.retryAll();
    setIsPulling(false);
  };
  
  return (
    <PullToRefresh onRefresh={handlePullToRefresh} refreshing={isPulling}>
      <div>
        <NotificationBadge 
          count={notifications.length}
          loading={orchestrator.loading.notifications}
        />
        
        <PostFeed 
          posts={posts}
          loading={orchestrator.loading.posts}
        />
      </div>
    </PullToRefresh>
  );
};

export const Feed = withDataOrchestrator<FeedData>(
  FeedComponent,
  {
    hooks: {
      posts: () => postsApi.useList(),
      notifications: () => notificationsApi.useList({ queryParams: { unread: true } })
    }
  }
);
```

### Example 5: After Mutation Pattern

```tsx
interface TodoListData {
  todos: Todo[];
}

const TodoListComponent = ({ todos, orchestrator }: WithOrchestratorProps<TodoListData>) => {
  const createMutation = todosApi.useCreate({
    onSuccess: () => {
      // Refetch list after creating a new todo
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
      
      <TodoList 
        todos={todos}
        onDelete={deleteMutation.mutate}
        loading={orchestrator.loading.todos}
      />
    </div>
  );
};

export const TodoListPage = withDataOrchestrator<TodoListData>(
  TodoListComponent,
  {
    hooks: {
      todos: () => todosApi.useList()
    }
  }
);
```

---

## Migration Guide

### Before (Current)

```tsx
const UserProfile = withDataOrchestrator(
  ({ user, posts }: { user: User; posts: Post[] }) => {
    // ❌ No way to refetch
    return <div>...</div>;
  },
  {
    hooks: {
      user: () => userApi.useQuery(userId),
      posts: () => postsApi.useList()
    }
  }
);
```

### After (Enhanced)

```tsx
interface PageData {
  user: User;
  posts: Post[];
}

const UserProfileComponent = ({ 
  user, 
  posts, 
  orchestrator 
}: WithOrchestratorProps<PageData>) => {
  // ✅ Can refetch
  return (
    <div>
      <button onClick={orchestrator.retryAll}>Refresh</button>
      {/* ... */}
    </div>
  );
};

export const UserProfile = withDataOrchestrator<PageData>(
  UserProfileComponent,
  {
    hooks: {
      user: () => userApi.useQuery(userId),
      posts: () => postsApi.useList()
    }
  }
);
```

**Changes Required:**
1. Define data interface explicitly
2. Add `orchestrator` to component props
3. Use `WithOrchestratorProps<TData>` type helper
4. Pass data interface as generic to `withDataOrchestrator<TData>`

**Backward Compatibility:**
- ✅ Existing code continues to work
- ✅ `orchestrator` prop is additive (doesn't break existing prop spreading)
- ✅ Type inference improves but isn't required

---

## Benefits

### For Developers

1. **Refetch Control**: Full control over data refresh cycles
2. **Better Types**: Proper TypeScript inference with autocomplete
3. **Granular Loading**: Access individual resource loading states
4. **Cleaner Code**: No need for manual type annotations

### For Applications

1. **Pull-to-Refresh**: Easy to implement refresh patterns
2. **After Mutations**: Simple to refetch after CRUD operations
3. **Selective Updates**: Refetch only what changed
4. **Better UX**: Fine-grained loading indicators

---

## Open Questions

1. **Prop Name**: Should we use `orchestrator`, `dataOrchestrator`, or `controls`?
   - **Recommendation:** `orchestrator` (concise, clear)

2. **Backward Compatibility**: Should we support the old API without breaking changes?
   - **Recommendation:** Yes, make `orchestrator` prop additive

3. **Error States**: Should we also expose error states in `orchestrator`?
   ```tsx
   orchestrator.errors.posts // Error for posts resource
   ```
   - **Recommendation:** Yes, include in Phase 1

4. **Refetch Options**: Should `refetch` methods accept options?
   ```tsx
   orchestrator.refetch.posts({ skipCache: true })
   ```
   - **Recommendation:** Phase 2 enhancement

---

## Timeline

- **Week 1**: RFC Review and Approval
- **Week 2**: Implementation (Phase 1)
- **Week 3**: Documentation (Phase 2)
- **Week 4**: Testing and Release (Phase 3)

---

## Alternative Considered

### Using Render Props

```tsx
<DataOrchestrator hooks={hooks}>
  {({ data, orchestrator }) => (
    <UserProfile {...data} orchestrator={orchestrator} />
  )}
</DataOrchestrator>
```

**Rejected because:**
- More verbose
- Doesn't solve type inference issue
- Render props less common in modern React

---

## Conclusion

This enhancement maintains backward compatibility while significantly improving the developer experience for components using `withDataOrchestrator`. The addition of refetch capabilities and proper TypeScript generics makes the HOC more powerful and easier to use correctly.

**Status:** ✅ **IMPLEMENTED** - All features from this RFC have been successfully implemented.

---

## Additional Features Implemented

### `watchSearchParams` - Automatic Refetch on URL Changes

Auto-reset data when URL search parameters change. Perfect for tab switching, filtering, and pagination:

```tsx
const TodoListWithData = withDataOrchestrator<{ todos: Todo[] }>(TodoListContent, {
  hooks: {
    todos: () => {
      const [status] = useUrlParam('status');
      return todosApi.withQuery({ status }).useList();
    },
  },
  options: {
    watchSearchParams: ['status'], // Auto-refetch when ?status= changes
  },
});
```

**How it works:**
1. Monitors specified URL search parameters
2. Automatically resets orchestrator when any watched param changes
3. Hooks re-execute with new parameter values
4. Data automatically refetches

### `refetchBehavior` - Control Loading UX

Choose between stale-while-revalidate (smooth transitions) or blocking (explicit loading):

```tsx
withDataOrchestrator<PageData>(Component, {
  hooks: { /* ... */ },
  options: {
    watchSearchParams: ['status'],
    refetchBehavior: 'stale-while-revalidate', // or 'blocking'
  },
});
```

**Behaviors:**
- **`'stale-while-revalidate'`** (default): Shows previous data while fetching new data. No loading flashes, smooth transitions.
- **`'blocking'`**: Clears data and shows loading state. More explicit but can feel slower.

**Supported hooks:**
- ✅ `useList` - Caches data by cacheKey (endpoint + params + queryParams)
- ✅ `useById` - Caches data by ID (e.g., transitioning between /users/123 and /users/456)

**Example with tabs:**
```tsx
// Tab switching with smooth transitions
const TodosWithTabs = withDataOrchestrator<{ todos: Todo[] }>(Content, {
  hooks: {
    todos: () => {
      const [status] = useUrlParam('status'); // 'active', 'completed', 'archived'
      return todosApi.withQuery({ status }).useList();
    },
  },
  options: {
    watchSearchParams: ['status'],
    refetchBehavior: 'stale-while-revalidate',
  },
});
```

**Result:**
1. Load "Active" tab → Normal loading state
2. Click "Completed" → Shows "Active" todos while loading "Completed"
3. "Completed" data arrives → Smoothly transitions
4. Click "Active" → Instantly shows from cache

### `RefetchBehaviorContext` - App-wide Configuration

Set default behavior for entire app:

```tsx
import { RefetchBehaviorProvider } from '@skylabs-digital/react-proto-kit';

<RefetchBehaviorProvider behavior="stale-while-revalidate">
  <App />
</RefetchBehaviorProvider>
```

**Precedence:**
1. Hook-level option (highest)
2. `withDataOrchestrator` option
3. Context provider
4. Default: `'stale-while-revalidate'`

---

## Implementation Summary

✅ **Phase 1 Complete:**
- Orchestrator controls injected via `orchestrator` prop
- Type helpers: `WithOrchestratorProps<TData>`, `OrchestratorControls`
- Backward compatible

✅ **Additional Features:**
- `watchSearchParams` for URL-driven refetches
- `refetchBehavior` with stale-while-revalidate support
- Per-hook and global configuration
- Support in both `useList` and `useById`

✅ **Documentation:**
- Updated DATA_ORCHESTRATOR.md
- Added examples for all features
- TypeScript examples included

✅ **Testing:**
- Tested with todo-with-tabs example
- Smooth transitions verified
- Backward compatibility maintained

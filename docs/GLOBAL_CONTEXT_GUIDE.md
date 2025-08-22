# Global Context - Complete Usage Guide

This guide provides comprehensive examples and best practices for using Global Context in the API Client Service.

## Table of Contents

- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
- [Advanced Configuration](#advanced-configuration)
- [Entity Relationships](#entity-relationships)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Setup Providers

```typescript
import { ApiClientProvider, GlobalStateProvider } from 'api-client-service';

function App() {
  return (
    <ApiClientProvider connectorType="localStorage">
      <GlobalStateProvider>
        <YourApp />
      </GlobalStateProvider>
    </ApiClientProvider>
  );
}
```

### 2. Enable Global Context

```typescript
import { createDomainApi } from 'api-client-service';
import { z } from 'zod';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Enable Global Context with one flag
const usersApi = createDomainApi('users', userSchema, {
  globalState: true,  // 🎯 This enables automatic synchronization
});
```

### 3. Use in Components

```typescript
function UserList() {
  const { data: users, loading } = usersApi.useList!();
  const { mutate: createUser } = usersApi.useCreate!();
  
  // All components using usersApi will update automatically
  const handleCreate = () => createUser({ name: 'New User', email: 'user@example.com' });
  
  return (
    <div>
      <button onClick={handleCreate}>Add User</button>
      {users?.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  );
}

function UserStats() {
  const { data: users = [] } = usersApi.useList!();
  
  // Automatically updates when users change
  return <div>Total Users: {users.length}</div>;
}
```

## Basic Usage

### Simple Entity Management

```typescript
// Define your schema
const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  inStock: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create API with Global Context
const productsApi = createDomainApi('products', productSchema, {
  globalState: true,
  optimistic: true,
});

// Component 1: Product List
function ProductList() {
  const { data: products = [], loading } = productsApi.useList!();
  const { mutate: deleteProduct } = productsApi.useDelete!();
  
  // Dynamic ID support for delete operations
  const handleDelete = (id: string) => deleteProduct(undefined, id);
  
  return (
    <div>
      {loading ? 'Loading...' : null}
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name} - ${product.price}</h3>
          <button onClick={() => handleDelete(product.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

// Component 2: Product Stats (automatically syncs)
function ProductStats() {
  const { data: products = [] } = productsApi.useList!();
  
  const inStockCount = products.filter(p => p.inStock).length;
  const totalValue = products.reduce((sum, p) => sum + p.price, 0);
  
  return (
    <div>
      <p>Total Products: {products.length}</p>
      <p>In Stock: {inStockCount}</p>
      <p>Total Value: ${totalValue}</p>
    </div>
  );
}

// Component 3: Add Product Form
function AddProductForm() {
  const { mutate: createProduct, loading } = productsApi.useCreate!();
  const [formData, setFormData] = useState({ name: '', price: 0, category: '', inStock: true });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct(formData);
    // ✨ ProductList and ProductStats automatically update!
    setFormData({ name: '', price: 0, category: '', inStock: true });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Product name"
      />
      <input 
        type="number"
        value={formData.price}
        onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
        placeholder="Price"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

## Advanced Configuration

### Optimistic Updates

```typescript
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  optimistic: true,  // Enable optimistic updates
});

function PostList() {
  const { mutate: updatePost } = postsApi.useUpdate!();
  
  const handleTogglePublished = async (post: Post) => {
    // UI updates instantly, even before API call completes
    // Dynamic ID support - pass ID as second parameter
    await updatePost({ published: !post.published }, post.id);
    // If API call fails, changes are automatically rolled back
  };
}
```

### Custom Cache Times

```typescript
// Different cache times for different entity types
const usersApi = createDomainApi('users', userSchema, {
  globalState: true,
  cacheTime: 10 * 60 * 1000, // 10 minutes (users change less frequently)
});

const notificationsApi = createDomainApi('notifications', notificationSchema, {
  globalState: true,
  cacheTime: 30 * 1000, // 30 seconds (notifications are very dynamic)
});

const settingsApi = createDomainApi('settings', settingsSchema, {
  globalState: true,
  cacheTime: 60 * 60 * 1000, // 1 hour (settings rarely change)
});
```

## Entity Relationships

### Defining Relationships

```typescript
// Posts invalidate comments when they change
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['comments'], // When posts change, refresh comments
});

// Comments invalidate posts when they change (for comment counts)
const commentsApi = createDomainApi('comments', commentSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['posts'], // When comments change, refresh posts
});

// Users affect both posts and comments
const usersApi = createDomainApi('users', userSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['posts', 'comments'], // User changes affect both
});
```

### Complex Relationships Example

```typescript
// E-commerce example with multiple related entities
const productsApi = createDomainApi('products', productSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['orders', 'cart'], // Product changes affect orders and cart
});

const ordersApi = createDomainApi('orders', orderSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['products'], // Orders affect product stock
});

const cartApi = createDomainApi('cart', cartSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['products'], // Cart changes might affect product availability
});

const usersApi = createDomainApi('users', userSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['orders', 'cart'], // User changes affect their orders and cart
});
```

## Real-World Examples

### Blog Platform

```typescript
// Complete blog platform with Global Context
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['comments'],
  cacheTime: 5 * 60 * 1000,
});

const commentsApi = createDomainApi('comments', commentSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['posts'],
  cacheTime: 2 * 60 * 1000,
});

const categoriesApi = createDomainApi('categories', categorySchema, {
  globalState: true,
  optimistic: false, // Categories don't need optimistic updates
  invalidateRelated: ['posts'],
  cacheTime: 15 * 60 * 1000,
});

// Blog post component with automatic synchronization
function BlogPost({ postId }: { postId: string }) {
  const { data: post } = postsApi.useById!(postId);
  const { data: comments = [] } = commentsApi.useList!();
  const { data: categories = [] } = categoriesApi.useList!();
  const { mutate: createComment } = commentsApi.useCreate!();
  
  const postComments = comments.filter(c => c.postId === postId);
  const category = categories.find(c => c.id === post?.categoryId);
  
  const handleAddComment = async (content: string) => {
    await createComment({ content, postId, authorId: 'current-user' });
    // ✨ Comment count updates automatically everywhere
    // ✨ Recent comments sidebar updates automatically
    // ✨ Post stats update automatically
  };
  
  return (
    <article>
      <h1>{post?.title}</h1>
      <p>Category: {category?.name}</p>
      <p>Comments: {postComments.length}</p>
      
      <div>
        {postComments.map(comment => (
          <div key={comment.id}>{comment.content}</div>
        ))}
      </div>
      
      <CommentForm onSubmit={handleAddComment} />
    </article>
  );
}

// Sidebar component that automatically stays in sync
function BlogSidebar() {
  const { data: posts = [] } = postsApi.useList!();
  const { data: comments = [] } = commentsApi.useList!();
  const { data: categories = [] } = categoriesApi.useList!();
  
  const publishedPosts = posts.filter(p => p.published);
  const recentComments = comments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  return (
    <aside>
      <div>
        <h3>Stats</h3>
        <p>Posts: {publishedPosts.length}</p>
        <p>Comments: {comments.length}</p>
        <p>Categories: {categories.length}</p>
      </div>
      
      <div>
        <h3>Recent Comments</h3>
        {recentComments.map(comment => (
          <div key={comment.id}>{comment.content.substring(0, 50)}...</div>
        ))}
      </div>
    </aside>
  );
}
```

### E-commerce Dashboard

```typescript
// E-commerce dashboard with real-time updates
const productsApi = createDomainApi('products', productSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['orders', 'inventory'],
});

const ordersApi = createDomainApi('orders', orderSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['products', 'customers'],
});

const customersApi = createDomainApi('customers', customerSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['orders'],
});

function EcommerceDashboard() {
  const { data: products = [] } = productsApi.useList!();
  const { data: orders = [] } = ordersApi.useList!();
  const { data: customers = [] } = customersApi.useList!();
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const lowStockProducts = products.filter(p => p.stock < 10);
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  
  return (
    <div className="dashboard">
      <div className="stats">
        <div>Products: {products.length}</div>
        <div>Orders: {orders.length}</div>
        <div>Customers: {customers.length}</div>
        <div>Revenue: ${totalRevenue}</div>
        <div>Low Stock: {lowStockProducts.length}</div>
      </div>
      
      <div className="recent-orders">
        <h3>Recent Orders</h3>
        {recentOrders.map(order => (
          <div key={order.id}>
            Order #{order.id} - ${order.total}
          </div>
        ))}
      </div>
      
      <div className="low-stock">
        <h3>Low Stock Products</h3>
        {lowStockProducts.map(product => (
          <div key={product.id}>
            {product.name} - {product.stock} remaining
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Entity Naming

```typescript
// ✅ Good: Use plural nouns for entity names
const usersApi = createDomainApi('users', userSchema, { globalState: true });
const postsApi = createDomainApi('posts', postSchema, { globalState: true });
const commentsApi = createDomainApi('comments', commentSchema, { globalState: true });

// ❌ Avoid: Singular or inconsistent naming
const userApi = createDomainApi('user', userSchema, { globalState: true });
const postAPI = createDomainApi('Post', postSchema, { globalState: true });
```

### 2. Cache Time Strategy

```typescript
// ✅ Good: Different cache times based on data volatility
const usersApi = createDomainApi('users', userSchema, {
  globalState: true,
  cacheTime: 10 * 60 * 1000, // 10 minutes - users change infrequently
});

const notificationsApi = createDomainApi('notifications', notificationSchema, {
  globalState: true,
  cacheTime: 30 * 1000, // 30 seconds - notifications are very dynamic
});

const settingsApi = createDomainApi('settings', settingsSchema, {
  globalState: true,
  cacheTime: 60 * 60 * 1000, // 1 hour - settings rarely change
});
```

### 3. Relationship Mapping

```typescript
// ✅ Good: Map relationships based on actual dependencies
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  invalidateRelated: ['comments'], // Posts affect comments
});

const commentsApi = createDomainApi('comments', commentSchema, {
  globalState: true,
  invalidateRelated: ['posts'], // Comments affect posts (for counts)
});

// ❌ Avoid: Over-invalidation
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  invalidateRelated: ['comments', 'users', 'categories', 'settings'], // Too many!
});
```

### 4. Optimistic Updates

```typescript
// ✅ Good: Use optimistic updates for user actions
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  optimistic: true, // Good for create/update/delete operations
});

// ✅ Good: Disable optimistic updates for critical operations
const paymentsApi = createDomainApi('payments', paymentSchema, {
  globalState: true,
  optimistic: false, // Don't show payment as successful until confirmed
});
```

### 5. Component Structure

```typescript
// ✅ Good: Separate concerns, let Global Context handle synchronization
function ProductList() {
  const { data: products } = productsApi.useList!();
  return <div>{products?.map(p => <ProductCard key={p.id} product={p} />)}</div>;
}

function ProductStats() {
  const { data: products = [] } = productsApi.useList!();
  return <div>Total: {products.length}</div>;
}

function ProductForm() {
  const { mutate: createProduct } = productsApi.useCreate!();
  // Form logic here
}

// ❌ Avoid: Manual state coordination
function ProductManager() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleDataChange = () => setRefreshKey(prev => prev + 1);
  
  return (
    <div>
      <ProductList key={refreshKey} onDataChange={handleDataChange} />
      <ProductStats key={refreshKey} onDataChange={handleDataChange} />
      <ProductForm onDataChange={handleDataChange} />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

#### 1. Components Not Updating

**Problem**: Components don't update when data changes.

**Solution**: Ensure Global Context is enabled and providers are set up correctly.

```typescript
// ❌ Missing GlobalStateProvider
function App() {
  return (
    <ApiClientProvider connectorType="localStorage">
      <YourApp /> {/* Components won't sync */}
    </ApiClientProvider>
  );
}

// ✅ Correct setup
function App() {
  return (
    <ApiClientProvider connectorType="localStorage">
      <GlobalStateProvider>
        <YourApp /> {/* Components will sync automatically */}
      </GlobalStateProvider>
    </ApiClientProvider>
  );
}
```

#### 2. Stale Data Issues

**Problem**: Data appears stale or outdated.

**Solution**: Check cache times and invalidation rules.

```typescript
// ❌ Cache time too long
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  cacheTime: 60 * 60 * 1000, // 1 hour - too long for dynamic data
});

// ✅ Appropriate cache time
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes - better for dynamic data
});
```

#### 3. Over-Invalidation

**Problem**: Too many unnecessary API calls.

**Solution**: Review and optimize invalidation rules.

```typescript
// ❌ Over-invalidation
const usersApi = createDomainApi('users', userSchema, {
  globalState: true,
  invalidateRelated: ['posts', 'comments', 'orders', 'products'], // Too many!
});

// ✅ Targeted invalidation
const usersApi = createDomainApi('users', userSchema, {
  globalState: true,
  invalidateRelated: ['posts', 'comments'], // Only what's actually affected
});
```

#### 4. Memory Leaks

**Problem**: Memory usage keeps growing.

**Solution**: Ensure proper cleanup and reasonable cache times.

```typescript
// ✅ Good: Reasonable cache times
const tempDataApi = createDomainApi('tempData', tempDataSchema, {
  globalState: true,
  cacheTime: 60 * 1000, // 1 minute for temporary data
});

// ✅ Good: Manual cleanup when needed
function useCleanupOnUnmount() {
  useEffect(() => {
    return () => {
      // Cleanup logic if needed
    };
  }, []);
}
```

### Debugging Tips

1. **Use React DevTools**: Install React DevTools to inspect Global Context state.

2. **Enable Debug Mode**: Add comprehensive debug logging to track state changes.

```typescript
import { configureDebugLogging } from 'api-client-service';

// Enable debug mode globally
configureDebugLogging(true, '[GLOBAL-CONTEXT]');

// Create APIs with global state
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  optimistic: true,
});
```

**Debug output includes:**
- 🚀 API requests and responses
- 🎯 Cache hits and misses
- 🔄 State invalidations and updates
- ⚡ Performance timing
- ❌ Error details and validation failures

3. **Monitor Network Requests**: Use browser dev tools to ensure API calls are optimized.

4. **Check Console**: Look for Global Context warnings and errors in the console.

5. **Environment-Based Debug Setup**:

```typescript
// Only enable in development
if (process.env.NODE_ENV === 'development') {
  configureDebugLogging(true, '[DEV-GLOBAL-STATE]');
}
```

This guide covers the essential patterns and best practices for using Global Context effectively. For more examples, check out the complete working examples in the `examples/` directory.

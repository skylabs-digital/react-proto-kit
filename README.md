# 🚀 **API Client Service**

*Modern React API client with Global State Context for seamless data synchronization*

A powerful, type-safe React library for API management with intelligent global state synchronization. Build complex applications with multiple entities that stay perfectly synchronized across all components automatically.

## 🎯 **Complete API Solution with Global Context**

**Key Features:**
- 🔌 **Domain APIs** - CRUD operations with automatic validation
- 🌐 **Global State Context** - Automatic synchronization across all components
- 🔄 **Intelligent Invalidation** - Smart cache management with entity relationships
- ⚡ **Optimistic Updates** - Instant UI feedback with automatic rollback
- 📝 **Forms Integration** - Type-safe forms with Zod validation
- 🧪 **Multiple Connectors** - localStorage for dev, HTTP for production

## ⚡ **Global Context: The game-changer for complex apps**

### Without Global Context (Traditional Approach)
```typescript
// Each component manages its own state - leads to complexity
function BlogApp() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Manual callbacks everywhere
  const handleDataChange = () => setRefreshKey(prev => prev + 1);
  
  return (
    <div>
      <PostList onDataChange={handleDataChange} />
      <Sidebar key={refreshKey} onDataChange={handleDataChange} />
      {/* Manual refresh buttons, callback chains, stale data... */}
    </div>
  );
}
```

### With Global Context (Modern Approach)
```typescript
import { 
  ApiClientProvider, 
  GlobalStateProvider,
  createDomainApi 
} from 'api-client-service';

// 1. Define your schemas
const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  published: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 2. Enable Global Context with one flag
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,        // 🎯 This changes everything
  optimistic: true,         // Instant UI updates
  invalidateRelated: ['comments'], // Smart cache invalidation
});

// 3. Components automatically sync across the entire app
function BlogApp() {
  return (
    <ApiClientProvider connectorType="localStorage">
      <GlobalStateProvider>
        <div>
          <PostList />     {/* No callbacks needed */}
          <Sidebar />      {/* Auto-updates when posts change */}
          <CommentForm />  {/* Updates post comment counts instantly */}
        </div>
      </GlobalStateProvider>
    </ApiClientProvider>
  );
}

function PostList() {
  const { data: posts, loading } = postsApi.useList!();
  const { mutate: createPost } = postsApi.useCreate!();
  
  // Create a post - ALL components update automatically
  const handleCreate = () => createPost({ title: 'New Post', content: '...' });
  
  return (
    <div>
      <button onClick={handleCreate}>Add Post</button>
      {posts?.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  );
}

function Sidebar() {
  const { data: posts = [] } = postsApi.useList!();
  
  // Automatically shows updated count when posts change
  return <div>Total Posts: {posts.length}</div>;
}
```

## 🌐 **Global State Context - The Complete Guide**

### What is Global Context?

Global Context is an intelligent state management system that automatically synchronizes data across all components in your React application. When any component modifies data, all other components using that data update instantly without manual intervention.

### Key Benefits

- **🔄 Automatic Synchronization**: All components stay in sync automatically
- **⚡ Optimistic Updates**: Instant UI feedback with automatic rollback on errors
- **🧠 Intelligent Invalidation**: Smart cache management based on entity relationships
- **🎯 Zero Boilerplate**: No manual state management, callbacks, or refresh logic
- **🔗 Entity Relationships**: Define how entities affect each other
- **⏰ Configurable Caching**: Different cache times per entity type

### Setup (One-Time)

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

### Enable Global Context (One Flag)

```typescript
// Without Global Context (traditional)
const postsApi = createDomainApi('posts', postSchema);

// With Global Context (modern)
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,                    // 🎯 Enable global synchronization
  optimistic: true,                     // Instant UI updates
  invalidateRelated: ['comments'],      // When posts change, refresh comments
  cacheTime: 5 * 60 * 1000,            // 5 minutes cache
});
```

### Real-World Example: Blog Platform

```typescript
// Define entity relationships
const postsApi = createDomainApi('posts', postSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['comments'], // Posts affect comments
  cacheTime: 5 * 60 * 1000,
});

const commentsApi = createDomainApi('comments', commentSchema, {
  globalState: true,
  optimistic: true,
  invalidateRelated: ['posts'], // Comments affect posts (for counts)
  cacheTime: 3 * 60 * 1000,
});

// Components automatically sync
function BlogPost({ postId }) {
  const { data: post } = postsApi.useById!(postId);
  const { data: comments = [] } = commentsApi.useList!();
  
  const postComments = comments.filter(c => c.postId === postId);
  
  return (
    <div>
      <h1>{post?.title}</h1>
      <p>Comments: {postComments.length}</p> {/* Auto-updates when comments change */}
    </div>
  );
}

function CommentForm({ postId }) {
  const { mutate: createComment } = commentsApi.useCreate!();
  
  const handleSubmit = async (content) => {
    await createComment({ content, postId });
    // ✨ BlogPost component automatically shows updated comment count
    // ✨ Sidebar stats automatically refresh
    // ✨ All without any manual refresh calls!
  };
}
```

### Advanced Configuration

```typescript
const usersApi = createDomainApi('users', userSchema, {
  globalState: true,
  optimistic: true,
  cacheTime: 10 * 60 * 1000,           // 10 minutes (users change less frequently)
  invalidateRelated: ['posts', 'comments'], // User changes affect posts and comments
});

const categoriesApi = createDomainApi('categories', categorySchema, {
  globalState: true,
  optimistic: false,                    // No optimistic updates for categories
  cacheTime: 30 * 60 * 1000,           // 30 minutes (categories rarely change)
  invalidateRelated: ['posts'],        // Category changes affect posts
});
```

### Global Context vs Traditional State Management

| Feature | Without Global Context | With Global Context |
|---------|----------------------|-------------------|
| **Component Sync** | Manual callbacks, prop drilling | Automatic synchronization |
| **Code Complexity** | High (3x more code) | Low (minimal boilerplate) |
| **User Experience** | Manual refresh buttons, stale data | Real-time updates, always fresh |
| **Cache Management** | Manual invalidation logic | Intelligent automatic invalidation |
| **Entity Relations** | Complex callback chains | Simple configuration |
| **Optimistic Updates** | Manual implementation | Built-in with rollback |
| **Maintenance** | Error-prone, complex | Self-managing, reliable |

## ✨ **Key Features**

- **🌐 Global State Context**: Automatic synchronization across all components
- **🎯 Domain APIs**: Complete CRUD operations generated automatically  
- **🔄 Intelligent Invalidation**: Smart cache management with entity relationships
- **⚡ Optimistic Updates**: Instant UI feedback with automatic rollback
- **📝 Forms Integration**: Type-safe forms with Zod validation
- **🧪 Multiple Connectors**: localStorage for dev, HTTP for production
- **🔧 Smart Conventions**: Auto-generates create/update schemas
- **🧪 Test-Friendly**: Built-in mocking and testing utilities

## 🚀 **Live Examples**

Explore complete working examples that demonstrate the power of Global Context:

### 📝 **TODO Apps**
- **[TODO with Global Context](./examples/todo-with-global-context/)** - Simple, clean, automatic synchronization
- **[TODO without Global Context](./examples/todo-without-global-context/)** - Complex, manual state management
- **[TODO with Backend](./examples/todo-with-backend/)** - Full-stack app with Express.js backend and real-time sync

### 📰 **Blog Platforms** 
- **[Blog with Global Context](./examples/blog-with-global-context/)** - Advanced multi-entity app with real-time sync
- **[Blog without Global Context](./examples/blog-without-global-context/)** - Same features but 3x more complex code

**Run any example:**
```bash
cd examples/[example-name]
yarn install
yarn dev

# For backend example:
cd examples/todo-with-backend
yarn install
yarn start  # Runs both backend and frontend
```

Compare the examples to see the dramatic difference in code complexity and user experience!

## 📦 **Installation**

```bash
npm install api-client-service
# or
yarn add api-client-service
```

## 🚀 **Quick Start**

### 1. Setup Provider

Wrap your app with the API provider:

```tsx
import { ApiClientProvider, GlobalStateProvider } from 'api-client-service';

function App() {
  return (
    <ApiClientProvider connectorType="localStorage"> {/* Dev mode */}
      <GlobalStateProvider>
        <YourApp />
      </GlobalStateProvider>
    </ApiClientProvider>
  );
}
```

### 2. Define Your Data Schema

```tsx
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional()
});
```

### 3. Generate Your API (One Line!)

```tsx
import { createDomainApi } from 'api-client-service';

const productApi = createDomainApi('products', productSchema, {
  globalState: true,  // Enable automatic synchronization
  optimistic: true    // Instant UI updates
});
// That's it! You now have: useList, useById, useCreate, useUpdate, useDelete
```

### 4. Complete Component Example

function ProductManager() {
  // API operations
  const { data: products, loading, error } = productApi.useList();
  const { mutate: createProduct } = productApi.useCreate();
  const { mutate: updateProduct } = productApi.useUpdate();
  const { mutate: deleteProduct } = productApi.useDelete();
  
  // Form handling
  const { values, errors, handleInputChange, handleSubmit } = useFormData(productSchema);
  
  // URL state
  const [selectedId, setSelectedId] = useUrlSelector('productId');
  
  const onSubmit = handleSubmit(async (data) => {
    await createProduct(data);
    setSelectedId(null); // Clear selection after create
  });

  const handleUpdate = async (id: string) => {
    await updateProduct(id, {
      name: 'Updated Product',
      price: 149.99
    });
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
  };

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <form onSubmit={onSubmit}>
        <input name="name" value={values.name || ''} onChange={handleInputChange} />
        {errors.name && <span>{errors.name}</span>}
        <button type="submit">Create Product</button>
      </form>
      
      <div>
        {products?.map(product => (
          <div key={product.id} onClick={() => setSelectedId(product.id)}>
            <h3>{product.name} - ${product.price}</h3>
            <p>{product.category}</p>
            <button onClick={() => handleUpdate(product.id)}>Update</button>
            <button onClick={() => handleDelete(product.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🎨 **API Templates**

Choose the right template for your use case:

### Full CRUD (Most Common)

```tsx
const productApi = createCrudApi('products', ProductSchema);
// Generates: useList, useById, useCreate, useUpdate, useDelete
```

### Read-Only APIs

```tsx
const analyticsApi = createReadOnlyApi('analytics', AnalyticsSchema);
// Generates: useList, useById (perfect for reports, logs, etc.)
```

### Custom Operations

```tsx
const customApi = createCustomApi('orders', OrderSchema, [
  'list', 'create', 'cancel' // only the operations you need
]);
```

### Multi-Domain Example

```tsx
function Dashboard() {
  const { data: users } = userApi.useList();
  const { data: analytics } = analyticsApi.useList();
  const { data: orders } = orderApi.useList();

  return (
    <div>
      <h2>Users: {users?.length}</h2>
      <h2>Revenue: ${analytics?.totalRevenue}</h2>
      <h2>Orders: {orders?.length}</h2>
    </div>
  );
}
```

## 🔌 **Environment Configuration**

### Development (localStorage)

Perfect for prototyping and development:

```tsx
<ApiClientProvider 
  connectorType="localStorage" 
  config={{
    simulateDelay: 500,    // Simulate network delay
    errorRate: 0.1,        // 10% error rate for testing
    seed: {                // Initialize with mock data
      data: {
        products: [
          { id: '1', name: 'Sample Product', price: 99.99, category: 'Electronics' }
        ]
      },
      behavior: {
        initializeEmpty: true,
        mergeStrategy: 'replace'
      }
    }
  }} 
/>
```

### Production (HTTP/REST)

For real APIs:

```tsx
<ApiClientProvider 
  connectorType="fetch" 
  config={{
    baseUrl: 'https://api.yourapp.com',
    headers: { 
      'Authorization': 'Bearer ' + getAuthToken(),
      'Content-Type': 'application/json'
    },
    timeout: 10000,
    retries: 3,
    seed: {                // Optional: fallback data for 204 responses
      data: { products: [] },
      behavior: {
        useOnNoContent: true
      }
    }
  }} 
/>
```

### Environment-Based Configuration

```tsx
const apiConfig = {
  development: {
    connectorType: 'localStorage' as const,
    config: { simulateDelay: 300 }
  },
  production: {
    connectorType: 'fetch' as const,
    config: {
      baseUrl: process.env.REACT_APP_API_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    }
  }
};

const currentConfig = apiConfig[process.env.NODE_ENV as keyof typeof apiConfig];

<ApiClientProvider {...currentConfig} />
```

## 📝 **Forms Module**

Type-safe forms with automatic validation using Zod schemas:

```tsx
import { useFormData, createFormHandler } from '@skylabs-digital/react-proto-kit';
import { z } from 'zod';

// Define schema with Zod
const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean(),
});

// Option 1: Direct hook usage
function ProductForm() {
  const { 
    values, 
    errors, 
    handleInputChange, 
    handleSubmit,
    isValid,
    isDirty 
  } = useFormData(ProductSchema);

  const onSubmit = handleSubmit(async (data) => {
    // Data is automatically validated
    await productApi.useCreate().mutate(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <input 
        name="name" 
        value={values.name || ''} 
        onChange={handleInputChange} 
      />
      {errors.name && <span>{errors.name}</span>}
      
      <button type="submit" disabled={!isValid}>
        Create Product
      </button>
    </form>
  );
}

// Option 2: Factory pattern (consistent with createCrudApi)
const productForm = createFormHandler(ProductSchema);
const form = productForm.useForm();
```

**Supported input types:**
- `text`, `email`, `password` → `string`
- `number` → `number`
- `checkbox` → `boolean`
- `textarea` → `string`
- `select` → `string`

**Key features:**
- ✅ **Automatic validation** with Zod schemas
- ✅ **Real-time validation** on field changes
- ✅ **Type safety** with full TypeScript support
- ✅ **Form state management** (isDirty, isValid)
- ✅ **Error handling** per field and general errors
- ✅ **Integration** with API module

## 🧭 **Navigation Module**

Type-safe URL parameter management:

```tsx
import { useUrlSelector } from '@skylabs-digital/react-proto-kit';

// Single values
const [productId, setProductId] = useUrlSelector('productId');
// productId: string | undefined

// Array values
const [tags, setTags] = useUrlSelector('tags', String, { multiple: true });
// tags: string[] | undefined

// With type transformation
const [page, setPage] = useUrlSelector('page', Number);
// page: number | undefined
```

## 🌱 **Seed Data & Mock Development**

Initialize your endpoints with seed data for rapid development and testing:

### Basic Seed Configuration

```tsx
import { createDevSeedConfig } from '@skylabs-digital/react-proto-kit';

const seedData = {
  products: [
    { id: '1', name: 'Laptop', price: 999.99, category: 'Electronics' },
    { id: '2', name: 'Coffee Mug', price: 15.99, category: 'Kitchen' }
  ],
  users: [
    { id: '1', name: 'John Doe', email: 'john@example.com' }
  ]
};

<ApiClientProvider 
  connectorType="localStorage"
  config={{
    seed: createDevSeedConfig(seedData)
  }}
/>
```

### Seed Behaviors

**LocalStorage Connector:**
- `initializeEmpty: true` - Seeds empty collections on startup
- `mergeStrategy: 'replace' | 'merge' | 'append'` - How to handle existing data

**Fetch Connector:**
- `useOnNoContent: true` - Returns seed data when API responds with 204 No Content

### Environment-Aware Seeding

```tsx
import { createEnvironmentSeedConfig } from '@skylabs-digital/react-proto-kit';

const config = {
  baseUrl: process.env.REACT_APP_API_URL,
  seed: createEnvironmentSeedConfig(seedData, process.env.NODE_ENV)
  // Only seeds in development/staging, not production
};
```

### Seed Helpers

```tsx
import { 
  createDevSeedConfig,      // Full dev setup with all behaviors
  createFallbackSeedConfig, // Only for 204 responses
  createInitSeedConfig,     // Only for localStorage initialization
  generateMockData          // Generate mock data from templates
} from '@skylabs-digital/react-proto-kit';

// Generate mock data
const mockUsers = generateMockData({
  name: 'User',
  email: 'user@example.com'
}, 10); // Creates 10 mock users with incremental IDs
```

## 📦 **Schema Helpers**

Built-in helpers for common data patterns:

### Entity Schema (Most Common)

Automatically includes `id`, `createdAt`, and `updatedAt`:

```typescript
const UserSchema = createEntitySchema({
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  role: Type.Union([Type.Literal('admin'), Type.Literal('user')])
});
// Auto-generates: id, createdAt, updatedAt
```

### Timestamped Schema

Just timestamps, no ID:

```typescript
const LogSchema = createTimestampedSchema({
  message: Type.String(),
  level: Type.Union([Type.Literal('info'), Type.Literal('error')])
});
// Auto-generates: createdAt, updatedAt
```

### Complex Nested Schemas

```typescript
const OrderSchema = createEntitySchema({
  userId: Type.String(),
  items: Type.Array(Type.Object({
    productId: Type.String(),
    quantity: Type.Number(),
    price: Type.Number()
  })),
  status: Type.Union([
    Type.Literal('pending'),
    Type.Literal('processing'),
    Type.Literal('completed'),
    Type.Literal('cancelled')
  ]),
  shippingAddress: Type.Object({
    street: Type.String(),
    city: Type.String(),
    zipCode: Type.String(),
    country: Type.String()
  })
});
```

## 🔍 **Complete API Reference**

### Generated Hooks

Each API template generates specific hooks:

#### CRUD API Hooks

```typescript
const api = createCrudApi('products', ProductSchema);

// Query hooks (GET operations)
api.useList()     // GET /products - List all
api.useById(id)   // GET /products/:id - Get by ID

// Mutation hooks (POST/PUT/DELETE operations)
api.useCreate()   // POST /products - Create new
api.useUpdate()   // PUT /products/:id - Update existing
api.useDelete()   // DELETE /products/:id - Delete
```

#### Hook Return Types

```typescript
// Query hooks return:
interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: ErrorResponse | null;
  refetch: () => Promise<void>;
}

// Mutation hooks return:
interface MutationResult<TInput, TOutput> {
  mutate: (input: TInput) => Promise<TOutput>;
  loading: boolean;
  error: ErrorResponse | null;
}
```

### Error Handling

```typescript
function ProductList() {
  const { data, loading, error } = productApi.useList();
  
  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <ErrorMessage>
        {error.message || 'Something went wrong'}
        {error.type === 'VALIDATION' && (
          <ValidationErrors errors={error.validation} />
        )}
      </ErrorMessage>
    );
  }
  
  return <ProductGrid products={data} />;
}

## 🧪 **Testing**

Built-in testing utilities:

```typescript
import { createTestWrapper, mockApiResponse } from '@skylabs-digital/react-proto-kit/testing';
import { render, screen } from '@testing-library/react';

// Test wrapper with localStorage connector
const TestWrapper = createTestWrapper({
  connectorType: 'localStorage',
  config: { simulateDelay: 0 }
});

// Mock API responses
mockApiResponse('products', 'list', {
  success: true,
  data: [{ id: '1', name: 'Test Product', price: 99.99 }]
});

test('displays products', async () => {
  render(<ProductList />, { wrapper: TestWrapper });
  
  expect(await screen.findByText('Test Product')).toBeInTheDocument();
});
```

### Run Tests

```bash
yarn test        # Run all tests
yarn test:watch  # Watch mode
yarn coverage    # Coverage report
```

## 🎯 **Type Safety**

Full TypeScript support with automatic type inference:

```typescript
// Types are automatically inferred from your schemas
type Product = InferType<typeof ProductSchema>;
type CreateProduct = InferCreateType<typeof ProductSchema>; // without id, timestamps
type UpdateProduct = InferUpdateType<typeof ProductSchema>; // partial fields

// Use in your components
function ProductForm({ product }: { product?: Product }) {
  const createProduct = productApi.useCreate();
  
  const handleSubmit = async (data: CreateProduct) => {
    // TypeScript ensures data matches the schema
    await createProduct.mutate(data);
  };
}
```

## 🚀 **Real-World Examples**

### E-commerce Store

```typescript
// Product catalog
const ProductSchema = createEntitySchema({
  name: Type.String(),
  price: Type.Number(),
  category: Type.String(),
  inStock: Type.Boolean(),
  images: Type.Array(Type.String())
});

// User management
const UserSchema = createEntitySchema({
  email: Type.String({ format: 'email' }),
  firstName: Type.String(),
  lastName: Type.String(),
  role: Type.Union([Type.Literal('customer'), Type.Literal('admin')])
});

// Order processing
const OrderSchema = createEntitySchema({
  userId: Type.String(),
  items: Type.Array(Type.Object({
    productId: Type.String(),
    quantity: Type.Number(),
    price: Type.Number()
  })),
  total: Type.Number(),
  status: Type.String()
});

// Generate APIs
const productApi = createCrudApi('products', ProductSchema);
const userApi = createCrudApi('users', UserSchema);
const orderApi = createCrudApi('orders', OrderSchema);
```

### Blog Platform

```typescript
const PostSchema = createEntitySchema({
  title: Type.String(),
  content: Type.String(),
  authorId: Type.String(),
  published: Type.Boolean(),
  tags: Type.Array(Type.String())
});

const CommentSchema = createEntitySchema({
  postId: Type.String(),
  authorId: Type.String(),
  content: Type.String(),
  approved: Type.Boolean()
});

const postApi = createCrudApi('posts', PostSchema);
const commentApi = createCrudApi('comments', CommentSchema);
```

## 📚 **Documentation**

- **[Usage Guide](./docs/USAGE_GUIDE.md)** - Comprehensive examples and patterns
- **[Forms Guide](./docs/FORMS.md)** - Complete forms module documentation with examples
- **[Architecture](./docs/ARCHITECTURE.md)** - Technical architecture details
- **[Schemas](./docs/SCHEMAS.md)** - Advanced schema patterns and validation
- **[Developer Experience](./docs/DEVELOPER_EXPERIENCE.md)** - Agility features and roadmap
- **[Implementation](./docs/IMPLEMENTATION.md)** - Technical implementation details for contributors

## 🤝 **Contributing**

We welcome contributions! Please see our [Implementation Guide](./docs/IMPLEMENTATION.md) for technical details.

```bash
# Development setup
yarn install
yarn test
yarn build
```

## 📄 **License**

MIT License - Built for maximum development agility.

---

**Ready to prototype faster?** Start with `npm install @skylabs-digital/react-proto-kit` and create your first prototype in under 5 minutes! 🚀

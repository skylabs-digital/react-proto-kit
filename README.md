# API Client Service

A modern, type-safe React library for rapid API development. Build complete CRUD operations with a single line of code and focus on your business logic, not boilerplate.

## 🚀 **Why API Client Service?**

Stop writing repetitive API code. This library implements the **90% use case with one line** philosophy:

```typescript
import { ApiClientProvider, createEntitySchema, createCrudApi, createCreateSchema, createUpdateSchema, z } from '@skylabs/api-client-service';

// 1. Define your schema with validation (only manual step)
const ProductSchema = createEntitySchema({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean(),
});

// 2. Generate create/update schemas with automatic validation
const ProductCreateSchema = createCreateSchema(ProductSchema);
const ProductUpdateSchema = createUpdateSchema(ProductSchema);

// 3. Create API with validation
const productApi = createCrudApi('products', ProductSchema, {
  createSchema: ProductCreateSchema,
  updateSchema: ProductUpdateSchema,
});

// 4. Use in components with automatic validation
function ProductList() {
  const { data: products, loading, error } = productApi.useList();
  const createProduct = productApi.useCreate();

  const handleCreate = async () => {
    try {
      // Automatic validation before API call
      await createProduct.mutate({
        name: 'New Product',
        price: 99.99,
        category: 'Electronics',
        inStock: true,
      });
    } catch (error) {
      // Handle validation errors
      if (createProduct.error?.type === 'VALIDATION') {
        console.log('Validation errors:', createProduct.error.validation);
      }
    }
  };

  // ... rest of component
}
```

## ✨ **Key Features**

- **🎯 One-Line APIs**: Complete CRUD operations generated automatically
- **🔧 Smart Conventions**: Auto-generates create/update schemas from your base schema
- **📦 Schema Helpers**: Built-in helpers for common patterns (timestamps, IDs, etc.)
- **🎨 Flexible Templates**: CRUD, read-only, or custom operation sets
- **⚡ Type-Safe**: Full TypeScript support with runtime validation
- **🔌 Environment-Aware**: localStorage for development, HTTP for production
- **🧪 Test-Friendly**: Built-in mocking and testing utilities

## 📦 **Installation**

```bash
npm install @skylabs/api-client-service
# or
yarn add @skylabs/api-client-service
```

## 🚀 **Quick Start**

### 1. Setup Provider

Wrap your app with the API provider:

```tsx
import { ApiClientProvider } from '@skylabs/api-client-service';

function App() {
  return (
    <ApiClientProvider connectorType="localStorage"> {/* Dev mode */}
      <YourApp />
    </ApiClientProvider>
  );
}
```

### 2. Define Your Data Schema

```tsx
import { createEntitySchema, Type } from '@skylabs/api-client-service';

const ProductSchema = createEntitySchema({
  name: Type.String(),
  price: Type.Number(),
  category: Type.String(),
  description: Type.Optional(Type.String())
});
```

### 3. Generate Your API (One Line!)

```tsx
import { createCrudApi } from '@skylabs/api-client-service';

const productApi = createCrudApi('products', ProductSchema);
// That's it! You now have: useList, useById, useCreate, useUpdate, useDelete
```

### 4. Use in Your Components

```tsx
function ProductManager() {
  const { data: products, loading, error } = productApi.useList();
  const createProduct = productApi.useCreate();
  const updateProduct = productApi.useUpdate();
  const deleteProduct = productApi.useDelete();

  const handleCreate = async () => {
    await createProduct.mutate({
      name: 'New Product',
      price: 99.99,
      category: 'Electronics'
    });
  };

  const handleUpdate = async (id: string) => {
    await updateProduct.mutate(id, {
      name: 'Updated Product',
      price: 149.99
    });
  };

  const handleDelete = async (id: string) => {
    await deleteProduct.mutate(id);
  };

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleCreate}>Add Product</button>
      <div>
        {products?.map(product => (
          <div key={product.id}>
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
    persistData: true      // Keep data between sessions
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
    retries: 3
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
import { createTestWrapper, mockApiResponse } from '@skylabs/api-client-service/testing';
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

**Ready to build faster?** Start with `npm install @skylabs/api-client-service` and create your first API in under 5 minutes! 🚀

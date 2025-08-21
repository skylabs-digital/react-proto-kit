# 🚀 **React Proto Kit**

*Complete React prototyping toolkit - from idea to working prototype in minutes*

A modern, type-safe React library for rapid prototyping. Build complete applications with APIs, forms, and navigation using minimal code. Focus on your business logic, not boilerplate.

## 🎯 **Complete Prototyping Solution**

**Three powerful modules in one kit:**
- 🔌 **API Module** - CRUD operations with automatic validation
- 📝 **Forms Module** - Type-safe forms with Zod validation  
- 🧭 **Navigation Module** - URL state management

## ⚡ **The 90% use case with minimal code** philosophy:

```typescript
import { 
  ApiClientProvider, 
  createCrudApi,
  useFormData,
  useUrlSelector,
  z 
} from '@skylabs-digital/react-proto-kit';

// 1. Define your schema with Zod (shared across API, forms, validation)
const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 2. Complete prototype in 3 lines
const productApi = createCrudApi('products', ProductSchema);
const { values, errors, handleSubmit, handleInputChange } = useFormData(ProductSchema);
const [selectedId, setSelectedId] = useUrlSelector('productId');

// 3. Use in components with automatic validation
function ProductManager() {
  const { data: products, loading, error } = productApi.useList();
  const createProduct = productApi.useCreate();

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Automatic validation before API call
      await createProduct.mutate(data);
      setSelectedId(null); // Clear selection
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  });

  return (
    <div>
      <form onSubmit={onSubmit}>
        <input 
          name="name" 
          placeholder="Product name"
          value={values.name || ''} 
          onChange={handleInputChange} 
        />
        {errors.name && <span className="error">{errors.name}</span>}
        
        <input 
          name="price" 
          type="number" 
          placeholder="Price"
          value={values.price || ''} 
          onChange={handleInputChange} 
        />
        {errors.price && <span className="error">{errors.price}</span>}
        
        <button type="submit">Create Product</button>
      </form>
      
      {products?.map(product => (
        <div 
          key={product.id} 
          onClick={() => setSelectedId(product.id)}
          className={selectedId === product.id ? 'selected' : ''}
        >
          <h3>{product.name} - ${product.price}</h3>
          <p>Category: {product.category}</p>
        </div>
      ))}
    </div>
  );
}
```

## ✨ **Key Features**

- **🎯 One-Line APIs**: Complete CRUD operations generated automatically
- **🔌 API Module**: Auto-generates CRUD operations with type safety
- **📝 Forms Module**: Validated forms with automatic error handling
- **🧭 Navigation Module**: URL state management with type inference
- **⚡ Unified Validation**: Single Zod schema for API, forms, and navigation
- **🔧 Smart Conventions**: Auto-generates create/update schemas
- **🔌 Environment-Aware**: localStorage for development, HTTP for production
- **🧪 Test-Friendly**: Built-in mocking and testing utilities

## 📦 **Installation**

```bash
npm install @skylabs-digital/react-proto-kit
# or
yarn add @skylabs-digital/react-proto-kit
```

## 🚀 **Quick Start**

### 1. Setup Provider

Wrap your app with the API provider:

```tsx
import { ApiClientProvider } from '@skylabs-digital/react-proto-kit';

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
import { createEntitySchema, Type } from '@skylabs-digital/react-proto-kit';

const ProductSchema = createEntitySchema({
  name: Type.String(),
  price: Type.Number(),
  category: Type.String(),
  description: Type.Optional(Type.String())
});
```

### 3. Generate Your API (One Line!)

```tsx
import { createCrudApi } from '@skylabs-digital/react-proto-kit';

const productApi = createCrudApi('products', ProductSchema);
// That's it! You now have: useList, useById, useCreate, useUpdate, useDelete
```

### 4. Complete Component Example

```tsx
function ProductManager() {
  // API operations
  const { data: products, loading, error } = productApi.useList();
  const { mutate: createProduct } = productApi.useCreate();
  
  // Form handling
  const { values, errors, handleInputChange, handleSubmit } = useFormData(ProductSchema);
  
  // URL state
  const [selectedId, setSelectedId] = useUrlSelector('productId');
  
  const onSubmit = handleSubmit(async (data) => {
    await createProduct(data);
    setSelectedId(null); // Clear selection after create
  });
  
  return (
    <div>
      <form onSubmit={onSubmit}>
        <input name="name" onChange={handleInputChange} />
        {errors.name && <span>{errors.name}</span>}
        <button type="submit">Create</button>
      </form>
      
      {products?.map(product => (
        <div key={product.id} onClick={() => setSelectedId(product.id)}>
          {product.name}
        </div>
      ))}
    </div>
  );
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

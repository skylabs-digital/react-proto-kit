# Schema Defaults and Dual Schema Support

React Proto Kit provides powerful schema management with automatic default value application and dual schema support for maximum flexibility.

## 🎯 Overview

The library supports two types of schemas:
- **Entity Schema**: Defines the complete data structure with defaults
- **Upsert Schema**: Defines validation rules for create/update operations

This separation allows you to have different validation rules for input while maintaining consistent defaults for your entities.

## ✨ Default Values Feature

Default values defined in your entity schema are automatically applied when creating or retrieving entities, even if those fields are missing from the input data.

### Basic Example

```typescript
import { z } from 'zod';
import { createDomainApi } from '@skylabs-digital/react-proto-kit';

// Entity schema with defaults
const userEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string().default('user'), // Default value
  isActive: z.boolean().default(true), // Default value
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Simple API - uses entity schema for both validation and defaults
const userApi = createDomainApi('users', {
  entitySchema: userEntitySchema,
});

// When creating a user, defaults are automatically applied
const { mutate: createUser } = userApi.useCreate();

// This will create a user with role: 'user' and isActive: true
await createUser({ 
  name: 'John Doe', 
  email: 'john@example.com' 
});
```

## 🎯 Dual Schema Configuration

For more complex scenarios, you can define separate schemas for validation and entity structure:

```typescript
// Entity schema - complete structure with defaults
const todoEntitySchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().optional(),
  user: z.string().default('Demo User'), // Auto-assigned user
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Upsert schema - validation for create/update operations
const todoUpsertSchema = z.object({
  text: z.string()
    .min(1, 'Todo text is required')
    .max(100, 'Todo text must be at most 100 characters'),
  completed: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().optional(),
  // Note: 'user' field is not in upsert schema but will be added from entity schema
});

const todoApi = createDomainApi('todos', {
  entitySchema: todoEntitySchema,
  upsertSchema: todoUpsertSchema,
  globalState: true,
});
```

## 📋 Configuration Examples

### 1. Simple Configuration (Single Schema)

```typescript
const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  inStock: z.boolean().default(true),
  category: z.string().default('general'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const productApi = createDomainApi('products', {
  entitySchema: productSchema,
});
```

### 2. Dual Schema Configuration

```typescript
const postEntitySchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  published: z.boolean(),
  author: z.string().default('Anonymous'),
  views: z.number().default(0),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const postUpsertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  published: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  // author and views will be set from entity schema defaults
});

const postApi = createDomainApi('posts', {
  entitySchema: postEntitySchema,
  upsertSchema: postUpsertSchema,
  globalState: true,
  optimistic: true,
});
```

### 3. Advanced Configuration with Nested Resources

```typescript
const commentEntitySchema = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string().default('Guest'),
  approved: z.boolean().default(false),
  likes: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const commentUpsertSchema = z.object({
  text: z.string().min(1, 'Comment text is required'),
  author: z.string().optional(),
  // approved and likes will use entity schema defaults
});

const commentsApi = createDomainApi('posts/:postId/comments', {
  entitySchema: commentEntitySchema,
  upsertSchema: commentUpsertSchema,
  globalState: true,
  queryParams: {
    dynamic: ['approved', 'sortBy', 'order'],
  },
});
```

## 🔧 How It Works

### Default Value Extraction

The system automatically extracts default values from Zod schemas:

```typescript
// These patterns are supported:
z.string().default('value')           // Direct default
z.boolean().default(true)             // Boolean default
z.number().default(0)                 // Number default
z.array(z.string()).default([])       // Array default
z.string().optional()                 // No default (undefined)
```

### Application Process

1. **Input Validation**: User input is validated against the upsert schema
2. **Default Extraction**: Defaults are extracted from the entity schema
3. **Merging**: Defaults are applied first, then user input overwrites them
4. **Storage**: The complete entity with defaults is stored

```typescript
// Example flow:
// Input: { text: 'Buy milk' }
// Entity defaults: { user: 'Demo User', completed: false, priority: 'medium' }
// Result: { text: 'Buy milk', user: 'Demo User', completed: false, priority: 'medium', id: '...', createdAt: '...', updatedAt: '...' }
```

## 🎨 Use Cases

### 1. User Management with Role Defaults

```typescript
const userEntitySchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
  permissions: z.array(z.string()).default(['read']),
  isActive: z.boolean().default(true),
  lastLogin: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const userUpsertSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'user', 'guest']).optional(),
  // permissions and isActive use entity defaults
});
```

### 2. E-commerce Products with Inventory Defaults

```typescript
const productEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  inStock: z.boolean().default(true),
  quantity: z.number().default(0),
  category: z.string().default('uncategorized'),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const productUpsertSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().min(0, 'Quantity cannot be negative').optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
```

### 3. Content Management with Author Tracking

```typescript
const articleEntitySchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  author: z.string().default('System'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  publishedAt: z.string().optional(),
  views: z.number().default(0),
  likes: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const articleUpsertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  publishedAt: z.string().optional(),
  // author, views, and likes use entity defaults
});
```

## 🛠 Helper Functions

The library provides utility functions for working with schema defaults:

```typescript
import { extractSchemaDefaults, applySchemaDefaults } from '@skylabs-digital/react-proto-kit';

// Extract defaults from a schema
const defaults = extractSchemaDefaults(userEntitySchema);
// Returns: { role: 'user', isActive: true, permissions: ['read'] }

// Apply defaults to data
const userData = { email: 'john@example.com', name: 'John' };
const completeUser = applySchemaDefaults(userData, userEntitySchema);
// Returns: { email: 'john@example.com', name: 'John', role: 'user', isActive: true, permissions: ['read'] }
```

## 🔍 Best Practices

### 1. Schema Organization

```typescript
// Good: Separate concerns
const entitySchema = z.object({
  // Complete entity structure with defaults
  id: z.string(),
  name: z.string(),
  status: z.string().default('active'),
  // ... other fields
});

const createSchema = z.object({
  // Only fields needed for creation with validation
  name: z.string().min(1, 'Name is required'),
  // status will use entity default
});

const updateSchema = z.object({
  // Fields that can be updated
  name: z.string().min(1, 'Name is required').optional(),
  status: z.string().optional(),
});
```

### 2. Default Value Types

```typescript
// Good: Use appropriate default types
z.string().default(''),                    // Empty string for text
z.boolean().default(false),                // False for flags
z.number().default(0),                     // Zero for counters
z.array(z.string()).default([]),           // Empty array for lists
z.enum(['active', 'inactive']).default('active'), // Enum defaults

// Avoid: Complex objects as defaults (use factory functions instead)
z.object({}).default(() => ({ complex: 'object' }))
```

### 3. Validation Strategy

```typescript
// Entity schema: Permissive with defaults
const entitySchema = z.object({
  title: z.string(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string()).default([]),
});

// Upsert schema: Strict validation
const upsertSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title too long')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Title contains invalid characters'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string().min(1)).max(10, 'Too many tags').optional(),
});
```

## 🚀 Migration Guide

### From Single Schema to Dual Schema

```typescript
// Before: Single schema
const userApi = createDomainApi('users', {
  entitySchema: userSchema,
});

// After: Dual schema with defaults
const userApi = createDomainApi('users', {
  entitySchema: userEntitySchema,    // With defaults
  upsertSchema: userUpsertSchema,    // With validation
});
```

### Adding Defaults to Existing Schemas

```typescript
// Before: No defaults
const schema = z.object({
  name: z.string(),
  active: z.boolean(),
});

// After: With defaults
const schema = z.object({
  name: z.string(),
  active: z.boolean().default(true),  // Added default
  role: z.string().default('user'),   // New field with default
});
```

This dual schema approach provides maximum flexibility while maintaining type safety and automatic default value application throughout your application.

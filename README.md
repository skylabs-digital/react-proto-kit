# React Proto Kit

> **From idea to working prototype in minutes** ⚡

A powerful React prototyping toolkit that eliminates boilerplate and accelerates development. Build full-stack applications with type-safe APIs, real-time state management, and automatic CRUD operations.

[![npm version](https://badge.fury.io/js/@skylabs-digital%2Freact-proto-kit.svg)](https://badge.fury.io/js/@skylabs-digital%2Freact-proto-kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)

## 🚀 Quick Start

**One-liner to get started:**

```bash
npm install @skylabs-digital/react-proto-kit zod react react-router-dom
```

```tsx
import { createDomainApi, z } from '@skylabs-digital/react-proto-kit';

// Define your data schema
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
});

// Create a fully functional API
const userApi = createDomainApi('users', userSchema, userSchema);

// Use it in your component
function UserList() {
  const { data: users, loading } = userApi.useList();
  const { mutate: createUser } = userApi.useCreate();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <button onClick={() => createUser({ name: 'John', email: 'john@example.com', age: 30 })}>
        Add User
      </button>
      {users?.map(user => (
        <div key={user.id}>{user.name} - {user.email}</div>
      ))}
    </div>
  );
}
```

That's it! You now have a fully functional CRUD API with TypeScript support, optimistic updates, and automatic state management.

## ✨ Key Features

- **🔥 Zero Boilerplate**: One function call creates a complete CRUD API
- **🎯 Type-Safe**: Full TypeScript support with automatic type inference
- **⚡ Real-time**: Automatic state synchronization across components
- **🔄 Optimistic Updates**: Instant UI feedback with automatic rollback on errors
- **🌐 Backend Agnostic**: Works with any REST API or local storage
- **📝 Form Handling**: Built-in form validation and state management
- **🔗 Nested Resources**: Support for complex resource relationships
- **🎨 Builder Pattern**: Chainable API for dynamic configurations
- **📊 Query Parameters**: Static and dynamic query parameter management
- **🔍 URL State**: Automatic URL synchronization for filters and pagination
- **🎭 Data Orchestrator**: Aggregate multiple API calls with smart loading states
- **🎨 UI Components**: Built-in Modal, Drawer, Tabs, Stepper, Accordion, and Snackbar components with URL state management

## 📖 Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Documentation](#documentation)
- [Contributing](#contributing)

## 📦 Installation

```bash
# npm
npm install @skylabs-digital/react-proto-kit zod react react-router-dom

# yarn
yarn add @skylabs-digital/react-proto-kit zod react react-router-dom

# pnpm
pnpm add @skylabs-digital/react-proto-kit zod react react-router-dom
```

### Peer Dependencies

- `react` >= 16.8.0
- `react-router-dom` >= 6.0.0
- `zod` >= 3.0.0

## 🎯 Basic Usage

### 1. Setup Providers

Wrap your app with the necessary providers:

```tsx
import { BrowserRouter } from 'react-router-dom';
import { ApiClientProvider, GlobalStateProvider } from '@skylabs-digital/react-proto-kit';

function App() {
  return (
    <BrowserRouter>
      <ApiClientProvider connectorType="fetch" config={{ baseUrl: 'http://localhost:3001' }}>
        <GlobalStateProvider>
          {/* Your app components */}
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}
```

### 2. Define Your Schema

```tsx
import { z } from '@skylabs-digital/react-proto-kit';

const todoSchema = z.object({
  text: z.string().min(1, 'Todo text is required'),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});
```

### 3. Create Your API

```tsx
import { createDomainApi } from '@skylabs-digital/react-proto-kit';

const todoApi = createDomainApi('todos', todoSchema, todoSchema, {
  optimistic: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
});
```

### 4. Use in Components

```tsx
function TodoApp() {
  const { data: todos, loading, error } = todoApi.useList();
  const { mutate: createTodo } = todoApi.useCreate();
  const { mutate: updateTodo } = todoApi.useUpdate();
  const { mutate: deleteTodo } = todoApi.useDelete();

  if (loading) return <div>Loading todos...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => createTodo({ text: 'New Todo', completed: false })}>
        Add Todo
      </button>
      {todos?.map(todo => (
        <div key={todo.id}>
          <span>{todo.text}</span>
          <button onClick={() => updateTodo(todo.id, { ...todo, completed: !todo.completed })}>
            Toggle
          </button>
          <button onClick={() => deleteTodo(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## 🚀 Advanced Features

### Nested Resources

Handle complex resource relationships with ease:

```tsx
// Comments belong to todos
const commentApi = createDomainApi(
  'todos/:todoId/comments',
  commentSchema,
  commentUpsertSchema,
  {
    optimistic: false,
    queryParams: {
      static: { include: 'author' },
      dynamic: ['status', 'sortBy']
    }
  }
);

// Usage with builder pattern
function TodoComments({ todoId }: { todoId: string }) {
  const api = commentApi
    .withParams({ todoId })
    .withQuery({ status: 'published', sortBy: 'createdAt' });
    
  const { data: comments } = api.useList();
  const { mutate: createComment } = api.useCreate();
  
  return (
    <div>
      {comments?.map(comment => (
        <div key={comment.id}>{comment.text}</div>
      ))}
      <button onClick={() => createComment({ text: 'New comment', authorId: 'user-1' })}>
        Add Comment
      </button>
    </div>
  );
}
```

### Different Schemas for Operations

Use different schemas for entity responses vs create/update operations:

```tsx
// Full entity schema (includes server-generated fields)
const userEntitySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().url(), // Server-generated
  lastLoginAt: z.string().datetime(), // Server-managed
});

// Schema for create/update operations (excludes server-generated fields)
const userUpsertSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const userApi = createDomainApi('users', userEntitySchema, userUpsertSchema);
```

### Type Extraction

Extract TypeScript types from your APIs:

```tsx
import { ExtractEntityType, ExtractInputType } from '@skylabs-digital/react-proto-kit';

type User = ExtractEntityType<typeof userApi>;
// Result: { id: string; createdAt: string; updatedAt: string; name: string; email: string; avatar: string; lastLoginAt: string; }

type UserInput = ExtractInputType<typeof userApi>;
// Result: { name: string; email: string; }
```

### Form Integration

Built-in form handling with validation:

```tsx
import { useFormData } from '@skylabs-digital/react-proto-kit';

function UserForm() {
  const { mutate: createUser } = userApi.useCreate();
  const { values, errors, handleInputChange, handleSubmit, reset } = useFormData(
    userUpsertSchema,
    { name: '', email: '' }
  );

  const onSubmit = handleSubmit(async (data) => {
    await createUser(data);
    reset();
  });

  return (
    <form onSubmit={onSubmit}>
      <input
        name="name"
        value={values.name || ''}
        onChange={handleInputChange}
        placeholder="Name"
      />
      {errors.name && <span>{errors.name}</span>}
      
      <input
        name="email"
        value={values.email || ''}
        onChange={handleInputChange}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email}</span>}
      
      <button type="submit">Create User</button>
    </form>
  );
}
```

### URL State Management

Synchronize component state with URL parameters:

```tsx
import { useUrlSelector } from '@skylabs-digital/react-proto-kit';

function TodoList() {
  const [filter, setFilter] = useUrlSelector('filter', (value: string) => value as FilterType);
  const [page, setPage] = useUrlSelector('page', (value: string) => parseInt(value) || 1);
  
  const { data: todos } = todoApi.useList({
    page,
    limit: 10,
    filter: filter || 'all'
  });

  return (
    <div>
      <button onClick={() => setFilter('active')}>Show Active</button>
      <button onClick={() => setFilter('completed')}>Show Completed</button>
      <button onClick={() => setPage(page + 1)}>Next Page</button>
      {/* Render todos */}
    </div>
  );
}
```

### Partial Updates with PATCH

Use PATCH for efficient partial updates:

```tsx
function TodoItem({ todo }: { todo: Todo }) {
  const { mutate: patchTodo } = todoApi.usePatch();
  
  // Only update the completed field
  const toggleCompleted = () => {
    patchTodo(todo.id, { completed: !todo.completed });
  };
  
  return (
    <div>
      <span>{todo.text}</span>
      <button onClick={toggleCompleted}>
        {todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
      </button>
    </div>
  );
}
```

### Data Orchestrator

Manage multiple API calls in a single component with smart loading states:

```tsx
import { useDataOrchestrator } from '@skylabs-digital/react-proto-kit';

function Dashboard() {
  const { data, isLoading, isFetching, hasErrors, errors, retryAll } = useDataOrchestrator({
    required: {
      users: userApi.useList,
      products: productApi.useList,
    },
    optional: {
      stats: statsApi.useQuery,
    },
  });

  // First load - blocks rendering
  if (isLoading) return <FullPageLoader />;
  
  // Required resources failed
  if (hasErrors) return <ErrorPage errors={errors} onRetry={retryAll} />;

  return (
    <div>
      {/* Non-blocking refetch indicator */}
      {isFetching && <TopBarSpinner />}
      
      <h1>Users: {data.users!.length}</h1>
      <h1>Products: {data.products!.length}</h1>
      
      {/* Optional resource with independent error handling */}
      {errors.stats ? (
        <ErrorBanner error={errors.stats} />
      ) : data.stats ? (
        <StatsWidget data={data.stats} />
      ) : null}
    </div>
  );
}
```

**Key Features:**
- **`isLoading`**: Blocks rendering during first load of required resources
- **`isFetching`**: Shows non-blocking indicator for refetches
- **Required vs Optional**: Control which resources block rendering
- **Granular Retry**: Retry individual resources or all at once
- **Type-Safe**: Full TypeScript inference for all data

See [Data Orchestrator Documentation](./docs/DATA_ORCHESTRATOR.md) for more details.

### Local Storage Mode

Perfect for prototyping without a backend:

```tsx
function App() {
  return (
    <BrowserRouter>
      <ApiClientProvider connectorType="localStorage">
        <GlobalStateProvider>
          {/* Your app works exactly the same! */}
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}
```

## 📚 API Reference

### `createDomainApi(path, entitySchema, upsertSchema, config?)`

Creates a complete CRUD API for a resource.

**Parameters:**
- `path: string` - Resource path (e.g., 'users', 'todos/:todoId/comments')
- `entitySchema: ZodSchema` - Schema for entity responses
- `upsertSchema: ZodSchema` - Schema for create/update operations
- `config?: object` - Optional configuration

**Config Options:**
```tsx
{
  optimistic?: boolean;        // Enable optimistic updates (default: true)
  cacheTime?: number;         // Cache duration in milliseconds
  queryParams?: {
    static?: Record<string, any>;   // Always included parameters
    dynamic?: string[];             // Runtime configurable parameters
  };
}
```

**Returns:** API object with methods:
- `useList(params?)` - Fetch list of entities
- `useQuery(id)` / `useById(id)` - Fetch single entity
- `useCreate()` - Create new entity
- `useUpdate()` - Update entire entity (PUT)
- `usePatch()` - Partial update (PATCH)
- `useDelete()` - Delete entity
- `withParams(params)` - Inject path parameters (builder pattern)
- `withQuery(params)` - Inject query parameters (builder pattern)

### Hooks

All hooks return objects with consistent interfaces:

**Query Hooks (`useList`, `useQuery`, `useById`):**
```tsx
{
  data: T | T[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**Mutation Hooks (`useCreate`, `useUpdate`, `usePatch`, `useDelete`):**
```tsx
{
  mutate: (data: T, id?: string) => Promise<T>;
  loading: boolean;
  error: Error | null;
}
```

### Type Utilities

- `ExtractEntityType<T>` - Extract complete entity type with auto-generated fields
- `ExtractInputType<T>` - Extract input type for create/update operations

## 📁 Examples

The repository includes comprehensive examples:

- **[Basic Todo](./examples/todo-without-global-context/)** - Simple CRUD operations
- **[Todo with Global State](./examples/todo-with-global-context/)** - Real-time state sync
- **[Todo with Backend](./examples/todo-with-backend/)** - Full-stack integration
- **[Blog Example](./examples/blog-with-backend/)** - Complex nested resources
- **[Advanced Patterns](./examples/)** - Advanced usage patterns

Run examples locally:

```bash
git clone https://github.com/skylabs-digital/react-proto-kit.git
cd react-proto-kit/examples/todo-with-backend
npm install
npm run dev
```

## 🎨 UI Components

### Snackbar Notifications

Built-in toast-style notifications with auto-dismiss and queue management:

```tsx
import { SnackbarProvider, SnackbarContainer, useSnackbar } from '@skylabs-digital/react-proto-kit';

// Setup (once in your app)
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
        message: 'Changes saved successfully!',
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      showSnackbar({
        message: 'Error saving changes',
        variant: 'error',
        duration: 5000
      });
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

**Snackbar Features:**
- ✅ 4 variants: `success`, `error`, `warning`, `info`
- ✅ Auto-dismiss with configurable timeout
- ✅ Queue system for multiple notifications
- ✅ Optional action buttons (undo, etc.)
- ✅ Fully customizable via `SnackbarComponent` prop
- ✅ 6 position options (top/bottom, left/center/right)
- ✅ Portal rendering for proper z-index

**Custom Snackbar Component:**
```tsx
import { SnackbarItemProps } from '@skylabs-digital/react-proto-kit';

function CustomSnackbar({ snackbar, onClose, animate }: SnackbarItemProps) {
  return (
    <div style={{ /* your custom styles */ }}>
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

**Integration with CRUD APIs:**
```tsx
const todosApi = createDomainApi('todos', todoSchema);
const { showSnackbar } = useSnackbar();

const createMutation = todosApi.useCreate({
  onSuccess: () => showSnackbar({ message: 'Todo created!', variant: 'success' }),
  onError: (e) => showSnackbar({ message: e.message, variant: 'error' })
});
```

## 📖 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation with all hooks and components
- **[UI Components Guide](./docs/UI_COMPONENTS.md)** - Complete guide with examples for Modal, Drawer, Tabs, Stepper, Accordion, and Snackbar
- **[UI Components RFC](./docs/RFC_URL_NAVIGATION.md)** - Technical design and architecture decisions
- **[Advanced Usage](./docs/ADVANCED_USAGE.md)** - Complex patterns and best practices
- **[Forms Guide](./docs/FORMS.md)** - Form handling and validation
- **[Global Context Guide](./docs/GLOBAL_CONTEXT_GUIDE.md)** - State management
- **[Data Orchestrator](./docs/DATA_ORCHESTRATOR.md)** - Aggregate multiple API calls
- **[Architecture](./docs/ARCHITECTURE.md)** - Internal architecture and design decisions
- **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Upgrading between versions

## 🛠 Backend Integration

### Express.js Example

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let todos = [];
let nextId = 1;

// GET /todos
app.get('/todos', (req, res) => {
  res.json(todos);
});

// POST /todos
app.post('/todos', (req, res) => {
  const todo = {
    id: String(nextId++),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...req.body
  };
  todos.push(todo);
  res.status(201).json(todo);
});

// PUT /todos/:id
app.put('/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });
  
  todos[index] = {
    ...todos[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json(todos[index]);
});

// PATCH /todos/:id
app.patch('/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });
  
  todos[index] = {
    ...todos[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json(todos[index]);
});

// DELETE /todos/:id
app.delete('/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });
  
  todos.splice(index, 1);
  res.status(204).send();
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/skylabs-digital/react-proto-kit.git
cd react-proto-kit
npm install
npm run dev
```

### Running Tests

```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 📄 License

MIT © [Skylabs Digital](https://github.com/skylabs-digital)

## 🙏 Acknowledgments

Built with ❤️ by the Skylabs Digital team. Special thanks to:

- [Zod](https://zod.dev/) for amazing schema validation
- [React](https://reactjs.org/) for the incredible ecosystem
- The open-source community for inspiration and feedback

---

**Ready to prototype at lightning speed?** ⚡ [Get started now](#quick-start) or [explore the examples](./examples/)!

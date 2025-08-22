# TODO App - With Global Context

This is a simple TODO application demonstrating the power of Global Context in the API Client Service. All components automatically stay in sync without manual state management.

## Features

- ✅ **Global State Management**: All components share state automatically
- ✅ **Optimistic Updates**: Instant UI feedback with rollback on errors
- ✅ **Real-time Sync**: Add/update/delete todos and see changes everywhere
- ✅ **Smart Caching**: 5-minute cache with automatic invalidation
- ✅ **Filter Views**: View all, pending, or completed todos
- ✅ **Statistics**: Live counters that update automatically

## Key Benefits of Global Context

1. **No Manual State Management**: Components don't need to pass data around
2. **Automatic Synchronization**: TodoStats updates when TodoForm creates items
3. **Optimistic Updates**: UI responds instantly, with rollback on errors
4. **Efficient Caching**: Data is cached and shared across all components

## Running the Example

```bash
cd examples/todo-with-global-context
npm install
npm run dev
```

## Code Highlights

### API Setup with Global Context
```typescript
const todosApi = createDomainApi(
  'todos',
  todoSchema,
  {
    globalState: true,        // Enable global context
    optimistic: true,         // Enable optimistic updates
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
  }
);
```

### Component Synchronization
- `TodoForm` creates todos → `TodoStats` updates automatically
- `TodoItem` toggles completion → `TodoStats` reflects changes instantly
- All components share the same data source seamlessly

### Provider Setup
```typescript
<ApiClientProvider connectorType="localStorage">
  <GlobalStateProvider>
    <App />
  </GlobalStateProvider>
</ApiClientProvider>
```

This example showcases how Global Context eliminates the complexity of manual state management while providing powerful features like optimistic updates and intelligent caching.

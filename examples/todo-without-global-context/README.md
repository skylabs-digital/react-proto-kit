# TODO App - Without Global Context

This is a simple TODO application demonstrating the traditional approach without Global Context. Notice how much manual work is required to keep components synchronized.

## Features

- ❌ **Manual State Management**: Components need manual callbacks and refresh logic
- ❌ **No Automatic Sync**: Changes in one component don't reflect in others automatically
- ❌ **Manual Refresh Required**: Users must click refresh buttons to see updates
- ❌ **Complex State Coordination**: Parent components manage refresh keys and callbacks
- ✅ **Individual Caching**: Each component has its own cache (not shared)

## Challenges Without Global Context

1. **Manual Synchronization**: TodoStats doesn't update when TodoForm creates items
2. **Callback Hell**: Components need onTodoAdded, onTodoChanged callbacks
3. **Refresh Keys**: Parent components manage refreshKey state to force updates
4. **User Experience**: Users must manually refresh to see changes
5. **Code Complexity**: More boilerplate code for state coordination

## Running the Example

```bash
cd examples/todo-without-global-context
npm install
npm run dev
```

## Code Highlights

### API Setup without Global Context
```typescript
const todosApi = createDomainApi(
  'todos',
  todoSchema
  // No globalState flag - each component manages its own state
);
```

### Manual Synchronization Required
```typescript
// Parent component manages refresh state
const [refreshKey, setRefreshKey] = useState(0);

const handleTodoAdded = () => {
  // Force other components to refresh
  setRefreshKey(prev => prev + 1);
};

// Child components need callbacks
<TodoForm onTodoAdded={handleTodoAdded} />
<TodoStats onRefresh={handleRefresh} />
<TodoList refreshKey={refreshKey} />
```

### Component Isolation Issues
- `TodoForm` creates todos → `TodoStats` shows stale data until manual refresh
- `TodoItem` toggles completion → `TodoStats` doesn't update automatically
- Each component fetches its own data independently

## Comparison with Global Context

| Feature | Without Global Context | With Global Context |
|---------|----------------------|-------------------|
| Automatic Sync | ❌ Manual callbacks required | ✅ Automatic |
| Code Complexity | ❌ High (callbacks, refresh keys) | ✅ Low (just use hooks) |
| User Experience | ❌ Manual refresh needed | ✅ Real-time updates |
| State Management | ❌ Parent manages coordination | ✅ Handled automatically |
| Caching | ❌ Isolated per component | ✅ Shared across components |

This example showcases the complexity and limitations of traditional state management compared to the seamless experience provided by Global Context.

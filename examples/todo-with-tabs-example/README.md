# Todo with Tabs Example

This example demonstrates **automatic data refetching** when URL query parameters change using `withDataOrchestrator` HOC with `watchSearchParams`.

## 🎯 Key Features

1. **Tab Navigation** - Uses `useUrlTabs` to manage tabs in URL (`?status=active`)
2. **Query Filters** - Uses `withQuery()` to filter todos by status
3. **Auto Refetch** - Uses `watchSearchParams: ['status']` to automatically refetch when tab changes
4. **Type Safety** - Full TypeScript support throughout

## 🔧 How It Works

```tsx
function TodoTabs() {
  // 1. Manage tab state in URL
  const [activeTab, setTab] = useUrlTabs('status', ['active', 'completed', 'archived']);

  // 2. Create HOC that filters by current tab
  const TodoListWithData = withDataOrchestrator<TodoListData>(TodoListContent, {
    hooks: {
      // 3. Use withQuery to inject status filter
      todos: () => todosApi.withQuery({ status: activeTab }).useList(),
    },
    options: {
      // 4. 🔥 Auto-reset when 'status' URL param changes!
      watchSearchParams: ['status'],
    },
  });

  return <TodoListWithData />;
}
```

## ⚡ Execution Flow

1. User clicks "Completed" tab
2. `setTab('completed')` updates URL to `?status=completed`
3. `watchSearchParams` detects `status` param changed
4. HOC automatically resets orchestrator state
5. Hook re-executes: `todosApi.withQuery({ status: 'completed' }).useList()`
6. Fresh data loads with new filter ✨

## 🚀 Running the Example

```bash
cd examples/todo-with-tabs-example
yarn install
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) and try switching between tabs!

## 📚 Key Concepts

### withQuery()
Injects query parameters into API calls:
```tsx
todosApi.withQuery({ status: 'active', category: 'work' }).useList()
```

### watchSearchParams
Automatically resets when specified URL params change:
```tsx
options: {
  watchSearchParams: ['status', 'category']
}
```

### Why This Pattern?

**Without `watchSearchParams`:**
- Changing URL params wouldn't trigger refetch
- Would need manual `orchestrator.refetch()` calls
- Hooks would still use old captured values ❌

**With `watchSearchParams`:**
- URL param changes automatically trigger reset
- Hooks re-execute with new values
- Data stays in sync with URL ✅

## 🎨 UI Features

- Visual loading indicator when fetching
- Tab count badges
- Styled active/completed items
- Category labels
- Empty state handling

## 💡 Learn More

- [Data Orchestrator Documentation](../../docs/DATA_ORCHESTRATOR.md)
- [API Reference](../../docs/API_REFERENCE.md)
- [withQuery Builder Pattern](../../docs/ADVANCED_USAGE.md)

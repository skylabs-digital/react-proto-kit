import React, { useState, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  ApiClientProvider,
  useUrlSelector,
  useFormData,
  createDomainApi,
  ExtractEntityType,
  z,
} from '../../../src';

// Business schema for input validation and API creation
const todoSchema = z.object({
  text: z
    .string()
    .min(1, 'Todo text is required')
    .max(10, 'Todo text must be 10 characters or less'),
  completed: z.boolean(),
});

// Create API without Global Context
const todosApi = createDomainApi('todos', todoSchema);

// Extract types from the API - this is what developers can use!
type Todo = ExtractEntityType<typeof todosApi>;

// Filter options
type FilterType = 'all' | 'active' | 'completed';

function TodoForm({ onTodoAdded }: { onTodoAdded: () => void }) {
  const { mutate: createTodo, loading } = todosApi.useCreate();
  const { values, errors, handleInputChange, handleSubmit, reset } = useFormData(todoSchema, {
    text: '',
    completed: false,
  });

  const onSubmit = handleSubmit(async data => {
    await createTodo(data);
    reset();
    onTodoAdded();
  });

  return (
    <form onSubmit={onSubmit} className="todo-form">
      <div className="form-field">
        <input
          type="text"
          name="text"
          value={values.text || ''}
          onChange={handleInputChange}
          placeholder="Add a new todo..."
          className={`todo-input ${errors.text ? 'error' : ''}`}
          disabled={loading}
        />
        {errors.text && <span className="error-message">{errors.text}</span>}
      </div>
      <button type="submit" disabled={loading || !values.text?.trim()}>
        {loading ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  );
}

function TodoStats({ onRefresh }: { onRefresh: () => void }) {
  // Each component needs its own data fetching
  const { data: todos, loading, error, refetch } = todosApi.useList();

  // Handle loading and error states properly
  if (loading) {
    return (
      <div className="sync-warning">
        <h4>📊 Loading Statistics...</h4>
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">-</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">-</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">-</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sync-warning">
        <h4>❌ Error Loading Statistics</h4>
        <p>Failed to load todo statistics. Please try refreshing.</p>
        <button onClick={() => refetch()} className="btn btn-refresh">
          🔄 Retry
        </button>
      </div>
    );
  }

  // Safely handle undefined data
  const safeTodos: Todo[] = todos || [];
  const completedCount = safeTodos.filter((todo: Todo) => todo.completed).length;
  const pendingCount = safeTodos.length - completedCount;

  const handleRefresh = () => {
    refetch();
    onRefresh();
  };

  return (
    <>
      <div className="sync-warning">
        <h4>⚠️ Manual Synchronization Required</h4>
        <p>
          Without Global Context, components don't automatically sync. You need to manually refresh
          to see updates from other components.
        </p>
      </div>

      <button onClick={handleRefresh} className="btn btn-refresh">
        {loading ? 'Refreshing...' : '🔄 Refresh Stats'}
      </button>

      <div className="stats">
        <div className="stat-card">
          <div className="stat-number">{safeTodos.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{pendingCount}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{completedCount}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>
    </>
  );
}

function TodoItem({ todo, onTodoChanged }: { todo: Todo; onTodoChanged: () => void }) {
  const { mutate: updateTodo } = todosApi.useUpdate(todo.id);
  const { mutate: deleteTodo } = todosApi.useDelete(todo.id);

  const handleToggle = async () => {
    await updateTodo({
      text: todo.text,
      completed: !todo.completed,
    });
    // Manual callback to notify parent
    onTodoChanged();
  };

  const handleDelete = async () => {
    await deleteTodo();
    // Manual callback to notify parent
    onTodoChanged();
  };

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>{todo.text}</span>
      <div className="todo-actions">
        <button
          onClick={handleToggle}
          className={`btn ${todo.completed ? 'btn-success' : 'btn-success'}`}
        >
          {todo.completed ? '↶ Undo' : '✓ Done'}
        </button>
        <button onClick={handleDelete} className="btn btn-danger">
          Delete
        </button>
      </div>
    </li>
  );
}

function TodoList({ refreshKey }: { refreshKey: number }) {
  const { data: todos, loading, error, refetch } = todosApi.useList();
  const [filter, setFilter] = useUrlSelector('filter', (value: string) => value as FilterType, {
    multiple: false,
  });
  const currentFilter = filter || 'all';

  // Force refetch when refreshKey changes
  React.useEffect(() => {
    if (refreshKey > 0) {
      refetch();
    }
  }, [refreshKey, refetch]);

  const handleTodoChanged = useCallback(() => {
    // Refetch data when a todo is changed
    refetch();
  }, [refetch]);

  // Handle loading state
  if (loading) {
    return <div className="loading">Loading todos...</div>;
  }

  // Handle error state
  if (error) {
    return (
      <div className="empty-state">
        <h3>❌ Error Loading Todos</h3>
        <p>Failed to load your todos. Please try again.</p>
        <button onClick={() => refetch()} className="btn btn-primary">
          🔄 Retry
        </button>
      </div>
    );
  }

  // Safely handle undefined data
  const safeTodos: Todo[] = todos || [];
  const filteredTodos = safeTodos.filter((todo: Todo) => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  return (
    <>
      <div className="filter-tabs">
        <button
          className={`filter-tab ${currentFilter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({safeTodos.length})
        </button>
        <button
          className={`filter-tab ${currentFilter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({safeTodos.filter((t: Todo) => !t.completed).length})
        </button>
        <button
          className={`filter-tab ${currentFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({safeTodos.filter((t: Todo) => t.completed).length})
        </button>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="empty-state">
          <h3>No todos found</h3>
          <p>
            {currentFilter === 'all'
              ? 'Add your first todo above!'
              : `No ${currentFilter} todos yet.`}
          </p>
        </div>
      ) : (
        <ul className="todo-list">
          {filteredTodos.map((todo: Todo) => (
            <TodoItem key={todo.id} todo={todo} onTodoChanged={handleTodoChanged} />
          ))}
        </ul>
      )}
    </>
  );
}

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTodoAdded = () => {
    // Force other components to refresh
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <BrowserRouter>
      <ApiClientProvider connectorType="localStorage">
        <div className="app">
          <header className="header">
            <h1>Todo App</h1>
            <p>Without Global Context - Manual synchronization required</p>
          </header>

          <div className="content">
            <TodoForm onTodoAdded={handleTodoAdded} />
            <TodoStats onRefresh={handleRefresh} />
            <TodoList refreshKey={refreshKey} />
          </div>
        </div>
      </ApiClientProvider>
    </BrowserRouter>
  );
}

export default App;

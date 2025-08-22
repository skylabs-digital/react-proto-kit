import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  ApiClientProvider,
  ExtractEntityType,
  GlobalStateProvider,
  createDomainApi,
  configureDebugLogging,
  useFormData,
  useUrlSelector,
  z,
} from '../../../src';

// Enable debug logging
configureDebugLogging(true, '[TODO-GLOBAL]');

// Schema definition with validation
const todoSchema = z.object({
  text: z
    .string()
    .min(1, 'Todo text is required')
    .max(10, 'Todo text must be 10 characters or less'),
  completed: z.boolean(),
});

// Filter options
type FilterType = 'all' | 'active' | 'completed';

// Create API with Global Context
const todosApi = createDomainApi('todos', todoSchema, {
  globalState: true,
  optimistic: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
});

// Extract types from the API - this is what developers can use!
type Todo = ExtractEntityType<typeof todosApi>;

// Components
function TodoForm() {
  const { mutate: createTodo, loading } = todosApi.useCreate();
  const { values, errors, handleInputChange, handleSubmit, reset } = useFormData(todoSchema, {
    text: '',
    completed: false,
  });

  const onSubmit = handleSubmit(async data => {
    await createTodo(data);
    reset();
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
      <button type="submit" className="btn btn-primary" disabled={loading || !values.text?.trim()}>
        {loading ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  );
}

function TodoStats() {
  const { data: todos, loading, error } = todosApi.useList();

  // Handle loading state
  if (loading) {
    return (
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
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="stats">
        <div style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>
          <p>❌ Error loading statistics</p>
        </div>
      </div>
    );
  }

  // Safely handle undefined data
  const safeTodos = todos || [];
  const completedCount = safeTodos.filter(todo => todo.completed).length;
  const pendingCount = safeTodos.length - completedCount;

  return (
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
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const { mutate: updateTodo } = todosApi.useUpdate(todo.id);
  const { mutate: deleteTodo } = todosApi.useDelete(todo.id);

  const handleToggle = () => {
    updateTodo({
      text: todo.text,
      completed: !todo.completed,
    });
  };

  const handleDelete = () => {
    deleteTodo();
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

function TodoList() {
  const { data: todos, loading, error } = todosApi.useList();
  const [filter, setFilter] = useUrlSelector('filter', (value: string) => value as FilterType, {
    multiple: false,
  });
  const currentFilter = filter || 'all';

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
      </div>
    );
  }

  // Safely handle undefined data
  const safeTodos = todos || [];
  const filteredTodos = safeTodos.filter(todo => {
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
          Active ({safeTodos.filter(t => !t.completed).length})
        </button>
        <button
          className={`filter-tab ${currentFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({safeTodos.filter(t => t.completed).length})
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
          {filteredTodos.map(todo => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ApiClientProvider connectorType="localStorage">
        <GlobalStateProvider>
          <div className="app">
            <header className="header">
              <h1>Todo App</h1>
              <p>With Global Context - All components stay in sync automatically!</p>
            </header>

            <div className="content">
              <TodoForm />
              <TodoStats />
              <TodoList />
            </div>
          </div>
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}

export default App;

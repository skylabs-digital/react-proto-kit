import React, { useState } from 'react';
import { z } from 'zod';
import { ApiClientProvider, GlobalStateProvider, createDomainApi } from '../../../src';

// Schema definition
const todoSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

type Todo = z.infer<typeof todoSchema>;

// Create API with Global Context
const todosApi = createDomainApi('todos', todoSchema, {
  globalState: true,
  optimistic: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
});

// Components
function TodoForm() {
  const [text, setText] = useState('');
  const { mutate: createTodo, loading } = todosApi.useCreate!();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    await createTodo({
      text: text.trim(),
      completed: false,
    });
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Add a new todo..."
        className="todo-input"
        disabled={loading}
      />
      <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
        {loading ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  );
}

function TodoStats() {
  const { data: todos, loading, error } = todosApi.useList!();

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
  const { mutate: updateTodo } = todosApi.useUpdate!(todo.id);
  const { mutate: deleteTodo } = todosApi.useDelete!(todo.id);

  const handleToggle = () => {
    updateTodo({ completed: !todo.completed });
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
  const { data: todos, loading, error } = todosApi.useList!();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

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
    if (filter === 'pending') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <>
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({safeTodos.length})
        </button>
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({safeTodos.filter(t => !t.completed).length})
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({safeTodos.filter(t => t.completed).length})
        </button>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="empty-state">
          <h3>No todos found</h3>
          <p>{filter === 'all' ? 'Add your first todo above!' : `No ${filter} todos yet.`}</p>
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
  );
}

export default App;

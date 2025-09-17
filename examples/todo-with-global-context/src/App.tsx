import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { z } from 'zod';
import { createDomainApi, ExtractEntityType } from '../../../src/factory/createDomainApi';
import {
  ApiClientProvider,
  configureDebugLogging,
  GlobalStateProvider,
  useFormData,
  useUrlSelector,
} from '../../../src';

// Enable debug logging
configureDebugLogging(true, '[TODO-GLOBAL]');

// Schemas
const todoEntitySchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().optional(),
  user: z.string().default('Demo User'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const todoUpsertSchema = z.object({
  text: z
    .string()
    .min(1, 'Todo text is required')
    .max(10, 'Todo text must be at most 10 characters'),
  completed: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().optional(),
});

const commentEntitySchema = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const commentUpsertSchema = z.object({
  text: z.string().min(1, 'Comment text is required'),
  author: z.string().optional(),
});

// Create the todos API with global state and typed query parameters
const todosApi = createDomainApi('todos', {
  entitySchema: todoEntitySchema,
  upsertSchema: todoUpsertSchema,
  globalState: true,
  queryParams: {
    static: { include: 'user' },
    dynamic: ['priority', 'completed', 'search', 'sortBy', 'order'],
  },
});

// Create nested comments API with typed query parameters
const commentsApi = createDomainApi('todos/:todoId/comments', {
  entitySchema: commentEntitySchema,
  upsertSchema: commentUpsertSchema,
  globalState: true,
  queryParams: {
    dynamic: ['author', 'sortBy', 'order'],
  },
});

// Extract types from the APIs
type _Todo = ExtractEntityType<typeof todosApi>;
type _Comment = ExtractEntityType<typeof commentsApi>;

// Filter types
type FilterType = 'all' | 'active' | 'completed';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high';

// Components
function TodoForm() {
  const { mutate: createTodo, loading } = todosApi.useCreate();

  const { values, errors, handleInputChange, handleSubmit, reset } = useFormData(todoUpsertSchema, {
    text: '',
    completed: false,
    priority: 'medium' as const,
    category: '',
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
      <div className="form-field">
        <select
          name="priority"
          value={values.priority || 'medium'}
          onChange={handleInputChange}
          className="priority-select"
          disabled={loading}
        >
          <option value="low">🟢 Low Priority</option>
          <option value="medium">🟡 Medium Priority</option>
          <option value="high">🔴 High Priority</option>
        </select>
      </div>
      <div className="form-field">
        <input
          type="text"
          name="category"
          value={values.category || ''}
          onChange={handleInputChange}
          placeholder="Category (optional)"
          className="category-input"
          disabled={loading}
        />
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
  const completedCount = safeTodos.filter(todo => (todo as any).completed).length;
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

function TodoItem({ todo }: { todo: z.infer<typeof todoEntitySchema> }) {
  const [showComments, setShowComments] = React.useState(false);
  const [newCommentText, setNewCommentText] = React.useState('');
  const { mutate: updateTodo } = todosApi.useUpdate();
  const { mutate: deleteTodo } = todosApi.useDelete();

  // Nested comments API for this specific todo with strongly typed path params
  const todoCommentsApi = commentsApi.withParams({ todoId: todo.id });

  // Example of strongly typed query parameters with useList
  const { data: comments } = todoCommentsApi.useList({
    queryParams: {
      sortBy: 'createdAt',
      order: 'desc',
    },
  });

  // Example of strongly typed query parameters with useQuery - commented out to prevent infinite re-render
  // const firstCommentId = comments?.[0]?.id;
  // const { data: _firstComment } = todoCommentsApi.useQuery(firstCommentId || 'skip', {
  //   queryParams: {
  //     author: 'Demo User',
  //   },
  // });

  const { mutate: addComment } = todoCommentsApi.useCreate();
  const { mutate: deleteComment } = todoCommentsApi.useDelete();

  const handleAddComment = () => {
    if (newCommentText.trim()) {
      addComment({
        text: newCommentText.trim(),
        author: 'Demo User',
      });
      setNewCommentText('');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(undefined, commentId);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleToggle = () => {
    updateTodo({
      text: todo.text,
      completed: !todo.completed,
      priority: todo.priority,
      category: todo.category,
    });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const handleDelete = () => {
    deleteTodo();
  };

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}`}>
      <div className="todo-content">
        <span className="priority-indicator">{getPriorityIcon(todo.priority)}</span>
        <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
          {todo.text}
          {todo.category && <span className="category-tag">#{todo.category}</span>}
        </span>
        <span className="comment-count" onClick={toggleComments} style={{ cursor: 'pointer' }}>
          💬 {comments?.length || 0}
        </span>
      </div>
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

      {showComments && (
        <div
          className="comments-section"
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            border: '1px solid #e9ecef',
          }}
        >
          <div
            className="comments-header"
            style={{
              fontWeight: 'bold',
              marginBottom: '10px',
              color: '#495057',
            }}
          >
            Comments ({comments?.length || 0})
          </div>

          {comments && comments.length > 0 ? (
            <div className="comments-list" style={{ marginBottom: '10px' }}>
              {comments.map((comment: any) => (
                <div
                  key={comment.id}
                  style={{
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: 'white',
                    borderRadius: '3px',
                    border: '1px solid #dee2e6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#212529' }}>{comment.text}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                      by {comment.author} • {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginLeft: '10px',
                    }}
                    title="Delete comment"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                color: '#6c757d',
                fontStyle: 'italic',
                marginBottom: '10px',
                fontSize: '14px',
              }}
            >
              No comments yet. Be the first to comment!
            </div>
          )}

          <div className="add-comment" style={{ display: 'flex', gap: '5px' }}>
            <input
              type="text"
              value={newCommentText}
              onChange={e => setNewCommentText(e.target.value)}
              placeholder="Add a comment..."
              style={{
                flex: 1,
                padding: '5px 8px',
                border: '1px solid #ced4da',
                borderRadius: '3px',
                fontSize: '14px',
              }}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  handleAddComment();
                }
              }}
            />
            <button
              onClick={handleAddComment}
              disabled={!newCommentText.trim()}
              style={{
                padding: '5px 10px',
                backgroundColor: newCommentText.trim() ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: newCommentText.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function TodoList() {
  const [filter, setFilter] = useUrlSelector('filter', (value: string) => value as FilterType, {
    multiple: false,
  });
  const [priorityFilter, setPriorityFilter] = useUrlSelector(
    'priority',
    (value: string) => value as PriorityFilter,
    {
      multiple: false,
    }
  );
  const [categoryFilter, setCategoryFilter] = useUrlSelector('category', (value: string) => value, {
    multiple: false,
  });

  const currentFilter = filter || 'all';
  const currentPriorityFilter = priorityFilter || 'all';
  const currentCategoryFilter = categoryFilter || '';

  // Use builder pattern with dynamic query params
  const filteredTodosApi = todosApi.withQuery({
    ...(currentFilter !== 'all' && { completed: currentFilter === 'completed' }),
    ...(currentPriorityFilter !== 'all' && { priority: currentPriorityFilter }),
    ...(currentCategoryFilter && { category: currentCategoryFilter }),
  });

  const { data: todos, loading, error } = filteredTodosApi.useList();

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

  // Data is already filtered by query params, but we can do additional client-side filtering
  const safeTodos = todos || [];
  const filteredTodos = safeTodos; // Already filtered by API query params

  return (
    <>
      <div className="filters">
        <div className="filter-group">
          <label>Status:</label>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${currentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-tab ${currentFilter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              className={`filter-tab ${currentFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${currentPriorityFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-tab ${currentPriorityFilter === 'high' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('high')}
            >
              🔴 High
            </button>
            <button
              className={`filter-tab ${currentPriorityFilter === 'medium' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('medium')}
            >
              🟡 Medium
            </button>
            <button
              className={`filter-tab ${currentPriorityFilter === 'low' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('low')}
            >
              🟢 Low
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>Category:</label>
          <input
            type="text"
            placeholder="Filter by category..."
            value={currentCategoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="category-filter"
          />
        </div>
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
            <TodoItem key={(todo as any).id} todo={todo as z.infer<typeof todoEntitySchema>} />
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
              <h1>Advanced Todo App</h1>
              <p>Featuring nested resources, different schemas, query params & global state!</p>
              <div className="demo-info">
                <p>
                  <strong>🏗️ Architecture Demo:</strong>
                </p>
                <ul>
                  <li>📋 Different schemas: Entity vs Upsert</li>
                  <li>🔍 Query parameters: priority, category, status</li>
                  <li>🌐 Global state with optimistic updates</li>
                </ul>
              </div>
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

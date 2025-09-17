import { useState } from 'react';
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
configureDebugLogging(true, '[TODO-BACKEND]');

// Entity schema - includes all fields that exist in the entity (including server-generated ones)
const todoEntitySchema = z.object({
  text: z
    .string()
    .min(1, 'Todo text is required')
    .max(10, 'Todo text must be 10 characters or less'),
  completed: z.boolean(),
  views: z.number().int().min(0).default(10), // Server-generated field, not required for create/update
});

// Upsert schema - only fields that can be sent in create/update/patch operations
const todoUpsertSchema = z.object({
  text: z
    .string()
    .min(1, 'Todo text is required')
    .max(10, 'Todo text must be 10 characters or less'),
  completed: z.boolean(),
  // Note: 'views' is NOT included here - it's managed by the server
});

// Filter options
type FilterType = 'all' | 'active' | 'completed';

// Comment schemas for nested routes example
const commentEntitySchema = z.object({
  text: z.string().min(1, 'Comment text is required'),
  authorId: z.string(),
  views: z.number().int().min(0).default(0),
});

const commentUpsertSchema = z.object({
  text: z.string().min(1, 'Comment text is required'),
  authorId: z.string(),
});

// Create API with Global Context and FetchConnector
const todosApi = createDomainApi('todos', todoEntitySchema, todoUpsertSchema, {
  optimistic: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
});

// Create nested API for comments (this demonstrates the builder pattern)
const commentsApi = createDomainApi(
  'todos/:todoId/comments',
  commentEntitySchema,
  commentUpsertSchema,
  {
    optimistic: false, // Disable optimistic updates for comments
    cacheTime: 2 * 60 * 1000, // 2 minutes
    queryParams: {
      static: { author: 'fer' }, // Always included
      dynamic: ['viewed', 'status', 'sortBy'], // Runtime configurable
    },
  }
);

// Extract types from the API - this is what developers can use!
type Todo = ExtractEntityType<typeof todosApi>;

// Example of using nested routes
function CommentsExample({ todoId }: { todoId: string }) {
  const [queryConfig, setQueryConfig] = useState({
    viewed: true,
    status: 'published',
    sortBy: 'createdAt',
  });

  // Configure the API with the specific todoId and query parameters
  const todoCommentsApi = commentsApi.withParams({ todoId }).withQuery(queryConfig); // Dynamic params from state

  // Now we can use it like a normal API (includes static + dynamic params)
  const { data: comments, loading } = todoCommentsApi.useList();
  const { mutate: createComment } = todoCommentsApi.useCreate();
  const { mutate: updateComment } = todoCommentsApi.useUpdate();
  const { mutate: patchComment } = todoCommentsApi.usePatch();
  const { mutate: deleteComment } = todoCommentsApi.useDelete();

  if (loading) return <div>Loading comments...</div>;

  return (
    <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #ddd' }}>
      <h4>Comments for Todo {todoId}</h4>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        <strong>Query Params:</strong> {JSON.stringify({ author: 'fer', ...queryConfig })}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={() =>
            createComment({
              text: `Comment ${Date.now()}`,
              authorId: 'user-123',
            })
          }
          style={{ marginRight: '10px' }}
        >
          Add Comment
        </button>
        <button
          onClick={() => {
            if (comments && comments.length > 0) {
              const firstComment = comments[0];
              updateComment(firstComment.id, {
                text: `Updated: ${firstComment.text}`,
                authorId: firstComment.authorId,
              });
            }
          }}
          style={{ marginRight: '10px' }}
        >
          Update First Comment
        </button>
        <button
          onClick={() => {
            if (comments && comments.length > 0) {
              const firstComment = comments[0];
              patchComment(firstComment.id, {
                text: `Patched: ${firstComment.text}`,
              });
            }
          }}
        >
          Patch First Comment
        </button>
        <button
          onClick={() => {
            // Change query params - this will trigger a re-render and new API call
            const newConfig = {
              viewed: !queryConfig.viewed,
              status: queryConfig.viewed ? 'draft' : 'published',
              sortBy: queryConfig.sortBy === 'createdAt' ? 'updatedAt' : 'createdAt',
            };
            setQueryConfig(newConfig);
            console.log('🔍 Query params changed:', newConfig);
          }}
          style={{ marginLeft: '10px' }}
        >
          Toggle Query Params
        </button>
      </div>
      <ul>
        {comments?.map(comment => (
          <li key={comment.id} style={{ marginBottom: '5px' }}>
            <strong>{comment.authorId}:</strong> {comment.text}
            <button
              onClick={() => deleteComment(comment.id)}
              style={{ marginLeft: '10px', color: 'red' }}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Components
function TodoForm() {
  const { mutate: createTodo, loading } = todosApi.useCreate();
  const { values, errors, handleInputChange, handleSubmit, reset } = useFormData(todoUpsertSchema, {
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

function BackendInfo() {
  return (
    <div className="backend-info">
      <h4>🚀 Connected to Express Backend</h4>
      <p>
        This app uses the FetchConnector to communicate with an Express.js backend running on port
        3001. All data is stored in memory on the server and synced automatically across all
        components using Global Context.
      </p>
    </div>
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
          <p>❌ Error connecting to backend</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Make sure the Express server is running on port 3001
          </p>
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
  const { mutate: updateTodo } = todosApi.useUpdate();
  const { mutate: patchTodo } = todosApi.usePatch();
  const { mutate: deleteTodo } = todosApi.useDelete();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleToggle = () => {
    updateTodo(todo.id, {
      text: todo.text,
      completed: !todo.completed,
    });
  };

  const handleDelete = () => {
    deleteTodo(todo.id);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(todo.text);
  };

  const handleSave = () => {
    if (editText.trim() && editText !== todo.text) {
      // Use PATCH for partial update (only text field)
      patchTodo(todo.id, { text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div>
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
              maxLength={10}
              style={{
                flex: 1,
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSave}
              className="btn btn-success"
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              ✓ Save
            </button>
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              ✕ Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
              {todo.text}
              {todo.views && (
                <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                  ({todo.views} views)
                </span>
              )}
            </span>
            <div className="todo-actions">
              <button
                onClick={handleToggle}
                className={`btn ${todo.completed ? 'btn-success' : 'btn-success'}`}
              >
                {todo.completed ? '↶ Undo' : '✓ Done'}
              </button>
              <button
                onClick={handleEdit}
                className="btn btn-secondary"
                disabled={todo.completed}
              >
                ✏️ Edit
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </div>
      <CommentsExample todoId={todo.id} />
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
    return <div className="loading">Loading todos from server...</div>;
  }

  // Handle error state
  if (error) {
    return (
      <div className="empty-state">
        <h3>❌ Error Loading Todos</h3>
        <p>Failed to connect to the backend server.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Make sure the Express server is running on port 3001
        </p>
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
      <ApiClientProvider connectorType="fetch" config={{ baseUrl: 'http://localhost:3001' }}>
        <GlobalStateProvider>
          <div className="app">
            <header className="header">
              <h1>Todo App</h1>
              <p>With Express Backend - Real-time sync with server storage!</p>
            </header>

            <div className="content">
              <BackendInfo />
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

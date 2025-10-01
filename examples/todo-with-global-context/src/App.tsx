import React, { useState } from 'react';
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
import DashboardExamples from './DashboardExample';

// Enable debug logging
configureDebugLogging(true, '[TODO-GLOBAL]');

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

// Create API with separate entity and upsert schemas
const todosApi = createDomainApi('todos', todoEntitySchema, todoUpsertSchema, {
  optimistic: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
});

// Product schemas for testing useById
const productEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  inStock: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const productUpsertSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean(),
});

// Create products API
const productsApi = createDomainApi('products', productEntitySchema, productUpsertSchema, {
  optimistic: false,
  cacheTime: 5 * 60 * 1000, // 5 minutes
});

type Product = ExtractEntityType<typeof productsApi>;

// Products are now seeded via LocalStorageConnector config

// Separate component to test useById after mutations
function ProductByIdVerification({ productId }: { productId: string }) {
  const { data: product, loading, error } = productsApi.useById(productId);

  if (loading) {
    return (
      <div
        style={{
          margin: '10px 0',
          padding: '10px',
          border: '2px solid #FFC107',
          borderRadius: '6px',
          backgroundColor: '#FFF8E1',
        }}
      >
        <h5>🔍 Verification useById (Loading...)</h5>
        <p>Loading product: {productId}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          margin: '10px 0',
          padding: '10px',
          border: '2px solid #F44336',
          borderRadius: '6px',
          backgroundColor: '#FFEBEE',
        }}
      >
        <h5>🔍 Verification useById (Error)</h5>
        <p>Error: {error.message}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        style={{
          margin: '10px 0',
          padding: '10px',
          border: '2px solid #FF9800',
          borderRadius: '6px',
          backgroundColor: '#FFF3E0',
        }}
      >
        <h5>🔍 Verification useById (Not Found)</h5>
        <p>Product not found: {productId}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: '10px 0',
        padding: '10px',
        border: '2px solid #4CAF50',
        borderRadius: '6px',
        backgroundColor: '#E8F5E8',
      }}
    >
      <h5>🔍 Verification useById - Independent Component</h5>
      <div style={{ fontSize: '0.9rem' }}>
        <p>
          <strong>ID:</strong> {product.id}
        </p>
        <p>
          <strong>Name:</strong> {product.name}
        </p>
        <p>
          <strong>Price:</strong> ${product.price}
        </p>
        <p>
          <strong>In Stock:</strong> {product.inStock ? 'Yes' : 'No'}
        </p>
      </div>
      <small style={{ fontStyle: 'italic', color: '#666' }}>
        This is a separate component using useById to verify cache sync after mutations.
      </small>
    </div>
  );
}

// Product test component using useById
function ProductByIdTest() {
  // Test with a fixed product ID from seed data
  const FIXED_PRODUCT_ID = 'prod-1';
  const [showVerification, setShowVerification] = useState(false);

  const { data: product, loading, error, refetch } = productsApi.useById(FIXED_PRODUCT_ID);
  const { mutate: updateProduct, loading: updateLoading } = productsApi.useUpdate();
  const { mutate: patchProduct, loading: patchLoading } = productsApi.usePatch();
  const { mutate: deleteProduct, loading: deleteLoading } = productsApi.useDelete();

  console.log('🛍️ ProductByIdTest - useById result:', {
    productId: FIXED_PRODUCT_ID,
    product: product
      ? {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          inStock: product.inStock,
        }
      : null,
    loading,
    error: error?.message || null,
  });

  if (loading) {
    return (
      <div
        style={{
          margin: '20px 0',
          padding: '15px',
          border: '2px solid #FF9800',
          borderRadius: '8px',
          backgroundColor: '#FFF3E0',
        }}
      >
        <h4>🛍️ Product useById Test (Loading...)</h4>
        <p>Loading product: {FIXED_PRODUCT_ID}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          margin: '20px 0',
          padding: '15px',
          border: '2px solid #F44336',
          borderRadius: '8px',
          backgroundColor: '#FFEBEE',
        }}
      >
        <h4>🛍️ Product useById Test (Error)</h4>
        <p>Error: {error.message}</p>
        <button onClick={refetch} style={{ marginTop: '10px', padding: '5px 10px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        style={{
          margin: '20px 0',
          padding: '15px',
          border: '2px solid #FF9800',
          borderRadius: '8px',
          backgroundColor: '#FFF3E0',
        }}
      >
        <h4>🛍️ Product useById Test (Not Found)</h4>
        <p>Product not found: {FIXED_PRODUCT_ID}</p>
        <button onClick={refetch} style={{ marginTop: '10px', padding: '5px 10px' }}>
          Retry
        </button>
      </div>
    );
  }

  const handleUpdate = async () => {
    await updateProduct(product.id, {
      name: `Updated ${product.name} - ${new Date().toLocaleTimeString()}`,
      price: product.price + 10,
      category: product.category,
      inStock: product.inStock,
    });
    // Show verification component after update
    setShowVerification(true);
  };

  const handlePatch = async () => {
    await patchProduct(product.id, {
      inStock: !product.inStock,
    });
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      await deleteProduct(product.id);
    }
  };

  return (
    <div
      style={{
        margin: '20px 0',
        padding: '15px',
        border: '2px solid #2196F3',
        borderRadius: '8px',
        backgroundColor: '#E3F2FD',
      }}
    >
      <h4>🛍️ Product useById Test - Testing Cache Sync</h4>
      <div style={{ marginBottom: '15px' }}>
        <p>
          <strong>ID:</strong> {product.id}
        </p>
        <p>
          <strong>Name:</strong> {product.name}
        </p>
        <p>
          <strong>Price:</strong> ${product.price}
        </p>
        <p>
          <strong>Category:</strong> {product.category}
        </p>
        <p>
          <strong>In Stock:</strong> {product.inStock ? 'Yes' : 'No'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleUpdate}
          disabled={updateLoading}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: updateLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {updateLoading ? 'Updating...' : '🔄 UPDATE (PUT)'}
        </button>
        <button
          onClick={handlePatch}
          disabled={patchLoading}
          style={{
            padding: '8px 12px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: patchLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {patchLoading ? 'Patching...' : '📦 PATCH Stock'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteLoading}
          style={{
            padding: '8px 12px',
            backgroundColor: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: deleteLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {deleteLoading ? 'Deleting...' : '🗑️ DELETE'}
        </button>
        <button
          onClick={refetch}
          style={{
            padding: '8px 12px',
            backgroundColor: '#607D8B',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🔄 Refetch
        </button>
      </div>
      <small style={{ display: 'block', marginTop: '10px', fontStyle: 'italic' }}>
        This component uses useById to fetch product "{FIXED_PRODUCT_ID}" from seed data. Test if
        mutations sync with useById cache after refresh.
      </small>
      {showVerification && <ProductByIdVerification productId={FIXED_PRODUCT_ID} />}
    </div>
  );
}

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

// Component to test useById after creation
function TodoByIdTest({ todoId }: { todoId: string }) {
  const { data: todo, loading, error } = todosApi.useById(todoId);

  console.log('🔍 TodoByIdTest - useById result:', { todoId, todo, loading, error });

  if (loading) {
    return (
      <div className="todo-by-id-test">
        <h4>Testing useById (Loading...)</h4>
        <p>Fetching todo: {todoId}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="todo-by-id-test error">
        <h4>Testing useById (Error)</h4>
        <p>Error fetching todo: {error.message}</p>
      </div>
    );
  }

  if (!todo) {
    return (
      <div className="todo-by-id-test">
        <h4>Testing useById (Not Found)</h4>
        <p>Todo not found: {todoId}</p>
      </div>
    );
  }

  return (
    <div className="todo-by-id-test success">
      <h4>✅ Testing useById (Success)</h4>
      <p>
        <strong>ID:</strong> {todoId}
      </p>
      <p>
        <strong>Text:</strong> {todo.text}
      </p>
      <p>
        <strong>Completed:</strong> {todo.completed ? 'Yes' : 'No'}
      </p>
      <p>
        <strong>Views:</strong> {todo.views}
      </p>
      <small>This data comes from useById, testing cache synchronization after POST</small>
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
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const onSubmit = handleSubmit(async data => {
    const result = await createTodo(data);
    console.log('🎯 TodoForm - createTodo result:', result);
    if (result && (result as any).id) {
      setLastCreatedId((result as any).id);
      // Clear the test after 10 seconds
      setTimeout(() => setLastCreatedId(null), 10000);
    }
    reset();
  });

  return (
    <>
      <form onSubmit={onSubmit} className="todo-form">
        <div className="form-field">
          <input
            type="text"
            name="text"
            value={values.text || ''}
            onChange={handleInputChange}
            placeholder="Add a new todo..."
            className={`todo-input ${errors.text ? 'error' : ''}`}
          />
          {errors.text && <span className="error-message">{errors.text}</span>}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !values.text?.trim()}
        >
          {loading ? 'Adding...' : 'Add Todo'}
        </button>
      </form>

      {lastCreatedId && (
        <div
          style={{
            margin: '20px 0',
            padding: '15px',
            border: '2px solid #4CAF50',
            borderRadius: '8px',
            backgroundColor: '#f0f8f0',
          }}
        >
          <TodoByIdTest todoId={lastCreatedId} />
        </div>
      )}
    </>
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
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(todo.text);

  // Use PATCH for toggling completion status (partial update)
  const { mutate: patchTodo } = todosApi.usePatch();
  // Use UPDATE for editing the full todo (complete update)
  const { mutate: updateTodo } = todosApi.useUpdate();
  // Use DELETE for removing todos
  const { mutate: deleteTodo } = todosApi.useDelete();

  const handleToggle = () => {
    // PATCH only the completed field - more efficient!
    patchTodo(todo.id, { completed: !todo.completed });
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
      // UPDATE the entire todo with new text
      updateTodo(todo.id, {
        text: editText.trim(),
        completed: todo.completed,
      });
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
      {isEditing ? (
        <div className="todo-edit">
          <input
            type="text"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="todo-edit-input"
            autoFocus
          />
          <div className="todo-edit-actions">
            <button onClick={handleSave} className="btn btn-success btn-sm">
              Save
            </button>
            <button onClick={handleCancel} className="btn btn-secondary btn-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="todo-content">
            <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>{todo.text}</span>
            <small className="todo-views">👁️ {todo.views} views</small>
          </div>
          <div className="todo-actions">
            <button
              onClick={handleToggle}
              className={`btn ${todo.completed ? 'btn-warning' : 'btn-success'}`}
              title={todo.completed ? 'Mark as pending (PATCH)' : 'Mark as done (PATCH)'}
            >
              {todo.completed ? '↩️ Undo' : '✓ Done'}
            </button>
            <button onClick={handleEdit} className="btn btn-info" title="Edit todo (UPDATE)">
              ✏️ Edit
            </button>
            <button onClick={handleDelete} className="btn btn-danger" title="Delete todo (DELETE)">
              🗑️ Delete
            </button>
          </div>
        </>
      )}
      {/* Show comments for this todo */}
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
  const [view, setView] = useState<'todos' | 'dashboard'>('todos');

  return (
    <BrowserRouter>
      <ApiClientProvider
        connectorType="localStorage"
        config={{
          seed: {
            data: {
              products: [
                {
                  id: 'prod-1',
                  name: 'Laptop Pro',
                  price: 1299.99,
                  category: 'Electronics',
                  inStock: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
            },
            behavior: {
              initializeEmpty: true,
              mergeStrategy: 'replace',
            },
          },
        }}
      >
        <GlobalStateProvider>
          <div className="app">
            <header className="header">
              <h1>React Proto Kit Example</h1>
              <p>Global Context + Data Orchestrator</p>
              <div
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                }}
              >
                <button
                  onClick={() => setView('todos')}
                  style={{
                    padding: '8px 16px',
                    border: view === 'todos' ? '2px solid #4CAF50' : '2px solid #ddd',
                    borderRadius: '4px',
                    background: view === 'todos' ? '#4CAF50' : '#fff',
                    color: view === 'todos' ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Todo App (CRUD)
                </button>
                <button
                  onClick={() => setView('dashboard')}
                  style={{
                    padding: '8px 16px',
                    border: view === 'dashboard' ? '2px solid #2196F3' : '2px solid #ddd',
                    borderRadius: '4px',
                    background: view === 'dashboard' ? '#2196F3' : '#fff',
                    color: view === 'dashboard' ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Data Orchestrator
                </button>
              </div>
            </header>

            <div className="content">
              {view === 'todos' ? (
                <>
                  <ProductByIdTest />
                  <TodoForm />
                  <TodoStats />
                  <TodoList />
                </>
              ) : (
                <DashboardExamples />
              )}
            </div>
          </div>
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}

export default App;

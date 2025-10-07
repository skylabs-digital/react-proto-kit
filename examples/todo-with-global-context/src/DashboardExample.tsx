/**
 * Dashboard Example - Demonstrates useDataOrchestrator
 *
 * This example shows how to use the Data Orchestrator to:
 * 1. Load multiple resources (todos and products) simultaneously
 * 2. Distinguish between required and optional resources
 * 3. Handle loading and error states centrally
 * 4. Use retry functionality
 * 5. Show refetch indicators without blocking UI
 */

import React from 'react';
import {
  createDomainApi,
  useDataOrchestrator,
  withDataOrchestrator,
  ExtractEntityType,
  z,
} from '../../../src';

// ============================================================================
// SCHEMAS & APIs
// ============================================================================

// Todo schemas
const todoEntitySchema = z.object({
  text: z.string().min(1),
  completed: z.boolean(),
  views: z.number().default(0),
});

const todoUpsertSchema = z.object({
  text: z.string().min(1),
  completed: z.boolean(),
});

// Product schemas
const productEntitySchema = z.object({
  name: z.string(),
  price: z.number(),
  inStock: z.boolean(),
});

const productUpsertSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  inStock: z.boolean(),
});

// Stats schema (read-only, no separate upsert needed)
const statsSchema = z.object({
  totalTodos: z.number(),
  completedTodos: z.number(),
  totalProducts: z.number(),
});

const todosApi = createDomainApi('todos', todoEntitySchema, todoUpsertSchema);
const productsApi = createDomainApi('products', productEntitySchema, productUpsertSchema);
const statsApi = createDomainApi('stats', statsSchema, statsSchema);

type Todo = ExtractEntityType<typeof todosApi>;
type Product = ExtractEntityType<typeof productsApi>;
type Stats = ExtractEntityType<typeof statsApi>;

// ============================================================================
// EXAMPLE 1: Hook with Required/Optional Resources
// ============================================================================

function DashboardWithHook() {
  const { data, isLoading, isFetching, hasErrors, errors, retry, retryAll } = useDataOrchestrator(
    {
      required: {
        todos: todosApi.useList,
        products: productsApi.useList,
      },
      optional: {
        stats: () => statsApi.useById('global'),
      },
    },
    { resetKey: 'dashboard' }
  );

  // First load of required resources - blocks rendering
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Required resources failed - show error
  if (hasErrors) {
    return (
      <div className="dashboard-error">
        <h2>Failed to load dashboard</h2>
        {Object.entries(errors).map(([key, error]) => (
          <p key={key}>
            <strong>{key}:</strong> {error.message}
          </p>
        ))}
        <button onClick={retryAll}>Retry All</button>
      </div>
    );
  }

  // Success - render dashboard
  return (
    <div className="dashboard">
      {/* Refetch indicator - non-blocking */}
      {isFetching && (
        <div
          style={{
            position: 'fixed',
            top: 10,
            right: 10,
            padding: '8px 12px',
            background: '#2196F3',
            color: 'white',
            borderRadius: 4,
            fontSize: '0.9rem',
          }}
        >
          🔄 Updating...
        </div>
      )}

      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={retryAll}>🔄 Refresh All</button>
      </header>

      {/* Stats Section - Optional Resource */}
      <section className="stats-section">
        <h2>Statistics</h2>
        {errors.stats ? (
          <div className="stats-error">
            <p>Failed to load stats: {errors.stats.message}</p>
            <button onClick={() => retry('stats')}>Retry Stats</button>
          </div>
        ) : data.stats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{data.stats.totalTodos}</h3>
              <p>Total Todos</p>
            </div>
            <div className="stat-card">
              <h3>{data.stats.completedTodos}</h3>
              <p>Completed</p>
            </div>
            <div className="stat-card">
              <h3>{data.stats.totalProducts}</h3>
              <p>Products</p>
            </div>
          </div>
        ) : (
          <p>No stats available</p>
        )}
      </section>

      {/* Todos Section - Required Resource */}
      <section className="todos-section">
        <h2>Todos ({data.todos?.length || 0})</h2>
        <div className="todos-list">
          {data.todos!.map((todo: Todo) => (
            <div key={todo.id} className="todo-item">
              <input type="checkbox" checked={todo.completed} readOnly />
              <span>{todo.text}</span>
              <span className="views">{todo.views} views</span>
            </div>
          ))}
        </div>
      </section>

      {/* Products Section - Required Resource */}
      <section className="products-section">
        <h2>Products ({data.products?.length || 0})</h2>
        <div className="products-grid">
          {data.products!.map((product: Product) => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p className="price">${product.price}</p>
              <p className="stock">{product.inStock ? '✅ In Stock' : '❌ Out of Stock'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: HOC with Declarative Approach
// ============================================================================

interface DashboardData {
  todos: Todo[] | null;
  products: Product[] | null;
  stats?: Stats | null;
}

function DashboardContent({
  todos,
  products,
  stats,
  orchestrator,
}: DashboardData & { orchestrator: any }) {
  // HOC ensures required resources are loaded, so we can safely assert non-null
  if (!todos || !products) return null;
  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard (HOC Pattern)</h1>
      <p>This component only renders when required resources (todos and products) are loaded.</p>

      <button
        onClick={orchestrator.retryAll}
        disabled={orchestrator.isFetching}
        style={{
          padding: '8px 16px',
          marginBottom: 20,
          background: orchestrator.isFetching ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: orchestrator.isFetching ? 'not-allowed' : 'pointer',
        }}
      >
        {orchestrator.isFetching ? 'Refreshing...' : 'Refresh All Data'}
      </button>

      {stats && (
        <div style={{ background: '#e8f4f8', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <h3>Stats (Optional Resource)</h3>
          <p>
            Total Views: {stats.totalViews} | Average: {stats.averagePerItem.toFixed(1)}
          </p>
          {orchestrator.loading.stats && <small>Loading stats...</small>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Todos</h2>
            <button
              onClick={() => orchestrator.retry('todos')}
              disabled={orchestrator.loading.todos}
              style={{ padding: '4px 12px', fontSize: '0.9rem' }}
            >
              {orchestrator.loading.todos ? '⟳' : 'Refresh'}
            </button>
          </div>
          <ul>
            {todos.map(todo => (
              <li key={todo.id}>
                {todo.completed ? '✅' : '⬜'} {todo.text}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Products</h2>
            <button
              onClick={() => orchestrator.retry('products')}
              disabled={orchestrator.loading.products}
              style={{ padding: '4px 12px', fontSize: '0.9rem' }}
            >
              {orchestrator.loading.products ? '⟳' : 'Refresh'}
            </button>
          </div>
          <ul>
            {products.map(product => (
              <li key={product.id}>
                {product.name} - ${product.price}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Wrap with HOC - only renders when all required resources are loaded
export const DashboardWithHOC = withDataOrchestrator<DashboardData>(DashboardContent, {
  hooks: {
    todos: todosApi.useList,
    products: productsApi.useList,
    stats: () => statsApi.useById('global'),
  },
  options: {
    resetKey: 'dashboard-hoc',
  },
});

// ============================================================================
// EXAMPLE 3: Progressive Loading
// ============================================================================

function DashboardProgressive() {
  const { data, loadingStates, errors, retry } = useDataOrchestrator({
    todos: todosApi.useList,
    products: productsApi.useList,
    stats: () => statsApi.useById('global'),
  });

  return (
    <div className="dashboard-progressive">
      <h1>Dashboard (Progressive Loading)</h1>

      {/* Each section renders independently */}
      <section>
        <h2>Todos</h2>
        {loadingStates.todos ? (
          <div className="skeleton">Loading todos...</div>
        ) : errors.todos ? (
          <div className="error">
            Error: {errors.todos.message}
            <button onClick={() => retry('todos')}>Retry</button>
          </div>
        ) : (
          <div>{data.todos?.length || 0} todos loaded</div>
        )}
      </section>

      <section>
        <h2>Products</h2>
        {loadingStates.products ? (
          <div className="skeleton">Loading products...</div>
        ) : errors.products ? (
          <div className="error">
            Error: {errors.products.message}
            <button onClick={() => retry('products')}>Retry</button>
          </div>
        ) : (
          <div>{data.products?.length || 0} products loaded</div>
        )}
      </section>

      <section>
        <h2>Stats</h2>
        {loadingStates.stats ? (
          <div className="skeleton">Loading stats...</div>
        ) : errors.stats ? (
          <div className="error">
            Error: {errors.stats.message}
            <button onClick={() => retry('stats')}>Retry</button>
          </div>
        ) : data.stats ? (
          <div>
            {data.stats.totalTodos} todos, {data.stats.totalProducts} products
          </div>
        ) : (
          <div>No stats available</div>
        )}
      </section>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function DashboardExamples() {
  const [mode, setMode] = React.useState<'hook' | 'hoc' | 'progressive'>('hook');

  return (
    <div>
      <nav style={{ padding: '20px', borderBottom: '2px solid #ccc' }}>
        <button onClick={() => setMode('hook')}>Hook Example</button>
        <button onClick={() => setMode('hoc')}>HOC Example</button>
        <button onClick={() => setMode('progressive')}>Progressive Loading</button>
      </nav>

      {mode === 'hook' && <DashboardWithHook />}
      {mode === 'hoc' && <DashboardWithHOC />}
      {mode === 'progressive' && <DashboardProgressive />}
    </div>
  );
}

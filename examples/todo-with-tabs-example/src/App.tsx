import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  createDomainApi,
  withDataOrchestrator,
  useUrlTabs,
  useUrlParam,
  GlobalStateProvider,
  ApiClientProvider,
  LocalStorageConnector,
  z,
  configureDebugLogging,
} from '../../../src';

// Enable debug logging
configureDebugLogging(true, '[BACKEND]');

// ============================================================================
// Schemas & Types
// ============================================================================

const todoSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  status: z.enum(['active', 'completed', 'archived']),
  category: z.enum(['personal', 'work', 'shopping']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type Todo = z.infer<typeof todoSchema>;

// ============================================================================
// API Setup & Seed Data
// ============================================================================

// Seed data for localStorage
const seedTodos = [
  { text: 'Buy groceries', completed: false, status: 'active', category: 'shopping' },
  { text: 'Finish project', completed: false, status: 'active', category: 'work' },
  { text: 'Read book', completed: true, status: 'completed', category: 'personal' },
  { text: 'Exercise', completed: false, status: 'active', category: 'personal' },
  { text: 'Team meeting', completed: true, status: 'completed', category: 'work' },
  { text: 'Old task', completed: true, status: 'archived', category: 'work' },
  { text: 'Buy laptop', completed: false, status: 'active', category: 'shopping' },
  { text: 'Dentist appointment', completed: false, status: 'active', category: 'personal' },
];

const todosApi = createDomainApi('todos', todoSchema, todoSchema);

// ============================================================================
// Todo List Component (receives filtered data)
// ============================================================================

interface TodoListData {
  todos: Todo[];
}

function TodoListContent({ todos, orchestrator }: TodoListData & { orchestrator: any }) {
  return (
    <div style={{ padding: 20 }}>
      {orchestrator.isFetching && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '8px 16px',
            background: '#2196F3',
            color: 'white',
            borderRadius: 4,
            fontSize: '0.9em',
          }}
        >
          🔄 Fetching...
        </div>
      )}

      <h2 style={{ marginTop: 0 }}>Todos ({todos?.length || 0})</h2>

      {!todos || todos.length === 0 ? (
        <p style={{ color: '#999', fontStyle: 'italic' }}>No todos found for this filter</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {todos.map(todo => (
            <li
              key={todo.id}
              style={{
                padding: '12px 16px',
                marginBottom: 8,
                background: todo.completed ? '#f5f5f5' : 'white',
                border: '1px solid #ddd',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: '1.2em' }}>{todo.completed ? '✅' : '⬜'}</span>
              <span style={{ flex: 1, textDecoration: todo.completed ? 'line-through' : 'none' }}>
                {todo.text}
              </span>
              <span
                style={{
                  padding: '4px 8px',
                  background: '#e3f2fd',
                  borderRadius: 4,
                  fontSize: '0.85em',
                }}
              >
                {todo.category}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// Tabs Component with withDataOrchestrator
// ============================================================================

// Create HOC outside component - hooks will read from URL directly
const TodoListWithData = withDataOrchestrator<{ todos: Todo[] }>(TodoListContent, {
  hooks: {
    // 🔥 Key: Hook factory reads status directly from URL using useUrlParam
    // Pass queryParams directly to useList (NOT via withQuery) for reactivity
    todos: () => {
      const [status] = useUrlParam('status'); // Reads from ?status=active
      // ✅ Use withQuery with current status - creates reactive cacheKey
      return todosApi.withQuery({ status: status || 'active' }).useList();
    },
  },
  options: {
    // 🔥 Magic: Auto-reset when 'status' URL param changes!
    watchSearchParams: ['status'],
  },
});

function TodoTabs() {
  // Use useUrlTabs hook to manage tab state
  const [activeTab, setTab] = useUrlTabs<'active' | 'completed' | 'archived'>(
    'status',
    ['active', 'completed', 'archived'],
    'active'
  );

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Todo App with Tabs</h1>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          borderBottom: '2px solid #ddd',
        }}
      >
        <button
          onClick={() => setTab('active')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'active' ? '3px solid #2196F3' : '3px solid transparent',
            background: activeTab === 'active' ? '#e3f2fd' : 'transparent',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: activeTab === 'active' ? 600 : 400,
            transition: 'all 0.2s',
          }}
        >
          Active
        </button>
        <button
          onClick={() => setTab('completed')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom:
              activeTab === 'completed' ? '3px solid #2196F3' : '3px solid transparent',
            background: activeTab === 'completed' ? '#e3f2fd' : 'transparent',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: activeTab === 'completed' ? 600 : 400,
            transition: 'all 0.2s',
          }}
        >
          Completed
        </button>
        <button
          onClick={() => setTab('archived')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'archived' ? '3px solid #2196F3' : '3px solid transparent',
            background: activeTab === 'archived' ? '#e3f2fd' : 'transparent',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: activeTab === 'archived' ? 600 : 400,
            transition: 'all 0.2s',
          }}
        >
          Archived
        </button>
      </div>

      {/* Tab Content - automatically fetches when tab changes! */}
      <TodoListWithData />

      {/* Explanation */}
      <div
        style={{
          marginTop: 40,
          padding: 20,
          background: '#fff3cd',
          borderRadius: 8,
          fontSize: '0.9em',
        }}
      >
        <h3 style={{ marginTop: 0 }}>✨ How it works:</h3>
        <ol style={{ marginBottom: 0 }}>
          <li>
            <code>useUrlTabs</code> manages the active tab in URL (<code>?status=active</code>)
          </li>
          <li>
            <code>withQuery()</code> injects the status filter into the API call
          </li>
          <li>
            <code>watchSearchParams: ['status']</code> detects URL changes
          </li>
          <li>When you click a tab, URL changes and data auto-refetches! 🎉</li>
        </ol>
      </div>
    </div>
  );
}

// ============================================================================
// App Entry Point
// ============================================================================

export default function App() {
  // Initialize connector with seed data
  const connector = new LocalStorageConnector({
    simulateDelay: 100,
  });

  // Seed data on mount
  React.useEffect(() => {
    const seeded = localStorage.getItem('todos-seeded');
    if (!seeded) {
      seedTodos.forEach(todo => {
        const id = Math.random().toString(36).substring(7);
        const now = new Date().toISOString();
        localStorage.setItem(
          `todos-${id}`,
          JSON.stringify({ ...todo, id, createdAt: now, updatedAt: now })
        );
      });
      localStorage.setItem('todos-seeded', 'true');
    }
  }, []);

  return (
    <BrowserRouter>
      <ApiClientProvider connector={connector}>
        <GlobalStateProvider>
          <TodoTabs />
        </GlobalStateProvider>
      </ApiClientProvider>
    </BrowserRouter>
  );
}

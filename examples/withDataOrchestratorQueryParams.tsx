/**
 * Example: withDataOrchestrator with URL Query Parameters
 * 
 * This example demonstrates how to use watchSearchParams to automatically
 * refetch data when URL query parameters change.
 * 
 * Problem: When using the HOC, changing URL params doesn't trigger refetch
 * Solution: Use watchSearchParams option to auto-reset when params change
 */

import React from 'react';
import {
  createDomainApi,
  withDataOrchestrator,
  useUrlParam,
  z,
} from '../src';

// ============================================================================
// Setup: API & Types
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

const todosApi = createDomainApi('todos', todoSchema, todoSchema, {
  connector: { type: 'localStorage' },
  seedConfig: {
    enabled: true,
    resetOnInit: true,
    data: [
      { text: 'Buy groceries', completed: false, status: 'active', category: 'shopping' },
      { text: 'Finish project', completed: false, status: 'active', category: 'work' },
      { text: 'Read book', completed: true, status: 'completed', category: 'personal' },
      { text: 'Exercise', completed: false, status: 'active', category: 'personal' },
      { text: 'Team meeting', completed: true, status: 'completed', category: 'work' },
      { text: 'Old task', completed: true, status: 'archived', category: 'work' },
    ],
  },
});

// ============================================================================
// Example 1: Without watchSearchParams (PROBLEM)
// ============================================================================

function TodoListContentBasic({ todos }: { todos: Todo[] | null }) {
  if (!todos) return null;

  return (
    <div style={{ padding: 20, border: '1px solid #ccc', marginBottom: 20 }}>
      <h2>❌ Without watchSearchParams (Broken)</h2>
      <p style={{ color: '#666' }}>
        Try changing filters - data won't update until manual refresh
      </p>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            {todo.completed ? '✅' : '⬜'} {todo.text} 
            <span style={{ color: '#999', fontSize: '0.85em' }}>
              {' '}[{todo.category}]
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TodoListBasic() {
  const [status] = useUrlParam('status');
  const [category] = useUrlParam('category');

  // ❌ PROBLEM: When status or category change in URL,
  // the hooks don't re-execute with new values
  const TodoList = withDataOrchestrator(TodoListContentBasic, {
    hooks: {
      todos: () => todosApi.useList({ 
        queryParams: { 
          status: status || 'active',
          category: category || undefined
        } 
      }),
    },
    // Missing: watchSearchParams!
  });

  return (
    <div>
      <TodoList />
      <p style={{ fontSize: '0.9em', color: '#999' }}>
        Current filters: status={status || 'active'}, category={category || 'all'}
      </p>
    </div>
  );
}

// ============================================================================
// Example 2: With watchSearchParams (SOLUTION)
// ============================================================================

function TodoListContentFixed({ todos, orchestrator }: { todos: Todo[] | null; orchestrator: any }) {
  if (!todos) return null;

  return (
    <div style={{ padding: 20, border: '2px solid #4CAF50', marginBottom: 20 }}>
      <h2>✅ With watchSearchParams (Fixed)</h2>
      <p style={{ color: '#666' }}>
        Filters update automatically! {orchestrator.isFetching && '🔄 Fetching...'}
      </p>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            {todo.completed ? '✅' : '⬜'} {todo.text}
            <span style={{ color: '#999', fontSize: '0.85em' }}>
              {' '}[{todo.category}]
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TodoListFixed() {
  const [status] = useUrlParam('status');
  const [category] = useUrlParam('category');

  // ✅ SOLUTION: watchSearchParams detects URL changes
  // and automatically resets the orchestrator
  const TodoList = withDataOrchestrator(TodoListContentFixed, {
    hooks: {
      todos: () => todosApi.useList({ 
        queryParams: { 
          status: status || 'active',
          category: category || undefined
        } 
      }),
    },
    options: {
      // 🔥 Magic happens here!
      watchSearchParams: ['status', 'category']
    }
  });

  return <TodoList />;
}

// ============================================================================
// Example 3: Complete Demo with Filters
// ============================================================================

export function TodoApp() {
  const [status, setStatus] = useUrlParam('status');
  const [category, setCategory] = useUrlParam('category');

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <h1>Todo App with URL Filters</h1>
      
      {/* Filter Controls */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: 20, 
        borderRadius: 8, 
        marginBottom: 30 
      }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 10, fontWeight: 600 }}>Status:</label>
          <select 
            value={status || 'active'} 
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 4 }}
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        
        <div>
          <label style={{ marginRight: 10, fontWeight: 600 }}>Category:</label>
          <select 
            value={category || ''} 
            onChange={(e) => setCategory(e.target.value || undefined)}
            style={{ padding: '8px 12px', borderRadius: 4 }}
          >
            <option value="">All</option>
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="shopping">Shopping</option>
          </select>
        </div>
      </div>

      {/* Without watchSearchParams - broken */}
      <TodoListBasic />

      {/* With watchSearchParams - works! */}
      <TodoListFixed />

      {/* Technical Explanation */}
      <div style={{ 
        background: '#e3f2fd', 
        padding: 20, 
        borderRadius: 8,
        marginTop: 30,
        fontSize: '0.9em'
      }}>
        <h3>How watchSearchParams Works:</h3>
        <ol>
          <li>User changes <code>?status=active</code> to <code>?status=completed</code></li>
          <li>HOC detects change in watched param <code>status</code></li>
          <li>Automatically resets orchestrator internal state</li>
          <li>Hook factories re-execute with new <code>status</code> value</li>
          <li>Fresh data loads with new filters ✨</li>
        </ol>
      </div>
    </div>
  );
}

export default TodoApp;

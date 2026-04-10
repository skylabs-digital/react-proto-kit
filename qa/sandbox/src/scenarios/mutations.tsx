import React, { useState } from 'react';
import { createDomainApi, z } from '@skylabs-digital/react-proto-kit';

const todoSchema = z.object({
  title: z.string().min(1, 'title required'),
  status: z.enum(['pending', 'done']),
  tenantId: z.string().optional(),
});

const todosApi = createDomainApi('todos', todoSchema, todoSchema);

// Scenario focused on the v2 mutation return contract:
//   - `const res = await create(...)` — never throws
//   - res.success === true  → { data }
//   - res.success === false → { error: { code, message, fields? } }
//
// The UI surfaces the last response as JSON so Playwright agents can read the
// exact shape the library emits.
export default function MutationsScenario() {
  const { data: todos, loading } = todosApi.useList();
  const { mutate: createTodo, error: createError } = todosApi.useCreate();
  const { mutate: patchTodo } = todosApi.usePatch();
  const { mutate: deleteTodo } = todosApi.useDelete();

  const [title, setTitle] = useState('New todo');
  const [lastResponse, setLastResponse] = useState<unknown>(null);

  async function handleCreate() {
    const res = await createTodo({ title, status: 'pending' });
    setLastResponse(res);
  }

  // Intentionally triggers a Zod validation error so agents can assert the
  // discriminated-union error shape.
  async function handleCreateInvalid() {
    const res = await createTodo({ title: '', status: 'pending' } as never);
    setLastResponse(res);
  }

  async function handleToggle(id: string, status: 'pending' | 'done') {
    const next = status === 'pending' ? 'done' : 'pending';
    const res = await patchTodo(id, { status: next });
    setLastResponse(res);
  }

  async function handleDelete(id: string) {
    const res = await deleteTodo(id);
    setLastResponse(res);
  }

  return (
    <section style={{ padding: 16 }}>
      <h2>Mutations scenario</h2>
      <p style={hint}>
        Demonstrates the v2 <code>ApiResponse&lt;T&gt;</code> contract. Inspect
        <code> #last-response</code> for the exact shape the mutation returned.
      </p>

      <div style={row}>
        <input
          data-testid="mutations-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <button data-testid="mutations-create-btn" onClick={handleCreate}>
          Create todo
        </button>
        <button
          data-testid="mutations-create-invalid-btn"
          onClick={handleCreateInvalid}
        >
          Create invalid (force validation error)
        </button>
      </div>

      {createError && (
        <div data-testid="mutations-hook-error" style={errorBanner}>
          hook.error mirror: {createError.message ?? 'error'}
        </div>
      )}

      {loading && <p data-testid="mutations-loading">loading…</p>}

      <ul data-testid="mutations-todo-list">
        {(todos ?? []).map(t => (
          <li key={t.id} data-testid={`todo-item-${t.id}`}>
            <span>{t.title}</span> — <em>{t.status}</em>{' '}
            <button
              data-testid={`todo-toggle-${t.id}`}
              onClick={() => handleToggle(t.id, t.status as 'pending' | 'done')}
            >
              toggle
            </button>
            <button
              data-testid={`todo-delete-${t.id}`}
              onClick={() => handleDelete(t.id)}
            >
              delete
            </button>
          </li>
        ))}
      </ul>

      <h3>Last response</h3>
      <pre
        id="last-response"
        data-testid="mutations-last-response"
        style={codeBlock}
      >
        {JSON.stringify(lastResponse, null, 2)}
      </pre>
    </section>
  );
}

const row: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 12 };
const hint: React.CSSProperties = { color: '#6b7280', fontSize: 13 };
const errorBanner: React.CSSProperties = {
  padding: 8,
  marginBottom: 8,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#991b1b',
};
const codeBlock: React.CSSProperties = {
  background: '#0f172a',
  color: '#f8fafc',
  padding: 12,
  borderRadius: 6,
  fontSize: 12,
  overflowX: 'auto',
};
